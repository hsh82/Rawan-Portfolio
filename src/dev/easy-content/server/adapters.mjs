import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { contentPath, readText, revisionOf, safeSlug, writeTransaction } from './security.mjs';
import { parseDocument, serializeDocument, updateFrontmatter } from './frontmatter.mjs';
import { ICON_IDS } from '../../../utils/icon-registry.mjs';

const jsonPath = (name) => contentPath(name, 'entries.json');
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = value => JSON.stringify(value, null, 2) + '\n';
const localized = (value, locale) => value?.[locale] || value?.en || {};

function projectRecord(id) {
  const projects = readJson(jsonPath('projects'));
  return projects.find(project => project.id === id);
}

function projectOverviewFile(locale, id) {
  return contentPath('blog', locale, 'projects', id, 'overview.mdx');
}

function articleFile(locale, project, slug) {
  return contentPath('blog', locale, 'projects', project, `${slug}.mdx`);
}

function articleEntity(locale, project, slug) {
  const file = articleFile(locale, project, slug);
  if (!existsSync(file)) throw new Error('Article does not exist');
  const source = readText(file);
  const parsed = parseDocument(source);
  return { type: slug === 'overview' ? 'project' : 'article', id: `${project}/${slug}`, locale, project, slug, source, document: parsed, revision: revisionOf(source) };
}

function projectChildren(locale, project) {
  const directory = contentPath('blog', locale, 'projects', project);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.mdx?$/.test(entry.name) && entry.name !== 'overview.mdx')
    .map(entry => {
      const slug = entry.name.replace(/\.mdx?$/, '');
      const source = readText(articleFile(locale, project, slug));
      const document = parseDocument(source);
      return { slug, title: document.frontmatter.title || slug, draft: document.frontmatter.draft === true };
    });
}

function readProject(locale, id) {
  const record = projectRecord(id);
  if (!record) throw new Error('Project does not exist');
  const overview = articleEntity(locale, id, 'overview');
  return { type: 'project', id, locale, project: id, record, source: overview.source, metadata: record, document: overview.document, revision: revisionOf(`${writeJson(readJson(jsonPath('projects')))}\n${overview.source}`), articles: projectChildren(locale, id) };
}

function readLanding(locale) {
  const file = contentPath('blog', locale, '_index.mdx');
  if (!existsSync(file)) throw new Error('Blog landing content does not exist');
  const source = readText(file);
  const document = parseDocument(source);
  return { type: 'blog', id: 'landing', locale, source, document, revision: revisionOf(source) };
}

function readJourney(locale, id) {
  const file = jsonPath('journey');
  const entries = readJson(file);
  const entry = entries.find(item => item.id === id);
  if (!entry) throw new Error('Journey entry does not exist');
  return { type: 'journey', id, locale, metadata: entry, source: '', revision: revisionOf(readText(file)) };
}

