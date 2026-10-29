import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseDocument, updateFrontmatter } from '../src/dev/easy-content/server/frontmatter.mjs';
import { BLOG_LOCALES, unifiedEntityPathFromLegacy } from '../src/utils/blog-layout.mjs';

const root = resolve(process.cwd());
const blogRoot = resolve(root, 'content/blog');
const write = process.argv.includes('--write');
const force = process.argv.includes('--force');

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    const file = join(directory, item.name);
    return item.isDirectory() ? walk(file) : [file];
  });
}

function legacyFiles() {
  return walk(blogRoot).filter(file => /\.(md|mdx)$/.test(file)).filter(file => {
    const rel = relative(blogRoot, file).replaceAll('\\', '/');
    return BLOG_LOCALES.includes(rel.split('/')[0]);
  });
}

function sharedFromDocuments(entityPath, documents) {
  const source = documents.en?.document?.frontmatter?.title ? documents.en.document.frontmatter : documents.fa.document.frontmatter;
  const isLanding = entityPath === 'landing';
  const parts = entityPath.split('/');
  return {
    id: isLanding ? 'landing' : parts.at(-1),
    kind: source.kind || (isLanding ? 'landing' : entityPath.endsWith('/overview') ? 'overview' : 'article'),
    translationId: source.translationId || (isLanding ? 'blog-landing' : parts.join('-')),
    slug: source.slug || (isLanding ? 'blog' : parts.at(-1)),
    category: source.category || (isLanding ? 'blog' : parts[0]),
    subcategory: source.subcategory,
    status: BLOG_LOCALES.every(locale => documents[locale] && documents[locale].document.frontmatter.draft !== true) ? 'published' : 'draft',
    pubDate: source.pubDate,
    updatedDate: source.updatedDate,
    tags: Array.isArray(source.tags) ? source.tags : [],
    author: source.author,
    cover: source.cover,
    featured: Boolean(source.featured),
    toc: source.toc !== false,
  };
}

const groups = new Map();
for (const file of legacyFiles()) {
  const relativePath = relative(blogRoot, file).replaceAll('\\', '/');
  const locale = relativePath.split('/')[0];
  const entityPath = unifiedEntityPathFromLegacy(relativePath);
  const group = groups.get(entityPath) || {};
  group[locale] = { file, source: readFileSync(file, 'utf8'), document: parseDocument(readFileSync(file, 'utf8')) };
  groups.set(entityPath, group);
}

if (!groups.size) {
  console.log('No legacy locale-first blog files found.');
  process.exit(0);
}

const errors = [];
const migrations = [];
for (const [entityPath, documents] of groups) {
  for (const locale of BLOG_LOCALES) if (!documents[locale]) errors.push(`${entityPath}: missing ${locale} translation`);
  if (errors.length) continue;
  const shared = sharedFromDocuments(entityPath, documents);
  const targetDirectory = resolve(blogRoot, entityPath);
  const targetEntry = join(targetDirectory, 'entry.json');
  const targetFiles = Object.fromEntries(BLOG_LOCALES.map(locale => [locale, join(targetDirectory, `${locale}.mdx`)]));
  if (!force && [targetEntry, ...Object.values(targetFiles)].some(existsSync)) errors.push(`${entityPath}: target already exists (use --force only after review)`);
  migrations.push({ entityPath, documents, shared, targetDirectory, targetEntry, targetFiles });
}

if (errors.length) {
  console.error(errors.map(error => `ERROR: ${error}`).join('\n'));
  process.exit(1);
}
for (const migration of migrations) {
  console.log(`${write ? 'Migrate' : 'Would migrate'} ${migration.entityPath}: ${Object.keys(migration.documents).join(' + ')}`);
  if (!write) continue;
  mkdirSync(migration.targetDirectory, { recursive: true });
  writeFileSync(migration.targetEntry, `${JSON.stringify(migration.shared, null, 2)}\n`);
  for (const locale of BLOG_LOCALES) {
    const source = updateFrontmatter(migration.documents[locale].source, { ...migration.shared, locale, draft: migration.shared.status !== 'published' });
    writeFileSync(migration.targetFiles[locale], source);
  }
  for (const locale of BLOG_LOCALES) rmSync(migration.documents[locale].file);
}
console.log(write ? 'Bilingual blog migration complete.' : 'Dry run complete. Re-run with --write after reviewing the mapping.');
