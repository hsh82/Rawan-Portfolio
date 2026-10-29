import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readProjectHubs } from '../src/utils/project-source.mjs';
import { selectHomepageProjects } from '../src/utils/project-selection.mjs';

const root = resolve(process.cwd());
const contentRoot = resolve(root, 'content');
const read = (file, fallback = {}) => existsSync(resolve(contentRoot, file)) ? JSON.parse(readFileSync(resolve(contentRoot, file), 'utf8')) : fallback;
const config = read('resume/config.json');
const profileSource = read('profile.json');
const homeSource = read('home.json', { locales: { en: {}, fa: {} } });
const profile = { ...profileSource, ...homeSource, locales: { ...(profileSource.locales || {}), ...(homeSource.locales || {}) } };
const site = read('site.json');
const contact = read('contact.json');

if (!config.enabled || !profile.visible) {
  console.log('Résumé PDFs skipped: enable resume/config.json only after verified public profile information is available.');
  process.exit(0);
}

const locales = config.locales?.length ? config.locales : ['en', 'fa'];
const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const local = (item, locale) => item?.locales?.[locale] || {};
const records = (name) => existsSync(resolve(contentRoot, name, 'entries.json'))
  ? read(`${name}/entries.json`).filter(item => item.visible !== false).sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))
  : [];
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
  const mime = extension === '.svg' ? 'image/svg+xml' : extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : extension === '.webp' ? 'image/webp' : extension === '.gif' ? 'image/gif' : 'image/png';
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

function displayUrl(value) {
  try {
    const parsed = new URL(value);
    return `${parsed.host.replace(/^www\./, '')}${parsed.pathname.replace(/\/$/, '')}${parsed.search}`;
  } catch {
    return value;
  }
}

function assertResumeReady() {
  const missing = [];
  for (const locale of locales) {
    const copy = profileCopy(locale);
    if (!copy.displayName) missing.push(`${locale}.displayName`);
    if (!copy.title) missing.push(`${locale}.title`);
    if (!(copy.intro || copy.summary)) missing.push(`${locale}.intro or ${locale}.summary`);
  }
  const hasContact = Boolean(contact.email || contact.phone || contact.location || site.siteUrl || contact.socials?.length);
  if (!hasContact) missing.push('contact method');
  if (config.portrait !== false && !(profile.resumeImage || profile.image)) missing.push('profile image');
  if (missing.length) throw new Error(`Résumé is enabled but required public content is missing: ${missing.join(', ')}`);
  if (!existsSync(font400) || !existsSync(font700)) throw new Error('Résumé fonts are missing: install @fontsource/vazirmatn before generating PDFs.');
}

function projectSelection() {
  const projects = readProjectHubs(contentRoot);
  const limit = Math.min(6, Math.max(1, Number(config.projectLimit || 4)));
  if (config.projectIds?.length) {
    const byId = new Map(projects.map(project => [project.id, project]));
    const missing = config.projectIds.filter(id => !byId.has(id));
    if (missing.length) throw new Error(`Résumé projectIds reference missing project hubs: ${missing.join(', ')}`);
    return selectHomepageProjects(config.projectIds.map(id => byId.get(id)), limit);
  }
  return selectHomepageProjects(projects, limit);
}

const contactLabels = { en: { heading: 'Contact', email: 'Email', phone: 'Phone', location: 'Location', website: 'Website' }, fa: { heading: 'راه‌های ارتباطی', email: 'ایمیل', phone: 'تلفن', location: 'موقعیت', website: 'وب‌سایت' } };

function contactItems(locale) {
  const labels = contactLabels[locale] || contactLabels.en;
  const result = [];
  const add = (label, value, href = '', ltr = true) => { if (value) result.push({ label, value, href, ltr }); };
  add(labels.email, contact.email, contact.email ? `mailto:${contact.email}` : '');
  add(labels.location, contact.location, '', false);
  add(labels.phone, contact.phone, contact.phone ? `tel:${contact.phone}` : '');
  add(labels.website, site.siteUrl, site.siteUrl, true);
  for (const item of contact.socials || []) add(item.label, displayUrl(item.url), item.url, true);
  return result;
}

