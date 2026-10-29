import { execFile } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { evaluate } from '@mdx-js/mdx';
import * as preactRuntime from 'preact/jsx-runtime';
import { render as renderPreact } from 'preact-render-to-string';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { repositoryRoot, assertLocalRequest, sessionToken, mediaRoot, safePath, writeAtomic } from './security.mjs';
import { contentTree, contextForPath, editorContextForPath, createArticle, createJourney, createProject, deleteEntity, readEntity, saveEntity } from './adapters-bilingual.mjs';
import { createResource, deleteResource, readResource, resourceCatalog, resourceDependencies, resourcePreviewUrl, saveResource } from './resources.mjs';
import { createPreviewSession, previewSession } from './preview-sessions.mjs';

const execFileAsync = promisify(execFile);
const MAX_BODY = 1_500_000;
const MAX_ASSET = 12 * 1024 * 1024;
const MAX_UPLOAD_BODY = Math.ceil(MAX_ASSET / 3) * 4 + 300_000;
const editorRoot = resolve(dirname(new URL(import.meta.url).pathname), '..', 'editor');
const editorHtml = readFileSync(resolve(editorRoot, 'editor-bilingual.html'), 'utf8');
const editorScript = readFileSync(resolve(editorRoot, 'editor-bilingual.js'), 'utf8');
const editorDeleteScript = readFileSync(resolve(editorRoot, 'editor-delete.js'), 'utf8');
const studioHtml = readFileSync(resolve(editorRoot, 'studio.html'), 'utf8');
const studioScript = readFileSync(resolve(editorRoot, 'studio.js'), 'utf8');

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function text(res, status, contentType, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.end(payload);
}

function requestPath(req) {
  return new URL(req.url || '/', 'http://easy-content.local');
}

async function body(req, limit = MAX_BODY) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Request body is too large'), { code: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function requireToken(req) {
  if (req.headers['x-easy-content-token'] !== sessionToken) throw Object.assign(new Error('Invalid Easy Content session token'), { code: 403 });
}

async function gitStatus() {
  const result = await execFileAsync('git', ['status', '--short', '--branch', '--', 'content'], { cwd: repositoryRoot, windowsHide: true });
  const diff = await execFileAsync('git', ['diff', '--stat', '--', 'content'], { cwd: repositoryRoot, windowsHide: true });
  return { status: result.stdout, diff: diff.stdout };
}

async function validateContent() {
  const command = process.platform === 'win32' ? 'node.exe' : process.execPath;
  const validate = await execFileAsync(command, ['scripts/content-validate.mjs'], { cwd: repositoryRoot, windowsHide: true });
  const links = await execFileAsync(command, ['scripts/content-check-links.mjs'], { cwd: repositoryRoot, windowsHide: true });
  return { validate: validate.stdout, links: links.stdout };
}

function ensureImageType(filename, contentType) {
  const extension = String(filename).toLowerCase().match(/\.(png|jpe?g|webp|gif)$/)?.[1];
  const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
  if (!extension || types[extension] !== contentType) throw new Error('Only matching PNG, JPEG, WebP, and GIF assets are allowed');
  return extension;
}

function hasImageSignature(buffer, extension) {
  if (extension === 'png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (extension === 'jpg' || extension === 'jpeg') return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  if (extension === 'gif') return buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (extension === 'webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

function safeAssetName(filename) {
  const base = String(filename || '').split(/[\\/]/).at(-1).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  if (!base || base.startsWith('.') || base.includes('..')) throw new Error('Invalid asset filename');
  return base;
}

async function uploadAsset(input) {
  const filename = safeAssetName(input.filename);
  const extension = ensureImageType(filename, input.contentType);
  const buffer = Buffer.from(String(input.data || ''), 'base64');
  if (!buffer.length || buffer.length > MAX_ASSET) throw new Error('Asset is empty or exceeds the 12 MB limit');
  if (!hasImageSignature(buffer, extension)) throw new Error('The uploaded file does not match its declared image type');
  const project = input.project ? safeAssetName(input.project).replace(/\.[^.]+$/, '') : 'uploads';
  const file = safePath(mediaRoot, 'projects', project, filename);
  if (existsSync(file)) throw new Error('An asset with this filename already exists');
  writeAtomic(file, buffer);
  await execFileAsync(process.execPath, ['scripts/media-publish.mjs'], { cwd: repositoryRoot, windowsHide: true });
  return { reference: `media/projects/${project}/${filename}`, publicUrl: `/media/projects/${project}/${filename}` };
}

function listMedia(directory = mediaRoot) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) return listMedia(file);
    if (!/\.(png|jpe?g|webp|gif)$/i.test(entry.name)) return [];
    return [`/media/${relative(mediaRoot, file).replaceAll('\\', '/')}`];
  });
}

