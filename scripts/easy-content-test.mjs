import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseDocument, updateFrontmatter } from '../src/dev/easy-content/server/frontmatter.mjs';
import { isInside, safePath, safeSlug } from '../src/dev/easy-content/server/security.mjs';
import { contextForPath, editorContextForPath, readEntity, saveEntity } from '../src/dev/easy-content/server/adapters-bilingual.mjs';
import { contentActions, editorCapabilities } from '../src/dev/easy-content/context.mjs';
import { readResource, resourceCatalog } from '../src/dev/easy-content/server/resources.mjs';
import { migrateBilingual, planBilingualMigration } from '../src/dev/easy-content/server/migration.mjs';
import { unifiedEntityPathFromLegacy } from '../src/utils/blog-layout.mjs';

assert.equal(safeSlug(' CI/CD Pipeline '), 'ci-cd-pipeline');
assert.throws(() => safePath(process.cwd(), '..'), /Unsafe path segment/);
assert.equal(isInside(process.cwd(), process.cwd()), true);
assert.equal(isInside(process.cwd(), `${process.cwd()}-outside`), false);

const source = `---\ntitle: "Original title"\ncustom: keep-me\ntags: ["Docker", "CI/CD"]\n---\n\n## Body\n`;
const parsed = parseDocument(source);
assert.equal(parsed.frontmatter.custom, 'keep-me');
assert.deepEqual(parsed.frontmatter.tags, ['Docker', 'CI/CD']);
const updated = updateFrontmatter(source, { title: 'Updated title', draft: true });
const reparsed = parseDocument(updated);
assert.equal(reparsed.frontmatter.title, 'Updated title');
assert.equal(reparsed.frontmatter.custom, 'keep-me');
assert.equal(reparsed.frontmatter.draft, true);
assert.match(reparsed.body, /## Body/);

assert.equal(contextForPath('/en/').type, 'unsupported');
assert.match(contextForPath('/en/').reason, /unsupported content type/);
assert.deepEqual(contentActions({ type: 'blog', locale: 'en' }).map(action => action.id), ['edit-blog', 'new-project']);
assert.deepEqual(contentActions({ type: 'project', locale: 'en', projectId: 'devops' }).map(action => action.id), ['edit-project', 'new-article']);
assert.deepEqual(contentActions({ type: 'article', locale: 'fa', projectId: 'devops', articleId: 'cicd' }).map(action => action.id), ['edit-article', 'new-article']);
assert.equal(editorContextForPath('/dev/content/new/article/devops').project, 'devops');
assert.equal(editorContextForPath('/dev/content/new/article/devops').mode, 'new');
assert.equal(editorContextForPath('/dev/content/edit/home').type, 'unsupported');
assert.equal(editorContextForPath('/dev/content/').type, 'studio');
assert.equal(editorContextForPath('/dev/content/edit/resource/profile/').type, 'resource');
assert.equal(editorCapabilities('home'), null);
assert.throws(() => saveEntity({ context: { type: 'home' } }), /unsupported content type/);

const landing = readEntity({ type: 'blog', id: 'landing' });
assert.equal(landing.shared.status, landing.locales.en.document.frontmatter.draft ? 'draft' : 'published');
assert.ok(landing.locales.en.source.includes('Project journal'));
assert.ok(landing.locales.fa.source.includes('دفترچهٔ پروژه‌ها'));
assert.equal(editorContextForPath('/dev/content/edit/blog/').locale, undefined);
assert.ok(resourceCatalog().some(resource => resource.id === 'profile'));
assert.equal(readResource({ resource: 'profile' }).resource, 'profile');

assert.equal(unifiedEntityPathFromLegacy('en/projects/demo/overview.mdx'), 'projects/demo');
assert.equal(unifiedEntityPathFromLegacy('fa/projects/demo/release-notes.mdx'), 'projects/demo/articles/release-notes');

const fixture = mkdtempSync(join(tmpdir(), 'rawan-easy-content-'));
const writeFixture = (file, source) => {
  const target = join(fixture, file);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, source);
};
const fixtureSource = ({ kind = 'article', title, description, slug, locale, category = 'blog', subcategory, translationId, draft = false, body }) => `---
kind: ${kind}
title: "${title}"
description: "${description}"
slug: ${slug}
locale: ${locale}
category: ${category}
${subcategory ? `subcategory: ${subcategory}\n` : ''}tags: ["engineering"]
pubDate: "2026-10-29"
draft: ${draft}
translationId: ${translationId}
toc: true
custom: "preserve-me"
---

${body}
`;

