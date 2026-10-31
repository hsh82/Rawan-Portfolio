export const BLOG_LOCALES = ['en', 'fa'];

const extensionPattern = /\.(md|mdx)$/i;

export function cleanBlogPath(value) {
  return String(value || '').replaceAll('\\', '/').replace(/^\.\//, '').replace(/^\//, '');
}

export function stripBlogExtension(value) {
  return cleanBlogPath(value).replace(extensionPattern, '');
}

export function isBlogLocale(value) {
  return BLOG_LOCALES.includes(String(value));
}

/**
 * Converts both the legacy locale-first layout and the unified bilingual
 * entity layout to the stable collection ID used by the public routes.
 */
export function normalizeBlogEntryId(entry) {
  const parts = cleanBlogPath(entry).split('/').filter(Boolean);
  if (!parts.length) return '';

  if (isBlogLocale(parts[0])) {
    return `${parts[0]}/${stripBlogExtension(parts.slice(1).join('/'))}`;
  }

  const file = parts.at(-1) || '';
  const locale = file.replace(extensionPattern, '');
  if (!isBlogLocale(locale)) return stripBlogExtension(parts.join('/'));

  const entity = parts.slice(0, -1);
  if (entity.join('/') === 'landing') return `${locale}/_index`;
  // A project hub owns its overview document. Keeping `overview` in the
  // collection id preserves the established public URL while allowing the
  // canonical files to live directly in `projects/<id>/`.
  if (entity[0] === 'projects' && entity.length === 2) return `${locale}/projects/${entity[1]}/overview`;
  if (entity[0] === 'projects' && entity[2] === 'articles') {
    return `${locale}/projects/${entity[1]}/${entity[3]}`;
  }
  return `${locale}/${entity.join('/')}`;
}

export function parseBlogEntryPath(entry) {
  const normalized = cleanBlogPath(entry);
  const parts = normalized.split('/').filter(Boolean);
  const id = normalizeBlogEntryId(normalized);

  if (isBlogLocale(parts[0])) {
    const locale = parts[0];
    const relative = stripBlogExtension(parts.slice(1).join('/'));
    return {
      layout: 'legacy',
      locale,
      id,
      relative,
      entityPath: relative === '_index' ? 'landing' : relative,
      legacyPath: normalized,
    };
  }

  const locale = (parts.at(-1) || '').replace(extensionPattern, '');
  if (!isBlogLocale(locale)) return { layout: 'unknown', locale: undefined, id, relative: normalized };
  const entityPath = parts.slice(0, -1).join('/');
  return {
    layout: 'unified',
    locale,
    id,
    relative: entityPath,
    entityPath,
    unifiedPath: normalized,
  };
}

export function unifiedEntityPathFromLegacy(entry) {
  const parsed = parseBlogEntryPath(entry);
  if (parsed.layout !== 'legacy') return parsed.entityPath;
  if (parsed.entityPath === 'landing') return 'landing';
  const parts = parsed.entityPath.split('/').filter(Boolean);
  if (parts[0] === 'projects' && parts.length >= 3) {
    if (parts.at(-1) === 'overview') return `projects/${parts[1]}`;
    return `projects/${parts[1]}/articles/${parts.at(-1)}`;
  }
  return parts.join('/');
}

export function unifiedPathForLocale(entityPath, locale) {
  const safeEntityPath = cleanBlogPath(entityPath).replace(/\/$/, '');
  if (safeEntityPath === 'landing') return `landing/${locale}.mdx`;
  return `${safeEntityPath}/${locale}.mdx`;
}

export function publicRouteFromCollectionId(id) {
  const parts = cleanBlogPath(id).split('/').filter(Boolean);
  if (parts[1] === '_index') return `/${parts[0]}/blog/`;
  return `/${parts[0]}/blog/${parts.slice(1).join('/')}/`;
}