const previewElement = (tag, props = {}, children) => preactRuntime.jsx(tag, children === undefined ? props : { ...props, children });
const previewComponents = {
  Callout: ({ children, title, type }) => previewElement('aside', { class: `preview-callout preview-callout-${type || 'note'}` }, [title && previewElement('strong', {}, title), previewElement('div', {}, children)]),
  Figure: ({ src, alt, caption }) => previewElement('figure', {}, [previewElement('img', { src, alt: alt || '' }), caption && previewElement('figcaption', {}, caption)]),
  AttachmentDownload: ({ children, href, label }) => previewElement('a', { href, download: true }, label || children || 'Download attachment'),
  MermaidDiagram: ({ children, label }) => previewElement('div', { class: 'preview-diagram' }, label || children || 'Mermaid diagram'),
  MindMap: ({ children, label }) => previewElement('div', { class: 'preview-diagram' }, label || children || 'Mind map'),
  CodeBlock: ({ children, language }) => previewElement('pre', {}, previewElement('code', { 'data-language': language || '' }, children)),
  Tabs: ({ children }) => previewElement('div', { class: 'preview-tabs' }, children),
};

async function renderPreview(input) {
  const evaluated = await evaluate(String(input.source || ''), {
    ...preactRuntime,
    baseUrl: import.meta.url,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
    useMDXComponents: () => previewComponents,
  });
  return renderPreact(evaluated.default({}));
}

function previewFrame(res, id) {
  const session = previewSession(id);
  if (!session) return text(res, 404, 'text/plain; charset=utf-8', 'Preview expired. Refresh it from Easy Content Studio.');
  const snapshot = JSON.stringify(session).replaceAll('<', '\\u003c');
  const page = resourcePreviewUrl(session.resource, session.locale);
  const html = `<!doctype html><html lang="${session.locale}" dir="${session.locale === 'fa' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,iframe{margin:0;width:100%;height:100%;border:0}#notice{position:fixed;z-index:2;top:.5rem;inset-inline-start:.5rem;padding:.35rem .55rem;border-radius:.4rem;background:#075fca;color:#fff;font:12px system-ui;box-shadow:0 .25rem 1rem #0003}</style></head><body><span id="notice">Unsaved local preview</span><iframe id="site" src="${page}"></iframe><script>const session=${snapshot};const frame=document.querySelector('#site');const copy=session.value?.locales?.[session.locale]||session.value?.locales?.en||{};frame.addEventListener('load',()=>{const d=frame.contentDocument;if(!d)return;const set=(selector,value)=>{const el=d.querySelector(selector);if(el&&typeof value==='string')el.textContent=value};const imageUrl=value=>typeof value==='string'?(value.startsWith('media/')?'/media/'+value.slice(6):value):'';if(session.resource==='home'){set('#start h1',copy.displayName);set('#start h1 + p',copy.title);set('#start h1 + p + p',copy.intro);set('#start h1 + p + p + p',copy.summary);set('#about h2',copy.about?.title);set('#about h2 + p',copy.about?.description||copy.description)}if(session.resource==='profile'){const img=d.querySelector('#start img');const image=imageUrl(session.value?.image);if(img&&image)img.src=image}if(session.resource==='contact'){set('#contact h1',copy.title);set('#contact h1 + p',copy.intro)}if(session.resource==='site'){d.title=session.value?.locales?.[session.locale]?.title||d.title;const meta=d.querySelector('meta[name="description"]');if(meta)meta.content=session.value?.locales?.[session.locale]?.description||meta.content}})</script></body></html>`;
  return text(res, 200, 'text/html; charset=utf-8', html);
}

