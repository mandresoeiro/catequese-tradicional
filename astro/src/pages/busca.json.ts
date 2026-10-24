import { getSearchDocuments } from '../lib/content';
import {articles} from '../lib/library';
import {base} from '../lib/content';

export function GET() {
  return new Response(JSON.stringify([...getSearchDocuments(),...articles.map(article=>({title:article.title,url:base+'biblioteca/'+article.slug+'/',text:article.body.replace(/[#*`>|]/g,' ').replace(/\s+/g,' ')}))]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
