import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(process.cwd());
const contentRoot = resolve(root, 'content');
const read = (file) => JSON.parse(readFileSync(resolve(contentRoot, file), 'utf8'));
const config = read('resume/config.json');
const profile = read('profile.json');
const site = read('site.json');
const contact = read('contact.json');

if (!config.enabled || !profile.visible) {
  console.log('Résumé PDFs skipped: enable resume/config.json only after verified public profile information is available.');
  process.exit(0);
}

const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const records = (name) => existsSync(resolve(contentRoot, name, 'entries.json')) ? read(`${name}/entries.json`).filter(item => item.visible !== false) : [];
const local = (item, locale) => item?.locales?.[locale] || {};
const profileCopy = (locale) => profile.locales?.[locale] || {};
const safeSlug = (value) => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'resume';
const filenameSlug = safeSlug(config.filenameSlug || profile.name || profile.locales?.en?.displayName);
const output = resolve(root, 'public/resume');
const temp = resolve(root, '.astro/resume-print');
const chrome = process.env.CHROME_BIN || 'google-chrome';
const font400 = resolve(root, 'node_modules/@fontsource/vazirmatn/files/vazirmatn-arabic-400-normal.woff2');
const font700 = resolve(root, 'node_modules/@fontsource/vazirmatn/files/vazirmatn-arabic-700-normal.woff2');

