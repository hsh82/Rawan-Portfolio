import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readPortfolioSource } from '../src/utils/portfolio-source.mjs';
import { selectHomepageProjects } from '../src/utils/project-selection.mjs';

const root = resolve(process.cwd());
const contentRoot = resolve(root, 'content');
const sourceData = readPortfolioSource(contentRoot);
const { profile, site, contact, resume: config } = sourceData;

if (!config.enabled || !profile.visible) {
  console.log('Résumé PDFs skipped: enable resume/config.json only after verified public profile information is available.');
  process.exit(0);
}

const locales = config.locales?.length ? config.locales : ['en', 'fa'];
const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const local = (item, locale) => item?.locales?.[locale] || item?.locales?.en || {};
const visibleRecords = (items = []) => items.filter(item => item.visible !== false).sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
const profileCopy = (locale) => profile.locales?.[locale] || profile.locales?.en || {};
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
    if (!(copy.summary || copy.intro)) missing.push(`${locale}.summary or ${locale}.intro`);
  }
  const hasContact = Boolean(contact.email || contact.phone || contact.location || site.siteUrl || contact.socials?.length);
  if (!hasContact) missing.push('contact method');
  if (config.portrait !== false && !(profile.resumeImage || profile.image)) missing.push('profile image');
  if (missing.length) throw new Error(`Résumé is enabled but required public content is missing: ${missing.join(', ')}`);
  if (!existsSync(font400) || !existsSync(font700)) throw new Error('Résumé fonts are missing: install @fontsource/vazirmatn before generating PDFs.');
}

function projectSelection() {
  const projects = sourceData.projects;
  const limit = Math.min(6, Math.max(1, Number(config.projectLimit || 4)));
  if (config.projectIds?.length) {
    const byId = new Map(projects.map(project => [project.id, project]));
    const missing = config.projectIds.filter(id => !byId.has(id));
    if (missing.length) throw new Error(`Résumé projectIds reference missing project hubs: ${missing.join(', ')}`);
    return selectHomepageProjects(config.projectIds.map(id => byId.get(id)), limit);
  }
  return selectHomepageProjects(projects, limit);
}

const labels = {
  en: { about: 'About me', focus: 'Professional focus', experience: 'Professional experience', skills: 'Technical capabilities', education: 'Education', certifications: 'Certifications', journey: 'Professional journey', projects: 'Selected projects', contactFallback: 'Contact' },
  fa: { about: 'دربارهٔ من', focus: 'تمرکز حرفه‌ای', experience: 'سوابق شغلی', skills: 'مهارت‌های فنی', education: 'تحصیلات', certifications: 'گواهی‌نامه‌ها', journey: 'مسیر حرفه‌ای', projects: 'پروژه‌های منتخب', contactFallback: 'راه‌های ارتباطی' },
};

function contactItems(locale) {
  const label = labels[locale] || labels.en;
  const items = [];
  const add = (name, value, href = '', direction = 'ltr') => { if (value) items.push({ name, value, href, direction }); };
  add(locale === 'fa' ? 'ایمیل' : 'Email', contact.email, contact.email ? `mailto:${contact.email}` : '');
  add(locale === 'fa' ? 'موقعیت' : 'Location', contact.location, '', 'ltr');
  add(locale === 'fa' ? 'تلفن' : 'Phone', contact.phone, contact.phone ? `tel:${contact.phone}` : '');
  add(locale === 'fa' ? 'وب‌سایت' : 'Website', site.siteUrl, site.siteUrl);
  for (const item of contact.socials || []) add(item.label, displayUrl(item.url), item.url);
  return { title: contact.locales?.[locale]?.title || contact.locales?.en?.title || label.contactFallback, items };
}

function contactHtml(locale) {
  const contactData = contactItems(locale);
  if (!contactData.items.length) return '';
  return `<section class="resume-section contact-section"><h2>${escape(contactData.title)}</h2><ul class="contact-grid">${contactData.items.map(item => `<li><span class="contact-label">${escape(item.name)}</span>${item.href ? `<a class="contact-value" href="${escape(item.href)}" dir="${item.direction}">${escape(item.value)}</a>` : `<span class="contact-value" dir="${item.direction}">${escape(item.value)}</span>`}</li>`).join('')}</ul></section>`;
}

