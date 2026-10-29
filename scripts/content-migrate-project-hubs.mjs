import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseDocument, updateFrontmatter } from '../src/dev/easy-content/server/frontmatter.mjs';

const root = resolve(process.cwd());
const blog = join(root, 'content', 'blog', 'projects');
const registryFile = join(root, 'content', 'projects', 'entries.json');
const write = process.argv.includes('--write');
const today = new Date().toISOString().slice(0, 10);
const registry = existsSync(registryFile) ? JSON.parse(readFileSync(registryFile, 'utf8')) : [];
const records = new Map(registry.map(item => [item.id, item]));
const plans = [];
const errors = [];

if (existsSync(blog)) for (const directory of readdirSync(blog, { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  const id = directory.name;
  const rootDir = join(blog, id);
  const legacyDir = join(rootDir, 'overview');
  if (!existsSync(legacyDir)) continue;
  const sources = Object.fromEntries(['en', 'fa'].map(locale => [locale, join(legacyDir, `${locale}.mdx`)]));
  if (existsSync(join(rootDir, 'entry.json')) || ['en', 'fa'].some(locale => existsSync(join(rootDir, `${locale}.mdx`)))) {
    errors.push(`${id}: project root already contains canonical files`);
    continue;
  }
  if (['en', 'fa'].some(locale => !existsSync(sources[locale]))) {
    errors.push(`${id}: overview needs both en.mdx and fa.mdx`);
    continue;
  }
  const record = records.get(id);
  if (!record) {
    errors.push(`${id}: no matching legacy project record in content/projects/entries.json`);
    continue;
  }
  const documents = Object.fromEntries(['en', 'fa'].map(locale => [locale, parseDocument(readFileSync(sources[locale], 'utf8'))]));
  const shared = {
    ...record,
    id,
    kind: 'overview',
    translationId: record.translationId || documents.en.frontmatter.translationId || id,
    slug: 'overview',
    category: 'projects',
    subcategory: id,
    status: record.visible ? 'published' : 'draft',
    pubDate: documents.en.frontmatter.pubDate || documents.fa.frontmatter.pubDate || today,
    tags: documents.en.frontmatter.tags || documents.fa.frontmatter.tags || [],
    toc: documents.en.frontmatter.toc !== false,
  };
  delete shared.locales;
  delete shared.visible;
  plans.push({ id, rootDir, legacyDir, sources, shared });
}

if (errors.length) {
  console.error(errors.map(error => `ERROR: ${error}`).join('\n'));
  process.exit(1);
}
if (!plans.length) {
  console.log('No legacy project overview folders need migration.');
  process.exit(0);
}

for (const plan of plans) {
  console.log(`${write ? 'Migrate' : 'Would migrate'} project hub: ${plan.id}`);
  if (!write) continue;
  writeFileSync(join(plan.rootDir, 'entry.json'), `${JSON.stringify(plan.shared, null, 2)}\n`);
  for (const locale of ['en', 'fa']) {
    const source = readFileSync(plan.sources[locale], 'utf8');
    const next = updateFrontmatter(source, { ...plan.shared, locale, draft: plan.shared.status !== 'published' });
    writeFileSync(join(plan.rootDir, `${locale}.mdx`), next);
  }
  const trash = join(root, '.easy-content-trash', `project-hub-${Date.now()}`, plan.id, 'overview');
  mkdirSync(resolve(trash, '..'), { recursive: true });
  renameSync(plan.legacyDir, trash);
}

console.log(write ? 'Project hub migration complete. Validate content before removing the legacy registry.' : 'Dry run complete. Re-run with --write after reviewing the mapping.');
