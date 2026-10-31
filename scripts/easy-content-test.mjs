import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeDocumentSource, parseDocument, updateFrontmatter } from '../src/dev/easy-content/server/frontmatter.mjs';
import { isInside, safePath, safeSlug } from '../src/dev/easy-content/server/security.mjs';
import { contextForPath, editorContextForPath, readEntity, saveEntity } from '../src/dev/easy-content/server/adapters-bilingual.mjs';
import { contentActions, editorCapabilities } from '../src/dev/easy-content/context.mjs';
import { readResource, resourceCatalog } from '../src/dev/easy-content/server/resources.mjs';
import { migrateBilingual, planBilingualMigration } from '../src/dev/easy-content/server/migration.mjs';
import { unifiedEntityPathFromLegacy } from '../src/utils/blog-layout.mjs';
import { normalizeImageReference, normalizeIconId } from '../src/utils/blog-media.mjs';
import { ICON_IDS, iconDefinition } from '../src/utils/icon-registry.mjs';
import { iconCatalog } from '../src/dev/easy-content/server/icon-catalog.mjs';

assert.equal(normalizeImageReference(' /media/projects/demo/cover.webp '), 'media/projects/demo/cover.webp');
assert.equal(normalizeImageReference('https://images.example.test/cover.webp'), 'https://images.example.test/cover.webp');
assert.throws(() => normalizeImageReference('http://images.example.test/cover.webp'), /HTTPS URL/);
assert.throws(() => normalizeImageReference('javascript:alert(1)'), /HTTPS URL/);
assert.equal(normalizeIconId('docker'), 'docker');
assert.equal(normalizeIconId('shopping-bag'), 'shopping-bag');
assert.throws(() => normalizeIconId('not-registered'), /Unknown icon/);
assert.equal(ICON_IDS.length, 35);
assert.equal(iconDefinition('shopping-bag').lucide, 'shopping-bag');
assert.equal(iconCatalog().filter(icon => icon.node.length).length, ICON_IDS.length);
assert.match(readFileSync(new URL('../src/components/blog/ArticleCard.astro', import.meta.url), 'utf8'), /data-card-image/);
assert.match(readFileSync(new URL('../src/components/platform/ProjectVisual.astro', import.meta.url), 'utf8'), /project-cover__fallback/);
assert.match(readFileSync(new URL('../src/utils/skill-icons.ts', import.meta.url), 'utf8'), /shopping-bag/);

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

