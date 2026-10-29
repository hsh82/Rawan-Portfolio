import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';
export type Article = CollectionEntry<'blog'>;
export const articlePath = (article: Article) => `/${article.data.locale}/blog/${article.id.split('/').slice(1).join('/')}/`;
export const articleSegments = (article: Article) => article.id.split('/').slice(1, -1);
export const categoryPath = (locale: Locale, segments: string[]) => `/${locale}/blog/category/${segments.join('/')}/`;
export const isLanding = (article: Article) => article.data.kind === 'landing' || article.id.split('/').at(-1) === '_index';
export const isProjectArticle = (article: Article) => article.data.category === 'projects' && article.id.split('/')[2] !== undefined;
export const projectIdOf = (article: Article) => isProjectArticle(article) ? article.id.split('/')[2] : undefined;
export const isProjectOverview = (article: Article) => isProjectArticle(article) && article.data.slug === 'overview';
export async function published(locale?: Locale, includeDrafts = false) {
  const entries = await getCollection('blog', ({ data }) => (includeDrafts ? data.kind !== 'landing' : !data.draft && data.kind !== 'landing') && (!locale || data.locale === locale));
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
export async function landing(locale: Locale) {
  const entries = await getCollection('blog', ({ data }) => !data.draft && data.kind === 'landing' && data.locale === locale);
  return entries[0];
}
export async function projectOverview(projectId: string, locale: Locale) {
  const entries = await published(locale);
  return entries.find(article => projectIdOf(article) === projectId && isProjectOverview(article));
}
export async function projectArticles(projectId: string, locale: Locale) {
  const entries = await published(locale);
  return entries.filter(article => projectIdOf(article) === projectId && !isProjectOverview(article));
}
export async function projectNavigation(article: Article) {
  const projectId = projectIdOf(article);
  const entries = projectId ? await projectArticles(projectId, article.data.locale as Locale) : (await published(article.data.locale as Locale)).filter(item => !isProjectOverview(item));
  const index = entries.findIndex(item => item.id === article.id);
  return { previous: index > 0 ? entries[index - 1] : undefined, next: index >= 0 ? entries[index + 1] : undefined };
}
export function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 220)); }
export const formatDate = (date: Date, locale: Locale) => new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { dateStyle: 'medium' }).format(date);
