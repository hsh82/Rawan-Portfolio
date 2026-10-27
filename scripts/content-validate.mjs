import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'content');
const read = (file, fallback) => existsSync(resolve(root, file)) ? JSON.parse(readFileSync(resolve(root, file), 'utf8')) : fallback;
const entries = (file) => {
  const value = read(file, []);
  if (!Array.isArray(value)) throw new Error(`${file} must contain a JSON array`);
  return value;
};
const requiredLocales = (entry, source) => {
  if (!entry.locales?.en || !entry.locales?.fa) throw new Error(`${source}:${entry.id || 'entry'} needs en and fa locale values`);
};
const projects = entries('projects/entries.json');
const journey = entries('journey/entries.json');
const ids = new Set();
for (const project of projects) {
  if (!/^[a-z0-9-]+$/.test(project.id || '')) throw new Error('Project IDs must use lowercase letters, numbers, and hyphens');
  if (ids.has(project.id)) throw new Error(`Duplicate project ID: ${project.id}`);
  ids.add(project.id); requiredLocales(project, 'projects');
}
for (const event of journey) {
  if (!/^[a-z0-9-]+$/.test(event.id || '')) throw new Error('Journey IDs must use lowercase letters, numbers, and hyphens');
  requiredLocales(event, 'journey');
  if (event.startDate && Number.isNaN(Date.parse(event.startDate))) throw new Error(`Journey ${event.id} needs a valid startDate`);
  for (const id of event.projectIds || []) if (!ids.has(id)) throw new Error(`Journey ${event.id} references missing project ${id}`);
}
for (const file of ['site.json', 'profile.json', 'contact.json', 'resume/config.json']) read(file, {});
console.log(`Content valid: ${projects.length} projects, ${journey.length} journey entries.`);