try {
  writeFixture('content/blog/landing/entry.json', JSON.stringify({ id: 'landing', kind: 'landing', translationId: 'blog-landing', slug: 'blog', category: 'blog', status: 'published', pubDate: '2026-10-29', tags: [], toc: false }) + '\n');
  writeFixture('content/blog/landing/en.mdx', fixtureSource({ kind: 'landing', title: 'Project journal', description: 'English summary', slug: 'blog', locale: 'en', translationId: 'blog-landing', body: 'English body' }));
  writeFixture('content/blog/landing/fa.mdx', fixtureSource({ kind: 'landing', title: 'دفترچهٔ پروژه‌ها', description: 'خلاصهٔ فارسی', slug: 'blog', locale: 'fa', translationId: 'blog-landing', body: 'متن فارسی' }));
  writeFixture('content/blog/projects/demo/entry.json', JSON.stringify({ id: 'demo', kind: 'overview', translationId: 'project-demo', slug: 'overview', category: 'projects', projectCategory: 'devops-delivery', status: 'draft', visible: false, role: { en: 'Project', fa: 'پروژه' }, technologies: [], articleIds: [] }) + '\n');
  writeFixture('content/blog/projects/demo/en.mdx', fixtureSource({ title: 'Demo project', description: 'Demo summary', slug: 'overview', locale: 'en', category: 'projects', subcategory: 'demo', translationId: 'project-demo', draft: true, body: 'Project body' }));
  writeFixture('content/blog/projects/demo/fa.mdx', fixtureSource({ title: 'پروژهٔ نمونه', description: 'خلاصهٔ نمونه', slug: 'overview', locale: 'fa', category: 'projects', subcategory: 'demo', translationId: 'project-demo', draft: true, body: 'متن پروژه' }));
  writeFixture('content/blog/projects/demo/articles/release/entry.json', JSON.stringify({ id: 'demo/release', kind: 'article', translationId: 'demo-release', slug: 'release', category: 'projects', subcategory: 'demo', status: 'draft' }) + '\n');
  writeFixture('content/blog/projects/demo/articles/release/en.mdx', fixtureSource({ title: 'Release', description: 'Release summary', slug: 'release', locale: 'en', category: 'projects', subcategory: 'demo', translationId: 'demo-release', draft: true, body: 'Release body' }));
  writeFixture('content/blog/projects/demo/articles/release/fa.mdx', fixtureSource({ title: 'انتشار', description: 'خلاصهٔ انتشار', slug: 'release', locale: 'fa', category: 'projects', subcategory: 'demo', translationId: 'demo-release', draft: true, body: 'متن انتشار' }));

  const adapterUrl = new URL('../src/dev/easy-content/server/adapters-bilingual.mjs', import.meta.url).href;
  const child = `import assert from 'node:assert/strict';
import { readEntity, saveEntity } from ${JSON.stringify(adapterUrl)};
const landing = readEntity({ type: 'blog', id: 'landing' });
const savedLanding = saveEntity({ context: { type: 'blog', id: 'landing' }, shared: landing.shared, locales: { en: { body: 'Updated English body' }, fa: { body: 'متن فارسی به‌روزشده' } }, expectedRevision: landing.revision });
assert.equal(savedLanding.locales.en.document.frontmatter.custom, 'preserve-me');
assert.match(savedLanding.locales.en.source, /Updated English body/);
assert.match(savedLanding.locales.fa.source, /متن فارسی به‌روزشده/);
assert.throws(() => saveEntity({ context: { type: 'blog', id: 'landing' }, shared: savedLanding.shared, locales: { en: { source: '' } }, expectedRevision: savedLanding.revision }), /source cannot be empty/);
assert.throws(() => saveEntity({ context: { type: 'blog', id: 'landing' }, shared: savedLanding.shared, locales: { en: 'body only' }, expectedRevision: savedLanding.revision }), /payload must contain source or body/);
const project = readEntity({ type: 'project', id: 'demo', project: 'demo' });
const publishedProject = saveEntity({ context: { type: 'project', id: 'demo', project: 'demo' }, shared: project.shared, locales: { en: { body: 'Published project body' }, fa: { body: 'متن پروژهٔ منتشرشده' } }, expectedRevision: project.revision, publish: true });
assert.equal(publishedProject.shared.status, 'published');
assert.equal(publishedProject.metadata.visible, true);
const article = readEntity({ type: 'article', id: 'demo/release', project: 'demo', slug: 'release' });
const savedArticle = saveEntity({ context: { type: 'article', id: 'demo/release', project: 'demo', slug: 'release' }, shared: article.shared, locales: { en: { body: 'Article body' }, fa: { body: 'متن مقاله' } }, expectedRevision: article.revision });
assert.match(savedArticle.locales.fa.source, /متن مقاله/);
assert.throws(() => saveEntity({ context: { type: 'article', id: 'demo/release', project: 'demo', slug: 'release' }, shared: savedArticle.shared, locales: { en: { source: 'body only' }, fa: { source: savedArticle.locales.fa.source } }, expectedRevision: savedArticle.revision }), /needs frontmatter/);
assert.throws(() => saveEntity({ context: { type: 'article', id: 'demo/release', project: 'demo', slug: 'release' }, shared: savedArticle.shared, locales: { en: { body: 'stale' }, fa: { body: 'stale' } }, expectedRevision: article.revision }), /changed outside/);
console.log('adapter-fixture-ok');`;
  assert.match(execFileSync(process.execPath, ['--input-type=module', '-e', child], { cwd: fixture, encoding: 'utf8' }), /adapter-fixture-ok/);

  const migrationRoot = join(fixture, 'migration-blog');
  writeFixture('migration-blog/en/_index.mdx', fixtureSource({ kind: 'landing', title: 'Landing', description: 'Landing summary', slug: 'blog', locale: 'en', translationId: 'blog-landing', body: 'Landing body' }));
  writeFixture('migration-blog/fa/_index.mdx', fixtureSource({ kind: 'landing', title: 'لندینگ', description: 'خلاصه', slug: 'blog', locale: 'fa', translationId: 'blog-landing', body: 'متن' }));
  writeFixture('migration-blog/en/projects/migrated/overview.mdx', fixtureSource({ title: 'Migrated', description: 'Migrated summary', slug: 'overview', locale: 'en', category: 'projects', subcategory: 'migrated', translationId: 'project-migrated', body: 'Overview' }));
  writeFixture('migration-blog/fa/projects/migrated/overview.mdx', fixtureSource({ title: 'مهاجرت', description: 'خلاصه', slug: 'overview', locale: 'fa', category: 'projects', subcategory: 'migrated', translationId: 'project-migrated', body: 'نمای کلی' }));
  const plan = planBilingualMigration(migrationRoot);
  assert.equal(plan.errors.length, 0);
  assert.deepEqual(plan.migrations.map(item => item.entityPath).sort(), ['landing', 'projects/migrated']);
  migrateBilingual(migrationRoot, { write: true });
  assert.equal(readFileSync(join(migrationRoot, 'landing/en.mdx'), 'utf8').includes('kind: "landing"'), true);
  assert.equal(readFileSync(join(migrationRoot, 'projects/migrated/en.mdx'), 'utf8').includes('kind: "article"'), true);
  assert.equal(planBilingualMigration(migrationRoot).migrations.length, 0);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log('Easy Content security and frontmatter behavior passed.');
