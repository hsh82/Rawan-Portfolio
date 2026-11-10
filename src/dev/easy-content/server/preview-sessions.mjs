import { randomBytes } from 'node:crypto';

const key = Symbol.for('rawan.easy-content.preview-sessions');
const sessions = globalThis[key] ||= new Map();
const MAX_SESSIONS = 80;
const MAX_AGE = 10 * 60 * 1000;

function purge() {
  const now = Date.now();
  for (const [id, value] of sessions) if (now - value.createdAt > MAX_AGE) sessions.delete(id);
}

export function createPreviewSession(value) {
  purge();
  if (sessions.size >= MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
  const id = randomBytes(18).toString('base64url');
  sessions.set(id, { ...structuredClone(value), createdAt: Date.now() });
  return id;
}

export function previewSession(id) {
  purge();
  return sessions.get(id);
}
