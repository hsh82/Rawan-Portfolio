import { defaultFocusHeading } from '../../../utils/portfolio-schemas.mjs';
import { readPortfolioSource } from '../../../utils/portfolio-source.mjs';
import { resourceTemplate, validateResourceValue, contentError } from './resource-validation.mjs';
import { readFileSync } from 'node:fs';
import { contentPath, readText, revisionOf, safeSlug, writeTransaction } from './security.mjs';

const json = file => JSON.parse(readFileSync(file, 'utf8'));
const serialize = value => `${JSON.stringify(value, null, 2)}\n`;

export const RESOURCE_CATALOG = [
  { id: 'site', label: 'Site settings', group: 'Site', file: ['site.json'], kind: 'singleton', preview: 'home' },
  { id: 'profile', label: 'Profile & portrait', group: 'Site', file: ['profile.json'], kind: 'singleton', preview: 'home' },
  { id: 'home', label: 'Homepage content', group: 'Site', file: ['home.json'], kind: 'singleton', preview: 'home', localized: true },
  { id: 'focus', label: 'Focus areas', group: 'Site', file: ['home.json'], field: 'focus', kind: 'singleton', preview: 'home', localized: true },
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

function focusValue(root) {
  return { en: [], fa: [], ...root.focus, heading: root.focus?.heading ?? structuredClone(defaultFocusHeading) };
}

export function resourceCatalog() {
  return RESOURCE_CATALOG.map(resource => {
    const root = json(fileFor(resource));
    const value = resource.field ? focusValue(root) : root;
    return { ...resource, template: resource.kind === 'collection' ? resourceTemplate(resource.id) : value, count: resource.kind === 'collection' ? value.length : 1 };
  });
}

export function readResource({ resource, id }) {
  const descriptor = resourceDefinition(resource);
  const file = fileFor(descriptor);
  const root = json(file);
  const value = descriptor.field ? focusValue(root) : descriptor.kind === 'collection' && id ? root.find(item => item.id === id) : root;
  if (value === undefined) throw new Error('Content item does not exist');
  return { resource: descriptor.id, id: id || null, kind: descriptor.kind, value, revision: revisionOf(readText(file)), definition: descriptor };
}

function assertRevision(file, revision) {
  if (revisionOf(readText(file)) !== revision) throw Object.assign(new Error('Content changed outside Easy Content Mode. Reload before saving.'), { code: 409 });
}

export function candidateSource({ resource, id, value, mode }) {
  const descriptor = resourceDefinition(resource);
  const data = readPortfolioSource();
  if (descriptor.kind === 'singleton') {
    validateResourceValue(resource, value);
    if (descriptor.field) data.home = { ...data.home, [descriptor.field]: value };
    else data[resource] = value;
  } else {
    const items = data[resource];
    if (!id) {
      validateResourceValue(resource, value, { collection: true });
      data[resource] = mode ? importCandidate(items, value, mode, resource) : value;
    } else {
      validateResourceValue(resource, value, { id });
      if (value.id !== id) throw contentError(resource + '[' + id + '].id', 'stable IDs cannot be changed. Restore the selected record ID or create a separate record.');
      const index = items.findIndex(item => item.id === id);
      if (index < 0) throw contentError(resource, 'selected record does not exist');
      data[resource] = items.map((item, at) => at === index ? value : item);
    }
    const ids = new Set();
    for (const [index, item] of data[resource].entries()) {
      if (ids.has(item.id)) throw contentError(resource + '[' + index + '].id', 'duplicate ID: ' + item.id);
      ids.add(item.id);
    }
  }
  const projects = new Set(data.projects.map(item => item.id));
  const journeys = new Set(data.journey.map(item => item.id));
  const skills = new Set(data.skills.map(item => item.id));
  const references = (values, ids, path) => { for (const id of values || []) if (!ids.has(id)) throw contentError(path, 'references missing record ' + id + '. Restore the record or correct the reference explicitly.'); };
  for (const project of data.projects) {
    references(project.journeyIds, journeys, 'projects[' + project.id + '].journeyIds');
    references(project.relatedSkillIds, skills, 'projects[' + project.id + '].relatedSkillIds');
  }
  for (const item of data.journey) references(item.projectIds, projects, 'journey[' + item.id + '].projectIds');
  references(data.resume.projectIds, projects, 'resume.projectIds');
  references(data.resume.journeyIds, journeys, 'resume.journeyIds');
  return data;
}

export function saveResource({ resource, id, value, expectedRevision }) {
  const descriptor = resourceDefinition(resource);
  const file = fileFor(descriptor);
  assertRevision(file, expectedRevision);
  const data = candidateSource({ resource, id, value });
  writeTransaction([{ file, source: serialize(data[descriptor.field ? 'home' : resource]) }]);
  return readResource({ resource, id });
}

export function createResource({ resource, value = {}, expectedRevision }) {
  const descriptor = resourceDefinition(resource);
  if (descriptor.kind !== 'collection') throw new Error('This resource is a required singleton');
  const file = fileFor(descriptor);
  assertRevision(file, expectedRevision);
  const items = json(file);
  const proposed = safeSlug(value.id);
  if (proposed !== value.id) throw contentError(resource + '.id', 'confirm the normalized ID before creating: ' + proposed, { suggestion: proposed });
  if (items.some(item => item.id === proposed)) {
    let n = 2; while (items.some(item => item.id === proposed + '-' + n)) n++;
    throw contentError(resource + '.id', 'ID already exists. Choose a unique ID such as ' + proposed + '-' + n);
  }
  const next = [...items, value];
  candidateSource({ resource, value: next });
  writeTransaction([{ file, source: serialize(next) }]);
  return readResource({ resource, id: proposed });
}

function importCandidate(items, value, mode, resource) {
  if (!['append', 'update'].includes(mode)) throw contentError(resource, 'choose Append (new IDs) or Update (existing IDs). Replacement is not supported.');
  const incomingIds = new Set(value.map(item => item.id));
  if (incomingIds.size !== value.length) throw contentError(resource, 'import contains duplicate IDs');
  for (const item of value) {
    const exists = items.some(current => current.id === item.id);
    if ((mode === 'append' && exists) || (mode === 'update' && !exists)) throw contentError(resource + '[' + item.id + '].id', mode === 'append' ? 'already exists; choose Update to edit this record' : 'does not exist; choose Append to create it');
  }
  return mode === 'append' ? [...items, ...value] : items.map(item => value.find(candidate => candidate.id === item.id) || item);
}

export function importResources({ resource, value, mode, expectedRevision }) {
  const descriptor = resourceDefinition(resource);
  if (descriptor.kind !== 'collection') throw contentError(resource, 'only collections support import');
  const file = fileFor(descriptor);
  assertRevision(file, expectedRevision);
  validateResourceValue(resource, value, { collection: true });
  const items = json(file);
  const next = importCandidate(items, value, mode, resource);
  candidateSource({ resource, value: next });
  writeTransaction([{ file, source: serialize(next) }]);
  return readResource({ resource });
}

export function resourcePreviewUrl(resource, locale = 'en') {
  const section = { focus: 'focus', skills: 'skills', experience: 'experience', journey: 'journey', contact: 'contact' }[resource];
  return `/${locale}/${section ? `#${section}` : ''}`;
}

export function resourceDependencies(resource, id) {
  if (!id) return [];
  resourceDefinition(resource);
  const data = readPortfolioSource();
  const references = [];
  const projectField = resource === 'journey' ? 'journeyIds' : resource === 'skills' ? 'relatedSkillIds' : null;
  if (projectField) for (const project of data.projects) if (project[projectField]?.includes(id)) references.push({ resource: 'projects', id: project.id, field: projectField });
  if (resource === 'journey' && data.resume.journeyIds?.includes(id)) references.push({ resource: 'resume', id: 'config', field: 'journeyIds' });
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
