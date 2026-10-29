const api = '/__easy-content/api';
const blocks = {
  callout: '<Callout type="tip" title="Note">Write a short note.</Callout>',
  code: '```bash\n# Add code\n```',
  figure: '<Figure src="/media/projects/project/image.webp" alt="Describe the image" caption="Optional caption" />',
  table: '| Field | Value |\n| --- | --- |\n| Example | Add value |',
  mermaid: '<MermaidDiagram label="Diagram" chart={`flowchart LR\n  A[Start] --> B[Next]`} />',
  markmap: '<MindMap label="Map" content={`# Topic\n## Branch`} />',
  math: '$$\nE = mc^2\n$$',
};
const iconIds = ['gitlab-ci-cd', 'gitlab-runner', 'playwright', 'quality-gates', 'rollback', 'docker', 'docker-compose', 'nginx', 'harbor', 'nexus', 'health-checks', 'linux', 'vmware-esxi', 'vcenter', 'terraform', 'ansible', 'opnsense', 'vlan', 'wireguard', 'mikrotik', 'tls', 'dns', 'python', 'bash', 'technical-runbooks', 'jira', 'confluence', 'next-js', 'typescript', 'react', 'photoshop', 'illustrator', 'server', 'git-branch'];
const $ = selector => document.querySelector(selector);
const app = $('#app');
const source = $('#source');
const visual = $('#visual');
const diff = $('#diff');
const statusMessage = $('#status-message');
const state = $('#state');
const title = $('#title');
const description = $('#description');
const slug = $('#slug');
const tags = $('#tags');
const draft = $('#draft');
const favorite = $('#favorite');
const favoriteAt = $('#favorite-at');
const icon = $('#icon');
const publication = $('#publication');
const parent = $('#parent');
const parentSection = $('#parent-section');
const existingMedia = $('#existing-media');
const bilingualFields = $('#bilingual-fields');
const bilingualDescriptions = $('#bilingual-descriptions');
const titleEn = $('#title-en');
const titleFa = $('#title-fa');
const descriptionEn = $('#description-en');
const descriptionFa = $('#description-fa');
let token = '';
let context = null;
let entity = null;
let baseline = '';
let working = '';
let mode = 'source';
let dirty = false;
let visualChanged = false;

const copy = {
  en: { loading: 'Loading', draft: 'Draft', published: 'Published', saved: 'Saved', unsaved: 'Unsaved changes', conflict: 'This content changed outside Easy Content. Reload it before saving.', unsupported: 'unsupported content type', noProjects: 'No projects yet.', back: '← Back', save: 'Save draft', publish: 'Publish', savedMessage: 'Saved to the local working tree. Review with Git before committing.', recovery: 'A local recovery copy was found. Restore it?', validate: 'Validation complete', changes: 'Git changes loaded.' },
  fa: { loading: 'در حال بارگذاری', draft: 'پیش‌نویس', published: 'منتشرشده', saved: 'ذخیره‌شده', unsaved: 'تغییرات ذخیره‌نشده', conflict: 'این محتوا بیرون از Easy Content تغییر کرده است. ابتدا آن را دوباره بارگذاری کنید.', unsupported: 'نوع محتوای پشتیبانی‌نشده', noProjects: 'هنوز پروژه‌ای وجود ندارد.', back: 'بازگشت ←', save: 'ذخیرهٔ پیش‌نویس', publish: 'انتشار', savedMessage: 'در پوشهٔ کاری ذخیره شد. پیش از commit آن را با Git بررسی کنید.', recovery: 'یک نسخهٔ بازیابی محلی پیدا شد. آن را برگردانم؟', validate: 'اعتبارسنجی کامل شد', changes: 'تغییرات Git بارگذاری شد.' },
};
let text = copy.en;

function setStatus(message = '', isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('is-error', isError);
  state.classList.toggle('is-error', isError);
  if (isError) state.textContent = 'Error';
}

