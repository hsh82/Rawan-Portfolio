import { readFileSync } from 'node:fs';
import { editorContextForPath } from '../server/adapters-bilingual.mjs';

const editorHtml = readFileSync(new URL('./editor-bilingual.html', import.meta.url), 'utf8');
const studioHtml = readFileSync(new URL('./studio.html', import.meta.url), 'utf8');

export const prerender = false;

export function GET({ request }) {
  const url = new URL(request.url);
  const context = editorContextForPath(url.pathname, url.search);
  if (context.type === 'unsupported') return new Response(context.reason || 'unsupported content type', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  return new Response(['studio', 'resource'].includes(context.type) ? studioHtml : editorHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
