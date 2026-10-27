import { published, articlePath } from './blog';
import { t, type Locale } from './i18n';
const escapeXml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[char]!));
export async function rss(locale: Locale, site: URL) {
  const entries = await published(locale);
  const base = new URL(`/${locale}/blog/`, site).href;
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(t('blog.title', locale))}</title><description>${escapeXml(t('blog.intro', locale))}</description><link>${base}</link><language>${locale}</language>${entries.map(entry => `<item><title>${escapeXml(entry.data.title)}</title><description>${escapeXml(entry.data.description)}</description><link>${new URL(articlePath(entry), site).href}</link><guid>${new URL(articlePath(entry), site).href}</guid><pubDate>${entry.data.pubDate.toUTCString()}</pubDate></item>`).join('')}</channel></rss>`;
}
