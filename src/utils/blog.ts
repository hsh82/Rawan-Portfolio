import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';
export type Article = CollectionEntry<'blog'>;
export const articlePath = (article: Article) => `/${article.data.locale}/blog/${article.id.split('/').slice(1).join('/')}/`;
export const articleSegments = (article: Article) => article.id.split('/').slice(1, -1);
export const categoryPath = (locale: Locale, segments: string[]) => `/${locale}/blog/category/${segments.join('/')}/`;
export async function published(locale?: Locale) {
  const entries = await getCollection('blog', ({ data }) => !data.draft && (!locale || data.locale === locale));
  const ids = new Set<string>();
  const translations = new Set<string>();
  for (const entry of entries) {
    const parts = entry.id.split('/');
    if (parts[0] !== entry.data.locale || parts.length < 4 || parts[1] !== entry.data.category || parts.at(-1) !== entry.data.slug) throw new Error(`Article folder/frontmatter mismatch: ${entry.id}`);
    if (entry.data.subcategory && parts[2] !== entry.data.subcategory) throw new Error(`Article subcategory mismatch: ${entry.id}`);
    if (ids.has(entry.id)) throw new Error(`Duplicate article id: ${entry.id}`);
    ids.add(entry.id);
    const key = `${entry.data.locale}:${entry.data.translationId}`;
    if (translations.has(key)) throw new Error(`Duplicate translation identifier: ${key}`);
    translations.add(key);
  }
  return entries.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
export function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 220)); }
export const formatDate = (date: Date, locale: Locale) => new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { dateStyle: 'medium' }).format(date);
