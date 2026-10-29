import { createHash, randomBytes } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

export const repositoryRoot = resolve(process.cwd());
export const contentRoot = resolve(repositoryRoot, 'content');
export const mediaRoot = resolve(contentRoot, 'media');
export const sessionToken = randomBytes(24).toString('hex');

export function isInside(root, candidate) {
  const rootPath = resolve(root);
  const target = resolve(candidate);
  return target === rootPath || target.startsWith(`${rootPath}${sep}`);
}

export function safePath(root, ...segments) {
  if (segments.some(segment => typeof segment !== 'string' || !segment || segment.includes('\0') || segment.includes('/') || segment.includes('\\') || segment === '.' || segment === '..' || segment.includes('..'))) {
    throw new Error('Unsafe path segment');
  }
  const target = resolve(root, ...segments);
  if (!isInside(root, target)) throw new Error('Path is outside the allowed directory');
  const rootPath = resolve(root);
  let cursor = target;
  while (isInside(rootPath, cursor) && cursor !== rootPath) {
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) throw new Error('Symlink paths are not allowed');
    cursor = dirname(cursor);
  }
  return target;
}

export function contentPath(...segments) {
  return safePath(contentRoot, ...segments);
}

export function relativeContentPath(file) {
  const value = relative(repositoryRoot, file).replaceAll('\\', '/');
  if (!isInside(contentRoot, file)) throw new Error('Only content files may be exposed');
  return value;
}

export function revisionOf(source) {
  return createHash('sha256').update(source, 'utf8').digest('hex');
}

export function readText(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

export function ensureDirectory(file) {
  mkdirSync(dirname(file), { recursive: true });
}

function temporaryPath(file) {
  return `${file}.easy-content-${process.pid}-${randomBytes(6).toString('hex')}.tmp`;
}

export function writeAtomic(file, source) {
  ensureDirectory(file);
  const temp = temporaryPath(file);
  try {
    writeFileSync(temp, source, { encoding: 'utf8', mode: 0o600 });
    renameSync(temp, file);
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
}

export function writeTransaction(files) {
  const originals = files.map(file => ({ file, source: readText(file), existed: existsSync(file) }));
  const temps = [];
  try {
    for (const { file, source } of files) {
      ensureDirectory(file);
      const temp = temporaryPath(file);
      writeFileSync(temp, source, { encoding: 'utf8', mode: 0o600 });
      temps.push({ file, temp });
    }
    for (const { file, temp } of temps) renameSync(temp, file);
  } catch (error) {
    for (const temp of temps) if (existsSync(temp.temp)) unlinkSync(temp.temp);
    for (const original of originals) {
      if (original.existed) writeAtomic(original.file, original.source);
      else if (existsSync(original.file)) unlinkSync(original.file);
    }
    throw error;
  }
}

export function safeSlug(value) {
  const slug = String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Slug must contain lowercase letters, numbers, and hyphens');
  return slug;
}

export function assertLocalRequest(req) {
  const address = req.socket?.remoteAddress || '';
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) throw new Error('Easy Content writes are limited to the local machine');
  const origin = req.headers.origin;
  if (origin) {
    const host = req.headers.host;
    const originHost = new URL(origin).host;
    const originUrl = new URL(origin);
    if (!host || originHost !== host || !['localhost', '127.0.0.1', '::1'].includes(originUrl.hostname)) {
      throw new Error('Cross-origin Easy Content requests are not allowed');
    }
  }
}