export function contextForPath(pathname) {
  const match = pathname.match(/^\/(en|fa)(?:\/|$)/);
  const locale = match?.[1] || 'en';
  const rest = pathname.replace(/^\/(en|fa)\/?/, '').replace(/\/$/, '');
  // Home is intentionally outside the Easy Content capability model. It has
  // no editor context and no write endpoint in this phase.
  if (!rest) return { type: 'unsupported', id: 'home', locale, reason: 'unsupported content type' };
  if (rest === 'blog') return { type: 'blog', id: 'landing', locale };
  const article = rest.match(/^blog\/projects\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
  if (article) return { type: article[2] === 'overview' ? 'project' : 'article', id: `${article[1]}/${article[2]}`, locale, project: article[1], slug: article[2] };
  const project = rest.match(/^projects\/([a-z0-9-]+)$/);
  if (project) return { type: 'project', id: project[1], locale, project: project[1] };
  const journey = rest.match(/^journey\/([a-z0-9-]+)$/);
  if (journey) return { type: 'journey', id: journey[1], locale };
  return { type: 'unsupported', id: rest, locale };
}

function localeFromSearch(search) {
  const locale = new URLSearchParams(search || '').get('locale');
  return locale === 'fa' ? 'fa' : 'en';
}

export function editorContextForPath(pathname, search = '') {
  const locale = localeFromSearch(search);
  const blog = pathname.match(/^\/dev\/content\/(edit|new)\/blog\/?$/);
  if (blog) return blog[1] === 'edit'
    ? { type: 'blog', id: 'landing', locale, mode: 'edit', returnPath: `/${locale}/blog/` }
    : { type: 'unsupported', id: 'blog', locale, reason: 'Blog creation is not supported' };

  const project = pathname.match(/^\/dev\/content\/(edit|new)\/project(?:\/([a-z0-9-]+))?\/?$/);
  if (project) {
    const id = project[2];
    if (project[1] === 'new') return { type: 'project', id: 'new', locale, mode: 'new', returnPath: `/${locale}/blog/` };
    if (!id) return { type: 'unsupported', id: 'project', locale, reason: 'Project ID is required' };
    return { type: 'project', id, project: id, locale, mode: 'edit', returnPath: `/${locale}/blog/projects/${id}/overview/` };
  }

  const article = pathname.match(/^\/dev\/content\/(edit|new)\/article\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?\/?$/);
  if (article) {
    const projectId = article[2];
    const slug = article[3];
    if (article[1] === 'new') return { type: 'article', id: `${projectId}/new`, project: projectId, slug: 'new', locale, mode: 'new', returnPath: `/${locale}/blog/projects/${projectId}/overview/` };
    if (!slug) return { type: 'unsupported', id: projectId, locale, reason: 'Article slug is required' };
    return { type: 'article', id: `${projectId}/${slug}`, project: projectId, slug, locale, mode: 'edit', returnPath: `/${locale}/blog/projects/${projectId}/${slug}/` };
  }

  return { type: 'unsupported', id: pathname, locale, reason: 'unsupported content type' };
}

export function contentTree(locale = 'en') {
  return readJson(jsonPath('projects')).map(project => ({
    type: 'project',
    id: project.id,
    title: localized(project.locales, locale).title || project.id,
    draft: project.visible === false,
    children: projectChildren(locale, project.id).map(article => ({
      type: 'article',
      id: `${project.id}/${article.slug}`,
      slug: article.slug,
      title: article.title,
      draft: article.draft,
    })),
  }));
}

export function readEntity(context) {
  if (context.type === 'home') throw new Error('unsupported content type');
  if (context.type === 'blog') return readLanding(context.locale);
  if (context.type === 'project') return readProject(context.locale, context.project || context.id);
  if (context.type === 'article') return articleEntity(context.locale, context.project, context.slug);
  if (context.type === 'journey') return readJourney(context.locale, context.id);
  throw new Error('This page has no Easy Content adapter');
}

function validateSource(source, type) {
  const parsed = parseDocument(source);
  if (!parsed.hasFrontmatter) throw new Error(`${type} needs frontmatter`);
  if (!parsed.frontmatter.title || !parsed.frontmatter.description) throw new Error('Title and description are required');
  if (!parsed.frontmatter.slug || !/^[a-z0-9-]+$/.test(String(parsed.frontmatter.slug))) throw new Error('Slug must use lowercase letters, numbers, and hyphens');
  if (parsed.frontmatter.pubDate && Number.isNaN(Date.parse(String(parsed.frontmatter.pubDate)))) throw new Error('Publication date is invalid');
  return parsed;
}

function sourceMetadata(input, publish) {
  const metadata = input.frontmatter || {};
  return { title: String(metadata.title || ''), description: String(metadata.description || ''), tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : [], draft: !publish };
}

function updateProjectRecord(existing, metadata) {
  const allowed = ['visible', 'favorite', 'favoriteAt', 'featured', 'publication', 'maturity', 'category', 'secondaryCategories', 'role', 'locales', 'technologies', 'icon', 'image', 'imageAlt', 'publishedAt', 'updatedAt', 'repository', 'externalUrl', 'priority'];
  const next = { ...existing };
  for (const key of allowed) if (metadata && Object.prototype.hasOwnProperty.call(metadata, key)) next[key] = metadata[key];
  if (next.favoriteAt == null) delete next.favoriteAt;
  return next;
}

function assertProjectPublication(record, locale, publish) {
  if (!publish) return;
  if (!['public-ready', 'public-sanitized'].includes(record.publication)) throw new Error('Review the project publication status before publishing');
  for (const otherLocale of ['en', 'fa']) {
    const file = projectOverviewFile(otherLocale, record.id);
    if (!existsSync(file)) throw new Error(`Both locale overview files are required before publishing (${otherLocale})`);
    const parsed = parseDocument(readText(file));
    if (otherLocale !== locale && parsed.frontmatter.draft === true) throw new Error(`The ${otherLocale} overview is still a draft`);
  }
}

export function saveEntity(input) {
  const context = input.context;
  const source = String(input.source ?? '');
  if (context.type === 'home') throw new Error('unsupported content type');
  if (context.type === 'blog') {
    const file = contentPath('blog', context.locale, '_index.mdx');
    if (revisionOf(readText(file)) !== input.expectedRevision) throw Object.assign(new Error('File changed outside Easy Content Mode'), { code: 409 });
    const nextSource = updateFrontmatter(source, sourceMetadata(input, input.publish));
    validateSource(nextSource, 'Blog landing');
    writeTransaction([{ file, source: nextSource }]);
    return { ...readLanding(context.locale), saved: true };
  }
  if (context.type === 'article') {
    const file = articleFile(context.locale, context.project, context.slug);
    if (revisionOf(readText(file)) !== input.expectedRevision) throw Object.assign(new Error('File changed outside Easy Content Mode'), { code: 409 });
    const nextSource = updateFrontmatter(source, sourceMetadata(input, input.publish));
    const parsed = validateSource(nextSource, 'Article');
    if (parsed.frontmatter.slug !== context.slug) throw new Error('Changing an article slug requires the explicit rename workflow');
    writeTransaction([{ file, source: nextSource }]);
    return { ...articleEntity(context.locale, context.project, context.slug), saved: true };
  }
  if (context.type === 'project') {
    const projectsFile = jsonPath('projects');
    const overviewFile = projectOverviewFile(context.locale, context.project || context.id);
    const currentRegistry = readJson(projectsFile);
    const index = currentRegistry.findIndex(item => item.id === (context.project || context.id));
    if (index < 0) throw new Error('Project does not exist');
    const expected = input.expectedRevision;
    const currentCombined = revisionOf(`${writeJson(currentRegistry)}\n${readText(overviewFile)}`);
    if (currentCombined !== expected) throw Object.assign(new Error('Project changed outside Easy Content Mode'), { code: 409 });
    validateSource(source, 'Project');
    const nextRegistry = [...currentRegistry];
    nextRegistry[index] = updateProjectRecord(nextRegistry[index], input.metadata);
    if (nextRegistry[index].icon && !ICON_IDS.includes(nextRegistry[index].icon)) throw new Error(`Unknown icon: ${nextRegistry[index].icon}`);
    const projectLocale = nextRegistry[index].locales?.[context.locale] || {};
    assertProjectPublication(nextRegistry[index], context.locale, input.publish);
    const synchronizedSource = updateFrontmatter(source, { title: projectLocale.title, description: projectLocale.description, draft: input.publish ? false : true });
    nextRegistry[index].visible = Boolean(input.publish);
    if (input.publish && !nextRegistry[index].publishedAt) nextRegistry[index].publishedAt = new Date().toISOString().slice(0, 10);
    nextRegistry[index].updatedAt = new Date().toISOString().slice(0, 10);
    if (nextRegistry[index].favorite && !nextRegistry[index].favoriteAt) nextRegistry[index].favoriteAt = new Date().toISOString().slice(0, 10);
    writeTransaction([{ file: projectsFile, source: writeJson(nextRegistry) }, { file: overviewFile, source: synchronizedSource }]);
    return { ...readProject(context.locale, context.project || context.id), saved: true };
  }
  if (context.type === 'journey') {
    const file = jsonPath('journey');
    if (revisionOf(readText(file)) !== input.expectedRevision) throw Object.assign(new Error('Journey changed outside Easy Content Mode'), { code: 409 });
    const entries = readJson(file);
    const index = entries.findIndex(entry => entry.id === context.id);
    if (index < 0) throw new Error('Journey entry does not exist');
    const next = [...entries];
    const metadata = input.metadata || {};
    next[index] = { ...next[index], ...metadata, locales: { ...next[index].locales, [context.locale]: { ...next[index].locales?.[context.locale], title: metadata.locales?.[context.locale]?.title, description: metadata.locales?.[context.locale]?.description } } };
    writeTransaction([{ file, source: writeJson(next) }]);
    return { ...readJourney(context.locale, context.id), saved: true };
  }
  throw new Error('Unsupported Easy Content entity');
}

export function createProject(input) {
  const id = safeSlug(input.id || input.title?.en || input.title?.fa);
  const projectsFile = jsonPath('projects');
  const registry = readJson(projectsFile);
  if (registry.some(project => project.id === id)) throw new Error(`Project slug already exists: ${id}`);
  const record = {
    id, visible: false, favorite: Boolean(input.favorite), favoriteAt: input.favorite ? (input.favoriteAt || new Date().toISOString().slice(0, 10)) : undefined,
    featured: false, translationId: id, publication: 'requires-review', maturity: 'under-development', category: input.category || 'devops-delivery', secondaryCategories: [], icon: input.icon && ICON_IDS.includes(input.icon) ? input.icon : undefined,
    role: { en: input.role?.en || 'Project', fa: input.role?.fa || 'پروژه' }, locales: { en: { title: input.title?.en || id, description: input.description?.en || 'Draft project.' }, fa: { title: input.title?.fa || id, description: input.description?.fa || 'پروژهٔ پیش‌نویس.' } },
    technologies: input.technologies || [], journeyIds: [], relatedSkillIds: [], relatedProjectIds: [], articleIds: [], priority: 0,
  };
  const files = [{ file: projectsFile, source: writeJson([...registry, record]) }];
  for (const locale of input.locales || ['en', 'fa']) {
    const file = projectOverviewFile(locale, id);
    if (existsSync(file)) throw new Error(`Project overview already exists: ${locale}/${id}`);
    const title = record.locales[locale].title;
    const description = record.locales[locale].description;
    const body = locale === input.locale && input.body ? String(input.body) : `\n## ${title}\n\n${description}\n`;
    files.push({ file, source: serializeDocument({ title, description, slug: 'overview', locale, category: 'projects', subcategory: id, tags: input.tags || [], pubDate: new Date().toISOString().slice(0, 10), draft: true, featured: false, translationId: `${id}-overview`, toc: true }, body) });
  }
  writeTransaction(files);
  const locale = input.locale === 'fa' ? 'fa' : 'en';
  return { id, route: `/${locale}/blog/projects/${id}/overview/`, editorRoute: `/dev/content/edit/project/${id}/?locale=${locale}` };
}

export function createArticle(input) {
  const project = safeSlug(input.project);
  if (!projectRecord(project)) throw new Error(`Parent project does not exist: ${project}`);
  const slug = safeSlug(input.slug || input.title?.en || input.title?.fa);
  if (slug === 'overview') throw new Error('The overview slug is reserved for the project mother document');
  const files = [];
  for (const locale of input.locales || ['en', 'fa']) {
    const file = articleFile(locale, project, slug);
    if (existsSync(file)) throw new Error(`Article slug already exists: ${locale}/${project}/${slug}`);
    const title = input.title?.[locale] || slug;
    const description = input.description?.[locale] || 'Draft article.';
    const body = locale === input.locale && input.body ? String(input.body) : `\n## ${title}\n\n`;
    files.push({ file, source: serializeDocument({ title, description, slug, locale, category: 'projects', subcategory: project, tags: input.tags || [], pubDate: new Date().toISOString().slice(0, 10), draft: true, featured: false, translationId: input.translationId || `${project}-${slug}`, toc: true }, body) });
  }
  writeTransaction(files);
  const locale = input.locale === 'fa' ? 'fa' : 'en';
  return { project, slug, route: `/${locale}/blog/projects/${project}/${slug}/`, editorRoute: `/dev/content/edit/article/${project}/${slug}/?locale=${locale}` };
}

export function createJourney(input) {
  const id = safeSlug(input.id || input.title?.en || input.title?.fa);
  const file = jsonPath('journey');
  const entries = readJson(file);
  if (entries.some(entry => entry.id === id)) throw new Error(`Journey ID already exists: ${id}`);
  const entry = { id, visible: false, type: input.type || 'milestone', current: false, locales: { en: { title: input.title?.en || id, description: input.description?.en || 'Draft story.' }, fa: { title: input.title?.fa || id, description: input.description?.fa || 'روایت پیش‌نویس.' } }, organization: '', location: '', technologies: [], projectIds: [], articleIds: [], links: [], documents: [], priority: 0 };
  writeTransaction([{ file, source: writeJson([...entries, entry]) }]);
  return { id, route: `/${input.locale || 'en'}/journey/${id}/` };
}
