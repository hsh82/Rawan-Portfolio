import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseDocument, updateFrontmatter } from '../src/dev/easy-content/server/frontmatter.mjs';
import { writeTransaction } from '../src/dev/easy-content/server/security.mjs';
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
  const parts = entityPath.split('/').filter(Boolean);
  const isProjectHub = parts[0] === 'projects' && parts.length === 2;
  return {
    id: isLanding ? 'landing' : isProjectHub ? parts[1] : parts.join('/'),
    kind: source.kind || (isLanding ? 'landing' : isProjectHub ? 'overview' : 'article'),
    translationId: source.translationId || (isLanding ? 'blog-landing' : parts.join('-')),
    slug: source.slug || (isLanding ? 'blog' : isProjectHub ? 'overview' : parts.at(-1)),
    category: source.category || (isLanding ? 'blog' : 'projects'),
    subcategory: source.subcategory || (isLanding || !parts[1] ? undefined : parts[1]),
    status: BLOG_LOCALES.every(locale => documents[locale] && documents[locale].document.frontmatter.draft !== true) ? 'published' : 'draft',
    pubDate: source.pubDate,
    updatedDate: source.updatedDate,
    tags: Array.isArray(source.tags) ? source.tags : [],
    author: source.author,
    cover: source.cover,
    image: source.image,
    imageAlt: { en: documents.en.document.frontmatter.imageAlt, fa: documents.fa.document.frontmatter.imageAlt },
    icon: source.icon,
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
  const source = readFileSync(file, 'utf8');
  group[locale] = { file, source, document: parseDocument(source) };
  groups.set(entityPath, group);
}

if (!groups.size) {
  console.log('No legacy locale-first blog files found.');
  process.exit(0);
}

const errors = [];
const migrations = [];
for (const [entityPath, documents] of groups) {
  for (const locale of BLOG_LOCALES) {
    if (!documents[locale]) errors.push(`${entityPath}: missing ${locale} translation`);
    else if (!documents[locale].document.hasFrontmatter) errors.push(`${entityPath}: ${locale} needs valid frontmatter`);
  }
  if (BLOG_LOCALES.some(locale => !documents[locale] || !documents[locale].document.hasFrontmatter)) continue;
  const shared = sharedFromDocuments(entityPath, documents);
  const targetDirectory = resolve(blogRoot, entityPath);
  const targetEntry = join(targetDirectory, 'entry.json');
  const targetFiles = Object.fromEntries(BLOG_LOCALES.map(locale => [locale, join(targetDirectory, `${locale}.mdx`)]));
  if (!force && [targetEntry, ...Object.values(targetFiles)].some(existsSync)) errors.push(`${entityPath}: target already exists (inspect it before using --force)`);
  migrations.push({ entityPath, documents, shared, targetDirectory, targetEntry, targetFiles });
}

if (errors.length) {
  console.error(errors.map(error => `ERROR: ${error}`).join('\n'));
  process.exit(1);
}
const backupRoot = write ? mkdtempSync(resolve(root, '.easy-content-migration-')) : undefined;
try {
  for (const migration of migrations) {
    console.log(`${write ? 'Migrate' : 'Would migrate'} ${migration.entityPath}: ${Object.keys(migration.documents).join(' + ')}`);
    if (!write) continue;
    const moved = [];
    try {
      for (const locale of BLOG_LOCALES) {
        const sourceFile = migration.documents[locale].file;
        const backup = join(backupRoot, relative(blogRoot, sourceFile));
        mkdirSync(dirname(backup), { recursive: true });
        renameSync(sourceFile, backup);
        moved.push({ sourceFile, backup });
      }
      const files = [
        { file: migration.targetEntry, source: `${JSON.stringify(migration.shared, null, 2)}\n` },
        ...BLOG_LOCALES.map(locale => ({ file: migration.targetFiles[locale], source: updateFrontmatter(migration.documents[locale].source, { ...migration.shared, imageAlt: migration.shared.imageAlt?.[locale], kind: migration.shared.kind === 'overview' ? 'article' : migration.shared.kind, locale, draft: migration.shared.status !== 'published' }) })),
      ];
      writeTransaction(files);
    } catch (error) {
      for (const item of moved.reverse()) {
        mkdirSync(dirname(item.sourceFile), { recursive: true });
        renameSync(item.backup, item.sourceFile);
      }
      throw error;
    }
  }
} finally {
  if (backupRoot) rmSync(backupRoot, { recursive: true, force: true });
}
console.log(write ? 'Bilingual blog migration complete.' : 'Dry run complete. Re-run with --write after reviewing the mapping.');
