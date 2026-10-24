import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import MarkdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';

const docsRoot = resolve(process.cwd(), '../docs');
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(markdownItAttrs);
md.renderer.rules.heading_open = (tokens, index, options, env, renderer) => {
  const text = tokens[index + 1]?.children?.map(token => token.content).join('') ?? '';
  const stem = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'secao';
  const counts = env.headingCounts ??= new Map<string, number>();
  const count = (counts.get(stem) ?? 0) + 1;
  counts.set(stem, count);
  if (!tokens[index].attrGet('id')) tokens[index].attrSet('id', stem + (count > 1 ? '-' + count : ''));
  return renderer.renderToken(tokens, index, options);
};

export const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';

function readDocs(path: string): string {
  return readFileSync(resolve(docsRoot, path), 'utf8');
}

// Adaptador experimental. Conteúdo original continua intocado em /docs.
function adaptMkdocs(input: string): string {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let admonitionOpen = false;
  for (const line of lines) {
    const match = line.match(/^!!!\s+(\w+)(?:\s+"([^"]+)")?\s*$/);
    if (match) {
      if (admonitionOpen) out.push('', '</div>', '');
      out.push('<div class="admonition ' + match[1] + '">', '', '**' + (match[2] ?? match[1]) + '**', '');
      admonitionOpen = true;
      continue;
    }
    if (admonitionOpen && line.trim() && !/^(    |\t)/.test(line)) {
      out.push('', '</div>', '');
      admonitionOpen = false;
    }
    out.push(admonitionOpen && line.startsWith('    ') ? line.slice(4) : line);
  }
  if (admonitionOpen) out.push('', '</div>', '');
  return out.join('\n')
    .replaceAll('../assets/', base)
    .replace(/\{\s*\.([a-zA-Z0-9_-]+)\s*\}/g, '{$1}');
}

export function renderMarkdown(source: string): string {
  return md.render(adaptMkdocs(source), {}).replace(/href="([^"#?]+)\.md(#[^"]*)?"/g, (_match, path, anchor = '') => {
    const route = path.replace(/^(\.\.\/|\.\/)/, '').replace(/\/index$/, '');
    return 'href="' + base + route + '/' + anchor + '"';
  });
}

export function getLessonSlugs(): string[] {
  return readdirSync(resolve(docsRoot, 'aulas'))
    .filter((file) => /^aula-\d+\.md$/.test(file))
    .map((file) => file.replace(/\.md$/, ''))
    .sort();
}

export function titleOf(source: string): string {
  return source.match(/^#\s+(.+)$/m)?.[1] ?? 'Sem título';
}

export function getLesson(slug: string) {
  if (!/^aula-\d+$/.test(slug)) throw new Error('Slug inválido');
  const source = readDocs('aulas/' + slug + '.md');
  const html = renderMarkdown(source);
  const headings = [...html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(match => ({
    id: match[1], title: match[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'),
  }));
  const words = source.split(/\s+/).length;
  return { slug, title: titleOf(source), html, headings, minutes: Math.max(1, Math.ceil(words / 200)) };
}

export function getSearchDocuments() {
  return getLessonSlugs().map(slug => {
    const source = readDocs('aulas/' + slug + '.md');
    return { title: titleOf(source), url: base + 'aulas/' + slug + '/', text: source.replace(/^!!![^\n]*$/gm, '').replace(/<[^>]*>/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#*`>|_]/g, '').replace(/\s+/g, ' ').trim() };
  });
}

export function getQuestionnaire(slug: string) {
  if (!/^aula-\d+$/.test(slug)) throw new Error('Slug inválido');
  const source = readDocs('questionarios/' + slug + '.md').replace(/\r\n/g, '\n');
  const keys = JSON.parse(readFileSync(resolve(docsRoot, '../database/answer-keys.json'), 'utf8')) as {
    origin: string; lessons: Record<string, { source_sha256: string; answers: [string, string][] }>;
  };
  const key = keys.lessons[slug];
  if (!key || key.source_sha256 !== createHash('sha256').update(source).digest('hex')) {
    throw new Error('Gabarito ausente ou desatualizado para ' + slug + '. Confira as respostas antes de publicar.');
  }
  const matches = [...source.matchAll(/^###\s+(\d+)\.\s+(.+)$/gm)];
  if (key.answers.length !== matches.length) throw new Error('Gabarito incompleto: ' + slug);
  const questions: QuizQuestion[] = matches.map((match, index) => {
    const block = source.slice(match.index! + match[0].length, matches[index + 1]?.index ?? source.length);
    const options = [...block.matchAll(/^-\s+\[[ xX]\]\s+([A-D])\.\s+(.+)$/gm)].map(option => ({ label: option[1], text: option[2], html: md.renderInline(option[2]) }));
    const [answer, explanation] = key.answers[index];
    if (Number(match[1]) !== index + 1 || options.map(option => option.label).join('') !== 'ABCD' || !options.some(option => option.label === answer) || !explanation) {
      throw new Error('Questão ou gabarito inválido: ' + slug + ', questão ' + match[1]);
    }
    return { number: Number(match[1]), prompt: match[2], html: md.renderInline(match[2]), options, answer, explanation };
  });
  return { slug, title: titleOf(source), html: renderMarkdown(source), questions, keyOrigin: keys.origin };
}

export interface QuizQuestion {
  number: number;
  prompt: string;
  html: string;
  options: { label: string; text: string; html: string }[];
  answer: string;
  explanation: string;
}

export function getDocument(path: 'dicionario.md' | 'sobre.md' | 'aulas/trailer.md') {
  const source = readDocs(path);
  return { title: titleOf(source), html: renderMarkdown(source) };
}

export function getDictionary() {
  const lines=readDocs('dicionario.md').replace(/\r\n/g,'\n').split('\n');
  const entries=new Map<string,{term:string;definition:string;lessons:Set<string>}>();
  let lesson='';
  for(let index=0;index<lines.length;index++){
    const section=lines[index].match(/^## Novos verbetes.*#(\d+)/);
    if(section)lesson='aula-'+String(Number(section[1])).padStart(2,'0');
    const term=lines[index].match(/^\*\*(.+?)\*\*\s*$/);
    if(!term)continue;
    const body:string[]=[];
    while(index+1<lines.length&&!/^## |^\*\*.+\*\*\s*$/.test(lines[index+1]))body.push(lines[++index]);
    const id=term[1].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const previous=entries.get(id),lessons=previous?.lessons??new Set<string>();
    if(lesson)lessons.add(lesson);
    entries.set(id,{term:term[1],definition:body.join('\n').trim(),lessons});
  }
  return [...entries].map(([id,entry])=>({id,term:entry.term,definition:entry.definition,html:renderMarkdown(entry.definition),lessons:[...entry.lessons]})).sort((a,b)=>a.term.localeCompare(b.term,'pt-BR'));
}
