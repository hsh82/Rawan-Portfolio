import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('../', import.meta.url).pathname;
const dist = join(root, 'dist');
const content = join(root, 'content/blog');
const projectsFile = join(root, 'content/projects/entries.json');
const projects = existsSync(projectsFile) ? JSON.parse(readFileSync(projectsFile, 'utf8')) : [];
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
const files = existsSync(content) ? walk(content).filter(file => /\.mdx?$/.test(file)) : [];
const sitemap = readFileSync(join(dist, 'sitemap-0.xml'), 'utf8');
for (const locale of ['en', 'fa']) {
  for (const path of [`${locale}/index.html`, `${locale}/blog/index.html`, `${locale}/rss.xml`]) {
    if (!existsSync(join(dist, path))) throw new Error(`Missing static route: ${path}`);
  }
  const page = readFileSync(join(dist, locale, 'blog/index.html'), 'utf8');
  if (!page.includes(`lang=\"${locale}\"`) || !page.includes(`dir=\"${locale === 'fa' ? 'rtl' : 'ltr'}\"`)) throw new Error(`Incorrect locale document: ${locale}`);
  for (const blogPage of walk(join(dist, locale, 'blog')).filter(file => file.endsWith('.html'))) {
    const html = readFileSync(blogPage, 'utf8');
    if (html.includes('id=\"progress-control\"') || html.includes('id=\"progress-menu\"')) throw new Error(`Progress navigator leaked onto blog route: ${relative(dist, blogPage)}`);
  }
  const home = readFileSync(join(dist, locale, 'index.html'), 'utf8');
  for (const section of ['start', 'about', 'focus', 'experience', 'journey', 'skills', 'contact', 'projects', 'blog']) {
    if (!home.includes(`id=\"${section}\"`)) throw new Error(`Homepage section missing: ${locale}#${section}`);
  }
  if (!home.includes('id=\"progress-control\"')) throw new Error(`Homepage progress navigator missing: ${locale}`);
  for (const route of ['journey', 'projects']) {
    const page = join(dist, locale, route, 'index.html');
    if (!existsSync(page)) throw new Error(`Missing localized route: ${locale}/${route}`);
    const html = readFileSync(page, 'utf8');
    if (!html.includes(`lang="${locale}"`)) throw new Error(`Incorrect localized route: ${locale}/${route}`);
    if (!sitemap.includes(`/${locale}/${route}/`)) throw new Error(`Localized route missing from sitemap: ${locale}/${route}`);
  }
  const projectIds = projects.filter(project => project.visible && project.caseStudy).map(project => project.id);
  for (const id of projectIds) {
    const route = `/${locale}/projects/${id}/`;
    const output = join(dist, locale, 'projects', id, 'index.html');
    if (!existsSync(output) || !sitemap.includes(route)) throw new Error(`Project case study missing: ${route}`);
  }
  for (const hidden of projects.filter(project => !project.visible).map(project => project.id)) {
    const route = `/${locale}/projects/${hidden}/`;
    if (existsSync(join(dist, locale, 'projects', hidden, 'index.html')) || sitemap.includes(route)) throw new Error(`Private project leaked: ${route}`);
  }
  const contactRoute = join(dist, locale, 'contact', 'index.html');
  if (!existsSync(contactRoute) || !readFileSync(contactRoute, 'utf8').includes(`#contact`)) throw new Error(`Missing contact compatibility route: ${locale}/contact`);
  if (sitemap.includes(`/${locale}/contact/`)) throw new Error(`Contact compatibility route leaked into sitemap: ${locale}/contact`);
  const resumeRoute = join(dist, locale, 'resume', 'index.html');
  if (!existsSync(resumeRoute)) throw new Error(`Missing résumé compatibility route: ${locale}/resume`);
  const resumePage = readFileSync(resumeRoute, 'utf8');
  if (!resumePage.includes(locale === 'fa' ? 'رزومه' : 'Résumé')) throw new Error(`Résumé route is missing its disabled-state view: ${locale}/resume`);
  if (sitemap.includes(`/${locale}/resume/`)) throw new Error(`Résumé route leaked into sitemap: ${locale}/resume`);
}
let published = 0;
for (const file of files) {
  const body = readFileSync(file, 'utf8');
  const id = relative(content, file).replace(/\.mdx?$/, '').replaceAll('\\', '/');
  const route = `/${id.split('/')[0]}/blog/${id.split('/').slice(1).join('/')}/`;
  const output = join(dist, route, 'index.html');
  const isDraft = /^draft:\s*true\s*$/m.test(body);
  if (isDraft && (existsSync(output) || sitemap.includes(route))) throw new Error(`Draft leaked: ${route}`);
  if (!isDraft) {
    published++;
    if (!existsSync(output) || !sitemap.includes(route)) throw new Error(`Published route missing: ${route}`);
    const article = readFileSync(output, 'utf8');
    if (!article.includes('data-pagefind-body')) throw new Error(`Article absent from search: ${route}`);
    if (article.includes('id=\"progress-control\"') || article.includes('id=\"progress-menu\"')) throw new Error(`Progress navigator leaked onto article: ${route}`);
  }
}
if (existsSync(join(dist, 'de'))) throw new Error('German routes still generated');
if (!existsSync(join(dist, 'pagefind/pagefind.js'))) throw new Error('Pagefind index missing');
console.log(`Verified ${published} published article routes, locale pages, RSS, sitemap, and search assets.`);
