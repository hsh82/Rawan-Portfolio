import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { contentPath, readText, revisionOf, safeSlug, writeTransaction } from './security.mjs';
import { parseDocument, serializeDocument, updateFrontmatter } from './frontmatter.mjs';
import { ICON_IDS } from '../../../utils/icon-registry.mjs';
import { BLOG_LOCALES } from '../../../utils/blog-layout.mjs';

const jsonPath = name => contentPath(name, 'entries.json');
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = value => JSON.stringify(value, null, 2) + '\n';
const localized = (value, locale) => value?.[locale] || value?.en || {};
const today = () => new Date().toISOString().slice(0, 10);

function projectRecord(id) {
  return readJson(jsonPath('projects')).find(project => project.id === id);
}

function projectIdFor(context) {
  return context.project || context.projectId || context.id;
}

function entityPathFor(context) {
  if (context.type === 'blog') return 'landing';
  if (context.type === 'project') return `projects/${safeSlug(projectIdFor(context))}/overview`;
  if (context.type === 'article') return `projects/${safeSlug(context.project || context.projectId)}/articles/${safeSlug(context.slug || context.articleId)}`;
  throw new Error('Unsupported Easy Content entity');
}

function pathForEntity(entityPath, locale, extension = 'mdx') {
  return contentPath('blog', ...entityPath.split('/'), `${locale}.${extension}`);
}

function entryFile(entityPath) {
  return contentPath('blog', ...entityPath.split('/'), 'entry.json');
}

function legacyFile(context, locale) {
  if (context.type === 'blog') return contentPath('blog', locale, '_index.mdx');
  if (context.type === 'project') return contentPath('blog', locale, 'projects', projectIdFor(context), 'overview.mdx');
  return contentPath('blog', locale, 'projects', context.project || context.projectId, `${context.slug || context.articleId}.mdx`);
}

function entityFiles(context) {
  const entityPath = entityPathFor(context);
  const unified = BLOG_LOCALES.map(locale => pathForEntity(entityPath, locale));
  const useUnified = existsSync(entryFile(entityPath)) || unified.some(existsSync);
  return {
    entityPath,
    entry: entryFile(entityPath),
    files: Object.fromEntries(BLOG_LOCALES.map(locale => [locale, useUnified ? pathForEntity(entityPath, locale) : legacyFile(context, locale)])),
    unified: useUnified,
  };
}

function readDocument(file) {
  const source = readText(file);
  return { source, document: parseDocument(source), revision: revisionOf(source) };
}

function defaultShared(context, documents, record) {
  const en = documents.en.document.frontmatter;
  const fa = documents.fa.document.frontmatter;
  const source = en.title ? en : fa;
  return {
    id: context.id,
    kind: context.type === 'blog' ? 'landing' : context.type === 'project' ? 'overview' : 'article',
    translationId: source.translationId || `${context.id}`,
    slug: source.slug || (context.type === 'blog' ? 'blog' : context.type === 'project' ? 'overview' : context.slug),
    category: source.category || (context.type === 'blog' ? 'blog' : 'projects'),
    subcategory: source.subcategory || (context.type === 'project' || context.type === 'article' ? projectIdFor(context) : undefined),
    status: record?.visible || (en.title && !en.draft && fa.title && !fa.draft) ? 'published' : 'draft',
    pubDate: source.pubDate || today(),
    updatedDate: source.updatedDate,
    tags: Array.isArray(source.tags) ? source.tags : [],
    author: source.author,
    cover: source.cover,
    featured: Boolean(source.featured),
    toc: source.toc !== false,
  };
}

function readShared(context, documents, record, files) {
  if (files.unified && existsSync(files.entry)) {
    try {
      return { ...defaultShared(context, documents, record), ...readJson(files.entry) };
    } catch {
      throw new Error(`Invalid shared metadata: content/blog/${files.entityPath}/entry.json`);
    }
  }
  return defaultShared(context, documents, record);
}

export function readEntity(context) {
  if (context.type === 'home' || context.type === 'unsupported') throw new Error('unsupported content type');
  if (context.type === 'journey') return readJourney(context.locale || 'en', context.id);
  const files = entityFiles(context);
  const documents = Object.fromEntries(BLOG_LOCALES.map(locale => [locale, readDocument(files.files[locale])]));
  const record = context.type === 'project' ? projectRecord(projectIdFor(context)) : undefined;
  const shared = readShared(context, documents, record, files);
  return {
    type: context.type,
    id: context.id,
    project: context.type === 'project' || context.type === 'article' ? projectIdFor(context) : undefined,
    slug: context.type === 'article' ? context.slug || context.articleId : shared.slug,
    shared,
    metadata: record,
    locales: Object.fromEntries(BLOG_LOCALES.map(locale => [locale, { source: documents[locale].source, document: documents[locale].document, revision: documents[locale].revision }])),
    revision: revisionOf(JSON.stringify({ shared, metadata: record, en: documents.en.source, fa: documents.fa.source })),
    articles: context.type === 'project' ? projectChildren(projectIdFor(context)) : undefined,
  };
}