const tick = String.fromCharCode(96);
const fence = tick.repeat(3);
const richBody = `\n# Engineering challenge\n\n| Field | Value |\n| --- | --- |\n| Mode | bilingual |\n\n---\n\n${fence}bash\necho ready\n${fence}\n\n<MermaidDiagram chart={${tick}flowchart LR\n  A --> B\n${tick}} />\n\nمتن فارسی\n`;
const richSource = `---\nkind: article\ntitle: "Rich article"\ndescription: "Complete MDX"\nslug: rich-article\nlocale: en\ncategory: projects\ntranslationId: rich-article\npubDate: "2026-10-29"\ndraft: false\n---\n${richBody}`;
for (const candidate of [richSource, `\n\n${richSource}`, `\ufeff${richSource}`, richSource.replaceAll('\n', '\r\n'), `\ufeff\r\n\r\n${richSource.replaceAll('\n', '\r\n')}`]) {
  const document = parseDocument(candidate);
  assert.equal(document.hasFrontmatter, true);
  assert.match(document.body, /MermaidDiagram/);
  assert.match(document.body, /```bash/);
  assert.match(document.body, /\| Field \| Value \|/);
  assert.match(document.body, /متن فارسی/);
  assert.equal(normalizeDocumentSource(candidate).startsWith('---'), true);
}
const malformed = '\n---\ntitle: "Missing close"\n\nBody';
assert.equal(parseDocument(malformed).hasFrontmatter, false);
assert.equal(normalizeDocumentSource(malformed), malformed);

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
assert.ok(landing.locales.en.document.frontmatter.title);
assert.ok(landing.locales.fa.document.frontmatter.title);
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
const fixtureSource = ({ kind = 'article', title, description, slug, locale, category = 'blog', subcategory, translationId, draft = false, body, image, imageAlt, icon }) => `---
kind: ${kind}
title: "${title}"
description: "${description}"
slug: ${slug}
locale: ${locale}
category: ${category}
${subcategory ? `subcategory: ${subcategory}\n` : ''}tags: ["engineering"]
${image !== undefined ? `image: ${JSON.stringify(image)}\n` : ''}${imageAlt !== undefined ? `imageAlt: ${JSON.stringify(imageAlt)}\n` : ''}${icon !== undefined ? `icon: ${JSON.stringify(icon)}\n` : ''}
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
  writeFixture('content/blog/projects/demo/entry.json', JSON.stringify({ id: 'demo', kind: 'overview', translationId: 'project-demo', slug: 'overview', category: 'projects', projectCategory: 'devops-delivery', status: 'draft', visible: false, image: 'https://images.example.test/demo.webp', imageAlt: { en: 'Demo image', fa: 'تصویر نمونه' }, role: { en: 'Project', fa: 'پروژه' }, technologies: ['Docker'], relatedProjectIds: ['other-project'], caseStudy: { en: { intro: 'Intro' }, fa: { intro: 'مقدمه' } }, diagram: { en: { title: 'Flow' }, fa: { title: 'جریان' } }, articleIds: [] }) + '\n');
  writeFixture('content/blog/projects/demo/en.mdx', fixtureSource({ title: 'Demo project', description: 'Demo summary', slug: 'overview', locale: 'en', category: 'projects', subcategory: 'demo', translationId: 'project-demo', draft: true, body: 'Project body' }));
  writeFixture('content/blog/projects/demo/fa.mdx', fixtureSource({ title: 'پروژهٔ نمونه', description: 'خلاصهٔ نمونه', slug: 'overview', locale: 'fa', category: 'projects', subcategory: 'demo', translationId: 'project-demo', draft: true, body: 'متن پروژه' }));
  writeFixture('content/blog/projects/demo/articles/release/entry.json', JSON.stringify({ id: 'demo/release', kind: 'article', translationId: 'demo-release', slug: 'release', category: 'projects', subcategory: 'demo', status: 'draft' }) + '\n');
  writeFixture('content/blog/projects/demo/articles/release/en.mdx', fixtureSource({ title: 'Release', description: 'Release summary', slug: 'release', locale: 'en', category: 'projects', subcategory: 'demo', translationId: 'demo-release', draft: true, body: 'Release body' }));
  writeFixture('content/blog/projects/demo/articles/release/fa.mdx', fixtureSource({ title: 'انتشار', description: 'خلاصهٔ انتشار', slug: 'release', locale: 'fa', category: 'projects', subcategory: 'demo', translationId: 'demo-release', draft: true, body: 'متن انتشار' }));

  const adapterUrl = new URL('../src/dev/easy-content/server/adapters-bilingual.mjs', import.meta.url).href;
const child = `import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readEntity, saveEntity } from ${JSON.stringify(adapterUrl)};
import { updateFrontmatter } from ${JSON.stringify(new URL('../src/dev/easy-content/server/frontmatter.mjs', import.meta.url).href)};
const landing = readEntity({ type: 'blog', id: 'landing' });
const normalizedLanding = saveEntity({ context: { type: 'blog', id: 'landing' }, shared: landing.shared, locales: { en: { source: String.fromCharCode(10) + landing.locales.en.source }, fa: { source: String.fromCharCode(0xfeff) + landing.locales.fa.source.replaceAll(String.fromCharCode(10), String.fromCharCode(13, 10)) } }, expectedRevision: landing.revision });
assert.equal(normalizedLanding.locales.en.source.startsWith('---'), true);
assert.equal(normalizedLanding.locales.fa.source.startsWith('---'), true);
const savedLanding = saveEntity({ context: { type: 'blog', id: 'landing' }, shared: normalizedLanding.shared, locales: { en: { body: 'Updated English body' }, fa: { body: 'متن فارسی به‌روزشده' } }, expectedRevision: normalizedLanding.revision });
assert.equal(savedLanding.locales.en.document.frontmatter.custom, 'preserve-me');
assert.match(savedLanding.locales.en.source, /Updated English body/);
assert.match(savedLanding.locales.fa.source, /متن فارسی به‌روزشده/);
assert.throws(() => saveEntity({ context: { type: 'blog', id: 'landing' }, shared: savedLanding.shared, locales: { en: { source: '' } }, expectedRevision: savedLanding.revision }), /source cannot be empty/);
assert.throws(() => saveEntity({ context: { type: 'blog', id: 'landing' }, shared: savedLanding.shared, locales: { en: 'body only' }, expectedRevision: savedLanding.revision }), /payload must contain source or body/);
const project = readEntity({ type: 'project', id: 'demo', project: 'demo' });
const projectFile = join(process.cwd(), 'content/blog/projects/demo/entry.json');
let stableProjectJson = '';
for (let index = 0; index < 10; index += 1) {
  const currentProject = readEntity({ type: 'project', id: 'demo', project: 'demo' });
  const savedProject = saveEntity({ context: { type: 'project', id: 'demo', project: 'demo' }, shared: { ...currentProject.shared, project: { category: 'devops-delivery', icon: undefined, favorite: false, favoriteAt: null } }, locales: { en: { source: currentProject.locales.en.source }, fa: { source: currentProject.locales.fa.source } }, expectedRevision: currentProject.revision });
  const disk = JSON.parse(readFileSync(projectFile, 'utf8'));
  assert.equal(Object.prototype.hasOwnProperty.call(disk, 'project'), false);
  assert.deepEqual(disk.caseStudy, project.metadata.caseStudy);
  assert.deepEqual(disk.diagram, project.metadata.diagram);
  assert.deepEqual(disk.technologies, project.metadata.technologies);
  assert.deepEqual(disk.relatedProjectIds, project.metadata.relatedProjectIds);
  const serialized = JSON.stringify(disk);
  if (!stableProjectJson) stableProjectJson = serialized;
  assert.equal(serialized, stableProjectJson);
  assert.equal(Object.prototype.hasOwnProperty.call(savedProject.shared, 'project'), false);
}
const mediaProject = readEntity({ type: 'project', id: 'demo', project: 'demo' });
assert.equal(mediaProject.shared.image, 'https://images.example.test/demo.webp');
assert.equal(mediaProject.locales.en.document.frontmatter.image, mediaProject.shared.image);
assert.equal(mediaProject.locales.fa.document.frontmatter.image, mediaProject.shared.image);
const mediaSources = {
  en: { source: updateFrontmatter(mediaProject.locales.en.source, { icon: 'docker', imageAlt: 'Updated English demo image' }) },
  fa: { source: updateFrontmatter(mediaProject.locales.fa.source, { icon: 'docker', imageAlt: 'تصویر به‌روزشدهٔ نمونه' }) },
};
const mediaSaved = saveEntity({ context: { type: 'project', id: 'demo', project: 'demo' }, shared: mediaProject.shared, locales: mediaSources, expectedRevision: mediaProject.revision });
assert.equal(mediaSaved.shared.icon, 'docker');
assert.equal(mediaSaved.shared.imageAlt.en, 'Updated English demo image');
assert.equal(mediaSaved.shared.imageAlt.fa, 'تصویر به‌روزشدهٔ نمونه');
assert.match(mediaSaved.locales.en.source, /image: "https:\\/\\/images\\.example\\.test\\/demo\\.webp"/);
assert.match(mediaSaved.locales.fa.source, /icon: "docker"/);
const sourceEdited = saveEntity({ context: { type: 'project', id: 'demo', project: 'demo' }, shared: mediaSaved.shared, locales: { en: { source: updateFrontmatter(mediaSaved.locales.en.source, { icon: 'server' }) }, fa: { source: updateFrontmatter(mediaSaved.locales.fa.source, { icon: 'server' }) } }, expectedRevision: mediaSaved.revision });
assert.equal(sourceEdited.shared.icon, 'server');
assert.throws(() => saveEntity({ context: { type: 'project', id: 'demo', project: 'demo' }, shared: sourceEdited.shared, locales: { en: { source: updateFrontmatter(sourceEdited.locales.en.source, { image: 'http://insecure.example/demo.webp' }) }, fa: { source: updateFrontmatter(sourceEdited.locales.fa.source, { image: 'http://insecure.example/demo.webp' }) } }, expectedRevision: sourceEdited.revision }), /HTTPS URL/);
assert.throws(() => saveEntity({ context: { type: 'project', id: 'demo', project: 'demo' }, shared: sourceEdited.shared, locales: { en: { source: updateFrontmatter(sourceEdited.locales.en.source, { icon: 'not-registered' }) }, fa: { source: updateFrontmatter(sourceEdited.locales.fa.source, { icon: 'not-registered' }) } }, expectedRevision: sourceEdited.revision }), /Unknown icon/);
assert.throws(() => saveEntity({ context: { type: 'project', id: 'demo', project: 'demo' }, shared: sourceEdited.shared, locales: { en: { source: updateFrontmatter(sourceEdited.locales.en.source, { image: 'https://images.example.test/one.webp' }) }, fa: { source: updateFrontmatter(sourceEdited.locales.fa.source, { image: 'https://images.example.test/two.webp' }) } }, expectedRevision: sourceEdited.revision }), /image differs/);
assert.throws(() => saveEntity({ context: { type: 'project', id: 'demo', project: 'demo' }, shared: { ...project.shared, project: { project: { project: {} } } }, locales: { en: { source: project.locales.en.source }, fa: { source: project.locales.fa.source } }, expectedRevision: readEntity({ type: 'project', id: 'demo', project: 'demo' }).revision }), /excessively nested/);
const projectForPublish = readEntity({ type: 'project', id: 'demo', project: 'demo' });
const publishedProject = saveEntity({ context: { type: 'project', id: 'demo', project: 'demo' }, shared: projectForPublish.shared, locales: { en: { body: 'Published project body' }, fa: { body: 'متن پروژهٔ منتشرشده' } }, expectedRevision: projectForPublish.revision, publish: true });
assert.equal(publishedProject.shared.status, 'published');
assert.equal(publishedProject.metadata.visible, true);
const article = readEntity({ type: 'article', id: 'demo/release', project: 'demo', slug: 'release' });
const savedRichArticle = saveEntity({ context: { type: 'article', id: 'demo/release', project: 'demo', slug: 'release' }, shared: article.shared, locales: { en: { source: ${JSON.stringify(fixtureSource({ title: 'Release', description: 'Release summary', slug: 'release', locale: 'en', category: 'projects', subcategory: 'demo', translationId: 'demo-release', draft: true, body: richBody }))} }, fa: { source: ${JSON.stringify(fixtureSource({ title: 'انتشار', description: 'خلاصهٔ انتشار', slug: 'release', locale: 'fa', category: 'projects', subcategory: 'demo', translationId: 'demo-release', draft: true, body: richBody }))} } }, expectedRevision: article.revision });
assert.match(savedRichArticle.locales.en.source, /MermaidDiagram/);
assert.match(savedRichArticle.locales.fa.source, /متن فارسی/);
const savedArticle = saveEntity({ context: { type: 'article', id: 'demo/release', project: 'demo', slug: 'release' }, shared: savedRichArticle.shared, locales: { en: { body: 'Article body' }, fa: { body: 'متن مقاله' } }, expectedRevision: savedRichArticle.revision });
assert.match(savedArticle.locales.fa.source, /متن مقاله/);
const articleMedia = readEntity({ type: 'article', id: 'demo/release', project: 'demo', slug: 'release' });
const articleMediaSaved = saveEntity({ context: { type: 'article', id: 'demo/release', project: 'demo', slug: 'release' }, shared: articleMedia.shared, locales: { en: { source: updateFrontmatter(articleMedia.locales.en.source, { image: 'https://images.example.test/article.webp', imageAlt: 'Article image', icon: 'docker' }) }, fa: { source: updateFrontmatter(articleMedia.locales.fa.source, { image: 'https://images.example.test/article.webp', imageAlt: 'تصویر مقاله', icon: 'docker' }) } }, expectedRevision: articleMedia.revision });
assert.equal(articleMediaSaved.shared.image, 'https://images.example.test/article.webp');
assert.equal(articleMediaSaved.shared.imageAlt.fa, 'تصویر مقاله');
assert.equal(articleMediaSaved.shared.icon, 'docker');
assert.throws(() => saveEntity({ context: { type: 'article', id: 'demo/release', project: 'demo', slug: 'release' }, shared: articleMediaSaved.shared, locales: { en: { source: 'body only' }, fa: { source: articleMediaSaved.locales.fa.source } }, expectedRevision: articleMediaSaved.revision }), /needs (?:valid )?frontmatter/);
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
