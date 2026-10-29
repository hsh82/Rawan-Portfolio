import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const locales = ['en', 'fa'];

function frontmatterValue(source, field) {
  const match = source.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, 'm'));
  if (!match) return '';
  const value = match[1].trim();
  try { return JSON.parse(value); } catch { return value.replace(/^['"]|['"]$/g, ''); }
}

function readOverview(projectRoot, locale) {
  const file = resolve(projectRoot, `${locale}.mdx`);
  const source = existsSync(file) ? readFileSync(file, 'utf8') : '';
  return {
    title: frontmatterValue(source, 'title'),
    description: frontmatterValue(source, 'description'),
  };
}

/**
 * Read only canonical root project hubs. Nested `articles/` directories are
 * intentionally not returned as projects; they belong to their parent hub.
 */
export function readProjectHubs(contentRoot = resolve(process.cwd(), 'content')) {
  const directory = resolve(contentRoot, 'blog', 'projects');
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true })
    .filter(item => item.isDirectory())
    .map(item => {
      if (item.name === 'overview') throw new Error('Invalid project hub ID: overview is reserved for the overview URL');
      const projectRoot = resolve(directory, item.name);
      const entryFile = resolve(projectRoot, 'entry.json');
      if (!existsSync(entryFile)) return null;
      const shared = JSON.parse(readFileSync(entryFile, 'utf8'));
      return {
        ...shared,
        visible: shared.status === 'published',
        category: shared.projectCategory || (shared.category === 'projects' ? 'devops-delivery' : shared.category),
        locales: Object.fromEntries(locales.map(locale => [locale, readOverview(projectRoot, locale)])),
      };
    })
    .filter(Boolean);
}

export { frontmatterValue };
