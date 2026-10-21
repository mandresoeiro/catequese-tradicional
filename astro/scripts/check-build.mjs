import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
const base=resolve('dist/catequese-tradicional');
const site=existsSync(base)?base:resolve('dist');
const paths=['index.html','aulas/index.html','questionarios/index.html','caderno-visual/index.html','buscar/index.html','dicionario/index.html'];
for(let n=1;n<=10;n++){const slug='aula-'+String(n).padStart(2,'0');paths.push('aulas/'+slug+'/index.html','questionarios/'+slug+'/index.html','infograficos/'+slug+'.svg');}
let errors=0;
for(const path of paths){if(!existsSync(resolve(site,path))){console.error('Ausente:',path);errors++;}}
if(errors)process.exit(1);
console.log('Páginas e diagramas validados:',paths.length);