function request(path, options = {}) {
  return fetch(`${api}/${path}`, { ...options, headers: { 'Content-Type': 'application/json', 'x-easy-content-token': token, ...(options.headers || {}) } }).then(async response => {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(result.error || text.unsupported); error.status = response.status; throw error; }
    return result;
  });
}

function parseFrontmatter(value) {
  const match = value.match(/^---\s*\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) return { fields: {}, body: value };
  const fields = {};
  for (const line of match[1].split('\n')) {
    const item = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
    if (!item) continue;
    let parsed = item[2];
    if (parsed === 'true') parsed = true;
    else if (parsed === 'false') parsed = false;
    else if (parsed.startsWith('[')) { try { parsed = JSON.parse(parsed.replaceAll("'", '"')); } catch { parsed = []; } }
    else parsed = parsed.replace(/^['"]|['"]$/g, '');
    fields[item[1]] = parsed;
  }
  return { fields, body: value.slice(match[0].length) };
}

function quote(value) { return JSON.stringify(String(value ?? '')); }
function today() { return new Date().toISOString().slice(0, 10); }
function bodyOnly(value) { return parseFrontmatter(value).body; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function inlineHtml(value) { return escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'); }

function visualHtml(value) {
  const lines = bodyOnly(value).trim().split('\n');
  let html = '', inCode = false, code = [], list = null;
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const line of lines) {
    if (line.startsWith('```')) { if (inCode) { html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`; code = []; inCode = false; } else inCode = true; continue; }
    if (inCode) { code.push(line); continue; }
    if (/^\s*<[A-Z]/.test(line)) { closeList(); html += `<div class="easy-unsupported">${escapeHtml(line.trim())}</div>`; continue; }
    if (!line.trim()) { closeList(); continue; }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) { closeList(); html += `<h${heading[1].length}>${inlineHtml(heading[2])}</h${heading[1].length}>`; continue; }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/); const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (bullet || numbered) { const wanted = numbered ? 'ol' : 'ul'; if (list !== wanted) { closeList(); html += `<${wanted}>`; list = wanted; } html += `<li>${inlineHtml((bullet || numbered)[1])}</li>`; continue; }
    if (line.startsWith('> ')) { closeList(); html += `<blockquote>${inlineHtml(line.slice(2))}</blockquote>`; continue; }
    if (/^\|/.test(line)) { closeList(); html += `<pre class="easy-table">${escapeHtml(line)}</pre>`; continue; }
    closeList(); html += `<p>${inlineHtml(line)}</p>`;
  }
  closeList();
  return html || '<p class="empty">Nothing to preview yet.</p>';
}

function htmlToMarkdown(html) {
  const root = document.createElement('div'); root.innerHTML = html;
  const walk = node => [...node.childNodes].map(child => {
    if (child.nodeType === Node.TEXT_NODE) return child.textContent || '';
    const tag = child.nodeName.toLowerCase(); const content = walk(child);
    if (/^h[2-4]$/.test(tag)) return `${'#'.repeat(Number(tag[1]))} ${content}\n\n`;
    if (tag === 'p') return `${content}\n\n`; if (tag === 'li') return `- ${content}\n`; if (tag === 'blockquote') return `> ${content}\n\n`;
    if (tag === 'pre') return `\`\`\`\n${child.textContent}\n\`\`\`\n\n`; return content;
  }).join('');
  return walk(root).trim() + '\n';
}

function diffHtml(before, after) {
  const oldLines = before.split('\n'), newLines = after.split('\n'), rows = [];
  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i += 1) {
    if (oldLines[i] === newLines[i]) rows.push(escapeHtml(`  ${oldLines[i] || ''}`));
    else { if (oldLines[i] !== undefined) rows.push(`<span class="diff-removed">${escapeHtml(`- ${oldLines[i]}`)}</span>`); if (newLines[i] !== undefined) rows.push(`<span class="diff-added">${escapeHtml(`+ ${newLines[i]}`)}</span>`); }
  }
  return rows.join('\n') || 'No changes';
}

function setDirty(value = true) {
  dirty = value;
  state.textContent = value ? text.unsaved : (entity?.document?.frontmatter?.draft || context?.mode === 'new' ? text.draft : text.published);
  if (value) state.classList.remove('is-error');
  if (value) localStorage.setItem(`easy-content:recovery:${location.pathname}${location.search}`, working);
}

function renderMode() {
  source.classList.toggle('hidden', mode !== 'source');
  visual.classList.toggle('hidden', mode !== 'visual');
  diff.classList.toggle('hidden', mode !== 'diff');
  document.querySelectorAll('[data-mode]').forEach(button => { const active = button.dataset.mode === mode; button.classList.toggle('is-active', active); button.setAttribute('aria-selected', String(active)); });
  if (mode === 'visual') {
    visual.innerHTML = visualHtml(working);
    const advanced = /<[A-Z]/.test(working) || working.includes('```') || /!\[/.test(working) || /^\s*\|/m.test(working) || working.includes('$$') || /\[[^\]]+\]\(/.test(working);
    visual.contentEditable = advanced ? 'false' : 'true'; visual.classList.toggle('is-readonly', advanced);
  }
  if (mode === 'diff') diff.innerHTML = diffHtml(baseline, working);
}

function templateFor(type, projectId, articleSlug, locale, titleValue, descriptionValue) {
  const slugValue = type === 'project' ? 'overview' : articleSlug;
  return `---\ntitle: ${quote(titleValue)}\ndescription: ${quote(descriptionValue)}\nslug: ${slugValue}\nlocale: ${locale}\ncategory: projects\nsubcategory: ${projectId || ''}\ntags: []\npubDate: ${today()}\ndraft: true\nfeatured: false\ntranslationId: ${projectId || 'article'}-${articleSlug || 'overview'}\ntoc: true\n---\n\n## ${titleValue}\n\n${descriptionValue}\n`;
}

function currentLocaleData() {
  const front = entity?.document?.frontmatter || {};
  const localized = entity?.metadata?.locales?.[context.locale] || {};
  return { title: localized.title || front.title || '', description: localized.description || front.description || '' };
}

function setFieldValues() {
  const data = currentLocaleData();
  title.value = data.title || (context.type === 'project' ? (context.locale === 'fa' ? 'پروژهٔ بدون عنوان' : 'Untitled project') : (context.locale === 'fa' ? 'مقالهٔ بدون عنوان' : 'Untitled article'));
  description.value = data.description || '';
  const locales = entity?.metadata?.locales || {};
  titleEn.value = locales.en?.title || (context.locale === 'en' ? title.value : ''); titleFa.value = locales.fa?.title || (context.locale === 'fa' ? title.value : '');
  descriptionEn.value = locales.en?.description || (context.locale === 'en' ? description.value : ''); descriptionFa.value = locales.fa?.description || (context.locale === 'fa' ? description.value : '');
  slug.value = context.mode === 'new' ? (context.type === 'article' ? '' : '') : (context.type === 'project' ? context.project : entity?.document?.frontmatter?.slug || '');
  slug.readOnly = context.mode !== 'new';
  tags.value = Array.isArray(entity?.document?.frontmatter?.tags) ? entity.document.frontmatter.tags.join(', ') : '';
  draft.checked = context.mode === 'new' || entity?.document?.frontmatter?.draft === true;
  const metadata = entity?.metadata || {};
  icon.value = metadata.icon || ''; publication.value = metadata.publication || 'requires-review'; favorite.checked = Boolean(metadata.favorite ?? metadata.featured); favoriteAt.value = metadata.favoriteAt ? String(metadata.favoriteAt).slice(0, 10) : '';
  const isProject = context.type === 'project';
  document.querySelector('#advanced').classList.toggle('hidden', !isProject);
  parentSection.classList.toggle('hidden', context.type !== 'article');
  bilingualFields.classList.toggle('hidden', context.mode !== 'new'); bilingualDescriptions.classList.toggle('hidden', context.mode !== 'new');
  if (context.type === 'article') parent.innerHTML = `<strong>${escapeHtml(context.project || '')}</strong><span>${context.locale === 'fa' ? 'مقاله در پروژهٔ والد' : 'Article in the parent project'}</span>`;
}

function renderHeader() {
  const isFa = context.locale === 'fa'; text = isFa ? copy.fa : copy.en;
  document.documentElement.lang = context.locale; document.documentElement.dir = isFa ? 'rtl' : 'ltr';
  $('#back-link').textContent = text.back; $('#back-link').href = context.returnPath || `/${context.locale}/blog/`;
  $('#editor-heading').textContent = context.mode === 'new' ? (context.type === 'project' ? (isFa ? 'پروژهٔ جدید' : 'New project') : (isFa ? 'مقالهٔ جدید' : 'New article')) : (isFa ? 'ویرایش محتوا' : 'Edit content');
  $('#save-top').textContent = text.save; $('#publish-top').textContent = text.publish; $('#save-bottom').textContent = text.save; $('#publish-bottom').textContent = text.publish;
  const titleValue = context.type === 'blog' ? (isFa ? 'وبلاگ' : 'Blog') : context.project || (isFa ? 'مقاله' : 'Article');
  $('#breadcrumbs').innerHTML = `<a href="/${context.locale}/blog/">${isFa ? 'وبلاگ' : 'Blog'}</a><span aria-hidden="true">/</span><strong>${escapeHtml(titleValue)}</strong>`;
  if (context.type === 'article') $('#breadcrumbs').insertAdjacentHTML('beforeend', `<span aria-hidden="true">/</span><strong>${escapeHtml(context.slug || (isFa ? 'مقالهٔ جدید' : 'New article'))}</strong>`);
  const switchPath = locale => `${location.pathname}?locale=${locale}`;
  $('#locale-en').href = switchPath('en'); $('#locale-fa').href = switchPath('fa');
}

function renderEntity() {
  working = entity?.source || (context.type === 'blog' ? '' : templateFor(context.type, context.project, context.type === 'article' ? '' : 'overview', context.locale, '', ''));
  baseline = working; source.value = working; setFieldValues(); renderHeader(); renderMode(); setDirty(false); setStatus('');
  const recoveryKey = `easy-content:recovery:${location.pathname}${location.search}`; const recovery = localStorage.getItem(recoveryKey);
  if (recovery && recovery !== baseline && confirm(text.recovery)) { working = recovery; source.value = working; setDirty(true); }
  if (localStorage.getItem('easy-content:onboarding:v2') !== 'acknowledged') $('#notice').classList.add('is-visible');
}

function renderTree(tree) {
  const target = $('#tree'); target.replaceChildren();
  if (!tree.length) { target.innerHTML = `<p class="empty">${text.noProjects}</p>`; return; }
  for (const project of tree) {
    const item = document.createElement('a'); item.className = 'tree-item'; item.href = `/dev/content/edit/project/${project.id}?locale=${context.locale}`; item.setAttribute('aria-current', context.type === 'project' && context.project === project.id ? 'page' : 'false');
    item.innerHTML = `<span>${escapeHtml(project.title)}</span>${project.draft ? `<small class="tree-draft">${text.draft}</small>` : ''}`; target.append(item);
    if (project.children?.length) { const list = document.createElement('ul'); for (const child of project.children) { const childItem = document.createElement('a'); childItem.className = 'tree-item'; childItem.href = `/dev/content/edit/article/${project.id}/${child.slug}?locale=${context.locale}`; childItem.setAttribute('aria-current', context.type === 'article' && context.project === project.id && context.slug === child.slug ? 'page' : 'false'); childItem.innerHTML = `<span>${escapeHtml(child.title)}</span>${child.draft ? `<small class="tree-draft">${text.draft}</small>` : ''}`; const li = document.createElement('li'); li.append(childItem); list.append(li); } const wrapper = document.createElement('ul'); wrapper.append(...[...list.children]); target.append(wrapper); }
  }
}

function metadataPayload() {
  if (context.type !== 'project') return undefined;
  const next = structuredClone(entity?.metadata || {});
  next.locales = { ...next.locales, en: { ...next.locales?.en, title: titleEn.value || title.value, description: descriptionEn.value || description.value }, fa: { ...next.locales?.fa, title: titleFa.value || title.value, description: descriptionFa.value || description.value } };
  next.icon = icon.value.trim() || undefined; next.publication = publication.value; next.favorite = favorite.checked; next.favoriteAt = favorite.checked ? (favoriteAt.value || today()) : null;
  return next;
}

function sourceFrontmatter() {
  return { title: title.value, description: description.value, tags: tags.value.split(',').map(value => value.trim()).filter(Boolean) };
}

async function save(publish = false) {
  try {
    if (context.mode === 'new') {
      const titles = { en: titleEn.value || title.value, fa: titleFa.value || title.value };
      const descriptions = { en: descriptionEn.value || description.value, fa: descriptionFa.value || description.value };
      const payload = { title: titles, description: descriptions, locales: ['en', 'fa'], locale: context.locale, tags: tags.value.split(',').map(value => value.trim()).filter(Boolean), body: bodyOnly(working) };
      const result = context.type === 'project'
        ? await request('create-project', { method: 'POST', body: JSON.stringify({ ...payload, id: slug.value || title.value, icon: icon.value.trim() || undefined, favorite: favorite.checked, favoriteAt: favoriteAt.value || undefined }) })
        : await request('create-article', { method: 'POST', body: JSON.stringify({ ...payload, project: context.project, slug: slug.value || title.value }) });
      location.assign(result.editorRoute || result.route); return;
    }
    const result = await request('save', { method: 'POST', body: JSON.stringify({ context, source: working, metadata: metadataPayload(), frontmatter: sourceFrontmatter(), expectedRevision: entity.revision, publish }) });
    entity = result.entity; context.mode = 'edit'; baseline = entity.source; working = entity.source; source.value = working; setFieldValues(); setDirty(false); localStorage.removeItem(`easy-content:recovery:${location.pathname}${location.search}`); setStatus(text.savedMessage); if (publish) location.assign(context.returnPath);
  } catch (error) { setStatus(error.status === 409 ? text.conflict : error.message, true); }
}

function insertAtSelection(value) {
  const start = source.selectionStart ?? working.length; const end = source.selectionEnd ?? start; source.setRangeText(value, start, end, 'select'); working = source.value; setDirty(true); renderMode(); source.focus();
}

function prepareVisualEdit() { if (!visualChanged) return; working = `---\n${Object.entries(parseFrontmatter(working).fields).map(([key, value]) => `${key}: ${Array.isArray(value) ? JSON.stringify(value) : quote(value)}`).join('\n')}\n---\n${htmlToMarkdown(visual.innerHTML)}`; source.value = working; visualChanged = false; }

async function upload(file) {
  const reader = new FileReader(); reader.onload = async () => { try { const result = await request('upload-asset', { method: 'POST', body: JSON.stringify({ filename: file.name, contentType: file.type, data: String(reader.result).split(',')[1], project: context.project }) }); $('#media-result').textContent = result.publicUrl; insertAtSelection(`\n\n![${file.name}](${result.publicUrl})\n\n`); } catch (error) { setStatus(error.message, true); } }; reader.readAsDataURL(file);
}

function insertMedia(url) { if (url) insertAtSelection(`\n\n![Image](${url})\n\n`); }

async function boot() {
  try {
    const result = await fetch(`${api}/context?path=${encodeURIComponent(location.pathname + location.search)}`).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || text.unsupported); return data; });
    token = result.token; context = result.context; text = context.locale === 'fa' ? copy.fa : copy.en;
    if (context.mode !== 'new') entity = (await request(`read?context=${encodeURIComponent(JSON.stringify(context))}`)).entity;
    renderEntity(); renderTree((await request(`tree?locale=${context.locale}`)).tree || []); const media = (await request('media')).media || []; existingMedia.replaceChildren(new Option(context.locale === 'fa' ? 'انتخاب تصویر موجود' : 'Choose existing media', ''), ...media.map(url => new Option(url, url))); app.setAttribute('aria-busy', 'false');
  } catch (error) { app.innerHTML = `<main style="max-width:44rem;margin:12vh auto;padding:2rem"><p style="color:#dc2626;font-weight:700">${escapeHtml(error.message)}</p><a href="/">${escapeHtml(text.back)}</a></main>`; }
}

document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
$('#theme-toggle').addEventListener('click', () => { const dark = document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', dark ? 'dark' : 'light'); });
$('#dismiss-notice').addEventListener('click', () => { $('#notice').classList.remove('is-visible'); localStorage.setItem('easy-content:onboarding:v2', 'acknowledged'); });
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { prepareVisualEdit(); mode = button.dataset.mode; renderMode(); }));
source.addEventListener('input', () => { working = source.value; setDirty(true); renderMode(); });
visual.addEventListener('input', () => { visualChanged = true; setDirty(true); setStatus(context.locale === 'fa' ? 'تغییرات بصری ذخیره نشده است.' : 'Visual changes are unsaved.'); });
document.querySelectorAll('[data-insert]').forEach(button => button.addEventListener('click', () => insertAtSelection(button.dataset.insert)));
$('#heading-style').addEventListener('change', event => { const value = event.target.value; if (value === 'paragraph') return; insertAtSelection(`${value} `); event.target.value = 'paragraph'; });
$('#block-picker').addEventListener('change', event => { if (blocks[event.target.value]) insertAtSelection(`\n\n${blocks[event.target.value]}\n\n`); event.target.value = ''; });
['title', 'description', 'tags', 'title-en', 'title-fa', 'description-en', 'description-fa', 'slug', 'icon', 'favorite-at'].forEach(id => $(`#${id}`).addEventListener('input', () => setDirty(true)));
['draft', 'favorite', 'publication'].forEach(id => $(`#${id}`).addEventListener('change', () => setDirty(true)));
['save-top', 'save-bottom'].forEach(id => $(`#${id}`).addEventListener('click', () => { prepareVisualEdit(); save(false); }));
['publish-top', 'publish-bottom'].forEach(id => $(`#${id}`).addEventListener('click', () => { prepareVisualEdit(); save(true); }));
$('#upload').addEventListener('change', event => { const file = event.target.files?.[0]; if (file) upload(file); event.target.value = ''; });
existingMedia.addEventListener('change', event => { insertMedia(event.target.value); event.target.value = ''; });
source.addEventListener('dragover', event => event.preventDefault());
source.addEventListener('drop', event => { event.preventDefault(); const file = event.dataTransfer?.files?.[0]; if (file?.type.startsWith('image/')) upload(file); });
source.addEventListener('paste', event => { const file = [...(event.clipboardData?.files || [])].find(item => item.type.startsWith('image/')); if (file) { event.preventDefault(); upload(file); } });
$('#validate-top').addEventListener('click', async () => { try { const result = await request('validate'); setStatus(`${text.validate}: ${result.validate} ${result.links}`); } catch (error) { setStatus(error.message, true); } });
$('#git-top').addEventListener('click', async () => { try { const result = await request('git-status'); setStatus(`${text.changes}\n${result.status}\n${result.diff}`); } catch (error) { setStatus(error.message, true); } });
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); prepareVisualEdit(); save(false); } });
for (const id of iconIds) { const option = document.createElement('option'); option.value = id; $('#icon-list').append(option); }
boot();
