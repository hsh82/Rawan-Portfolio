import { guideForContext, renderAiWritingGuide } from './ai-writing-guide.js';
import { renderMermaidDiagrams } from '/src/components/blog/mermaid-renderer.js';

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
const $ = selector => document.querySelector(selector);
const app = $('#app');
const source = $('#source');
const visual = $('#visual');
const diff = $('#diff');
const state = $('#state');
const statusMessage = $('#status-message');
let token = '';
let context = null;
let entity = null;
let activeTab = 'general';
let activeLocale = 'en';
let mode = 'source';
let dirtyGeneral = false;
let dirtyLocales = new Set();
let text = {};
let iconCatalog = [];
let previewSerial = 0;
const editorLocale = new URLSearchParams(location.search).get('locale') === 'fa' ? 'fa' : 'en';
const editorLink = path => `${path}${path.includes('?') ? '&' : '?'}locale=${editorLocale}`;

const copy = {
  en: { back:'← Back', loading:'Loading', draft:'Draft', published:'Published', unsaved:'Unsaved changes', saved:'Saved to the local working tree. Review with Git before committing.', conflict:'This content changed outside Easy Content. Reload it before saving.', validate:'Validation complete', changes:'Git changes loaded.', noProjects:'No projects yet.', recovery:'A local recovery copy was found. Restore it?', saveDraft:'Save draft', saveChanges:'Save changes', publish:'Publish', unpublish:'Unpublish', general:'General', english:'English', persian:'Persian', incomplete:'Incomplete', ready:'Ready' },
  fa: { back:'بازگشت ←', loading:'در حال بارگذاری', draft:'پیش‌نویس', published:'منتشرشده', unsaved:'تغییرات ذخیره‌نشده', saved:'در پوشهٔ کاری ذخیره شد. پیش از commit آن را با Git بررسی کنید.', conflict:'این محتوا بیرون از Easy Content تغییر کرده است. ابتدا آن را دوباره بارگذاری کنید.', validate:'اعتبارسنجی کامل شد', changes:'تغییرات Git بارگذاری شد.', noProjects:'هنوز پروژه‌ای وجود ندارد.', recovery:'یک نسخهٔ بازیابی محلی پیدا شد. آن را برگردانم؟', saveDraft:'ذخیرهٔ پیش‌نویس', saveChanges:'ذخیرهٔ تغییرات', publish:'انتشار', unpublish:'لغو انتشار', general:'تنظیمات عمومی', english:'انگلیسی', persian:'فارسی', incomplete:'ناقص', ready:'آماده' },
};

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }
function quote(value) { return JSON.stringify(String(value ?? '')); }
function today() { return new Date().toISOString().slice(0, 10); }
function iconSvg(entry) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of entry.node || []) { const element = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [key, value] of Object.entries(attrs || {})) element.setAttribute(key, String(value)); svg.append(element); }
  return svg;
}
function renderIconPicker() {
  const grid = $('#icon-picker-grid');
  if (!grid) return;
  const query = ($('#icon-search')?.value || '').trim().toLocaleLowerCase();
  const selected = ($('#icon')?.value || '').trim();
  const visible = iconCatalog.filter(icon => !query || `${icon.id} ${icon.label} ${icon.keywords}`.toLocaleLowerCase().includes(query));
  grid.replaceChildren(...visible.map(icon => {
    const button = document.createElement('button'); button.type = 'button'; button.className = `icon-option${icon.id === selected ? ' is-selected' : ''}`; button.dataset.iconId = icon.id; button.setAttribute('role', 'option'); button.setAttribute('aria-selected', String(icon.id === selected)); button.title = `${icon.label} (${icon.id})`;
    button.append(iconSvg(icon)); const label = document.createElement('span'); label.className = 'icon-option__label'; label.textContent = icon.label; button.append(label);
    button.addEventListener('click', () => { $('#icon').value = icon.id; applySharedFieldToSources('icon', icon.id); dirtyGeneral = true; renderGeneral(); renderState(); });
    return button;
  }));
}
function renderIconDatalist() { const list = $('#icon-list'); if (!list) return; list.replaceChildren(...iconCatalog.map(icon => { const option = document.createElement('option'); option.value = icon.id; option.label = icon.label; return option; })); }
function parseFrontmatter(value) {
  const match = String(value).match(/^---\s*\n([\s\S]*?)\n---(?:\n|$)/);
  const fields = {};
  if (!match) return { fields, body: String(value) };
  for (const line of match[1].split('\n')) {
    const item = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
    if (!item) continue;
    let parsed = item[2].replace(/^['"]|['"]$/g, '');
    try { parsed = JSON.parse(item[2]); } catch { /* scalar string */ }
    fields[item[1]] = parsed;
  }
  return { fields, body: String(value).slice(match[0].length) };
}
function updateFrontmatter(sourceValue, updates) {
  const sourceText = String(sourceValue);
  const match = sourceText.match(/^(?:\ufeff|[ \t]*(?:\r\n|\n|\r))*---[ \t]*(?:\r\n|\n|\r)([\s\S]*?)(?:\r\n|\n|\r)---(?:(?:\r\n|\n|\r)|$)/);
  if (!match) return `---\n${Object.entries(updates).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => `${key}: ${Array.isArray(value) ? JSON.stringify(value) : quote(value)}`).join('\n')}\n---\n${sourceText.replace(/^(?:\ufeff|[ \t]*(?:\r\n|\n|\r))*/, '\n')}`;
  const lineEnding = sourceText.includes('\r\n') ? '\r\n' : '\n';
  const lines = match[1].split(/\r\n|\n|\r/);
  const used = new Set();
  const next = [];
  for (const line of lines) {
    const key = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*/)?.[1];
    if (key && Object.prototype.hasOwnProperty.call(updates, key)) {
      used.add(key);
      if (updates[key] !== null && updates[key] !== undefined) next.push(`${key}: ${Array.isArray(updates[key]) ? JSON.stringify(updates[key]) : quote(updates[key])}`);
    } else next.push(line);
  }
  for (const [key, value] of Object.entries(updates)) if (value !== undefined && value !== null && !used.has(key)) next.push(`${key}: ${Array.isArray(value) ? JSON.stringify(value) : quote(value)}`);
  const prefix = sourceText.match(/^(?:\ufeff|[ \t]*(?:\r\n|\n|\r))*/)?.[0] || '';
  return `${prefix}---${lineEnding}${next.join(lineEnding)}${lineEnding}---${lineEnding}${sourceText.slice(match[0].length).replace(/^(?:\r\n|\n|\r)?/, lineEnding)}`;
}
function bodyOnly(value) { return parseFrontmatter(value).body; }
function visualInline(value) { return escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>'); }
function visualHtml(value) {
  const lines = bodyOnly(value).trim().split('\n'); let html = ''; let code = []; let inCode = false; let list = null;
  const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const line of lines) {
    if (line.startsWith('```')) { if (inCode) { html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`; code = []; inCode = false; } else inCode = true; continue; }
    if (inCode) { code.push(line); continue; }
    if (!line.trim()) { closeList(); continue; }
    if (/^\s*<[A-Z]/.test(line) || /^\s*!\[/.test(line) || /^\s*\$\$/.test(line) || /^\s*\|/.test(line)) { closeList(); html += `<div class="easy-unsupported">${escapeHtml(line.trim())}</div>`; continue; }
    const heading = line.match(/^(#{2,4})\s+(.+)$/); if (heading) { closeList(); html += `<h${heading[1].length}>${visualInline(heading[2])}</h${heading[1].length}>`; continue; }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/); const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (bullet || numbered) { const wanted = numbered ? 'ol' : 'ul'; if (list !== wanted) { closeList(); html += `<${wanted}>`; list = wanted; } html += `<li>${visualInline((bullet || numbered)[1])}</li>`; continue; }
    if (line.startsWith('> ')) { closeList(); html += `<blockquote>${visualInline(line.slice(2))}</blockquote>`; continue; }
    closeList(); html += `<p>${visualInline(line)}</p>`;
  }
  closeList(); return html || '<p class="empty">Nothing to preview yet.</p>';
}
function diffHtml(before, after) {
  const oldLines = String(before).split('\n'); const newLines = String(after).split('\n'); const rows = []; const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i += 1) { if (oldLines[i] === newLines[i]) rows.push(escapeHtml(`  ${oldLines[i] || ''}`)); else { if (oldLines[i] !== undefined) rows.push(`<span class="diff-removed">${escapeHtml(`- ${oldLines[i]}`)}</span>`); if (newLines[i] !== undefined) rows.push(`<span class="diff-added">${escapeHtml(`+ ${newLines[i]}`)}</span>`); } }
  return rows.join('\n') || 'No changes';
}
function request(path, options = {}) { return fetch(`${api}/${path}`, { ...options, headers: { 'Content-Type':'application/json', 'x-easy-content-token':token, ...(options.headers || {}) } }).then(async response => { const data = await response.json(); if (!response.ok) throw Object.assign(new Error(data.error || 'Easy Content request failed'), { status:response.status }); return data; }); }
function templateFor(type, project, slug, locale, title = '', description = '') {
  const realSlug = type === 'project' ? 'overview' : slug;
  return `---\nkind: article\ntitle: ${quote(title)}\ndescription: ${quote(description)}\nslug: ${realSlug}\nlocale: ${locale}\ncategory: projects\nsubcategory: ${project || ''}\ntags: []\npubDate: ${today()}\ndraft: true\nfeatured: false\ntranslationId: ${project || 'article'}-${realSlug}\ntoc: true\n---\n\n## ${title}\n\n${description}\n`;
}
function localeBuffer(locale) { return entity?.locales?.[locale] || { source:templateFor(context.type, context.project, context.slug === 'new' ? '' : context.slug, locale), document:{frontmatter:{}}, revision:'' }; }
function markDirty(locale = null) { if (locale) dirtyLocales.add(locale); else dirtyGeneral = true; state.textContent = text.unsaved; if (activeLocale) localStorage.setItem(`easy-content:recovery:${context?.id || 'new'}`, JSON.stringify(collectPayload(false))); }
function isDirty() { return dirtyGeneral || dirtyLocales.size > 0; }
function setStatus(message, error = false) { statusMessage.textContent = message || ''; statusMessage.classList.toggle('is-error', error); }
function currentStatus() { return entity?.shared?.status === 'published' ? 'published' : 'draft'; }
function syncActiveFields() {
  if (activeTab !== 'en' && activeTab !== 'fa') return;
  const buffer = localeBuffer(activeLocale); const sourceValue = source.value;
  const changed = sourceValue !== buffer.source;
  const fields = parseFrontmatter(sourceValue).fields;
  buffer.source = sourceValue; buffer.title = fields.title || ''; buffer.description = fields.description || ''; buffer.document = { frontmatter: fields };
  entity.locales[activeLocale] = buffer; if (changed) dirtyLocales.add(activeLocale);
}
function sourceFields(locale) { return parseFrontmatter(localeBuffer(locale).source).fields; }
function sharedMediaFromSources() {
  const fields = Object.fromEntries(['en', 'fa'].map(locale => [locale, sourceFields(locale)]));
  const shared = {};
  for (const field of ['image', 'icon']) {
    const present = ['en', 'fa'].filter(locale => Object.prototype.hasOwnProperty.call(fields[locale], field));
    if (present.length) shared[field] = fields[present[0]][field] || null;
  }
  const imageAlt = {};
  for (const locale of ['en', 'fa']) if (Object.prototype.hasOwnProperty.call(fields[locale], 'imageAlt')) imageAlt[locale] = fields[locale].imageAlt || null;
  if (Object.keys(imageAlt).length) shared.imageAlt = imageAlt;
  return shared;
}
function applySharedFieldToSources(field, value) {
  const nextValue = value.trim() || null;
  for (const locale of ['en', 'fa']) {
    const buffer = localeBuffer(locale);
    buffer.source = updateFrontmatter(buffer.source, { [field]: nextValue });
    buffer.document = { frontmatter: parseFrontmatter(buffer.source).fields };
    entity.locales[locale] = buffer;
    dirtyLocales.add(locale);
    if (locale === activeLocale) source.value = buffer.source;
  }
  renderMode();
}
function sharedForm() {
  const category = $('#category').value.trim();
  const media = sharedMediaFromSources();
  const shared = { ...entity.shared, ...media, status:currentStatus(), slug:$('#slug').value.trim(), category:context.type === 'project' ? 'projects' : category, pubDate:$('#pub-date').value || today(), tags:$('#tags').value.split(',').map(value => value.trim()).filter(Boolean), featured:$('#featured').checked, toc:$('#toc').checked };
  if (!Object.prototype.hasOwnProperty.call(media, 'image')) shared.image = $('#image').value.trim() || null;
  if (!Object.prototype.hasOwnProperty.call(media, 'icon')) shared.icon = $('#icon').value.trim() || null;
  if (context.type === 'project') shared.project = { category, favorite:$('#favorite').checked, favoriteAt:$('#favorite').checked ? ($('#favorite-at').value || today()) : null };
  return shared;
}
function collectPayload(publish, unpublish = false) {
  syncActiveFields();
  const locales = Object.fromEntries(['en','fa'].map(locale => ({ [locale]: { source:localeBuffer(locale).source } })).map(item => Object.entries(item)[0]));
  return { context, shared:sharedForm(), locales, expectedRevision:entity?.revision, publish, unpublish };
}
function renderState() {
  const status = currentStatus(); state.textContent = isDirty() ? text.unsaved : (status === 'published' ? text.published : text.draft); $('#save-top').textContent = status === 'published' ? text.saveChanges : text.saveDraft; $('#save-bottom').textContent = $('#save-top').textContent; $('#publish-top').textContent = text.publish; $('#publish-bottom').textContent = text.publish; $('#publish-top').disabled = false; $('#publish-bottom').disabled = false; $('#unpublish-top').classList.toggle('hidden', status !== 'published');
  for (const locale of ['en','fa']) { const complete = Boolean(localeBuffer(locale).title && localeBuffer(locale).description && localeBuffer(locale).source); $(`#${locale}-badge`).textContent = complete ? `· ${text.ready}` : `· ${text.incomplete}`; }
}
function renderGeneral() {
  const shared = entity.shared || {}; const metadata = entity.metadata || {};
  $('#slug').value = context.mode === 'new' ? '' : (shared.slug || context.project || context.slug || ''); $('#slug').readOnly = true; $('#slug').closest('.field').classList.toggle('hidden', context.mode === 'new'); $('#status').value = currentStatus(); $('#pub-date').value = String(shared.pubDate || today()).slice(0,10); $('#tags').value = (shared.tags || []).join(', '); $('#category').value = context.type === 'project' ? (metadata.projectCategory || metadata.category || 'devops-delivery') : (shared.category || (context.type === 'blog' ? 'blog' : 'projects')); $('#image').value = shared.image || metadata.image || ''; $('#icon').value = shared.icon || metadata.icon || ''; $('#featured').checked = Boolean(shared.featured); $('#toc').checked = shared.toc !== false;
  renderIconPicker();
  $('#project-settings').classList.toggle('hidden', context.type !== 'project'); $('#favorite').checked = Boolean(metadata.favorite || shared.favorite); $('#favorite-at').value = metadata.favoriteAt ? String(metadata.favoriteAt).slice(0,10) : ''; $('#parent').textContent = context.type === 'article' ? `Parent project: ${context.project}` : '';
}
function renderLocale() {
  const buffer = localeBuffer(activeLocale); $('#active-locale-label').textContent = activeLocale === 'fa' ? text.persian : text.english; for (const id of ['localized-title', 'localized-description']) { const field = $(`#${id}`)?.closest('.field'); if (field) field.classList.add('hidden'); } source.value = buffer.source || ''; visual.setAttribute('dir', activeLocale === 'fa' ? 'rtl' : 'ltr'); renderMode();
}
function renderTabs() { document.querySelectorAll('[data-entity-tab]').forEach(tab => { const active = tab.dataset.entityTab === activeTab; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); }); $('#general-panel').classList.toggle('hidden', activeTab !== 'general'); $('#locale-panel').classList.toggle('hidden', activeTab === 'general'); }
async function renderPreview() { const serial = ++previewSerial; visual.innerHTML = '<p class="empty">Rendering preview…</p>'; try { const result = await request('preview', { method:'POST', body:JSON.stringify({ source:source.value, locale:activeLocale }) }); if (serial !== previewSerial || mode !== 'visual') return; visual.innerHTML = result.html || '<p class="empty">Nothing to preview yet.</p>'; await renderMermaidDiagrams(visual); } catch (error) { if (serial !== previewSerial) return; visual.innerHTML = `<p class="easy-unsupported">Preview error: ${escapeHtml(error.message)}</p>${visualHtml(source.value)}`; } }
function renderMode() { source.classList.toggle('hidden', mode !== 'source'); visual.classList.toggle('hidden', mode !== 'visual'); diff.classList.toggle('hidden', mode !== 'diff'); $('#source-toolbar').classList.toggle('hidden', mode !== 'source'); document.querySelectorAll('[data-mode]').forEach(tab => { const active = tab.dataset.mode === mode; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); }); if (mode === 'visual') renderPreview(); if (mode === 'diff') diff.innerHTML = diffHtml(localeBuffer(activeLocale).source, source.value); }
function renderHeader() { const isFa = activeLocale === 'fa'; document.documentElement.lang = isFa ? 'fa' : 'en'; document.documentElement.dir = isFa ? 'rtl' : 'ltr'; $('#back-link').textContent = text.back; $('#back-link').href = context.returnPath || '/en/blog/'; const title = context.type === 'blog' ? (isFa ? 'وبلاگ' : 'Blog') : context.project || (isFa ? 'مقاله' : 'Article'); $('#breadcrumbs').innerHTML = `<a href="/${isFa ? 'fa' : 'en'}/blog/">${isFa ? 'وبلاگ' : 'Blog'}</a><span aria-hidden="true">/</span><strong>${escapeHtml(title)}</strong>`; $('#editor-heading').textContent = context.mode === 'new' ? (context.type === 'project' ? (isFa ? 'پروژهٔ جدید' : 'New project') : (isFa ? 'مقالهٔ جدید' : 'New article')) : (isFa ? 'ویرایش محتوای دوزبانه' : 'Bilingual content editor'); $('#delete-top').classList.toggle('hidden', context.mode === 'new' || !['project','article'].includes(context.type)); }
function renderEntity() { renderHeader(); renderGeneral(); renderLocale(); renderTabs(); renderState(); const guide = guideForContext({ surface:'blog', context, entity, locale:activeLocale }); renderAiWritingGuide($('#ai-writing-guide'), guide); setStatus(''); }
function renderTree(tree) { const target = $('#tree'); target.replaceChildren(); if (!tree.length) { target.innerHTML = `<p class="empty">${text.noProjects}</p>`; return; } for (const project of tree) { const item = document.createElement('a'); item.className='tree-item'; item.href=editorLink(`/dev/content/edit/project/${project.id}/`); item.innerHTML=`<span>${escapeHtml(project.title)}<small class="tree-draft">${escapeHtml(project.titleFa || '')}</small></span>${project.draft ? `<small class="tree-draft">${text.draft}</small>` : ''}`; target.append(item); if (project.children?.length) { const list=document.createElement('ul'); for (const child of project.children) { const li=document.createElement('li'); const childItem=document.createElement('a'); childItem.className='tree-item'; childItem.href=editorLink(`/dev/content/edit/article/${project.id}/${child.slug}/`); childItem.innerHTML=`<span>${escapeHtml(child.title)}</span>${child.draft ? `<small class="tree-draft">${text.draft}</small>` : ''}`; li.append(childItem); list.append(li); } target.append(list); } } }
async function save(publish = false, unpublish = false) { try { if (context.mode === 'new') { syncActiveFields(); const shared=sharedForm(); const payload={ title:{en:localeBuffer('en').title || parseFrontmatter(localeBuffer('en').source).fields.title || 'New project', fa:localeBuffer('fa').title || parseFrontmatter(localeBuffer('fa').source).fields.title || 'پروژهٔ جدید'}, description:{en:localeBuffer('en').description || '', fa:localeBuffer('fa').description || ''}, locales:['en','fa'], locale:activeLocale, tags:shared.tags, image:shared.image, imageAlt:shared.imageAlt, icon:shared.icon, body:bodyOnly(localeBuffer(activeLocale).source), project:context.project, category:$('#category').value.trim() || 'devops-delivery', favorite:$('#favorite').checked, favoriteAt:$('#favorite-at').value || undefined, publish }; const result=context.type==='project' ? await request('create-project',{method:'POST',body:JSON.stringify(payload)}) : await request('create-article',{method:'POST',body:JSON.stringify(payload)}) ; location.assign(result.editorRoute || result.route); return; } const result=await request('save',{method:'POST',body:JSON.stringify(collectPayload(publish,unpublish))}); entity=result.entity; dirtyGeneral=false; dirtyLocales.clear(); context.mode='edit'; renderEntity(); localStorage.removeItem(`easy-content:recovery:${context.id}`); setStatus(text.saved); if (publish) location.assign(context.returnPath); } catch (error) { setStatus(error.status === 409 ? text.conflict : error.message, true); } }
function insertAtSelection(value) { const start=source.selectionStart ?? source.value.length; const end=source.selectionEnd ?? start; source.setRangeText(value,start,end,'select'); syncActiveFields(); entity.locales[activeLocale].source=source.value; markDirty(activeLocale); renderMode(); source.focus(); }
async function upload(file) { const reader=new FileReader(); reader.onload=async()=>{ try { const result=await request('upload-asset',{method:'POST',body:JSON.stringify({filename:file.name,contentType:file.type,data:String(reader.result).split(',')[1],project:context.project})}); $('#media-result').textContent=`Uploaded ${result.publicUrl}; card image selected.`; $('#image').value=result.reference; applySharedFieldToSources('image',result.reference); insertAtSelection(`\n\n![${file.name}](${result.publicUrl})\n\n`); dirtyGeneral=true; renderGeneral(); renderState(); } catch(error) { setStatus(error.message,true); } }; reader.readAsDataURL(file); }
async function boot() { try { const contextResult=await fetch(`${api}/context?path=${encodeURIComponent(location.pathname)}`).then(async response=>{ const data=await response.json(); if(!response.ok) throw new Error(data.error || 'unsupported content type'); return data; }); token=contextResult.token; context=contextResult.context; activeLocale=editorLocale; text=copy[editorLocale]; iconCatalog=(await request('icons')).icons || []; renderIconDatalist(); if(context.mode !== 'new') entity=(await request(`read?context=${encodeURIComponent(JSON.stringify(context))}`)).entity; else { const slug=context.type==='project' ? 'overview' : ''; entity={type:context.type,id:context.id,project:context.project,shared:{id:context.id,kind:context.type==='project'?'overview':'article',slug,status:'draft',category:'projects',pubDate:today(),tags:[],featured:false,toc:true},metadata:{},locales:{en:{source:templateFor(context.type,context.project,slug,'en'),title:'',description:''},fa:{source:templateFor(context.type,context.project,slug,'fa'),title:'',description:''}},revision:''}; } renderEntity(); renderTree((await request('tree')).tree || []); const media=(await request('media')).media || []; const options=media.map(url=>new Option(url,url)); $('#existing-media').replaceChildren(new Option('Choose existing media',''),...options.map(option=>option.cloneNode(true))); $('#card-image').replaceChildren(new Option('Choose existing media',''),...options); app.setAttribute('aria-busy','false'); } catch(error) { app.innerHTML=`<main style="max-width:44rem;margin:12vh auto;padding:2rem"><p style="color:#dc2626;font-weight:700">${escapeHtml(error.message)}</p><a href="/">${escapeHtml(text.back || 'Back')}</a></main>`; } }

document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark'); $('#theme-toggle').addEventListener('click',()=>{const dark=document.documentElement.classList.toggle('dark');localStorage.setItem('theme',dark?'dark':'light');}); $('#dismiss-notice').addEventListener('click',()=>{ $('#notice').classList.add('hidden'); localStorage.setItem('easy-content:onboarding:v3','acknowledged'); });
document.querySelectorAll('[data-entity-tab]').forEach(tab=>tab.addEventListener('click',()=>{ syncActiveFields(); activeTab=tab.dataset.entityTab; if(activeTab==='en'||activeTab==='fa') activeLocale=activeTab; renderEntity(); })); document.querySelectorAll('[data-mode]').forEach(tab=>tab.addEventListener('click',()=>{ syncActiveFields(); mode=tab.dataset.mode; renderMode(); })); source.addEventListener('input',()=>{ const parsed=parseFrontmatter(source.value); const buffer=localeBuffer(activeLocale); buffer.source=source.value; buffer.title=parsed.fields.title || ''; buffer.description=parsed.fields.description || ''; buffer.document={frontmatter:parsed.fields}; entity.locales[activeLocale]=buffer; $('#localized-title').value=buffer.title; $('#localized-description').value=buffer.description; markDirty(activeLocale); renderMode(); }); ['localized-title','localized-description'].forEach(id=>$('#'+id).addEventListener('input',()=>{syncActiveFields();markDirty(activeLocale);renderMode();})); ['image','icon'].forEach(id=>$('#'+id).addEventListener('input',()=>{applySharedFieldToSources(id,$('#'+id).value); dirtyGeneral=true; renderGeneral(); renderState();})); $('#icon-search').addEventListener('input',renderIconPicker); ['pub-date','tags','category','favorite-at'].forEach(id=>$('#'+id).addEventListener('input',()=>{dirtyGeneral=true;renderState();})); ['status','featured','toc','favorite'].forEach(id=>$('#'+id).addEventListener('change',()=>{dirtyGeneral=true;renderState();})); document.querySelectorAll('[data-insert]').forEach(button=>button.addEventListener('click',()=>insertAtSelection(button.dataset.insert))); $('#block-picker').addEventListener('change',event=>{if(blocks[event.target.value])insertAtSelection(`\n\n${blocks[event.target.value]}\n\n`);event.target.value='';}); ['save-top','save-bottom'].forEach(id=>$('#'+id).addEventListener('click',()=>save(false))); ['publish-top','publish-bottom'].forEach(id=>$('#'+id).addEventListener('click',()=>save(true))); $('#unpublish-top').addEventListener('click',()=>save(false,true)); $('#upload').addEventListener('change',event=>{const file=event.target.files?.[0];if(file)upload(file);event.target.value='';}); $('#existing-media').addEventListener('change',event=>{if(event.target.value)insertAtSelection(`\n\n![Image](${event.target.value})\n\n`);event.target.value='';}); $('#card-image').addEventListener('change',event=>{if(event.target.value){$('#image').value=event.target.value;applySharedFieldToSources('image',event.target.value);dirtyGeneral=true;renderGeneral();renderState();}event.target.value='';}); $('#validate-top').addEventListener('click',async()=>{try{const result=await request('validate');setStatus(`${text.validate}: ${result.validate} ${result.links}`);}catch(error){setStatus(error.message,true);}}); $('#git-top').addEventListener('click',async()=>{try{const result=await request('git-status');setStatus(`${text.changes}\n${result.status}\n${result.diff}`);}catch(error){setStatus(error.message,true);}}); document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();save(false);}}); window.addEventListener('beforeunload',event=>{if(isDirty()){event.preventDefault();event.returnValue='';}}); boot();