function bulletsFor(item, locale, limit = Number.POSITIVE_INFINITY) {
  const copy = local(item, locale);
  if (Array.isArray(copy.bullets) && copy.bullets.length) return `<ul>${copy.bullets.slice(0, limit).map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
  return copy.summary ? `<p>${escape(copy.summary)}</p>` : '';
}

function section(label, body, className = '', id = '') {
  const sectionId = id || (className === 'resume-experience' ? 'experience' : '');
  return body ? `<section${sectionId ? ` id="${escape(sectionId)}"` : ''} class="resume-section ${className}"><h2>${escape(label)}</h2>${body}</section>` : '';
}

function paragraphs(value = '') {
  return String(value).split(/\n\s*\n/).filter(Boolean).map(paragraph => `<p>${escape(paragraph)}</p>`).join('');
}

function homeLinksHtml(copy) {
  const links = [
    copy.ctaExperience ? `<a href="#experience">${escape(copy.ctaExperience)}</a>` : '',
    copy.ctaProjects ? `<a href="#projects">${escape(copy.ctaProjects)}</a>` : '',
  ].filter(Boolean);
  return links.length ? `<nav class="home-links" aria-label="${escape(copy.displayName || 'Homepage links')}">${links.join('')}</nav>` : '';
}

function projectLinks(project, locale) {
  const links = [
    project.repository ? `<a href="${escape(project.repository)}" dir="ltr">${escape(displayUrl(project.repository))}</a>` : '',
    project.externalUrl ? `<a href="${escape(project.externalUrl)}" dir="ltr">${escape(displayUrl(project.externalUrl))}</a>` : '',
    site.siteUrl ? `<a href="${escape(`${site.siteUrl.replace(/\/$/, '')}/${locale}/blog/projects/${project.id}/overview/`)}" dir="ltr">${escape(`${site.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/${locale}/blog/projects/${project.id}/overview/`)}</a>` : '',
  ].filter(Boolean);
  return links.length ? `<p class="project-links">${links.join('<span aria-hidden="true"> · </span>')}</p>` : '';
}

assertResumeReady();
const experience = visibleRecords(sourceData.experience);
const education = visibleRecords(sourceData.education);
const certifications = visibleRecords(sourceData.certifications);
const skills = visibleRecords(sourceData.skills);
const projects = projectSelection();
const journey = visibleRecords(sourceData.journey);

mkdirSync(output, { recursive: true });
mkdirSync(temp, { recursive: true });

for (const locale of locales) {
  const copy = profileCopy(locale);
  const text = labels[locale] || labels.en;
  const name = copy.displayName || profile.name || '';
  const title = copy.title || '';
  const portrait = config.portrait !== false ? assetDataUri(profile.resumeImage || profile.image) : '';
  const experienceHtml = (config.include?.experience !== false ? experience : []).map((item, index) => {
    const itemCopy = local(item, locale);
    const bulletLimit = index === 0 ? 5 : 1;
    return `<article class="entry"><h3>${escape(itemCopy.title)}</h3>${item.organization ? `<p class="muted"><strong>${escape(item.organization)}</strong></p>` : ''}${bulletsFor(item, locale, bulletLimit)}</article>`;
  }).join('');
  const skillsHtml = (config.include?.skills !== false ? skills : []).map(item => {
    const itemCopy = local(item, locale);
    return `<div class="skill-row"><h3>${escape(itemCopy.title)}</h3><p dir="ltr">${escape(item.technologies.join(' · '))}</p></div>`;
  }).join('');
  const homeCopy = sourceData.home?.locales?.[locale] || sourceData.home?.locales?.en || {};
  const aboutCopy = sourceData.home?.about?.[locale] || sourceData.home?.about?.en || {};
  const focusAreas = sourceData.home?.focus?.[locale] || sourceData.home?.focus?.en || [];
  const aboutCardsHtml = (aboutCopy.cards || []).map(card => `<article class="about-card"><h3>${escape(card.title)}</h3><p>${escape(card.description)}</p></article>`).join('');
  const aboutHtml = `${paragraphs(aboutCopy.description)}${aboutCardsHtml ? `<div class="about-cards">${aboutCardsHtml}</div>` : ''}`;
  const focusHtml = focusAreas.length ? `<div class="focus-grid">${focusAreas.map(area => `<article class="focus-card"><h3>${escape(area.title)}</h3><p>${escape(area.description)}</p></article>`).join('')}</div>` : '';
  const educationHtml = (config.include?.education !== false ? education : []).map(item => `<article class="entry"><h3>${escape(local(item, locale).title)}</h3>${item.organization ? `<p class="muted">${escape(item.organization)}</p>` : ''}${bulletsFor(item, locale, 1)}</article>`).join('');
  const certificationHtml = (config.include?.certifications !== false ? certifications : []).map(item => `<article class="entry"><h3>${escape(local(item, locale).title)}</h3>${bulletsFor(item, locale, 1)}</article>`).join('');
  const journeyHtml = (config.include?.journey ? journey : []).map(item => { const itemCopy = local(item, locale); return `<article class="entry journey-entry"><h3>${escape(itemCopy.title)}</h3>${item.organization ? `<p class="muted"><strong>${escape(item.organization)}</strong></p>` : ''}${itemCopy.description ? `<p>${escape(itemCopy.description)}</p>` : bulletsFor(item, locale, 1)}${item.technologies?.length ? `<p class="entry-tech" dir="ltr">${escape(item.technologies.join(' · '))}</p>` : ''}</article>`; }).join('');
  const projectsHtml = (config.include?.projects !== false ? projects : []).map(project => {
    const projectCopy = local(project, locale);
    const role = project.role?.[locale] || project.role?.en || '';
    return `<article class="project-entry"><div class="project-heading"><h3>${escape(projectCopy.title)}</h3>${role ? `<p class="project-role">${escape(role)}</p>` : ''}</div><p>${escape(projectCopy.description || projectCopy.summary || '')}</p><p class="project-technologies" dir="ltr">${escape(project.technologies.slice(0, 5).join(' · '))}</p>${projectLinks(project, locale)}</article>`;
  }).join('');
  const projectSection = config.include?.projects !== false && projectsHtml ? `<section id="projects" class="resume-projects"><h2>${escape(text.projects)}</h2><div class="project-list">${projectsHtml}</div></section>` : '';
  const aboutSection = aboutHtml ? `<section class="resume-section resume-about"><h2>${escape(text.about)}</h2>${aboutHtml}</section>` : '';
  const focusSection = focusHtml ? `<section class="resume-section resume-focus"><h2>${escape(text.focus)}</h2>${focusHtml}</section>` : '';
  const journeySection = journeyHtml ? `<section class="resume-section resume-journey"><h2>${escape(text.journey)}</h2>${journeyHtml}</section>` : '';
  const source = resolve(temp, `${locale}.html`);
  const pdf = resolve(output, `${filenameSlug}-${locale}.pdf`);
  const legacyPdf = resolve(output, `${locale}.pdf`);
  const html = `<!doctype html><html lang="${locale}" dir="${locale === 'fa' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${escape(name)} — ${escape(title)}</title><style>
@font-face{font-family:Vazirmatn;src:url('file://${font400}') format('woff2');font-weight:400}@font-face{font-family:Vazirmatn;src:url('file://${font700}') format('woff2');font-weight:700}
@page{size:A4;margin:16mm 16mm 17mm}*{box-sizing:border-box}html{font-family:Vazirmatn,sans-serif}body{margin:0;color:#102039;background:#fff;font-size:10.35pt;line-height:1.58}a{color:#0969c8;text-decoration:none;overflow-wrap:anywhere}.resume-header{display:grid;grid-template-columns:1fr ${portrait ? '30mm' : '1fr'};gap:7mm;align-items:center;border-bottom:2px solid #0A84FF;padding-bottom:5mm}.identity h1{font-size:26pt;line-height:1.12;margin:0;color:#102039;font-weight:700}.identity .title{font-size:12.5pt;color:#0A84FF;font-weight:700;margin-top:2mm}.intro,.summary{max-width:78ch;margin:4mm 0 0;color:#334155}.summary{margin-top:2.5mm;color:#475569}.portrait{width:30mm;height:30mm;object-fit:cover;border-radius:50%;border:1px solid #cbd5e1;background:#eaf2fb}.home-links{display:flex;flex-wrap:wrap;gap:2mm 5mm;margin-top:4mm}.home-links a{border-bottom:1px solid #0A84FF;padding-bottom:.5mm;font-weight:700}.resume-section{break-inside:auto;margin-top:7mm}.resume-section h2,.resume-projects h2{font-size:14pt;color:#0A84FF;border-bottom:1px solid #b8cbe0;padding-bottom:1.5mm;margin:0 0 4mm;font-weight:700;break-after:avoid}.resume-about{break-inside:auto}.resume-about>p{margin:0 0 3mm}.about-cards,.focus-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4mm;margin-top:5mm}.about-card,.focus-card{break-inside:avoid;border:1px solid #dbe5f0;border-radius:2mm;padding:3.5mm}.about-card h3,.focus-card h3{font-size:10.5pt;line-height:1.35;margin:0 0 1.5mm;color:#102039}.about-card p,.focus-card p{margin:0;color:#475569;font-size:9.4pt;line-height:1.5}.resume-skills{break-before:page;page-break-before:always}.resume-focus{margin-top:8mm}.resume-experience{break-before:page;page-break-before:always}.entry{break-inside:avoid;margin:0 0 5mm}.entry h3,.skill-row h3,.project-entry h3{font-size:11.2pt;line-height:1.35;margin:0 0 1mm;font-weight:700;color:#102039}.entry p{margin:0 0 1.5mm}.entry ul{margin:1.5mm 0 0;padding-inline-start:5.5mm}.entry li{margin:1mm 0}.entry-tech{color:#475569;font-size:9pt}.muted{color:#475569}.skill-row{display:grid;grid-template-columns:43mm 1fr;gap:5mm;padding:2.2mm 0;border-bottom:1px solid #e5edf5;break-inside:avoid}.skill-row h3{margin:0}.skill-row p{margin:0;color:#334155;font-size:9.5pt;line-height:1.5}.contact-section{break-inside:avoid;margin-top:9mm}.contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3.5mm 8mm;margin:0;padding:0;list-style:none}.contact-grid li{display:flex;flex-direction:column;gap:.7mm;min-width:0;border-bottom:1px solid #e5edf5;padding-bottom:1.5mm}.contact-label{font-size:9pt;color:#64748b;font-weight:700}.contact-value{font-size:10pt;overflow-wrap:anywhere}.resume-projects{break-before:page;page-break-before:always;margin-top:0}.project-list{display:grid;gap:6mm}.project-entry{break-inside:avoid;border-bottom:1px solid #cbd5e1;padding-bottom:5mm}.project-entry:last-child{border-bottom:0}.project-heading{display:flex;align-items:baseline;justify-content:space-between;gap:5mm}.project-entry h3{font-size:12pt}.project-role{margin:0;color:#475569;font-size:9pt;font-weight:700;white-space:nowrap}.project-entry>p{margin:1.5mm 0 0}.project-technologies,.project-links{color:#475569;font-size:9pt;line-height:1.5}.project-links{margin-top:1.5mm}.resume-footer{margin-top:8mm;border-top:1px solid #cbd5e1;padding-top:2.5mm;color:#64748b;font-size:8.5pt;display:flex;justify-content:space-between;gap:6mm;direction:ltr}.ltr{direction:ltr;unicode-bidi:isolate}@media print{a{color:#0969c8}}
</style></head><body><header class="resume-header"><div class="identity"><h1>${escape(name)}</h1><div class="title">${escape(title)}</div><p class="intro">${escape(copy.intro || '')}</p><p class="summary">${escape(copy.summary || '')}</p>${homeLinksHtml(homeCopy)}</div>${portrait ? `<img class="portrait" src="${portrait}" alt="${escape(name)}" />` : ''}</header>${aboutSection}${section(text.skills, skillsHtml, 'resume-skills')}${focusSection}${section(text.education, educationHtml)}${section(text.certifications, certificationHtml)}${section(text.experience, experienceHtml, 'resume-experience')} ${journeySection}${contactHtml(locale)}${projectSection}<footer class="resume-footer"><span>${escape(name)}</span><span>${escape(contact.email || (site.siteUrl ? displayUrl(site.siteUrl) : ''))}</span></footer><script>document.fonts.ready.then(()=>document.body.dataset.ready='true')</script></body></html>`;
  writeFileSync(source, html);
  const args = ['--headless', '--disable-gpu', '--disable-extensions', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=1000', '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, `file://${source}`];
  if (process.env.CHROME_NO_SANDBOX === '1') args.splice(1, 0, '--no-sandbox');
  const result = spawnSync(chrome, args, { stdio: 'inherit' });
  if (result.status !== 0 || !existsSync(pdf)) throw new Error(`Failed to generate résumé PDF for ${locale}. Set CHROME_BIN or CHROME_NO_SANDBOX=1 if required.`);
  copyFileSync(pdf, legacyPdf);
}

rmSync(temp, { recursive: true, force: true });
console.log(`Generated ${filenameSlug}-en.pdf and ${filenameSlug}-fa.pdf plus stable locale aliases.`);
