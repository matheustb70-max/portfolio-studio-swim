import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {planProject,prepareProject,validateSlug} from './publicar.mjs';

function fixture(){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'swim-publish-test-'));
 const source=path.join(base,'source'),repo=path.join(base,'repo');
 fs.mkdirSync(source);fs.mkdirSync(path.join(repo,'docs'),{recursive:true});
 fs.writeFileSync(path.join(source,'index.html'),'<h1>Teste</h1><img src="foto.svg">');
 fs.writeFileSync(path.join(source,'foto.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');
 fs.writeFileSync(path.join(repo,'portfolio.config.json'),JSON.stringify({directory:'docs',domain:'portfolio.estudioswim.com.br'}));
 fs.writeFileSync(path.join(repo,'docs/projects.json'),'[]');
 return {base,source,repo};
}
test('caminhos maliciosos e reservados são recusados',()=>{
 for(const slug of ['../outro','a/b','docs','assets','Projeto','a--b'])assert.throws(()=>validateSlug(slug));
 assert.equal(validateSlug('drarafaeloliveirapsiquiatria'),'drarafaeloliveirapsiquiatria');
});
test('somente saída pública é incluída, sem env, documentos ou Git',()=>{
 const {source}=fixture();
 fs.writeFileSync(path.join(source,'.env'),'PRIVATE=value');
 fs.writeFileSync(path.join(source,'contrato.docx'),'private');
 fs.mkdirSync(path.join(source,'.git'));fs.writeFileSync(path.join(source,'.git/config'),'private');
 assert.deepEqual(planProject(source,'teste').files.map(f=>f.relative).sort(),['foto.svg','index.html']);
});
test('credenciais e caminhos de asset incompatíveis bloqueiam a publicação',()=>{
 const {source}=fixture();
 fs.writeFileSync(path.join(source,'index.html'),'<script src="/assets/app.js"></script>');
 assert.throws(()=>planProject(source,'teste'),/Caminho absoluto/);
 fs.writeFileSync(path.join(source,'index.html'),'-----BEGIN PRIVATE KEY-----');
 assert.throws(()=>planProject(source,'teste'),/credencial/);
});
test('republicar exige replace e preserva projetos irmãos',()=>{
 const {source,repo}=fixture();
 const plan=planProject(source,'teste');
 prepareProject(repo,plan,{title:'Teste',cover:'foto.svg'});
 fs.mkdirSync(path.join(repo,'docs','irmao'));fs.writeFileSync(path.join(repo,'docs','irmao','index.html'),'Não alterar');
 assert.throws(()=>prepareProject(repo,plan,{title:'Teste'}),/já existe/);
 fs.writeFileSync(path.join(source,'index.html'),'<h1>Atualizado</h1>');
 prepareProject(repo,planProject(source,'teste'),{title:'Atualizado',replace:true});
 assert.equal(fs.readFileSync(path.join(repo,'docs','irmao','index.html'),'utf8'),'Não alterar');
 assert.match(fs.readFileSync(path.join(repo,'docs','teste','index.html'),'utf8'),/Atualizado/);
 assert.equal(JSON.parse(fs.readFileSync(path.join(repo,'docs','projects.json'))).length,1);
});