function readJourney(locale, id) {
  const file = jsonPath('journey');
  const entry = readJson(file).find(item => item.id === id);
  if (!entry) throw new Error('Journey entry does not exist');
  return { type: 'journey', id, locale, metadata: entry, source: '', revision: revisionOf(readText(file)) };
}

function projectChildren(project) {
  const children = new Map();
  const unified = contentPath('blog', 'projects', project, 'articles');
  if (existsSync(unified)) {
    for (const item of readdirSync(unified, { withFileTypes: true })) {
      if (!item.isDirectory()) continue;
      const entry = contentPath('blog', 'projects', project, 'articles', item.name, 'entry.json');
      const en = pathForEntity(`projects/${project}/articles/${item.name}`, 'en');
      const fa = pathForEntity(`projects/${project}/articles/${item.name}`, 'fa');
      const file = existsSync(en) ? en : fa;
      const data = existsSync(entry) ? readJson(entry) : parseDocument(readText(file)).frontmatter;
      children.set(item.name, { slug: item.name, title: data.title || item.name, draft: data.status !== 'published' });
    }
  }
  for (const locale of BLOG_LOCALES) {
    const directory = contentPath('blog', locale, 'projects', project);
    if (!existsSync(directory)) continue;
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      if (!item.isFile() || item.name === 'overview.mdx' || !/\.mdx?$/.test(item.name)) continue;
      const slug = item.name.replace(/\.mdx?$/, '');
      if (children.has(slug)) continue;
      const document = parseDocument(readText(contentPath('blog', locale, 'projects', project, item.name)));
      children.set(slug, { slug, title: document.frontmatter.title || slug, draft: document.frontmatter.draft === true });
    }
  }
  return [...children.values()];
}

