import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import MarkdownIt from 'markdown-it';
import markdownItAttrs from 'markdown-it-attrs';

const docsRoot = resolve(process.cwd(), '../docs');
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(markdownItAttrs);

export const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';

function readDocs(path: string): string {
  return readFileSync(resolve(docsRoot, path), 'utf8');
}

// Adaptador experimental. Conteúdo original continua intocado em /docs.
function adaptMkdocs(input: string): string {
  const lines = input.replace(/\\r\\n/g, '\\n').split('\\n');
  const out: string[] = [];
  let admonitionOpen = false;
  for (const line of lines) {
    const match = line.match(/^!!!\\s+(\\w+)(?:\\s+"([^"]+)")?\\s*$/);
    if (match) {
      if (admonitionOpen) out.push('</div>');
      out.push('<div class="admonition ' + match[1] + '"><strong>' + (match[2] ?? match[1]) + '</strong>');
      admonitionOpen = true;
      continue;
    }
    if (admonitionOpen && line.trim() && !/^(    |\\t)/.test(line)) {
      out.push('</div>');
      admonitionOpen = false;
    }
    out.push(admonitionOpen && line.startsWith('    ') ? line.slice(4) : line);
  }
  if (admonitionOpen) out.push('</div>');
  return out.join('\\n')
    .replaceAll('../assets/', base)
    .replace(/\\{\\s*\\.([a-zA-Z0-9_-]+)\\s*\\}/g, '{$1}');
}

export function renderMarkdown(source: string): string {
  return md.render(adaptMkdocs(source));
}

export function getLessonSlugs(): string[] {
  return readdirSync(resolve(docsRoot, 'aulas'))
    .filter((file) => /^aula-\\d+\\.md$/.test(file))
    .map((file) => file.replace(/\\.md$/, ''))
    .sort();
}

export function titleOf(source: string): string {
  return source.match(/^#\\s+(.+)$/m)?.[1] ?? 'Sem título';
}

export function getLesson(slug: string) {
  if (!/^aula-\\d+$/.test(slug)) throw new Error('Slug inválido');
  const source = readDocs('aulas/' + slug + '.md');
  return { slug, title: titleOf(source), html: renderMarkdown(source) };
}

export function getQuestionnaire(slug: string) {
  if (!/^aula-\\d+$/.test(slug)) throw new Error('Slug inválido');
  const source = readDocs('questionarios/' + slug + '.md');
  return { slug, title: titleOf(source), html: renderMarkdown(source) };
}

export function getDocument(path: 'dicionario.md' | 'sobre.md' | 'aulas/trailer.md') {
  const source = readDocs(path);
  return { title: titleOf(source), html: renderMarkdown(source) };
}
