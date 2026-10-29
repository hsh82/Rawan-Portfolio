import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [kind, projectFolder, slug] = process.argv.slice(2);
if (kind !== 'blog' || !projectFolder || !slug) {
  console.error('Usage: npm run content:new -- blog projects/<project-id> <slug>');
  process.exit(1);
}
const folderParts = projectFolder.split('/');
if (folderParts.some(part => !/^[a-z0-9-]+$/.test(part)) || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Folder segments and slug must use lowercase letters, numbers, and hyphens.');
if (folderParts.length !== 2 || folderParts[0] !== 'projects') throw new Error('Articles must use projects/<project-id> as their folder.');
const entityPath = resolve(process.cwd(), 'content/blog', 'projects', folderParts[1], 'articles', slug);
const entry = resolve(entityPath, 'entry.json');
if (existsSync(entry)) throw new Error(`Already exists: ${entry}`);
mkdirSync(entityPath, { recursive: true });
const category = folderParts[0];
const shared = { id: `${folderParts[1]}/${slug}`, kind: 'article', translationId: `${folderParts[1]}-${slug}`, slug, category, subcategory: folderParts[1], status: 'draft', pubDate: new Date().toISOString().slice(0, 10), tags: [], featured: false, toc: true };
writeFileSync(entry, `${JSON.stringify(shared, null, 2)}\n`);
for (const locale of ['en', 'fa']) {
  const file = resolve(entityPath, `${locale}.mdx`);
  writeFileSync(file, `---\nkind: article\ntitle: "${slug.replaceAll('-', ' ')}"\ndescription: "Add a verified summary."\nslug: ${slug}\nlocale: ${locale}\ncategory: ${category}\nsubcategory: ${folderParts[1]}\ntags: []\npubDate: ${shared.pubDate}\ndraft: true\nfeatured: false\ntranslationId: ${shared.translationId}\ntoc: true\n---\n\n## Draft\n\nAdd verified, reviewable content before publishing.\n`);
}
console.log(`Created bilingual draft entity: ${entityPath}`);
