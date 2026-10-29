import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ICON_IDS } from '../src/utils/icon-registry.mjs';
import { parseBlogEntryPath } from '../src/utils/blog-layout.mjs';

const root = resolve(process.cwd(), 'content');
const read = (file, fallback) => existsSync(resolve(root, file)) ? JSON.parse(readFileSync(resolve(root, file), 'utf8')) : fallback;
const entries = (file) => {
  const value = read(file, []);
  if (!Array.isArray(value)) throw new Error(`${file} must contain a JSON array`);
  return value;
};
const walk = (dir) => existsSync(dir)
  ? readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(resolve(dir, item.name)) : [resolve(dir, item.name)])
  : [];
const blogFiles = () => walk(resolve(root, 'blog')).filter(file => /\.mdx?$/.test(file));
const frontmatter = (source) => {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---/);
  const fields = {};
  for (const line of match?.[1]?.split('\n') || []) {
    const value = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*?)\s*$/);
    if (value) {
      const raw = value[2].replace(/^['"]|['"]$/g, '');
      fields[value[1]] = raw === 'true' ? true : raw === 'false' ? false : raw;
    }
  }
  return fields;
};
const requiredLocales = (entry, source) => {
  if (!entry.locales?.en || !entry.locales?.fa) throw new Error(`${source}:${entry.id || 'entry'} needs en and fa locale values`);
};
const quoted = (source, field) => {
  const match = source.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, 'm'));
  if (!match) return '';
  try { return JSON.parse(match[1]); } catch { return match[1].replace(/^['"]|['"]$/g, ''); }
};
const projects = (() => {
  const directory = resolve(root, 'blog', 'projects');
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => {
    if (item.name === 'overview') throw new Error('Invalid project hub ID: overview is reserved for the overview URL');
    const projectRoot = resolve(directory, item.name);
    const entry = resolve(projectRoot, 'entry.json');
    if (!existsSync(entry)) throw new Error(`Project hub ${item.name} needs entry.json`);
    const shared = JSON.parse(readFileSync(entry, 'utf8'));
    const locales = Object.fromEntries(['en', 'fa'].map(locale => {
      const file = resolve(projectRoot, `${locale}.mdx`);
      if (!existsSync(file)) throw new Error(`Project hub ${item.name} needs ${locale}.mdx`);
      const source = readFileSync(file, 'utf8');
      return [locale, { title: quoted(source, 'title'), description: quoted(source, 'description') }];
    }));
    return { ...shared, visible: shared.status === 'published', category: shared.projectCategory || (shared.category === 'projects' ? 'devops-delivery' : shared.category), locales };
  });
})();
const journey = entries('journey/entries.json');
const skills = entries('skills/entries.json');
const ids = new Set();
const journeyIds = new Set(journey.map(event => event.id));
const skillIds = new Set(skills.map(skill => skill.id));
const categories = new Set(['devops-delivery', 'infrastructure-automation', 'networking-security', 'software-open-source', 'design-creative']);
const publicationStates = new Set(['public-ready', 'public-sanitized', 'requires-review', 'planned-or-experimental']);
const projectById = new Map(projects.map(project => [project.id, project]));
for (const project of projects) {
  if (!/^[a-z0-9-]+$/.test(project.id || '')) throw new Error('Project IDs must use lowercase letters, numbers, and hyphens');
  if (ids.has(project.id)) throw new Error(`Duplicate project ID: ${project.id}`);
  ids.add(project.id); requiredLocales(project, 'projects');
  if (!categories.has(project.category)) throw new Error(`Project ${project.id} has an invalid category`);
  if (!publicationStates.has(project.publication)) throw new Error(`Project ${project.id} has an invalid publication state`);
  if (!project.role?.en || !project.role?.fa) throw new Error(`Project ${project.id} needs localized role labels`);
  if (project.featured && !project.visible) throw new Error(`Featured project ${project.id} must be visible`);
  if (project.visible && ['requires-review', 'planned-or-experimental'].includes(project.publication)) throw new Error(`Private project ${project.id} cannot be visible`);
  if (project.caseStudy && (!project.caseStudy.en || !project.caseStudy.fa)) throw new Error(`Project ${project.id} needs a bilingual case study`);
  if (project.image && !project.image.startsWith('media/')) throw new Error(`Project ${project.id} image must reference content/media/`);
  if (project.image && (!project.imageAlt?.en || !project.imageAlt?.fa)) throw new Error(`Project ${project.id} image needs English and Persian alt text`);
  if (project.image && !existsSync(resolve(root, project.image))) throw new Error(`Missing project image: content/${project.image}`);
  if (project.icon && !ICON_IDS.includes(project.icon)) throw new Error(`Project ${project.id} has an unknown icon: ${project.icon}`);
  const favorite = project.favorite ?? project.featured ?? false;
  if (project.favoriteAt && !favorite) throw new Error(`Project ${project.id} has favoriteAt but is not favorite; set favorite: true or remove favoriteAt`);
  for (const field of ['publishedAt', 'updatedAt', 'favoriteAt']) if (project[field] && Number.isNaN(Date.parse(project[field]))) throw new Error(`Project ${project.id} has an invalid ${field}: ${project[field]}`);
  if (project.visible) {
    for (const locale of ['en', 'fa']) {
      const candidates = [
        resolve(root, 'blog', 'projects', project.id, `${locale}.mdx`),
        resolve(root, 'blog', 'projects', project.id, 'overview', `${locale}.mdx`),
        resolve(root, 'blog', locale, 'projects', project.id, 'overview.mdx'),
      ];
      const article = candidates.find(existsSync);
      if (!article) throw new Error(`Visible project ${project.id} needs a ${locale} overview article`);
      const source = readFileSync(article, 'utf8');
      if (/^draft:\s*true\s*$/m.test(source)) throw new Error(`Visible project ${project.id} overview is still a draft: ${locale}`);
      if (!source.includes(`subcategory: ${project.id}`)) throw new Error(`Project overview category mismatch: ${locale}/${project.id}`);
    }
  }
  for (const id of project.journeyIds || []) if (!journeyIds.has(id)) throw new Error(`Project ${project.id} references missing journey ${id}`);
  for (const id of project.relatedSkillIds || []) if (!skillIds.has(id)) throw new Error(`Project ${project.id} references missing skill ${id}`);
}
for (const project of projects) for (const id of project.relatedProjectIds || []) if (!ids.has(id)) throw new Error(`Project ${project.id} references missing related project ${id}`);
for (const event of journey) {
  if (!/^[a-z0-9-]+$/.test(event.id || '')) throw new Error('Journey IDs must use lowercase letters, numbers, and hyphens');
  requiredLocales(event, 'journey');
  if (event.startDate && Number.isNaN(Date.parse(event.startDate))) throw new Error(`Journey ${event.id} needs a valid startDate`);
  for (const id of event.projectIds || []) if (!ids.has(id)) throw new Error(`Journey ${event.id} references missing project ${id}`);
}
const articleTranslationIds = new Set();
const unifiedEntities = new Map();
for (const file of blogFiles()) {
  const relativePath = file.slice(resolve(root, 'blog').length + 1).replaceAll('\\', '/');
  const pathInfo = parseBlogEntryPath(relativePath);
  const parts = relativePath.replace(/\.mdx?$/, '').split('/');
  const fields = frontmatter(readFileSync(file, 'utf8'));
  const locale = pathInfo.locale;
  if (!['en', 'fa'].includes(locale) || fields.locale !== locale) throw new Error(`Blog file ${relativePath} must use a matching en/fa locale`);
  if (fields.kind === 'overview') throw new Error(`Blog MDX ${relativePath} must use kind: article; overview is reserved for the public route role`);
  if (!fields.title || !fields.description || !fields.translationId || !fields.pubDate) throw new Error(`Blog file ${relativePath} needs title, description, translationId, and pubDate frontmatter`);
  if (Number.isNaN(Date.parse(fields.pubDate)) || (fields.updatedDate && Number.isNaN(Date.parse(fields.updatedDate)))) throw new Error(`Blog file ${relativePath} has an invalid publication date`);
  const key = `${locale}:${fields.translationId}`;
  if (articleTranslationIds.has(key)) throw new Error(`Duplicate blog translation identifier ${key} in ${relativePath}`);
  articleTranslationIds.add(key);
  const kind = fields.kind || 'article';
  if (pathInfo.layout === 'unified') {
    const entity = unifiedEntities.get(pathInfo.entityPath) || { locales: new Set(), files: [] };
    entity.locales.add(locale); entity.files.push({ locale, file, fields }); unifiedEntities.set(pathInfo.entityPath, entity);
    const entryFile = resolve(root, 'blog', pathInfo.entityPath, 'entry.json');
    if (!existsSync(entryFile)) throw new Error(`Unified blog entity ${pathInfo.entityPath} needs entry.json`);
    const shared = JSON.parse(readFileSync(entryFile, 'utf8'));
    if (!shared.translationId || !shared.slug || !shared.status) throw new Error(`Unified blog entity ${pathInfo.entityPath} needs shared id, slug, and status`);
    if (fields.translationId !== shared.translationId || fields.slug !== shared.slug || fields.category !== shared.category) throw new Error(`Generated frontmatter does not match shared metadata: ${relativePath}`);
    if ((shared.status === 'published') !== (fields.draft !== true)) throw new Error(`Shared status and locale draft flag disagree: ${pathInfo.entityPath}/${locale}`);
    if (shared.status === 'published' && ['requires-review', 'planned-or-experimental'].includes(shared.publication)) throw new Error(`Non-public unified blog entity is published: ${pathInfo.entityPath}`);
    if (pathInfo.entityPath === 'landing') continue;
    const unifiedParts = pathInfo.entityPath.split('/');
    if (fields.category === 'projects') {
      const projectId = unifiedParts[1];
      const project = projectById.get(projectId);
      if (!project) throw new Error(`Blog file ${relativePath} references missing parent project ${projectId}`);
      if (!fields.subcategory || fields.subcategory !== projectId) throw new Error(`Blog file ${relativePath} needs subcategory: ${projectId}`);
      if (!fields.draft && (!project.visible || ['requires-review', 'planned-or-experimental'].includes(project.publication))) throw new Error(`Published blog file ${relativePath} belongs to a non-public project`);
    }
    continue;
  }
  if (kind === 'landing') {
    if (parts.at(-1) !== '_index') throw new Error(`Blog landing file ${relativePath} must be named _index.mdx`);
    continue;
  }
  if (parts.length < 3 || parts.at(-1) !== fields.slug || parts.at(-1) === '_index') throw new Error(`Blog file ${relativePath} must match its slug and locale/category folders`);
  if (fields.category === 'projects') {
    const projectId = parts[2];
    const project = projectById.get(projectId);
    if (!project) throw new Error(`Blog file ${relativePath} references missing parent project ${projectId}`);
    if (!fields.subcategory || fields.subcategory !== projectId || parts.length < 4) throw new Error(`Blog file ${relativePath} needs subcategory: ${projectId}`);
    if (!fields.draft && (!project.visible || ['requires-review', 'planned-or-experimental'].includes(project.publication))) throw new Error(`Published blog file ${relativePath} belongs to a non-public project`);
  } else if (fields.subcategory && parts[2] !== fields.subcategory) {
    throw new Error(`Blog file ${relativePath} has a subcategory/folder mismatch`);
  }
}
for (const [entityPath, entity] of unifiedEntities) {
  for (const locale of ['en', 'fa']) if (!entity.locales.has(locale)) throw new Error(`Unified blog entity ${entityPath} needs both ${locale} and its other translation`);
}
const profile = read('profile.json', {});
const resume = read('resume/config.json', {});
if (profile.image) {
  if (profile.visible && !profile.image.startsWith('media/')) throw new Error('Visible profile.image must reference the canonical content/media/ tree');
  const imageFile = profile.image.startsWith('media/')
    ? resolve(root, profile.image)
    : resolve(process.cwd(), 'public', profile.image.replace(/^\//, ''));
  if (!existsSync(imageFile)) throw new Error(`Missing profile image: ${profile.image}`);
  if (profile.visible && (!profile.imageAlt?.en || !profile.imageAlt?.fa)) throw new Error('Visible profile image needs English and Persian alt text');
}
if (profile.resumeImage) {
  if (!profile.resumeImage.startsWith('media/')) throw new Error('profile.resumeImage must reference the canonical content/media/ tree');
  if (!existsSync(resolve(root, profile.resumeImage))) throw new Error(`Missing résumé profile image: ${profile.resumeImage}`);
}
if (resume.portrait !== false && !(profile.resumeImage || profile.image)) throw new Error('Résumé portrait is enabled but no profile image is configured');
for (const file of ['site.json', 'contact.json']) read(file, {});
console.log(`Content valid: ${projects.length} projects, ${journey.length} journey entries.`);
