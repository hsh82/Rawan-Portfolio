import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { contentPath, moveToTrash, readText, revisionOf, safeSlug, writeTransaction } from './security.mjs';
import { parseDocument, removeFrontmatterFields, replaceBody, serializeDocument, updateFrontmatter } from './frontmatter.mjs';
import { assertSharedPayload, canonicalProjectMetadata, editableProjectPatch } from './project-metadata.mjs';
import { ICON_IDS } from '../../../utils/icon-registry.mjs';
import { BLOG_LOCALES } from '../../../utils/blog-layout.mjs';
import { normalizeIconId, normalizeImageAlt, normalizeImageReference, normalizeLocalizedImageAlt } from '../../../utils/blog-media.mjs';

const jsonPath = name => contentPath(name, 'entries.json');
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = value => JSON.stringify(value, null, 2) + '\n';
const today = () => new Date().toISOString().slice(0, 10);

function normalizeStoredImage(value) {
  const image = normalizeImageReference(value);
  if (image?.startsWith('media/')) {
    const file = contentPath(...image.split('/'));
    if (!existsSync(file)) throw new Error(`Image media file does not exist: content/${image}`);
  }
  return image;
}

function normalizeSharedMedia(value) {
  const next = { ...value };
  next.image = normalizeStoredImage(next.image);
  next.icon = normalizeIconId(next.icon);
  next.imageAlt = normalizeLocalizedImageAlt(next.imageAlt);
  if (next.image === undefined) delete next.image;
  if (next.icon === undefined) delete next.icon;
  if (next.imageAlt === undefined) delete next.imageAlt;
  return next;
}

const hasField = (value, field) => Object.prototype.hasOwnProperty.call(value || {}, field);
const absent = Symbol('absent');
function payloadField(input, field) {
  if (hasField(input.shared, field)) return input.shared[field];
  if (input.context?.type === 'project' && hasField(input.shared?.project, field)) return input.shared.project[field];
  return absent;
}

function synchronizeSharedMedia(shared, current, input, documents) {
  const next = { ...shared };
  for (const field of ['image', 'icon']) {
    const states = BLOG_LOCALES.map(locale => ({ locale, present: hasField(documents[locale].parsed.frontmatter, field), value: documents[locale].parsed.frontmatter[field] }));
    if (!states.some(state => state.present)) continue;
    if (!states.every(state => state.present)) throw new Error(`${field} must be present in both English and Persian frontmatter; edit both Source tabs before saving`);
    const normalized = states.map(state => field === 'image' ? normalizeStoredImage(state.value) : normalizeIconId(state.value));
    if (new Set(normalized.map(value => value || '')).size > 1) throw new Error(`${field} differs between English and Persian frontmatter; use one shared value in both Source tabs`);
    const supplied = payloadField(input, field);
    if (supplied !== absent) {
      const suppliedValue = field === 'image' ? normalizeStoredImage(supplied) : normalizeIconId(supplied);
      const currentValue = field === 'image' ? normalizeStoredImage(current[field]) : normalizeIconId(current[field]);
      if ((suppliedValue || '') !== (normalized[0] || '') && (suppliedValue || '') !== (currentValue || '')) throw new Error(`${field} in General Settings disagrees with the MDX Source tabs; reload or update both locales`);
    }
    next[field] = normalized[0];
  }

  const imageAlt = { ...(normalizeLocalizedImageAlt(current.imageAlt) || {}), ...(normalizeLocalizedImageAlt(shared.imageAlt) || {}) };
  for (const locale of BLOG_LOCALES) {
    if (hasField(documents[locale].parsed.frontmatter, 'imageAlt')) imageAlt[locale] = normalizeImageAlt(documents[locale].parsed.frontmatter.imageAlt);
  }
  next.imageAlt = Object.fromEntries(Object.entries(imageAlt).filter(([, value]) => value !== undefined));
  if (!Object.keys(next.imageAlt).length) delete next.imageAlt;
  return normalizeSharedMedia(next);
}

