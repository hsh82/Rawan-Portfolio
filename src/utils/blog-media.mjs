import { ICON_IDS } from './icon-registry.mjs';

export const BLOG_MEDIA_FIELDS = ['image', 'imageAlt', 'icon'];

export function normalizeImageReference(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error('Image must be a local media path or an HTTPS URL');
  const source = value.trim();
  if (!source) return undefined;
  const local = source.replace(/^\/+/, '');
  if (local.startsWith('media/')) {
    if (local.includes('\\') || local.split('/').some(segment => !segment || segment === '.' || segment === '..')) throw new Error('Image media paths must stay inside content/media');
    return local;
  }
  let url;
  try { url = new URL(source); } catch { throw new Error('Image must be a local media path or an HTTPS URL'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new Error('Remote images must use an HTTPS URL without credentials');
  return source;
}

export function isApprovedImageReference(value) {
  try { return value === undefined || normalizeImageReference(value) !== undefined; } catch { return false; }
}

export function normalizeIconId(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !ICON_IDS.includes(value.trim())) throw new Error(`Unknown icon: ${value}`);
  return value.trim();
}

export function normalizeImageAlt(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new Error('Image alt text must be a string');
  const text = value.trim();
  return text || undefined;
}

export function normalizeLocalizedImageAlt(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('imageAlt metadata must contain English and Persian values');
  const result = {};
  for (const locale of ['en', 'fa']) {
    const text = normalizeImageAlt(value[locale]);
    if (text !== undefined) result[locale] = text;
  }
  return Object.keys(result).length ? result : undefined;
}

export function mediaMirrorForLocale(shared, locale) {
  return {
    image: shared.image,
    icon: shared.icon,
    imageAlt: shared.imageAlt?.[locale],
  };
}