export function contextForPath(pathname) {
  const match = pathname.match(/^\/(en|fa)(?:\/|$)/);
  const locale = match?.[1] || 'en';
  const rest = pathname.replace(/^\/(en|fa)\/?/, '').replace(/\/$/, '');
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

export function editorContextForPath(pathname) {
  const blog = pathname.match(/^\/dev\/content\/(edit|new)\/blog\/?$/);
  if (blog) return blog[1] === 'edit' ? { type: 'blog', id: 'landing', mode: 'edit', returnPath: '/en/blog/' } : { type: 'unsupported', id: 'blog', reason: 'Blog creation is not supported' };
  const project = pathname.match(/^\/dev\/content\/(edit|new)\/project(?:\/([a-z0-9-]+))?\/?$/);
  if (project) {
    const id = project[2];
    if (project[1] === 'new') return { type: 'project', id: 'new', mode: 'new', returnPath: '/en/blog/' };
    if (!id) return { type: 'unsupported', id: 'project', reason: 'Project ID is required' };
    return { type: 'project', id, project: id, mode: 'edit', returnPath: `/en/blog/projects/${id}/overview/` };
  }
  const article = pathname.match(/^\/dev\/content\/(edit|new)\/article\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?\/?$/);
  if (article) {
    const projectId = article[2];
    const slug = article[3];
    if (article[1] === 'new') return { type: 'article', id: `${projectId}/new`, project: projectId, slug: 'new', mode: 'new', returnPath: `/en/blog/projects/${projectId}/overview/` };
    if (!slug) return { type: 'unsupported', id: projectId, reason: 'Article slug is required' };
    return { type: 'article', id: `${projectId}/${slug}`, project: projectId, slug, mode: 'edit', returnPath: `/en/blog/projects/${projectId}/${slug}/` };
  }
  return { type: 'unsupported', id: pathname, reason: 'unsupported content type' };
}

export function contentTree() {
  return readJson(jsonPath('projects')).map(project => ({
    type: 'project', id: project.id, title: localized(project.locales, 'en').title || project.id, titleFa: localized(project.locales, 'fa').title || project.id,
    draft: project.visible === false, children: projectChildren(project.id).map(article => ({ type: 'article', id: `${project.id}/${article.slug}`, slug: article.slug, title: article.title, draft: article.draft })),
  }));
}

function validateSource(source, type, locale, expectedSlug) {
  const parsed = parseDocument(source);
  if (!parsed.hasFrontmatter) throw new Error(`${type} (${locale}) needs frontmatter`);
  if (!parsed.frontmatter.title || !parsed.frontmatter.description) throw new Error(`${type} (${locale}) needs a title and description`);
  if (!parsed.frontmatter.slug || !/^[a-z0-9-]+$/.test(String(parsed.frontmatter.slug))) throw new Error(`${type} (${locale}) needs a lowercase slug`);
  if (expectedSlug && parsed.frontmatter.slug !== expectedSlug) throw new Error(`${type} (${locale}) slug cannot be changed here`);
  if (parsed.frontmatter.pubDate && Number.isNaN(Date.parse(String(parsed.frontmatter.pubDate)))) throw new Error(`${type} (${locale}) publication date is invalid`);
  return parsed;
}

function localizedFrontmatter(shared, document, locale, status) {
  const frontmatter = document.frontmatter;
  return { kind: shared.kind, title: String(frontmatter.title || ''), description: String(frontmatter.description || ''), slug: shared.slug, locale, category: shared.category, subcategory: shared.subcategory, tags: shared.tags || [], pubDate: shared.pubDate || today(), updatedDate: shared.updatedDate, cover: shared.cover, coverAlt: frontmatter.coverAlt, author: shared.author, draft: status !== 'published', featured: Boolean(shared.featured), translationId: shared.translationId, toc: shared.toc !== false };
}

function normalizeShared(input, current, context, documents) {
  const next = { ...current, ...(input || {}) };
  next.id = current.id || context.id;
  next.kind = current.kind || (context.type === 'blog' ? 'landing' : context.type === 'project' ? 'overview' : 'article');
  next.slug = current.slug || (context.type === 'blog' ? 'blog' : context.type === 'project' ? 'overview' : context.slug);
  next.translationId = next.translationId || current.translationId || context.id;
  next.category = next.category || (context.type === 'blog' ? 'blog' : 'projects');
  next.subcategory = context.type === 'blog' ? undefined : (next.subcategory || projectIdFor(context));
  next.tags = Array.isArray(next.tags) ? next.tags.map(String) : [];
  next.pubDate = next.pubDate || documents.en.document.frontmatter.pubDate || documents.fa.document.frontmatter.pubDate || today();
  next.toc = next.toc !== false;
  next.status = next.status === 'published' ? 'published' : 'draft';
  return next;
}

function allowedProjectRecord(existing, input) {
  const allowed = ['favorite', 'favoriteAt', 'featured', 'publication', 'maturity', 'category', 'secondaryCategories', 'role', 'technologies', 'icon', 'image', 'imageAlt', 'publishedAt', 'updatedAt', 'repository', 'externalUrl', 'priority', 'journeyIds', 'relatedSkillIds', 'relatedProjectIds', 'articleIds'];
  const next = { ...existing };
  for (const key of allowed) if (input && Object.prototype.hasOwnProperty.call(input, key)) next[key] = input[key];
  if (next.favoriteAt == null) delete next.favoriteAt;
  return next;
}

function assertProjectPublication(record) {
  if (!['public-ready', 'public-sanitized'].includes(record.publication)) throw new Error('Review the project publication status before publishing');
}

export function saveEntity(input) {
  const context = input.context || {};
  if (context.type === 'home' || context.type === 'unsupported') throw new Error('unsupported content type');
  if (context.type === 'journey') throw new Error('Journey editing is not part of the bilingual article editor');
  const current = readEntity(context);
  if (current.revision !== input.expectedRevision) throw Object.assign(new Error('Content changed outside Easy Content Mode'), { code: 409 });
  const files = entityFiles(context);
  if (!files.unified) throw new Error('This entity uses the legacy locale-first layout. Run npm run content:migrate-bilingual before saving it.');
  const documents = Object.fromEntries(BLOG_LOCALES.map(locale => [locale, readDocument(files.files[locale])]));
  const sources = input.locales || {};
  const shared = normalizeShared(input.shared, current.shared, context, documents);
  if (input.publish) shared.status = 'published';
  else if (input.unpublish) shared.status = 'draft';
  else shared.status = current.shared.status;
  const nextDocuments = {};
  for (const locale of BLOG_LOCALES) {
    const source = String(sources[locale]?.source ?? documents[locale].source);
    const expectedSlug = context.type === 'blog' ? 'blog' : context.type === 'project' ? 'overview' : context.slug;
    const parsed = validateSource(source, context.type === 'blog' ? 'Blog landing' : context.type === 'project' ? 'Project overview' : 'Article', locale, expectedSlug);
    nextDocuments[locale] = { parsed, source: updateFrontmatter(source, localizedFrontmatter(shared, parsed, locale, shared.status)) };
  }
  const writes = [{ file: files.entry, source: writeJson(shared) }, ...BLOG_LOCALES.map(locale => ({ file: pathForEntity(files.entityPath, locale), source: nextDocuments[locale].source }))];

  if (context.type === 'project') {
    const projectsFile = jsonPath('projects');
    const registry = readJson(projectsFile);
    const index = registry.findIndex(item => item.id === projectIdFor(context));
    if (index < 0) throw new Error('Project does not exist');
    if (input.publish) assertProjectPublication(registry[index]);
    const nextProject = allowedProjectRecord(registry[index], input.shared?.project || {});
    nextProject.locales = { ...nextProject.locales, en: { ...nextProject.locales?.en, title: nextDocuments.en.parsed.frontmatter.title, description: nextDocuments.en.parsed.frontmatter.description }, fa: { ...nextProject.locales?.fa, title: nextDocuments.fa.parsed.frontmatter.title, description: nextDocuments.fa.parsed.frontmatter.description } };
    if (input.publish) { nextProject.visible = true; if (!nextProject.publishedAt) nextProject.publishedAt = today(); }
    else if (input.unpublish) nextProject.visible = false;
    nextProject.updatedAt = today();
    if (nextProject.favorite && !nextProject.favoriteAt) nextProject.favoriteAt = today();
    if (nextProject.icon && !ICON_IDS.includes(nextProject.icon)) throw new Error(`Unknown icon: ${nextProject.icon}`);
    const nextRegistry = [...registry]; nextRegistry[index] = nextProject;
    writes.unshift({ file: projectsFile, source: writeJson(nextRegistry) });
  }
  writeTransaction(writes);
  return { ...readEntity(context), saved: true };
}

function createSource({ shared, locale, title, description, body }) {
  return serializeDocument({ kind: shared.kind, title, description, slug: shared.slug, locale, category: shared.category, subcategory: shared.subcategory, tags: shared.tags, pubDate: shared.pubDate, draft: true, featured: shared.featured, translationId: shared.translationId, toc: shared.toc }, body || `\n## ${title}\n\n${description}\n`);
}

export function createProject(input) {
  const id = safeSlug(input.id || input.title?.en || input.title?.fa);
  const projectsFile = jsonPath('projects');
  const registry = readJson(projectsFile);
  if (registry.some(project => project.id === id)) throw new Error(`Project slug already exists: ${id}`);
  const shared = { id, kind: 'overview', translationId: id, slug: 'overview', category: 'projects', subcategory: id, status: 'draft', pubDate: today(), tags: input.tags || [], featured: false, toc: true };
  const record = { id, visible: false, favorite: Boolean(input.favorite), favoriteAt: input.favorite ? (input.favoriteAt || today()) : undefined, featured: false, translationId: id, publication: 'requires-review', maturity: 'under-development', category: input.category || 'devops-delivery', secondaryCategories: [], icon: input.icon && ICON_IDS.includes(input.icon) ? input.icon : undefined, role: { en: input.role?.en || 'Project', fa: input.role?.fa || 'پروژه' }, locales: { en: { title: input.title?.en || id, description: input.description?.en || 'Draft project.' }, fa: { title: input.title?.fa || id, description: input.description?.fa || 'پروژهٔ پیش‌نویس.' } }, technologies: input.technologies || [], journeyIds: [], relatedSkillIds: [], relatedProjectIds: [], articleIds: [], priority: 0 };
  const entityPath = `projects/${id}/overview`;
  const files = [{ file: projectsFile, source: writeJson([...registry, record]) }, { file: entryFile(entityPath), source: writeJson(shared) }, ...BLOG_LOCALES.map(locale => ({ file: pathForEntity(entityPath, locale), source: createSource({ shared, locale, title: record.locales[locale].title, description: record.locales[locale].description, body: locale === input.locale ? input.body : undefined }) }))];
  writeTransaction(files);
  return { id, route: `/en/blog/projects/${id}/overview/`, editorRoute: `/dev/content/edit/project/${id}/` };
}

export function createArticle(input) {
  const project = safeSlug(input.project);
  if (!projectRecord(project)) throw new Error(`Parent project does not exist: ${project}`);
  const slug = safeSlug(input.slug || input.title?.en || input.title?.fa);
  if (slug === 'overview') throw new Error('The overview slug is reserved for the project mother document');
  const entityPath = `projects/${project}/articles/${slug}`;
  const shared = { id: `${project}/${slug}`, kind: 'article', translationId: input.translationId || `${project}-${slug}`, slug, category: 'projects', subcategory: project, status: 'draft', pubDate: today(), tags: input.tags || [], featured: false, toc: true };
  const files = [{ file: entryFile(entityPath), source: writeJson(shared) }];
  for (const locale of BLOG_LOCALES) {
    const file = pathForEntity(entityPath, locale);
    if (existsSync(file)) throw new Error(`Article already exists: ${locale}/${project}/${slug}`);
    files.push({ file, source: createSource({ shared, locale, title: input.title?.[locale] || slug, description: input.description?.[locale] || 'Draft article.', body: locale === input.locale ? input.body : undefined }) });
  }
  writeTransaction(files);
  return { project, slug, route: `/en/blog/projects/${project}/${slug}/`, editorRoute: `/dev/content/edit/article/${project}/${slug}/` };
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
