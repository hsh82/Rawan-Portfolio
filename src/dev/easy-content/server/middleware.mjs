import { execFile } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { repositoryRoot, assertLocalRequest, sessionToken, mediaRoot, safePath, writeAtomic } from './security.mjs';
import { contentTree, contextForPath, editorContextForPath, createArticle, createJourney, createProject, readEntity, saveEntity } from './adapters.mjs';

const execFileAsync = promisify(execFile);
const MAX_BODY = 1_500_000;
const MAX_ASSET = 12 * 1024 * 1024;
const MAX_UPLOAD_BODY = Math.ceil(MAX_ASSET / 3) * 4 + 300_000;
const editorRoot = resolve(dirname(new URL(import.meta.url).pathname), '..', 'editor');
const editorHtml = readFileSync(resolve(editorRoot, 'editor.html'), 'utf8');
const editorScript = readFileSync(resolve(editorRoot, 'editor.js'), 'utf8');

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

export function easyContentMiddleware({ editorOnly = false } = {}) {
  return async (req, res, next) => {
    try {
      const url = requestPath(req);
      const isEditorRequest = url.pathname === '/__easy-content/editor.js' || url.pathname.startsWith('/dev/content/');
      if (editorOnly && !isEditorRequest) return next();
      if (editorOnly) {
        assertLocalRequest(req);
        if (req.method === 'GET' && url.pathname === '/__easy-content/editor.js') return text(res, 200, 'text/javascript; charset=utf-8', editorScript);
        if (req.method === 'GET' && url.pathname.startsWith('/dev/content/')) {
          const context = editorContextForPath(url.pathname, url.search);
          if (context.type === 'unsupported') return text(res, 404, 'text/plain; charset=utf-8', context.reason || 'unsupported content type');
          return text(res, 200, 'text/html; charset=utf-8', editorHtml);
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
      if (req.method === 'GET' && operation === 'git-status') {
        requireToken(req);
        return json(res, 200, await gitStatus());
      }
      if (req.method === 'GET' && operation === 'validate') {
        requireToken(req);
        return json(res, 200, await validateContent());
      }
      if (req.method === 'GET' && operation === 'editor.js') return text(res, 200, 'text/javascript; charset=utf-8', editorScript);
      if (req.method === 'GET' && operation === 'tree') {
        requireToken(req);
        return json(res, 200, { tree: contentTree(url.searchParams.get('locale') === 'fa' ? 'fa' : 'en') });
      }
      if (req.method === 'GET' && operation === 'media') {
        requireToken(req);
        return json(res, 200, { media: listMedia() });
      }
      if (req.method !== 'POST') return next();
      requireToken(req);
      if (operation === 'save') return json(res, 200, { entity: saveEntity(await body(req)) });
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
