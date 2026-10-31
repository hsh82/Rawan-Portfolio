import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseDocument, updateFrontmatter } from './frontmatter.mjs';
import { writeTransaction } from './security.mjs';
import { BLOG_LOCALES, unifiedEntityPathFromLegacy } from '../../../utils/blog-layout.mjs';

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    const file = join(directory, item.name);
    return item.isDirectory() ? walk(file) : [file];
  });
}

function legacyFiles(blogRoot) {
  return walk(blogRoot).filter(file => /\.(md|mdx)$/i.test(file)).filter(file => {
    const relativePath = relative(blogRoot, file).replaceAll('\\', '/');
    return BLOG_LOCALES.includes(relativePath.split('/')[0]);
  });
}

function projectHub(entityPath) {
  const parts = entityPath.split('/').filter(Boolean);
  return parts[0] === 'projects' && parts.length === 2;
}

function sharedFromDocuments(entityPath, documents) {
  const source = documents.en.document.frontmatter.title ? documents.en.document.frontmatter : documents.fa.document.frontmatter;
  const isLanding = entityPath === 'landing';
  const isHub = projectHub(entityPath);
  const parts = entityPath.split('/').filter(Boolean);
  return {
    id: isLanding ? 'landing' : isHub ? parts[1] : parts.join('/'),
    kind: source.kind || (isLanding ? 'landing' : isHub ? 'overview' : 'article'),
    translationId: source.translationId || (isLanding ? 'blog-landing' : parts.join('-')),
    slug: source.slug || (isLanding ? 'blog' : isHub ? 'overview' : parts.at(-1)),
    category: source.category || (isLanding ? 'blog' : 'projects'),
    subcategory: source.subcategory || (isLanding || !parts[1] ? undefined : parts[1]),
    status: BLOG_LOCALES.every(locale => documents[locale].document.frontmatter.draft !== true) ? 'published' : 'draft',
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

function compatibilitySource(document, shared, locale) {
  return updateFrontmatter(document.source, {
    ...shared,
    kind: shared.kind === 'overview' ? 'article' : shared.kind,
    locale,
    draft: shared.status !== 'published',
  });
}

export function planBilingualMigration(blogRoot, { force = false } = {}) {
  const groups = new Map();
  for (const file of legacyFiles(blogRoot)) {
    const relativePath = relative(blogRoot, file).replaceAll('\\', '/');
    const locale = relativePath.split('/')[0];
    const entityPath = unifiedEntityPathFromLegacy(relativePath);
    const group = groups.get(entityPath) || {};
    const source = readFileSync(file, 'utf8');
    group[locale] = { file, source, document: parseDocument(source) };
    groups.set(entityPath, group);
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
    const output = {
      entry: `${JSON.stringify(shared, null, 2)}\n`,
      files: Object.fromEntries(BLOG_LOCALES.map(locale => [locale, compatibilitySource(documents[locale], shared, locale)])),
    };
    const targets = [targetEntry, ...Object.values(targetFiles)];
    if (!force && targets.some(existsSync)) errors.push(`${entityPath}: target already exists (inspect it before using --force)`);
    migrations.push({ entityPath, documents, shared, targetDirectory, targetEntry, targetFiles, output });
  }
  return { errors, migrations };
}

function tempBackupRoot(blogRoot) {
  return mkdtempSync(join(dirname(dirname(blogRoot)), '.easy-content-migration-'));
}

export function migrateBilingual(blogRoot, { force = false, write = false } = {}) {
  const plan = planBilingualMigration(blogRoot, { force });
  if (plan.errors.length) throw new Error(plan.errors.join('\n'));
  if (!write) return plan;
  const backupRoot = tempBackupRoot(blogRoot);
  try {
    for (const migration of plan.migrations) {
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
          { file: migration.targetEntry, source: migration.output.entry },
          ...BLOG_LOCALES.map(locale => ({ file: migration.targetFiles[locale], source: migration.output.files[locale] })),
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
    return plan;
  } finally {
    rmSync(backupRoot, { recursive: true, force: true });
  }
}
