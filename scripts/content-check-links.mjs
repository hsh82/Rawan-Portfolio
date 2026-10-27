import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const root = resolve(process.cwd(), 'content');
const walk = (dir) => existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(resolve(dir, item.name)) : [resolve(dir, item.name)]) : [];
const blogRoot = resolve(root, 'blog');
const files = walk(blogRoot).filter(file => /\.mdx?$/.test(file));
const articleIds = new Set(files.map(file => relative(blogRoot, file).replace(/\.mdx?$/, '').replaceAll('\\', '/')));
const categoryIds = new Set();
for (const id of articleIds) {
  const folders = id.split('/').slice(1, -1);
  for (let i = 1; i <= folders.length; i++) categoryIds.add(`${id.split('/')[0]}/${folders.slice(0, i).join('/')}`);
}
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\]\((\/(?:en|fa)\/[^)#]+)\)/g)) {
    const url = match[1];
    const locale = url.startsWith('/fa/') ? 'fa' : 'en';
    if (!url.startsWith('/en/blog/') && !url.startsWith('/fa/blog/')) throw new Error(`Unsupported internal link in ${file}: ${url}`);
    const route = url.slice(`/${locale}/blog/`.length).replace(/\/$/, '');
    if (!route) continue;
    if (route.startsWith('category/')) {
      if (!categoryIds.has(`${locale}/${route.slice('category/'.length)}`)) throw new Error(`Missing category route in ${file}: ${url}`);
    } else if (!articleIds.has(`${locale}/${route}`)) {
      throw new Error(`Missing article route in ${file}: ${url}`);
    }
  }
}
console.log(`Checked ${files.length} article files for supported internal links.`);
