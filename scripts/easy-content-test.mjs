import assert from 'node:assert/strict';
import { parseDocument, updateFrontmatter } from '../src/dev/easy-content/server/frontmatter.mjs';
import { isInside, safePath, safeSlug } from '../src/dev/easy-content/server/security.mjs';
import { contextForPath, editorContextForPath, saveEntity } from '../src/dev/easy-content/server/adapters.mjs';
import { contentActions, editorCapabilities } from '../src/dev/easy-content/context.mjs';

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
assert.equal(editorContextForPath('/dev/content/new/article/devops', '?locale=fa').project, 'devops');
assert.equal(editorContextForPath('/dev/content/new/article/devops', '?locale=fa').mode, 'new');
assert.equal(editorContextForPath('/dev/content/edit/home', '?locale=en').type, 'unsupported');
assert.equal(editorCapabilities('home'), null);
assert.throws(() => saveEntity({ context: { type: 'home' } }), /unsupported content type/);

console.log('Easy Content security and frontmatter behavior passed.');
