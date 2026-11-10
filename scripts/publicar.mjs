import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {applyOverlay} from './portfolio-overlay.mjs';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensions = new Set(['.html','.css','.js','.mjs','.json','.webmanifest','.svg','.webp','.png','.jpg','.jpeg','.avif','.gif','.ico','.woff','.woff2','.ttf','.otf','.eot','.mp4','.webm','.ogg','.mp3','.wav','.wasm']);
const reserved = new Set(['assets','scripts','docs','index','404','projects','api']);
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export function validateSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length>90 || reserved.has(slug)) throw Error('Caminho inválido. Use letras minúsculas, números e hífens; sem barras.');
  return slug;
}
function inside(root, target) {
  const relative=path.relative(root,target);
  return relative!=='' && relative!=='..' && !relative.startsWith('..'+path.sep) && !path.isAbsolute(relative);
}
function hash(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function publicHash(buffer,file) {
  return hash(/\.(?:html|css|js|mjs|json|webmanifest|svg|txt)$/i.test(file)?Buffer.from(buffer.toString('utf8').replace(/\r\n/g,'\n')):buffer);
}
export function planProject(source, slug) {
  validateSlug(slug);
  const root=fs.realpathSync(source);
  if (!fs.statSync(root).isDirectory() || !fs.existsSync(path.join(root,'index.html'))) throw Error('Selecione a pasta estática que contém index.html (normalmente dist ou out).');
  const files=[];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
      if (entry.name.startsWith('.') || ['node_modules','scripts','source-assets','preview'].includes(entry.name)) continue;
      const absolute=path.join(directory,entry.name);
      if (entry.isSymbolicLink()) throw Error('Links simbólicos não são publicados: '+entry.name);
      if (entry.isDirectory()) { visit(absolute); continue; }
      const relative=path.relative(root,absolute).split(path.sep).join('/');
      const ext=path.extname(entry.name).toLowerCase();
      if (!extensions.has(ext) && !/^licen[cs]e[^/]*\.txt$/i.test(entry.name)) continue;
      if (/^(?:package(?:-lock)?\.json|.*\.config\.(?:js|mjs|json))$/i.test(entry.name)) continue;
      const content=fs.readFileSync(absolute);
      if (content.length>50*1024*1024) throw Error('Arquivo grande demais para publicação direta: '+relative);
      if (['.html','.css','.js','.mjs','.json','.webmanifest','.svg'].includes(ext)) {
        const text=content.toString('utf8');
        if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}|\bsk_live_[A-Za-z0-9]{20,}/.test(text)) throw Error('Possível credencial em '+relative+'. Remova-a antes de publicar.');
        const refs=[];
        if (ext==='.html') {
          for (const m of text.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) refs.push(m[1]);
          for (const m of text.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) { if (!m[1].startsWith('data:')) refs.push(...m[1].split(',').map(x=>x.trim().split(/\s+/)[0])); }
        }
        for (const m of text.matchAll(/url\(\s*["']?([^\s)'";]+)["']?\s*\)/g)) refs.push(m[1]);
        for (let ref of refs) {
          if (!ref || ref.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue;
          ref=ref.split(/[?#]/)[0]; if(!ref)continue;
          if (ref.startsWith('/')) {
            if (!ref.startsWith('/'+slug+'/')) throw Error('Caminho absoluto incompatível em '+relative+': '+ref+'. Gere o site com base /'+slug+'/.');
            ref=ref.slice(slug.length+2);
          } else ref=path.posix.join(path.posix.dirname(relative),ref);
          const target=path.resolve(root,decodeURIComponent(ref));
          if (!inside(root,target) && target!==root) throw Error('Referência sai da pasta pública: '+ref);
          if (!fs.existsSync(target) && !fs.existsSync(path.join(target,'index.html')) && !fs.existsSync(target+'.html')) throw Error('Arquivo ou página não encontrado: '+ref+' (em '+relative+')');
        }
      }
      files.push({relative,absolute,sha256:hash(content),bytes:content.length});
    }
  }
  visit(root);
  const published=new Set(files.map(file=>file.relative));
  // References to ignored source files must not silently become broken links.
  for(const file of files.filter(file=>file.relative.endsWith('.html'))) {
    const html=fs.readFileSync(file.absolute,'utf8');
    for(const m of html.matchAll(/\b(?:src|href)=["']([^"'#?]+)["']/g)) {
      if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(m[1]))continue;
      const ref=m[1].startsWith('/'+slug+'/')?m[1].slice(slug.length+2):path.posix.join(path.posix.dirname(file.relative),m[1]);
      if(path.posix.extname(ref)&&!published.has(ref))throw Error('Referência a arquivo que não será publicado: '+ref);
    }
  }
  return {root,slug,files,totalBytes:files.reduce((sum,file)=>sum+file.bytes,0)};
}

function command(program,args,root,input,allowFailure=false) {
  let executable=program;
  if(process.platform==='win32') {
    const fallback=program==='gh'?path.join(process.env.ProgramFiles||'C:/Program Files','GitHub CLI','gh.exe'):program==='git'?path.resolve(path.dirname(process.execPath),'../../native/git/cmd/git.exe'):'';
    if(fallback&&fs.existsSync(fallback))executable=fallback;
  }
  const result=spawnSync(executable,args,{cwd:root,input,encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
  if(result.error)throw Error(program+' não está disponível. '+result.error.message);
  if(result.status!==0&&!allowFailure)throw Error((result.stderr||result.stdout||program+' falhou.').trim());
  return result;
}
function gh(args,root,input,allowFailure=false){return command('gh',args,root,input,allowFailure);}
function git(args,root){return command('git',args,root).stdout.trim();}

export function prepareProject(root, plan, {title,category='Website',cover='',replace=false}) {
  const config=JSON.parse(fs.readFileSync(path.join(root,'portfolio.config.json')));
  const output=path.resolve(root,config.directory);
  const target=path.join(output,plan.slug);
  if(!inside(root,output)||!inside(output,target))throw Error('Diretório de publicação inválido.');
  if(plan.root===root||inside(root,plan.root))throw Error('A origem precisa ser uma pasta externa ao repositório do portfólio.');
  const manifestPath=path.join(output,'projects.json');
  const projects=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const existing=projects.find(item=>item.slug===plan.slug);
  if((existing||fs.existsSync(target))&&!replace)throw Error('Esse caminho já existe. Para atualizá-lo, use --replace após revisar a origem.');
  if(cover&&!plan.files.some(file=>file.relative===cover))throw Error('Capa não encontrada na pasta pública: '+cover);
  const stagingRoot=path.join(root,'.staging');fs.mkdirSync(stagingRoot,{recursive:true});
  const staging=fs.mkdtempSync(path.join(stagingRoot,plan.slug+'-'));
  for(const file of plan.files){const dest=path.join(staging,file.relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file.absolute,dest);}
  if(config.overlay)applyOverlay(staging,root);
  // Preserve a recoverable local copy of a replaced project; never touch siblings.
  if(fs.existsSync(target))fs.renameSync(target,path.join(stagingRoot,plan.slug+'-backup-'+Date.now()));
  fs.renameSync(staging,target);
  const entry={slug:plan.slug,title,category,cover,updatedAt:new Date().toISOString()};
  if(existing)projects[projects.indexOf(existing)]=entry;else projects.push(entry);
  fs.writeFileSync(manifestPath,JSON.stringify(projects,null,2)+'\n');
  fs.writeFileSync(path.join(output,'CNAME'),config.domain+'\n');
  fs.writeFileSync(path.join(output,'.nojekyll'),'');
  return {config,url:'https://'+config.domain+'/'+plan.slug+'/'};
}

async function verify(root,slug,seconds=300) {
  const config=JSON.parse(fs.readFileSync(path.join(root,'portfolio.config.json')));
  const base='https://'+config.domain+'/'+validateSlug(slug)+'/';
  const local=path.join(root,config.directory,slug);
  if(!fs.existsSync(path.join(local,'index.html')))throw Error('Projeto não encontrado no checkout: '+slug);
  const deadline=Date.now()+seconds*1000;let last='';
  while(Date.now()<deadline){
    try {
      const response=await fetch(base,{signal:AbortSignal.timeout(15000)});
      if(response.status!==200)throw Error('HTTP '+response.status);
      const html=await response.text();
      if(html.replace(/\r\n/g,'\n')!==fs.readFileSync(path.join(local,'index.html'),'utf8').replace(/\r\n/g,'\n'))throw Error('A versão pública ainda não corresponde aos arquivos enviados.');
      const resources=[];
      function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else resources.push(path.relative(local,p).split(path.sep).join('/'));}}walk(local);
      for(let i=0;i<resources.length;i+=8){await Promise.all(resources.slice(i,i+8).map(async file=>{const r=await fetch(new URL(file,base),{signal:AbortSignal.timeout(15000)});if(r.status!==200)throw Error(file+': HTTP '+r.status);if(publicHash(Buffer.from(await r.arrayBuffer()),file)!==publicHash(fs.readFileSync(path.join(local,file)),file))throw Error('Arquivo ainda desatualizado: '+file);}));}
      const pages=JSON.parse(gh(['api',`repos/${config.account}/${config.repository}/pages`],root).stdout);
      if(pages.cname!==config.domain)throw Error('Domínio configurado no GitHub não corresponde ao portfólio.');
      if(!pages.https_enforced)gh(['api','--method','PUT',`repos/${config.account}/${config.repository}/pages`,'--input','-'],root,JSON.stringify({https_enforced:true}));
      console.log(`PUBLICADO E VERIFICADO: ${base} (${resources.length} arquivos conferidos)`);return base;
    } catch(error){const message=error.cause?.code||error.message;if(message!==last){console.log('Aguardando DNS, HTTPS ou publicação: '+message);last=message;}}
    await sleep(10000);
  }
  throw Error('Arquivos enviados, mas o endereço ainda não pôde ser verificado. Não trate como publicado. Execute novamente com --verify-only --slug '+slug+'.');
}

async function run(argv){
  const options={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw Error('Argumento desconhecido: '+argv[i]);const key=argv[i].slice(2);if(['dry-run','prepare-only','no-wait','verify-only','replace','open'].includes(key))options[key]=true;else{if(!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Falta valor para --'+key);options[key]=argv[++i];}}
  const root=path.resolve(options.repo||defaultRoot);
  if(options['verify-only']){await verify(root,options.slug,Number(options.timeout||300));return;}
  if(!options.source||!options.slug||!options.title){const rl=createInterface({input:process.stdin,output:process.stdout});try{options.source||=await rl.question('Pasta do site pronto (dist ou out): ');options.slug||=await rl.question('Caminho no portfólio (sem barras): ');options.title||=await rl.question('Nome do projeto: ');}finally{rl.close();}}
  options.source=options.source.replace(/^"|"$/g,'');
  const plan=planProject(options.source,options.slug);
  console.log(`Revisão: ${plan.files.length} arquivos públicos, ${(plan.totalBytes/1024/1024).toFixed(2)} MB; caminho /${plan.slug}/.`);
  if(options['dry-run']){console.log('Validação concluída. Nenhum arquivo alterado ou enviado.');return;}
  const config=JSON.parse(fs.readFileSync(path.join(root,'portfolio.config.json')));
  if(!options['prepare-only']){
    if(gh(['api','user','--jq','.login'],root).stdout.trim()!==config.account)throw Error('A conta GitHub autenticada é diferente da conta configurada.');
    if(git(['status','--porcelain'],root))throw Error('O repositório tem alterações locais. Revise e faça commit antes de publicar.');
    const remote=git(['remote','get-url','origin'],root);if(!remote.endsWith(`github.com/${config.account}/${config.repository}.git`))throw Error('Remote do portfólio inesperado.');
    if(git(['ls-remote','--heads','origin',config.branch],root)){git(['fetch','origin',config.branch],root);git(['merge','--ff-only','origin/'+config.branch],root);}
  }
  const result=prepareProject(root,plan,{title:options.title,category:options.category,cover:options.cover,replace:options.replace});
  if(options['prepare-only']){console.log('Arquivos preparados localmente: '+result.url);return;}
  git(['add','--',config.directory],root);
  if(git(['diff','--cached','--name-only'],root))git(['commit','-m','Publica '+options.title+' no portfólio'],root);
  git(['push','-u','origin',config.branch],root);
  const api=`repos/${config.account}/${config.repository}/pages`;
  const current=gh(['api',api],root,undefined,true);
  if(current.status!==0){if(!/404/.test(current.stderr))throw Error(current.stderr);gh(['api','--method','POST',api,'--input','-'],root,JSON.stringify({source:{branch:config.branch,path:'/'+config.directory}}));}
  const pages=JSON.parse(gh(['api',api],root).stdout);
  if(pages.cname!==config.domain)gh(['api','--method','PUT',api,'--input','-'],root,JSON.stringify({cname:config.domain}));
  if(options['no-wait']){console.log('ENVIADO, VERIFICAÇÃO PENDENTE: '+result.url);return;}
  await verify(root,plan.slug,Number(options.timeout||300));
  if(options.open&&process.platform==='win32')command('powershell.exe',['-NoProfile','-Command',`Start-Process -FilePath '${result.url}'`],root);
}
export async function main(argv=process.argv.slice(2)) {
  if(argv.includes('--dry-run'))return run(argv);
  const repoIndex=argv.indexOf('--repo');
  const root=path.resolve(repoIndex>=0?argv[repoIndex+1]:defaultRoot);
  const state=path.join(root,'.staging');fs.mkdirSync(state,{recursive:true});
  const lock=path.join(state,'publish.lock');let handle;
  try {
    try { handle=fs.openSync(lock,'wx'); }
    catch(error) {
      if(error.code!=='EEXIST')throw error;
      let stale=false;
      try {const owner=JSON.parse(fs.readFileSync(lock,'utf8'));if(!Number.isInteger(owner.pid))throw Error('Invalid lock');try{process.kill(owner.pid,0);}catch(probe){if(probe.code==='ESRCH')stale=true;else throw probe;}}
      catch {throw Error('Outra publicação está em andamento, ou há um lock que precisa de revisão: '+lock);}
      if(!stale)throw Error('Outra publicação está em andamento. Aguarde a conclusão antes de clicar novamente.');
      fs.unlinkSync(lock);handle=fs.openSync(lock,'wx');
    }
    fs.writeFileSync(handle,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));
    return await run(argv);
  } finally {
    if(handle!==undefined){fs.closeSync(handle);fs.unlinkSync(lock);}
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error('ERRO: '+error.message);process.exitCode=1;});
