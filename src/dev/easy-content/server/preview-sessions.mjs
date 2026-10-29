import { randomBytes } from 'node:crypto';

const sessions = new Map();
const MAX_AGE = 10 * 60 * 1000;

function purge() {
  const now = Date.now();
  for (const [id, value] of sessions) if (now - value.createdAt > MAX_AGE) sessions.delete(id);
}

export function createPreviewSession(value) {
  purge();
  const id = randomBytes(18).toString('base64url');
  sessions.set(id, { ...value, createdAt: Date.now() });
  return id;
}

export function previewSession(id) {
  purge();
  return sessions.get(id);
}
