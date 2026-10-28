import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const defaultRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function applyOverlay(target,root=defaultRoot) {
  const template=path.join(root,'templates','swim-overlay');
  const file=path.join(target,'index.html');
  let html=fs.readFileSync(file,'utf8');
  if(!/<\/body\s*>/i.test(html))throw Error('Não foi possível incluir o convite da SWIM: falta o fechamento do body.');
  html=html.replace(/<dialog\b[^>]*\bid=["']swim-return-dialog["'][^>]*>[\s\S]*?<\/dialog>/gi,'');
  html=html.replace(/<link\b[^>]*href=["']swim-portfolio\.css(?:\?[^"']*)?["'][^>]*>/gi,'');
  html=html.replace(/<script\b[^>]*src=["']swim-portfolio\.js(?:\?[^"']*)?["'][^>]*>[\s\S]*?<\/script>/gi,'');
  const markup=fs.readFileSync(path.join(template,'dialog.html'),'utf8');
  html=html.replace(/<\/body\s*>/i,markup+'\n</body>');
  fs.mkdirSync(path.join(target,'assets'),{recursive:true});
  for(const asset of ['swim-portfolio.css','swim-portfolio.js'])fs.copyFileSync(path.join(template,asset),path.join(target,asset));
  fs.copyFileSync(path.join(template,'swim-logo.svg'),path.join(target,'assets','swim-logo.svg'));
  fs.writeFileSync(file,html);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(!process.argv[2])throw Error('Informe a pasta pública que receberá o pop-up.');
  applyOverlay(path.resolve(process.argv[2]));
}
