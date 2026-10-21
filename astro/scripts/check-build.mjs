import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
const root=resolve('dist');
const base=existsSync(resolve(root,'catequese-tradicional/index.html'))?resolve(root,'catequese-tradicional'):root;
const pages=['index.html','aulas/index.html','questionarios/index.html','caderno-visual/index.html','buscar/index.html','dicionario/index.html','flashcards/index.html'];
for(let i=1;i<=10;i++){const slug='aula-'+String(i).padStart(2,'0');pages.push('aulas/'+slug+'/index.html','questionarios/'+slug+'/index.html','infograficos/'+slug+'.svg')}
const missing=pages.filter(p=>!existsSync(resolve(base,p)));
if(missing.length){console.error('Arquivos ausentes:',missing);process.exit(1)}
const prefix='/catequese-tradicional/';
let broken=[];
function crawl(directory){
 for(const name of readdirSync(directory,{withFileTypes:true})){
  const path=resolve(directory,name.name);
  if(name.isDirectory())crawl(path);else if(name.name.endsWith('.html')){
   const html=readFileSync(path,'utf8');
   const links=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(x=>x[1]);
   for(const link of links){
    if(!link.startsWith(prefix))continue;
    const clean=decodeURIComponent(link.split(/[?#]/)[0]).slice(prefix.length);
    if(!clean||clean.includes('..'))continue;
    const target=resolve(base,clean);
    if(!existsSync(target)&&!existsSync(target+'/index.html')&&!existsSync(target+'.html'))broken.push({page:path.slice(base.length),link});
   }
  }
 }
}
crawl(base);
if(broken.length){console.error('Links locais ausentes:',broken.slice(0,40));process.exit(1)}
console.log('Verificadas '+pages.length+' rotas e os links locais das páginas HTML.');
