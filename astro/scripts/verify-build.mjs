import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = resolve('dist');
const prefix = '/catequese-tradicional/';
const failures = [];
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? walk(resolve(directory, entry.name))
    : resolve(directory, entry.name)))).flat();
}
const pages = (await walk(root)).filter(path => path.endsWith('.html'));
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  for (const [, attribute, value] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|\/\/)/i.test(value)) continue;
    const [path, anchor] = value.split('#');
    const target = !path ? page : path.startsWith(prefix)
      ? resolve(root, decodeURIComponent(path.slice(prefix.length)).split('?')[0])
      : resolve(dirname(page), decodeURIComponent(path).split('?')[0]);
    try {
      const info = await stat(target);
      const file = info.isDirectory() ? resolve(target, 'index.html') : target;
      if (attribute === 'href' && anchor && file.endsWith('.html')) {
        const content = await readFile(file, 'utf8');
        if (!content.includes(`id="${decodeURIComponent(anchor)}"`)) failures.push(`${page}: âncora ausente ${value}`);
      }
    } catch { failures.push(`${page}: recurso ausente ${value}`); }
  }
}
const search = JSON.parse(await readFile(resolve(root, 'busca.json'), 'utf8'));
const lessonPages = pages.filter(path => /[/\\]aulas[/\\]aula-\d+[/\\]index\.html$/.test(path));
if (search.filter(entry=>entry.url.includes('/aulas/')).length !== lessonPages.length) failures.push('O índice de busca não cobre todas as aulas.');
for (const entry of search) {
  if (!entry.title || !entry.url || !entry.text) failures.push('Entrada de busca incompleta.');
}
const lesson11 = await readFile(resolve(root, 'aulas/aula-11/index.html'), 'utf8');
if (!lesson11.includes('<h2 id="1-resumo-essencial">')) failures.push('O resumo essencial não foi renderizado como seção.');
if (/!!!\s+(?:info|note|tip|warning)/.test(lesson11)) failures.push('Diretiva de destaque não convertida.');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${pages.length} páginas verificadas: links, recursos, âncoras e índice de ${search.length} conteúdos válidos.`);
}