function bulletsFor(item, locale) {
  const copy = local(item, locale);
  if (Array.isArray(copy.bullets) && copy.bullets.length) return `<ul>${copy.bullets.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
  return copy.summary ? `<p>${escape(copy.summary)}</p>` : '';
}

function section(label, body, className = '') {
  return body ? `<section class="resume-section ${className}"><h2>${label}</h2>${body}</section>` : '';
}

function contactHtml(locale) {
  const items = contactItems(locale);
  if (!items.length) return '';
  const copy = contact.locales?.[locale] || contact.locales?.en || {};
  return `<section class="contact-panel"><div><h2>${escape(copy.title || contactLabels[locale]?.heading || contactLabels.en.heading)}</h2>${copy.intro ? `<p>${escape(copy.intro)}</p>` : ''}</div><ul class="contact-grid">${items.map(item => `<li><span class="contact-label">${escape(item.label)}</span>${item.href ? `<a class="contact-value${item.ltr ? ' ltr' : ''}" href="${escape(item.href)}"${item.ltr ? ' dir="ltr"' : ''}>${escape(item.value)}</a>` : `<span class="contact-value${item.ltr ? ' ltr' : ''}"${item.ltr ? ' dir="ltr"' : ''}>${escape(item.value)}</span>`}</li>`).join('')}</ul></section>`;
}

assertResumeReady();
const experience = records('experience');
const education = records('education');
const certifications = records('certifications');
const skills = records('skills');
const projects = projectSelection();
const journey = records('journey');

mkdirSync(output, { recursive: true });
mkdirSync(temp, { recursive: true });

for (const locale of locales) {
  const copy = profileCopy(locale);
  const labels = locale === 'fa'
    ? { summary: 'خلاصهٔ حرفه‌ای', experience: 'سوابق شغلی', skills: 'مهارت‌های فنی', education: 'تحصیلات', certifications: 'گواهی‌نامه‌ها', journey: 'مسیر حرفه‌ای', projects: 'پروژه‌های منتخب', projectsIntro: 'نمونه‌هایی از پروژه‌های اصلی؛ مقاله‌های زیرمجموعه در این خلاصه وارد نشده‌اند.' }
    : { summary: 'Professional profile', experience: 'Professional experience', skills: 'Technical capabilities', education: 'Education', certifications: 'Certifications', journey: 'Professional journey', projects: 'Selected Projects', projectsIntro: 'Selected root project hubs; supporting child articles are not included in this summary.' };
  const name = copy.displayName || profile.name || '';
  const title = copy.title || '';
  const portrait = config.portrait !== false ? assetDataUri(profile.resumeImage || profile.image) : '';
  const experienceHtml = (config.include?.experience !== false ? experience : []).map(item => { const itemCopy = local(item, locale); return `<article class="entry"><h3>${escape(itemCopy.title)}</h3>${item.organization ? `<p class="muted"><strong>${escape(item.organization)}</strong></p>` : ''}${bulletsFor(item, locale)}</article>`; }).join('');
  const skillsHtml = (config.include?.skills !== false ? skills : []).map(item => { const itemCopy = local(item, locale); return `<div class="skill-row"><h3>${escape(itemCopy.title)}</h3><p>${escape(item.technologies.join(' · '))}</p></div>`; }).join('');
  const projectsHtml = (config.include?.projects !== false ? projects : []).map(project => {
    const projectCopy = local(project, locale);
    const role = project.role?.[locale] || '';
    const links = [
      project.repository ? `<a href="${escape(project.repository)}" dir="ltr">${escape(displayUrl(project.repository))}</a>` : '',
      project.externalUrl ? `<a href="${escape(project.externalUrl)}" dir="ltr">${escape(displayUrl(project.externalUrl))}</a>` : '',
      site.siteUrl ? `<a href="${escape(`${site.siteUrl.replace(/\/$/, '')}/${locale}/blog/projects/${project.id}/overview/`)}" dir="ltr">${escape(`${site.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/${locale}/blog/projects/${project.id}/overview/`)}</a>` : '',
    ].filter(Boolean).join('<span class="project-link-separator"> · </span>');
    return `<article class="project-card"><h3>${escape(projectCopy.title)}</h3>${role ? `<p class="project-role">${escape(role)}</p>` : ''}<p>${escape(projectCopy.description || '')}</p><p class="project-technologies">${escape(project.technologies.slice(0, 5).join(' · '))}</p>${links ? `<p class="project-links">${links}</p>` : ''}</article>`;
  }).join('');
  const educationHtml = (config.include?.education !== false ? education : []).map(item => `<article class="entry"><h3>${escape(local(item, locale).title)}</h3>${item.organization ? `<p>${escape(item.organization)}</p>` : ''}${bulletsFor(item, locale)}</article>`).join('');
  const certificationHtml = (config.include?.certifications !== false ? certifications : []).map(item => `<article class="entry"><h3>${escape(local(item, locale).title)}</h3>${bulletsFor(item, locale)}</article>`).join('');
  const journeyHtml = (config.include?.journey ? journey : []).map(item => `<article class="entry"><h3>${escape(local(item, locale).title)}</h3>${bulletsFor(item, locale)}</article>`).join('');
  const projectSection = config.include?.projects !== false && projectsHtml ? `<section class="resume-projects"><h2>${labels.projects}</h2><p class="projects-intro">${labels.projectsIntro}</p><div class="project-grid">${projectsHtml}</div></section>` : '';
  const source = resolve(temp, `${locale}.html`);
  const pdf = resolve(output, `${filenameSlug}-${locale}.pdf`);
  const legacyPdf = resolve(output, `${locale}.pdf`);
  const html = `<!doctype html><html lang="${locale}" dir="${locale === 'fa' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${escape(name)} — ${escape(title)}</title><style>
@font-face{font-family:Vazirmatn;src:url('file://${font400}') format('woff2');font-weight:400}@font-face{font-family:Vazirmatn;src:url('file://${font700}') format('woff2');font-weight:700}
@page{size:A4;margin:13mm 15mm 18mm}*{box-sizing:border-box}html{font-family:Vazirmatn,sans-serif}body{margin:0;color:#102039;background:#fff;font-size:9.6pt;line-height:1.55}a{color:#0969c8;text-decoration:none;overflow-wrap:anywhere}.ltr{direction:ltr;unicode-bidi:isolate}.resume-header{display:grid;grid-template-columns:1fr ${portrait ? '31mm' : '1fr'};gap:7mm;align-items:center;border-bottom:2px solid #0A84FF;padding-bottom:5mm}.identity h1{font-size:25pt;line-height:1.15;margin:0;color:#102039;font-weight:700}.identity .title{font-size:12pt;color:#0A84FF;font-weight:700;margin-top:1.5mm}.summary{max-width:78ch;margin:3mm 0 0;color:#334155}.portrait{width:31mm;height:31mm;object-fit:cover;border-radius:50%;border:1px solid #cbd5e1;background:#eaf2fb}.contact-panel{margin-top:5mm;padding:4mm 4.5mm;border:1px solid #b8cbe0;border-left:3px solid #0A84FF;border-radius:3mm;background:#f7fbff;break-inside:avoid}.contact-panel h2{font-size:12pt;color:#0A84FF;margin:0 0 1.5mm}.contact-panel>div>p{margin:0 0 3mm;color:#475569}.contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2.5mm 6mm;margin:0;padding:0;list-style:none}.contact-grid li{display:flex;flex-direction:column;gap:.4mm;min-width:0}.contact-label{font-size:7.5pt;color:#64748b;font-weight:700}.contact-value{font-size:8.8pt;overflow-wrap:anywhere}.resume-section{break-inside:auto;margin-top:5mm}.resume-section h2,.resume-projects h2{font-size:13pt;color:#0A84FF;border-bottom:1px solid #b8cbe0;padding-bottom:1.5mm;margin:0 0 3mm;font-weight:700;break-after:avoid}.entry{break-inside:avoid;margin:0 0 3.5mm}.entry h3,.skill-row h3,.project-card h3{font-size:10.5pt;line-height:1.35;margin:0 0 1mm;font-weight:700;color:#102039}.entry p{margin:0 0 1mm}.entry ul{margin:1mm 0 0;padding-inline-start:5mm}.entry li{margin:.6mm 0}.muted{color:#475569}.skill-row{display:grid;grid-template-columns:40mm 1fr;gap:4mm;padding:1.2mm 0;border-bottom:1px solid #e5edf5;break-inside:avoid}.skill-row p{margin:0;color:#334155}.resume-projects{break-before:page;page-break-before:always;margin-top:0}.projects-intro{margin:-1mm 0 4mm;color:#475569}.project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4mm}.project-card{break-inside:avoid;border:1px solid #cbd5e1;border-top:2px solid #0A84FF;border-radius:3mm;padding:4mm}.project-card h3{font-size:11.5pt}.project-role{margin:0 0 1.5mm;color:#475569;font-size:8.5pt;font-weight:700}.project-technologies,.project-links{margin:2mm 0 0;color:#475569;font-size:8.2pt}.project-links{overflow-wrap:anywhere}.project-link-separator{color:#94a3b8}.resume-footer{position:fixed;bottom:-10mm;left:0;right:0;border-top:1px solid #cbd5e1;padding-top:2mm;color:#64748b;font-size:7.5pt;display:flex;justify-content:space-between;direction:ltr;background:#fff}@media print{a{color:#0969c8}}
</style></head><body><header class="resume-header"><div class="identity"><h1>${escape(name)}</h1><div class="title">${escape(title)}</div><p class="summary">${escape(copy.intro || '')}</p>${contactHtml(locale)}</div>${portrait ? `<img class="portrait" src="${portrait}" alt="${escape(name)}" />` : ''}</header>${section(labels.summary, copy.summary ? `<p>${escape(copy.summary)}</p>` : '')}${section(labels.experience, experienceHtml)}${section(labels.skills, skillsHtml)}${section(labels.education, educationHtml)}${section(labels.certifications, certificationHtml)}${section(labels.journey, journeyHtml)}${projectSection}<footer class="resume-footer"><span>${escape(name)}</span><span>${contact.email ? escape(contact.email) : site.siteUrl ? escape(displayUrl(site.siteUrl)) : ''}</span></footer><script>document.fonts.ready.then(()=>document.body.dataset.ready='true')</script></body></html>`;
  writeFileSync(source, html);
  const args = ['--headless', '--disable-gpu', '--disable-extensions', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=1000', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, `file://${source}`];
  if (process.env.CHROME_NO_SANDBOX === '1') args.splice(1, 0, '--no-sandbox');
  const result = spawnSync(chrome, args, { stdio: 'inherit' });
  if (result.status !== 0 || !existsSync(pdf)) throw new Error(`Failed to generate résumé PDF for ${locale}. Set CHROME_BIN or CHROME_NO_SANDBOX=1 if required.`);
  copyFileSync(pdf, legacyPdf);
}
rmSync(temp, { recursive: true, force: true });
console.log(`Generated ${filenameSlug}-en.pdf and ${filenameSlug}-fa.pdf plus stable locale aliases.`);
