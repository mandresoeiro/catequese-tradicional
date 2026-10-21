import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import MarkdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';

const docsRoot = resolve(process.cwd(), '../docs');
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(markdownItAttrs);
export const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
function readDocs(path: string): string { return readFileSync(resolve(docsRoot, path), 'utf8'); }
export function titleOf(source: string): string { return source.match(/^#\s+(.+)$/m)?.[1] ?? 'Sem título'; }
export function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/<[^>]*>/g, '').replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-');
}
const escapeAttr = (s: string) => md.utils.escapeHtml(s);
const fallbackHeading = md.renderer.rules.heading_open ?? ((tokens: any, idx: number, opts: any, env: any, self: any) => self.renderToken(tokens, idx, opts));
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const sibling = tokens[idx + 1];
  const text = sibling?.content ?? '';
  const generated = slugify(text);
  const ids = (env.headingIds ??= new Map<string, number>());
  const count = ids.get(generated) ?? 0;
  ids.set(generated, count + 1);
  tokens[idx].attrSet('id', count ? generated+'-'+count : generated);
  return fallbackHeading(tokens, idx, options, env, self);
};
function adaptMkdocs(input: string): string {
  // Mantém as caixas de aviso como markdown renderizável, sem engolir os parágrafos seguintes.
  let output = input.replace(/(^|\n)!!![ \t]+([a-z-]+)(?:[ \t]+"([^"\n]+)")?[ \t]*\n((?:(?: {4}|\t)[^\n]*\n|[ \t]*\n)*)/g,
    (_all, start, type, title, body) => {
      const cleaned = body.split('\n').map((line: string) => line.startsWith('    ') ? line.slice(4) : line.startsWith('\t') ? line.slice(1) : line).join('\n').trim();
      return start + '<div class="admonition '+escapeAttr(type)+'"><strong>'+escapeAttr(title||type)+'</strong>\n\n'+cleaned+'\n\n</div>\n';
    });
  output = output.replaceAll('../assets/', base)
    .replaceAll('assets/images/', base+'images/')
    .replace(/\{\s*\.([a-zA-Z0-9_-]+)\s*\}/g, '{$1}');
  return output;
}
export function renderMarkdown(source: string): string {
  const env: {headingIds?: Map<string,number>} = {};
  return md.render(adaptMkdocs(source),env);
}
export function headingsOf(source: string) {
  return [...source.matchAll(/^(#{2,3})[ \t]+(.+)$/gm)].map((m) => ({level:m[1].length,title:m[2].replace(/[*_`]/g,''),id:slugify(m[2])}));
}
export function getLessonSlugs(): string[] {
  return readdirSync(resolve(docsRoot,'aulas')).filter(f=>/^aula-\d+\.md$/.test(f))
    .map(f=>f.replace(/\.md$/,'')).sort();
}
export function getLesson(slug: string) {
  if(!/^aula-\d+$/.test(slug)) throw new Error('Slug inválido');
  const source=readDocs('aulas/'+slug+'.md');
  return {slug,title:titleOf(source),source,headings:headingsOf(source),html:renderMarkdown(source)};
}
export function getQuestionnaire(slug: string) {
  if(!/^aula-\d+$/.test(slug)) throw new Error('Slug inválido');
  const source=readDocs('questionarios/'+slug+'.md');
  return {slug,title:titleOf(source),source,html:renderMarkdown(source)};
}
export function getDocument(path:'dicionario.md'|'sobre.md'|'aulas/trailer.md') {
  const source=readDocs(path); return {title:titleOf(source),source,html:renderMarkdown(source)};
}