function assetDataUri(assetPath) {
  if (!assetPath) return '';
  const file = assetPath.startsWith('media/')
    ? resolve(contentRoot, assetPath)
    : assetPath.startsWith('/media/')
      ? resolve(contentRoot, assetPath.slice(1))
      : assetPath.startsWith('/')
        ? resolve(root, 'public', assetPath.slice(1))
        : resolve(contentRoot, assetPath);
  if (!existsSync(file)) return '';
  const extension = extname(file).toLowerCase();
  const mime = extension === '.svg' ? 'image/svg+xml' : extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

function contactItems() {
  const result = [];
  if (contact.email) result.push(`<a href="mailto:${escape(contact.email)}" dir="ltr">${escape(contact.email)}</a>`);
  if (contact.phone) result.push(`<a href="tel:${escape(contact.phone)}" dir="ltr">${escape(contact.phone)}</a>`);
  if (site.siteUrl) result.push(`<a href="${escape(site.siteUrl)}" dir="ltr">${escape(site.siteUrl.replace(/^https?:\/\//, ''))}</a>`);
  for (const item of contact.socials || []) result.push(`<a href="${escape(item.url)}" dir="ltr">${escape(item.label)}</a>`);
  return result;
}

function bulletsFor(item, locale) {
  const copy = local(item, locale);
  if (Array.isArray(copy.bullets) && copy.bullets.length) return `<ul>${copy.bullets.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
  return copy.summary ? `<p>${escape(copy.summary)}</p>` : '';
}

function section(label, body) {
  return body ? `<section class="resume-section"><h2>${label}</h2>${body}</section>` : '';
}

const experience = records('experience');
const education = records('education');
const certifications = records('certifications');
const skills = records('skills');
const projects = records('projects');
const selectedProjects = (config.projectIds?.length ? config.projectIds.map(id => projects.find(project => project.id === id)).filter(Boolean) : projects.filter(project => project.featured)).slice(0, 3);

mkdirSync(output, { recursive: true });
mkdirSync(temp, { recursive: true });

for (const locale of config.locales || ['en', 'fa']) {
  const copy = profileCopy(locale);
  const name = copy.displayName || profile.name || '';
  const title = copy.title || '';
  const portrait = config.portrait !== false ? assetDataUri(profile.image) : '';
  const contactHtml = contactItems().join('<span class="contact-separator">·</span>');
  const experienceHtml = (config.include?.experience !== false ? experience : []).map(item => {
    const itemCopy = local(item, locale);
    return `<article class="entry"><h3>${escape(itemCopy.title)}</h3>${item.organization ? `<p class="muted"><strong>${escape(item.organization)}</strong></p>` : ''}${bulletsFor(item, locale)}</article>`;
  }).join('');
  const skillsHtml = (config.include?.skills !== false ? skills : []).map(item => {
    const itemCopy = local(item, locale);
    return `<div class="skill-row"><h3>${escape(itemCopy.title)}</h3><p>${escape(item.technologies.join(' · '))}</p></div>`;
  }).join('');
  const projectsHtml = (config.include?.projects !== false ? selectedProjects : []).map(project => {
    const projectCopy = local(project, locale);
    return `<article class="entry"><h3>${escape(projectCopy.title)}</h3><p>${escape(projectCopy.description || '')}</p><p class="muted">${escape(project.technologies.join(' · '))}${project.repository ? ` · <a href="${escape(project.repository)}" dir="ltr">${escape(project.repository)}</a>` : ''}</p></article>`;
  }).join('');
  const educationHtml = (config.include?.education !== false ? education : []).map(item => `<article class="entry"><h3>${escape(local(item, locale).title)}</h3>${item.organization ? `<p>${escape(item.organization)}</p>` : ''}${bulletsFor(item, locale)}</article>`).join('');
  const certificationHtml = (config.include?.certifications !== false ? certifications : []).map(item => `<article class="entry"><h3>${escape(local(item, locale).title)}</h3>${bulletsFor(item, locale)}</article>`).join('');
  const source = resolve(temp, `${locale}.html`);
  const pdf = resolve(output, `${filenameSlug}-${locale}.pdf`);
  const legacyPdf = resolve(output, `${locale}.pdf`);
  const html = `<!doctype html><html lang="${locale}" dir="${locale === 'fa' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${escape(name)} — ${escape(title)}</title><style>
@font-face{font-family:Vazirmatn;src:url('file://${font400}') format('woff2');font-weight:400}@font-face{font-family:Vazirmatn;src:url('file://${font700}') format('woff2');font-weight:700}
.skill-row{break-inside:avoid;page-break-inside:avoid}
@page{size:A4;margin:14mm 16mm 17mm}*{box-sizing:border-box}html{font-family:Vazirmatn,sans-serif}body{margin:0;color:#102039;background:#fff;font-size:9.5pt;line-height:1.55}a{color:#0969c8;text-decoration:none;overflow-wrap:anywhere}.resume-header{display:grid;grid-template-columns:1fr ${portrait ? '31mm' : '1fr'};gap:8mm;align-items:center;border-bottom:2px solid #0A84FF;padding-bottom:5mm}.identity h1{font-size:25pt;line-height:1.15;margin:0;color:#102039;font-weight:700}.identity .title{font-size:12pt;color:#0A84FF;font-weight:700;margin-top:1.5mm}.summary{max-width:78ch;margin:4mm 0 0;color:#334155}.portrait{width:31mm;height:37mm;object-fit:cover;border-radius:4mm;border:1px solid #cbd5e1;background:#eaf2fb}.contact{display:flex;flex-wrap:wrap;gap:1.5mm 3mm;margin-top:4mm;font-size:8.3pt;direction:ltr;justify-content:flex-start}.contact-separator{color:#94a3b8}.resume-section{break-inside:auto;margin-top:5mm}.resume-section h2{font-size:13pt;color:#0A84FF;border-bottom:1px solid #b8cbe0;padding-bottom:1.5mm;margin:0 0 3mm;font-weight:700}.entry{break-inside:avoid;margin:0 0 3.5mm}.entry h3,.skill-row h3{font-size:10.5pt;line-height:1.35;margin:0 0 1mm;font-weight:700;color:#102039}.entry p{margin:0 0 1mm}.entry ul{margin:1mm 0 0;padding-inline-start:5mm}.entry li{margin:.6mm 0}.muted{color:#475569}.skill-row{display:grid;grid-template-columns:38mm 1fr;gap:4mm;padding:1.2mm 0;border-bottom:1px solid #e5edf5}.skill-row p{margin:0;color:#334155}.resume-footer{position:fixed;bottom:-10mm;left:0;right:0;border-top:1px solid #cbd5e1;padding-top:2mm;color:#64748b;font-size:7.5pt;display:flex;justify-content:space-between;direction:ltr}.page-count:after{content:counter(page) ' / ' counter(pages)}.ltr{direction:ltr;unicode-bidi:isolate}@media print{a{color:#0969c8}}
</style></head><body><header class="resume-header"><div class="identity"><h1>${escape(name)}</h1><div class="title">${escape(title)}</div><p class="summary">${escape(copy.intro || copy.summary || '')}</p><div class="contact">${contactHtml}</div></div>${portrait ? `<img class="portrait" src="${portrait}" alt="${escape(name)}" />` : ''}</header>${section(locale === 'fa' ? 'خلاصه حرفه‌ای' : 'Professional summary', copy.summary ? `<p>${escape(copy.summary)}</p>` : '')}${section(locale === 'fa' ? 'سوابق شغلی' : 'Professional experience', experienceHtml)}${section(locale === 'fa' ? 'مهارت‌های فنی' : 'Technical skills', skillsHtml)}${section(locale === 'fa' ? 'پروژه‌های منتخب' : 'Selected projects', projectsHtml)}${section(locale === 'fa' ? 'تحصیلات' : 'Education', educationHtml)}${section(locale === 'fa' ? 'گواهی‌نامه‌ها' : 'Certifications', certificationHtml)}<footer class="resume-footer"><span>${escape(name)}</span><span>${site.siteUrl ? escape(site.siteUrl.replace(/^https?:\/\//, '')) : ''}</span><span class="page-count"></span></footer><script>document.fonts.ready.then(()=>document.body.dataset.ready='true')</script></body></html>`;
  writeFileSync(source, html.replace('margin:14mm 16mm 17mm', 'margin:14mm 16mm 27mm').replace('bottom:-10mm', 'bottom:-1mm').replace('direction:ltr}.page-count', 'direction:ltr;background:#fff}.page-count').replace('<span class="page-count"></span>', '<span></span>'));
  const args = ['--headless', '--disable-gpu', '--disable-extensions', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=1000', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, `file://${source}`];
  if (process.env.CHROME_NO_SANDBOX === '1') args.splice(1, 0, '--no-sandbox');
  const result = spawnSync(chrome, args, { stdio: 'inherit' });
  if (result.status !== 0 || !existsSync(pdf)) throw new Error(`Failed to generate résumé PDF for ${locale}. Set CHROME_BIN or CHROME_NO_SANDBOX=1 if required.`);
  copyFileSync(pdf, legacyPdf);
}
rmSync(temp, { recursive: true, force: true });
console.log(`Generated ${filenameSlug}-en.pdf and ${filenameSlug}-fa.pdf plus stable locale aliases.`);
