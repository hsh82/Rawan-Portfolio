import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [kind, locale, folder, slug] = process.argv.slice(2);
if (kind !== 'blog' || !['en', 'fa'].includes(locale) || !folder || !slug) {
  console.error('Usage: npm run content:new -- blog <en|fa> projects/<project-id> <slug>');
  process.exit(1);
}
const folderParts = folder.split('/');
if (folderParts.some(part => !/^[a-z0-9-]+$/.test(part)) || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Folder segments and slug must use lowercase letters, numbers, and hyphens.');
if (folderParts.length !== 2 || folderParts[0] !== 'projects') throw new Error('Articles must use projects/<project-id> as their folder.');
const dir = resolve(process.cwd(), 'content/blog', locale, ...folderParts);
const file = resolve(dir, `${slug}.mdx`);
if (existsSync(file)) throw new Error(`Already exists: ${file}`);
mkdirSync(dir, { recursive: true });
const category = folderParts[0];
const subcategory = folderParts[1] ? `subcategory: ${folderParts[1]}\n` : '';
writeFileSync(file, `---\ntitle: "${slug.replaceAll('-', ' ')}"\ndescription: "Add a verified summary."\nslug: ${slug}\nlocale: ${locale}\ncategory: ${category}\n${subcategory}tags: []\npubDate: ${new Date().toISOString().slice(0, 10)}\ndraft: true\nfeatured: false\ntranslationId: ${slug}\ntoc: true\n---\n\n## Draft\n\nAdd verified, reviewable content before publishing.\n`);
console.log(`Created draft article: ${file}`);