export function easyContentMiddleware({ editorOnly = false } = {}) {
  return async (req, res, next) => {
    try {
      const url = requestPath(req);
      const isPreviewRoute = url.pathname.startsWith('/dev/content/preview/');
      const isEditorRequest = url.pathname === '/__easy-content/editor.js' || url.pathname === '/__easy-content/editor-delete.js' || url.pathname === '/__easy-content/studio.js' || (!isPreviewRoute && url.pathname.startsWith('/dev/content/'));
      if (editorOnly && isPreviewRoute) {
        assertLocalRequest(req);
        const id = url.pathname.split('/').filter(Boolean).at(-1);
        return previewFrame(res, id);
      }
      if (editorOnly && !isEditorRequest) return next();
      if (editorOnly) {
        assertLocalRequest(req);
        if (req.method === 'GET' && url.pathname === '/__easy-content/editor.js') return text(res, 200, 'text/javascript; charset=utf-8', editorScript);
        if (req.method === 'GET' && url.pathname === '/__easy-content/editor-delete.js') return text(res, 200, 'text/javascript; charset=utf-8', editorDeleteScript);
        if (req.method === 'GET' && url.pathname === '/__easy-content/studio.js') return text(res, 200, 'text/javascript; charset=utf-8', studioScript);
        if (req.method === 'GET' && url.pathname.startsWith('/dev/content/')) {
          const context = editorContextForPath(url.pathname, url.search);
          if (context.type === 'unsupported') return text(res, 404, 'text/plain; charset=utf-8', context.reason || 'unsupported content type');
          return text(res, 200, 'text/html; charset=utf-8', ['studio', 'resource'].includes(context.type) ? studioHtml : editorHtml);
        }
        return next();
      }
      assertLocalRequest(req);
      const operation = url.pathname.replace(/^\//, '');
      if (req.method === 'GET' && operation === 'context') {
        const requestedPath = url.searchParams.get('path') || '/';
        const requestedUrl = new URL(requestedPath, 'http://easy-content.local');
        const context = requestedUrl.pathname.startsWith('/dev/content/')
          ? editorContextForPath(requestedUrl.pathname, requestedUrl.search)
          : contextForPath(requestedUrl.pathname);
        return json(res, context.type === 'unsupported' ? 404 : 200, { enabled: true, token: sessionToken, context });
      }
      if (req.method === 'GET' && operation === 'read') {
        requireToken(req);
        const context = JSON.parse(url.searchParams.get('context') || '{}');
        return json(res, 200, { entity: readEntity(context) });
      }
      if (req.method === 'GET' && operation === 'catalog') {
        requireToken(req);
        return json(res, 200, { resources: resourceCatalog(), projects: contentTree() });
      }
      if (req.method === 'GET' && operation === 'resource') {
        requireToken(req);
        return json(res, 200, { entity: readResource({ resource: url.searchParams.get('resource'), id: url.searchParams.get('id') || undefined }) });
      }
      if (req.method === 'GET' && operation === 'references') {
        requireToken(req);
        return json(res, 200, { references: resourceDependencies(url.searchParams.get('resource'), url.searchParams.get('id')) });
      }
      if (req.method === 'GET' && operation === 'git-status') {
        requireToken(req);
        return json(res, 200, await gitStatus());
      }
      if (req.method === 'GET' && operation === 'validate') {
        requireToken(req);
        return json(res, 200, await validateContent());
      }
      if (req.method === 'POST' && operation === 'preview') {
        requireToken(req);
        return json(res, 200, { html: await renderPreview(await body(req)) });
      }
      if (req.method === 'POST' && operation === 'preview-session') {
        requireToken(req);
        const input = await body(req);
        return json(res, 200, { id: createPreviewSession({ resource: input.resource, id: input.id, value: input.value, locale: input.locale === 'fa' ? 'fa' : 'en', revision: input.revision }) });
      }
      if (req.method === 'GET' && operation === 'editor.js') return text(res, 200, 'text/javascript; charset=utf-8', editorScript);
      if (req.method === 'GET' && operation === 'editor-delete.js') return text(res, 200, 'text/javascript; charset=utf-8', editorDeleteScript);
      if (req.method === 'GET' && operation === 'studio.js') return text(res, 200, 'text/javascript; charset=utf-8', studioScript);
      if (req.method === 'GET' && operation === 'tree') {
        requireToken(req);
        return json(res, 200, { tree: contentTree() });
      }
      if (req.method === 'GET' && operation === 'media') {
        requireToken(req);
        return json(res, 200, { media: listMedia() });
      }
      if (req.method !== 'POST') return next();
      requireToken(req);
      if (operation === 'save') return json(res, 200, { entity: saveEntity(await body(req)) });
      if (operation === 'delete-entity') return json(res, 200, deleteEntity(await body(req)));
      if (operation === 'save-resource') return json(res, 200, { entity: saveResource(await body(req)) });
      if (operation === 'create-resource') return json(res, 201, { entity: createResource(await body(req)) });
      if (operation === 'delete-resource') return json(res, 200, deleteResource(await body(req)));
      if (operation === 'create-project') return json(res, 201, createProject(await body(req)));
      if (operation === 'create-article') return json(res, 201, createArticle(await body(req)));
      if (operation === 'create-entry' || operation === 'create-journey') return json(res, 201, createJourney(await body(req)));
      if (operation === 'upload-asset') return json(res, 201, await uploadAsset(await body(req, MAX_UPLOAD_BODY)));
      return next();
    } catch (error) {
      const status = Number(error?.code) || 400;
      return json(res, status >= 400 && status < 600 ? status : 500, { error: error instanceof Error ? error.message : 'Easy Content request failed', conflict: status === 409 });
    }
  };
}
