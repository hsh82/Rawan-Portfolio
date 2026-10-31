import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildBlogPrompt, buildHomepagePrompt, BLOG_BLOCK_EXAMPLES, copyPrompt, guideForContext, HOMEPAGE_SECTION_MAP } from '../src/dev/easy-content/editor/ai-writing-guide.js';

const bilingualHtml = readFileSync(new URL('../src/dev/easy-content/editor/editor-bilingual.html', import.meta.url), 'utf8');
const studioHtml = readFileSync(new URL('../src/dev/easy-content/editor/studio.html', import.meta.url), 'utf8');
const middleware = readFileSync(new URL('../src/dev/easy-content/server/middleware.mjs', import.meta.url), 'utf8');

assert.deepEqual(HOMEPAGE_SECTION_MAP.map(section => section.id), ['start', 'about', 'skills', 'focus', 'experience', 'projects', 'journey', 'contact', 'blog']);
const homepagePrompt = buildHomepagePrompt({ resource: 'home' });
for (const path of ['content/home.json.locales.{en,fa}.greeting', 'content/home.json.about.{en,fa}.cards[0..2].title', 'content/skills/entries.json[].technologies[]', 'content/blog/projects/<project-id>/entry.json.status', 'content/site.json.locales.{en,fa}.footerCta.button']) assert.match(homepagePrompt, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.match(homepagePrompt, /ONE HOMEPAGE SECTION AT A TIME/);
assert.match(homepagePrompt, /1\. start[\s\S]*2\. about[\s\S]*3\. skills/i);

const contexts = [
  [{ type: 'blog', id: 'landing' }, 'Blog landing', 'content/blog/landing/en.mdx'],
  [{ type: 'project', project: 'rahban-access-gateway', slug: 'overview' }, 'Project overview', 'content/blog/projects/rahban-access-gateway/en.mdx'],
  [{ type: 'article', project: 'rahban-access-gateway', slug: 'architecture' }, 'Technical article', 'content/blog/projects/rahban-access-gateway/articles/architecture/en.mdx'],
];
for (const [context, label, location] of contexts) {
  const prompt = buildBlogPrompt({ context });
  assert.match(prompt, new RegExp(label));
  assert.match(prompt, new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(prompt, /begin immediately at byte zero/);
}
for (const block of ['Callout', 'Code', 'Image \/ Figure', 'Table', 'Mermaid', 'Markmap', 'Math']) assert.match(BLOG_BLOCK_EXAMPLES, new RegExp(block));
assert.match(BLOG_BLOCK_EXAMPLES, /<Callout type="tip" title="Note">/);
assert.match(BLOG_BLOCK_EXAMPLES, /<Figure src="\/media\/projects\/project\/image\.webp"/);
assert.match(BLOG_BLOCK_EXAMPLES, /<MermaidDiagram label="Diagram" chart=\{`flowchart LR/);
assert.match(BLOG_BLOCK_EXAMPLES, /<MindMap label="Map" content=\{`# Topic/);
assert.match(BLOG_BLOCK_EXAMPLES, /\$\$\nE = mc\^2/);

assert.equal(guideForContext({ surface: 'home', resource: 'home' }).label, 'Homepage · home');
assert.equal(guideForContext({ surface: 'blog', context: { type: 'project' } }).label, 'Project overview / project hub');

let copied = '';
assert.equal(await copyPrompt('complete prompt', { navigatorRef: { clipboard: { writeText: async value => { copied = value; } } }, documentRef: {} }), true);
assert.equal(copied, 'complete prompt');

let fallbackValue = '';
const fallbackTextarea = { style: {}, value: '', setAttribute() {}, select() {}, remove() {} };
const fallbackDocument = { body: { append(node) { fallbackValue = node.value; } }, createElement: () => fallbackTextarea, execCommand: command => command === 'copy' };
assert.equal(await copyPrompt('fallback prompt', { navigatorRef: { clipboard: { writeText: async () => { throw new Error('blocked'); } } }, documentRef: fallbackDocument }), true);
assert.equal(fallbackValue, 'fallback prompt');
assert.equal(await copyPrompt('cannot copy', { navigatorRef: {}, documentRef: { body: {}, createElement: () => ({ style: {}, select() {}, remove() {} }), execCommand: () => false } }), false);

const guidanceIndex = bilingualHtml.indexOf('Editing guidance');
assert.ok(guidanceIndex >= 0 && bilingualHtml.indexOf('id="ai-writing-guide"', guidanceIndex) > guidanceIndex);
assert.match(studioHtml, /id="ai-writing-guide"/);
assert.match(middleware, /ai-writing-guide\.js/);

console.log('Easy Content AI writing guide behavior passed.');
