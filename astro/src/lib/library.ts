import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderMarkdown, base } from './content';
import { rosaryGroups } from './rosary-data';

export interface Article {slug:string;title:string;category:string;kind:string;excerpt:string;lessons:string[];body:string;sources:[string,string][];}
const root=resolve(process.cwd(),'../library');
const catalog=JSON.parse(readFileSync(resolve(root,'catalog.json'),'utf8')) as Article[];
const saintStudy=JSON.parse(readFileSync(resolve(root,'saints-study.json'),'utf8')) as Record<string,{path:string;theme:string;reading:string;questions:string[];practice:string;connection:string}>;
for(const article of catalog){
  const study=saintStudy[article.slug];
  if(study)article.body+=`\n\n## Percurso para recordar\n${study.path}\n\n## Uma chave para a leitura\n${study.theme}\n\n## Leitura orientada\n${study.reading}\n\n## Perguntas para estudar\n${study.questions.map(q=>'- '+q).join('\n')}\n\n## Colocar em prática\n${study.practice}\n\n## Ligação com as aulas\n${study.connection}\n\n*As perguntas e propostas de prática são exercícios editoriais deste caderno, não citações do santo.*`;
}
const mysterySources: Record<string,string> = {
  gozosos:'https://www.vatican.va/special/rosary/documents/misteri_gaudiosi_po.html',
  dolorosos:'https://www.vatican.va/special/rosary/documents/misteri_dolorosi_po.html',
  gloriosos:'https://www.vatican.va/special/rosary/documents/misteri_gloriosi_po.html',
  luminosos:'https://www.vatican.va/special/rosary/documents/misteri_luminosi_po.html',
};
const mysteries:Article[]=rosaryGroups.map(group=>({slug:'misterios-'+group.id,title:group.title,category:'Rosário e oração',kind:group.id==='luminosos'?'Proposta devocional de 2002':'Meditação tradicional',excerpt:group.description,lessons:group.id==='gozosos'?['aula-06','aula-07']:group.id==='gloriosos'?['aula-08','aula-09','aula-10']:['aula-07'],body:'As meditações abaixo são sugestões editoriais breves. Leia as referências bíblicas em sua Bíblia e reze sem pressa.\n\n'+group.mysteries.map((m,index)=>`## ${index+1}. ${m.title}\n\n**Leitura:** ${m.reference}.\n\n${m.meditation}`).join('\n\n'),sources:[['Santa Sé: '+group.title,mysterySources[group.id]]]}));
export const articles=[...catalog,...mysteries];
if(new Set(articles.map(a=>a.slug)).size!==articles.length)throw new Error('Artigo duplicado na biblioteca.');
export function getArticle(slug:string){const article=articles.find(a=>a.slug===slug);if(!article)throw new Error('Artigo não encontrado.');return {...article,html:renderMarkdown(article.body)};}
export function sourceUrl(value:string){return /^https?:\/\//.test(value)?value:base+value;}
const related:Record<string,string[]>={
  'aula-01':['sao-pio-x','sao-jeronimo','fontes-e-estudo'],
  'aula-02':['sao-jeronimo','sao-tomas','ler-a-biblia'],
  'aula-03':['credo-e-mandamentos','santo-agostinho','sao-tomas'],
  'aula-04':['anjos','oracao-e-salmos','vida-espiritual'],
  'aula-05':['sao-francisco','vida-espiritual','misericordia'],
  'aula-06':['jesus-cristo','maria-e-jose','misterios-gozosos'],
  'aula-07':['como-rezar-o-terco','missa','maria-e-jose'],
  'aula-08':['misterios-gloriosos','sacramentos','jesus-cristo'],
  'aula-09':['misterios-gloriosos','maria-e-jose','distincoes'],
  'aula-10':['santo-agostinho','sao-francisco','rosario-e-terco'],
  'aula-11':['santo-atanasio','sao-pio-x','familias-religiosas'],
};
export function relatedArticles(slug:string){return(related[slug]??[]).map(id=>articles.find(a=>a.slug===id)!).filter(Boolean).slice(0,3);}
