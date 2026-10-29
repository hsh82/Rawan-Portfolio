import { readFileSync } from 'node:fs';
import { contentPath, readText, revisionOf, safeSlug, writeTransaction } from './security.mjs';

const json = file => JSON.parse(readFileSync(file, 'utf8'));
const serialize = value => `${JSON.stringify(value, null, 2)}\n`;

export const RESOURCE_CATALOG = [
  { id: 'site', label: 'Site settings', group: 'Site', file: ['site.json'], kind: 'singleton', preview: 'home' },
  { id: 'profile', label: 'Profile & portrait', group: 'Site', file: ['profile.json'], kind: 'singleton', preview: 'home' },
  { id: 'home', label: 'Homepage content', group: 'Site', file: ['home.json'], kind: 'singleton', preview: 'home', localized: true },
  { id: 'contact', label: 'Contact', group: 'Site', file: ['contact.json'], kind: 'singleton', preview: 'home', localized: true },
  { id: 'resume', label: 'Résumé settings', group: 'Site', file: ['resume', 'config.json'], kind: 'singleton', preview: 'home' },
  { id: 'experience', label: 'Experience', group: 'Career', file: ['experience', 'entries.json'], kind: 'collection', preview: 'home', localized: true },
  { id: 'education', label: 'Education', group: 'Career', file: ['education', 'entries.json'], kind: 'collection', preview: 'home', localized: true },
  { id: 'certifications', label: 'Certifications', group: 'Career', file: ['certifications', 'entries.json'], kind: 'collection', preview: 'home', localized: true },
  { id: 'skills', label: 'Skills', group: 'Career', file: ['skills', 'entries.json'], kind: 'collection', preview: 'home', localized: true },
  { id: 'journey', label: 'Journey', group: 'Career', file: ['journey', 'entries.json'], kind: 'collection', preview: 'home', localized: true },
];

function resourceDefinition(id) {
  const value = RESOURCE_CATALOG.find(resource => resource.id === id);
  if (!value) throw new Error('Unknown content resource');
  return value;
}

function fileFor(resource) { return contentPath(...resource.file); }

export function resourceCatalog() {
  return RESOURCE_CATALOG.map(resource => {
    const value = json(fileFor(resource));
    return { ...resource, count: resource.kind === 'collection' ? value.length : 1 };
  });
}

export function readResource({ resource, id }) {
  const descriptor = resourceDefinition(resource);
  const file = fileFor(descriptor);
  const root = json(file);
  const value = descriptor.kind === 'collection' && id ? root.find(item => item.id === id) : root;
  if (value === undefined) throw new Error('Content item does not exist');
  return { resource: descriptor.id, id: id || null, kind: descriptor.kind, value, revision: revisionOf(readText(file)), definition: descriptor };
}

function assertId(id) {
  if (!/^[a-z0-9-]+$/.test(String(id || ''))) throw new Error('Item ID must use lowercase letters, numbers, and hyphens');
}

export function saveResource({ resource, id, value, expectedRevision }) {
  const descriptor = resourceDefinition(resource);
  const file = fileFor(descriptor);
  if (revisionOf(readText(file)) !== expectedRevision) throw Object.assign(new Error('Content changed outside Easy Content Mode'), { code: 409 });
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Resource content must be a JSON object');
  if (descriptor.kind === 'singleton') {
    writeTransaction([{ file, source: serialize(value) }]);
  } else {
    assertId(id || value.id);
    if (value.id !== id) throw new Error('Stable item IDs cannot be changed here');
    const items = json(file);
    const index = items.findIndex(item => item.id === id);
    if (index < 0) throw new Error('Content item does not exist');
    const next = [...items];
    next[index] = value;
    writeTransaction([{ file, source: serialize(next) }]);
  }
  return readResource({ resource, id });
}

export function createResource({ resource, value = {} }) {
  const descriptor = resourceDefinition(resource);
  if (descriptor.kind !== 'collection') throw new Error('This resource is a required singleton');
  const file = fileFor(descriptor);
  const items = json(file);
  const id = safeSlug(value.id || value.locales?.en?.title || value.locales?.fa?.title);
  if (items.some(item => item.id === id)) throw new Error(`Item ID already exists: ${id}`);
  const item = { id, visible: false, priority: 0, locales: { en: {}, fa: {} }, ...value, id };
  writeTransaction([{ file, source: serialize([...items, item]) }]);
  return readResource({ resource, id });
}

export function resourcePreviewUrl(resource, locale = 'en') {
  const section = { skills: 'skills', experience: 'experience', journey: 'journey', contact: 'contact' }[resource];
  return `/${locale}/${section ? `#${section}` : ''}`;
}

export function resourceDependencies(_resource, id) {
  if (!id) return [];
  const references = [];
  for (const candidate of RESOURCE_CATALOG.filter(item => item.kind === 'collection')) {
    const contents = json(fileFor(candidate));
    for (const item of contents) {
      for (const [field, value] of Object.entries(item)) {
        if (Array.isArray(value) && value.includes(id)) references.push({ resource: candidate.id, id: item.id, field });
      }
    }
  }
  return references;
}

export function deleteResource({ resource, id, expectedRevision }) {
  const descriptor = resourceDefinition(resource);
  if (descriptor.kind !== 'collection') throw new Error('Required singleton resources cannot be deleted');
  const file = fileFor(descriptor);
  if (revisionOf(readText(file)) !== expectedRevision) throw Object.assign(new Error('Content changed outside Easy Content Mode'), { code: 409 });
  const dependencies = resourceDependencies(resource, id).filter(item => !(item.resource === resource && item.id === id));
  if (dependencies.length) throw new Error(`Cannot delete ${id}; it is referenced by ${dependencies.map(item => `${item.resource}/${item.id}`).join(', ')}`);
  const items = json(file);
  if (!items.some(item => item.id === id)) throw new Error('Content item does not exist');
  writeTransaction([{ file, source: serialize(items.filter(item => item.id !== id)) }]);
  return { deleted: true, resource, id };
}