function projectRecord(id) {
  const file = contentPath('blog', 'projects', safeSlug(id), 'entry.json');
  return existsSync(file) ? readJson(file) : undefined;
}

function projectIds() {
  const directory = contentPath('blog', 'projects');
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter(item => item.isDirectory() && existsSync(contentPath('blog', 'projects', item.name, 'entry.json')))
    .map(item => item.name);
}

function projectIdFor(context) {
  return context.project || context.projectId || context.id;
}

function entityPathFor(context) {
  if (context.type === 'blog') return 'landing';
  if (context.type === 'project') return `projects/${safeSlug(projectIdFor(context))}`;
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
    image: record?.image ?? en.image ?? fa.image,
    icon: record?.icon ?? en.icon ?? fa.icon,
    imageAlt: record?.imageAlt || { en: en.imageAlt, fa: fa.imageAlt },
    featured: Boolean(source.featured),
    toc: source.toc !== false,
  };
}

function readShared(context, documents, record, files) {
  if (files.unified && existsSync(files.entry)) {
    try {
      const shared = normalizeSharedMedia({ ...defaultShared(context, documents, record), ...readJson(files.entry) });
      return context.type === 'project' ? canonicalProjectMetadata(shared) : shared;
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
  const metadata = context.type === 'project' && record ? canonicalProjectMetadata(record) : record;
  return {
    type: context.type,
    id: context.id,
    project: context.type === 'project' || context.type === 'article' ? projectIdFor(context) : undefined,
    slug: context.type === 'article' ? context.slug || context.articleId : shared.slug,
    shared,
    metadata,
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
  if (/^\/dev\/content\/?$/.test(pathname)) return { type: 'studio', id: 'home', mode: 'browse', returnPath: '/en/' };
  const resource = pathname.match(/^\/dev\/content\/edit\/resource\/([a-z-]+)(?:\/([a-z0-9-]+))?\/?$/);
  if (resource) return { type: 'resource', resource: resource[1], id: resource[2] || undefined, mode: 'edit', returnPath: '/en/' };
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
  return projectIds().map(id => {
    const project = projectRecord(id) || {};
    const en = existsSync(pathForEntity(`projects/${id}`, 'en')) ? readDocument(pathForEntity(`projects/${id}`, 'en')).document.frontmatter : {};
    const fa = existsSync(pathForEntity(`projects/${id}`, 'fa')) ? readDocument(pathForEntity(`projects/${id}`, 'fa')).document.frontmatter : {};
    return {
      type: 'project', id,
      title: en.title || id,
      titleFa: fa.title || id,
      draft: project.status !== 'published',
      children: projectChildren(id).map(article => ({ type: 'article', id: `${id}/${article.slug}`, slug: article.slug, title: article.title, draft: article.draft })),
    };
  });
}

function validateSource(source, type, locale, expectedSlug, { requireContent = false } = {}) {
  const parsed = parseDocument(source);
  if (!parsed.hasFrontmatter) throw new Error(`${type} (${locale}) needs valid frontmatter beginning with --- and ending with ---; leading blank lines and a UTF-8 BOM are allowed`);
  if (requireContent && (!parsed.frontmatter.title || !parsed.frontmatter.description)) throw new Error(`${type} (${locale}) needs a title and description before publishing`);
  if (type === 'Project overview' && parsed.frontmatter.kind === 'overview') throw new Error(`Project overview (${locale}) must use kind: article in MDX frontmatter; overview is the URL role, not a collection kind`);
  if (!parsed.frontmatter.slug || !/^[a-z0-9-]+$/.test(String(parsed.frontmatter.slug))) throw new Error(`${type} (${locale}) needs a lowercase slug`);
  if (expectedSlug && parsed.frontmatter.slug !== expectedSlug) throw new Error(`${type} (${locale}) slug cannot be changed here`);
  if (parsed.frontmatter.pubDate && Number.isNaN(Date.parse(String(parsed.frontmatter.pubDate)))) throw new Error(`${type} (${locale}) publication date is invalid`);
  return parsed;
}

function sourceForSave(value, currentSource, type, locale) {
  if (value !== undefined && (!value || typeof value !== 'object' || Array.isArray(value))) throw new Error(`${type} (${locale}) payload must contain source or body`);
  const payload = value || {};
  const hasSource = Object.prototype.hasOwnProperty.call(payload, 'source');
  const hasBody = Object.prototype.hasOwnProperty.call(payload, 'body');
  if (hasSource && hasBody) throw new Error(`${type} (${locale}) must provide either complete source or body, not both`);
  if (!hasSource && !hasBody) return currentSource;
  if (hasSource) {
    if (typeof payload.source !== 'string' || !payload.source.trim()) throw new Error(`${type} (${locale}) source cannot be empty; restore the document before saving`);
    return payload.source;
  }
  if (typeof payload.body !== 'string') throw new Error(`${type} (${locale}) body must be text`);
  return replaceBody(currentSource, payload.body);
}

function localizedFrontmatter(shared, document, locale, status) {
  const frontmatter = document.frontmatter;
  return { kind: shared.kind === 'overview' ? 'article' : shared.kind, title: String(frontmatter.title || ''), description: String(frontmatter.description || ''), slug: shared.slug, locale, category: shared.category, subcategory: shared.subcategory, tags: shared.tags || [], pubDate: shared.pubDate || today(), updatedDate: shared.updatedDate, cover: shared.cover, coverAlt: frontmatter.coverAlt, image: shared.image, imageAlt: shared.imageAlt?.[locale], icon: shared.icon, author: shared.author, draft: status !== 'published', featured: Boolean(shared.featured), translationId: shared.translationId, toc: shared.toc !== false };
}

function normalizeShared(input, current, context, documents) {
  const payload = assertSharedPayload(input || {});
  const { project: _project, ...sharedInput } = payload;
  const next = { ...current, ...sharedInput, ...(context.type === 'project' ? editableProjectPatch(payload.project || {}) : {}) };
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
  return normalizeSharedMedia(next);
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
  if (input.locales !== undefined && (!input.locales || typeof input.locales !== 'object' || Array.isArray(input.locales))) throw new Error('Localized save payload must be an object keyed by en and fa');
  const sources = input.locales || {};
  const shared = normalizeShared(input.shared, current.shared, context, documents);
  if (input.publish) shared.status = 'published';
  else if (input.unpublish) shared.status = 'draft';
  else shared.status = current.shared.status;
  const nextDocuments = {};
  for (const locale of BLOG_LOCALES) {
    const source = sourceForSave(sources[locale], documents[locale].source, context.type === 'blog' ? 'Blog landing' : context.type === 'project' ? 'Project overview' : 'Article', locale);
    const expectedSlug = context.type === 'blog' ? 'blog' : context.type === 'project' ? 'overview' : context.slug;
    const parsed = validateSource(source, context.type === 'blog' ? 'Blog landing' : context.type === 'project' ? 'Project overview' : 'Article', locale, expectedSlug, { requireContent: input.publish === true });
    nextDocuments[locale] = { parsed, source };
  }
  const synchronized = synchronizeSharedMedia(shared, current.shared, input, nextDocuments);
  const writes = [{ file: files.entry, source: writeJson(synchronized) }, ...BLOG_LOCALES.map(locale => {
    const frontmatter = localizedFrontmatter(synchronized, nextDocuments[locale].parsed, locale, synchronized.status);
    let source = updateFrontmatter(nextDocuments[locale].source, frontmatter);
    const removals = ['image', 'imageAlt', 'icon'].filter(field => frontmatter[field] === undefined);
    if (removals.length) source = removeFrontmatterFields(source, removals);
    return { file: pathForEntity(files.entityPath, locale), source };
  })];

  if (context.type === 'project') {
    const record = projectRecord(projectIdFor(context));
    if (!record) throw new Error('Project does not exist');
    if (input.publish) { synchronized.visible = true; if (!synchronized.publishedAt) synchronized.publishedAt = today(); }
    else if (input.unpublish) synchronized.visible = false;
    synchronized.updatedAt = today();
    if (synchronized.favorite && !synchronized.favoriteAt) synchronized.favoriteAt = today();
    if (synchronized.icon && !ICON_IDS.includes(synchronized.icon)) throw new Error(`Unknown icon: ${synchronized.icon}`);
    writes[0] = { file: files.entry, source: writeJson(synchronized) };
  }
  writeTransaction(writes);
  return { ...readEntity(context), saved: true };
}

function createSource({ shared, locale, title, description, body }) {
  return serializeDocument({ kind: shared.kind === 'overview' ? 'article' : shared.kind, title, description, slug: shared.slug, locale, category: shared.category, subcategory: shared.subcategory, tags: shared.tags, pubDate: shared.pubDate, image: shared.image ?? '', imageAlt: shared.imageAlt?.[locale], icon: shared.icon ?? '', draft: shared.status !== 'published', featured: shared.featured, translationId: shared.translationId, toc: shared.toc }, body || `\n## ${title}\n\n${description}\n`);
}

export function createProject(input) {
  const requestedId = input.title?.en || input.title?.fa;
  const id = safeSlug(requestedId);
  if (id === 'overview') throw new Error('Project ID "overview" is reserved for the public overview URL; use a project-specific ID');
  if (projectRecord(id)) throw new Error(`Project slug already exists: ${id}`);
  if (input.publish && ['en', 'fa'].some(locale => !input.title?.[locale]?.trim() || !input.description?.[locale]?.trim())) throw new Error('Publish requires an English and Persian title and summary');
  const status = input.publish === true ? 'published' : 'draft';
  const shared = normalizeSharedMedia({ id, kind: 'overview', translationId: id, slug: 'overview', category: 'projects', projectCategory: input.category || 'devops-delivery', subcategory: id, status, visible: status === 'published', pubDate: today(), tags: input.tags || [], featured: false, toc: true, favorite: Boolean(input.favorite), favoriteAt: input.favorite ? (input.favoriteAt || today()) : undefined, publication: 'requires-review', maturity: 'under-development', secondaryCategories: [], image: input.image, imageAlt: input.imageAlt, icon: input.icon, role: { en: input.role?.en || 'Project', fa: input.role?.fa || 'پروژه' }, technologies: input.technologies || [], journeyIds: [], relatedSkillIds: [], relatedProjectIds: [], articleIds: [], priority: 0 });
  const entityPath = `projects/${id}`;
  const titles = { en: input.title?.en || id, fa: input.title?.fa || id };
  const descriptions = { en: input.description?.en || 'Draft project.', fa: input.description?.fa || 'پروژهٔ پیش‌نویس.' };
  const files = [{ file: entryFile(entityPath), source: writeJson(shared) }, ...BLOG_LOCALES.map(locale => ({ file: pathForEntity(entityPath, locale), source: createSource({ shared, locale, title: titles[locale], description: descriptions[locale], body: locale === input.locale ? input.body : undefined }) }))];
  if (input.publish) for (const locale of BLOG_LOCALES) validateSource(files.find(item => item.file === pathForEntity(entityPath, locale)).source, 'Project overview', locale, 'overview', { requireContent: true });
  writeTransaction(files);
  return { id, route: `/en/blog/projects/${id}/overview/`, editorRoute: `/dev/content/edit/project/${id}/` };
}

export function createArticle(input) {
  const project = safeSlug(input.project);
  if (!projectRecord(project)) throw new Error(`Parent project does not exist: ${project}`);
  const slug = safeSlug(input.slug || input.title?.en || input.title?.fa);
  if (slug === 'overview') throw new Error('The overview slug is reserved for the project mother document');
  const entityPath = `projects/${project}/articles/${slug}`;
  if (input.publish && ['en', 'fa'].some(locale => !input.title?.[locale]?.trim() || !input.description?.[locale]?.trim())) throw new Error('Publish requires an English and Persian title and summary');
  const status = input.publish === true ? 'published' : 'draft';
  const shared = normalizeSharedMedia({ id: `${project}/${slug}`, kind: 'article', translationId: input.translationId || `${project}-${slug}`, slug, category: 'projects', subcategory: project, status, pubDate: today(), tags: input.tags || [], image: input.image, imageAlt: input.imageAlt, icon: input.icon, featured: false, toc: true });
  const files = [{ file: entryFile(entityPath), source: writeJson(shared) }];
  for (const locale of BLOG_LOCALES) {
    const file = pathForEntity(entityPath, locale);
    if (existsSync(file)) throw new Error(`Article already exists: ${locale}/${project}/${slug}`);
    files.push({ file, source: createSource({ shared, locale, title: input.title?.[locale] || slug, description: input.description?.[locale] || 'Draft article.', body: locale === input.locale ? input.body : undefined }) });
  }
  if (input.publish) for (const locale of BLOG_LOCALES) validateSource(files.find(item => item.file === pathForEntity(entityPath, locale)).source, 'Article', locale, slug, { requireContent: true });
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

function referencesForProject(id) {
  const references = [];
  const jsonFiles = [
    ['journey', jsonPath('journey')],
    ['resume', contentPath('resume', 'config.json')],
  ];
  for (const [name, file] of jsonFiles) {
    if (!existsSync(file)) continue;
    const value = readJson(file);
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      for (const [field, candidate] of Object.entries(item || {})) {
        if (Array.isArray(candidate) && candidate.includes(id)) references.push(`${name}/${item.id || 'config'}:${field}`);
      }
    }
  }
  for (const otherId of projectIds()) {
    if (otherId === id) continue;
    const project = projectRecord(otherId) || {};
    if (project.relatedProjectIds?.includes(id)) references.push(`project/${otherId}:relatedProjectIds`);
  }
  return references;
}

function referencesForArticle(project, slug) {
  const id = `${project}/${slug}`;
  const references = [];
  const journeyFile = jsonPath('journey');
  if (existsSync(journeyFile)) for (const item of readJson(journeyFile)) if (item.articleIds?.includes(id)) references.push(`journey/${item.id}:articleIds`);
  const hub = projectRecord(project);
  if (hub?.articleIds?.includes(id)) references.push(`project/${project}:articleIds`);
  return references;
}

/**
 * Deletion is intentionally narrow and recoverable: source files are moved to
 * ignored local trash, never recursively removed. Projects with child articles
 * or incoming references are blocked instead of cascaded.
 */
export function deleteEntity(input) {
  const context = input.context || {};
  if (!['project', 'article'].includes(context.type)) throw new Error('Only a project or child article can be deleted here');
  const current = readEntity(context);
  if (current.revision !== input.expectedRevision) throw Object.assign(new Error('Content changed outside Easy Content Mode'), { code: 409 });
  if (context.type === 'project') {
    const project = projectIdFor(context);
    const children = projectChildren(project);
    if (children.length) throw new Error(`Delete or move the ${children.length} child article${children.length === 1 ? '' : 's'} before deleting this project`);
    const references = referencesForProject(project);
    if (references.length) throw new Error(`Cannot delete this project; it is referenced by ${references.join(', ')}`);
    const target = contentPath('blog', 'projects', safeSlug(project));
    return { deleted: true, target: moveToTrash(target, `project-${project}`) };
  }
  const project = safeSlug(context.project || context.projectId);
  const slug = safeSlug(context.slug || context.articleId);
  const references = referencesForArticle(project, slug);
  if (references.length) throw new Error(`Cannot delete this article; it is referenced by ${references.join(', ')}`);
  const target = contentPath('blog', 'projects', project, 'articles', slug);
  return { deleted: true, target: moveToTrash(target, `article-${project}-${slug}`) };
}
