import { guideForContext, renderAiWritingGuide } from './ai-writing-guide.js';
import { parseJsonBuffer } from './json-normalize.mjs';

const api = '/__easy-content/api';
const $ = selector => document.querySelector(selector);
const catalog = $('#catalog'); const workspace = $('#workspace'); const source = $('#source'); const form = $('#form');
let token = ''; let resources = []; let entity = null; let value = null; let dirty = false; let previewTimer;
const locale = new URLSearchParams(location.search).get('locale') === 'fa' ? 'fa' : 'en';
const ui = locale === 'fa' ? {
  site: '← سایت', title: 'استودیو محتوای آسان', loading: 'در حال بارگذاری…', save: 'ذخیرهٔ تغییرات', source: 'منبع JSON', general: 'عمومی', english: 'انگلیسی', persian: 'فارسی', preview: 'پیش‌نمایش واقعی سایت', refresh: 'تازه‌سازی', importPortrait: 'وارد کردن پرتره', sourceActions: 'ابزارهای منبع', description: 'فایل JSON اصلی را مستقیماً ویرایش کنید. اسناد وبلاگ و پروژه ویرایشگر دوزبانهٔ جداگانه دارند.', jsonHint: 'JSON اصلی را در پایین ویرایش کنید. اسناد وبلاگ و پروژه ویرایشگر دوزبانهٔ خود را دارند.', emptyTitle: 'استودیو محتوا', emptyText: 'یک فایل یا رکورد اصلی محتوا را انتخاب کنید. تغییرات تا زمان commit در working tree محلی شما باقی می‌مانند.', groups: { Site: 'سایت', Career: 'مسیر حرفه‌ای', Publishing: 'انتشار' }, resources: { site: 'تنظیمات سایت', profile: 'پروفایل و پرتره', home: 'محتوای صفحهٔ اصلی', contact: 'ارتباط', resume: 'تنظیمات رزومه', experience: 'تجربه', education: 'تحصیلات', certifications: 'گواهی‌ها', skills: 'مهارت‌ها', journey: 'مسیر حرفه‌ای' }, blog: 'صفحهٔ وبلاگ', newProject: 'پروژهٔ جدید', portraitSaved: 'پرتره بارگذاری و در پروفایل ذخیره شد.'
} : {
  site: '← Site', title: 'Easy Content Studio', loading: 'Loading…', save: 'Save Changes', source: 'JSON Source', general: 'General', english: 'English', persian: 'Persian', preview: 'Real Site Preview', refresh: 'Refresh', importPortrait: 'Import portrait', sourceActions: 'Source actions', description: 'Edit the canonical JSON source directly. Blog and project documents use the dedicated bilingual editor.', jsonHint: 'Edit the canonical JSON below. Blog and project documents have their own bilingual editor.', emptyTitle: 'Content Studio', emptyText: 'Choose a canonical content file or record. Changes stay in your local working tree until you commit them.', groups: { Site: 'Site', Career: 'Career', Publishing: 'Publishing' }, resources: { site: 'Site settings', profile: 'Profile & portrait', home: 'Homepage content', contact: 'Contact', resume: 'Résumé settings', experience: 'Experience', education: 'Education', certifications: 'Certifications', skills: 'Skills', journey: 'Journey' }, blog: 'Blog landing', newProject: 'New project', portraitSaved: 'Portrait uploaded and saved to the profile.'
};
function label(en, fa) { return locale === 'fa' ? fa : en; }
const isCollection = () => entity?.kind === 'collection' && !entity.id && !creating;
let creating = false, busy = false, previewVersion = 0;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currentPath = (resource, id) => `/dev/content/edit/resource/${resource}${id ? '/' + id : ''}/?locale=${locale}`;
function status(message, error = false) {
  $('#message').textContent = message || '';
  $('#message').classList.toggle('error', error);
  $('#state').textContent = error ? label('Needs attention', 'نیاز به بررسی') : dirty ? label('Unsaved changes', 'تغییرات ذخیره نشده') : label('Saved', 'ذخیره شد');
}
async function request(name, options = {}) {
  const response = await fetch(`${api}/${name}`, { ...options, headers: {'Content-Type':'application/json', 'x-easy-content-token':token, ...options.headers} });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed'), { issues: data.issues || [], status: response.status });
  return data;
}
const post = (name, payload) => request(name, { method:'POST', body:JSON.stringify(payload) });
function showError(error) {
  status(error.message, true);
  $('#issues').replaceChildren(...(error.issues || []).map(issue => { const li=document.createElement('li'); li.textContent=`${issue.path} — ${issue.message}`; return li; }));
}
function applyLocale() {
  document.documentElement.lang = locale; document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  $('.top__group a').textContent = ui.site; $('.top__group a').href = `/${locale}/`;
  $('.top__group strong').textContent = ui.title; $('#save').textContent = ui.save;
  $('#ai-open').textContent = label('AI Assistant', 'دستیار نگارش');
  $('#more summary').textContent = label('More Actions', 'عملیات بیشتر');
  $('#new').textContent = label('Add item', 'افزودن رکورد');
  $('#delete').textContent = label('Delete', 'حذف');
  $('#format').textContent = label('Format / Repair JSON', 'قالب‌بندی / اصلاح JSON');
  $('#validate').textContent = label('Validate Content', 'اعتبارسنجی محتوا');
  $('#git').textContent = label('View Git Changes', 'تغییرات گیت');
  $('#restore-id').textContent = label('Restore selected ID', 'بازیابی شناسهٔ انتخاب‌شده');
  $('#import-mode').setAttribute('aria-label', label('Import operation', 'عملیات ورود داده'));
  $('#import-mode').options[0].textContent = label('Append new records', 'افزودن رکوردهای جدید');
  $('#import-mode').options[1].textContent = label('Update existing records', 'ویرایش رکوردهای موجود');
  $('#import').textContent = label('Review import', 'بررسی ورود داده');
  $('#expand-preview').textContent = label('Expand preview', 'بزرگ‌کردن پیش‌نمایش');
  $('#preview-locale').value = locale; $('#empty h1').textContent=ui.emptyTitle; $('#empty .lede').textContent=ui.emptyText; $('#profile-import').firstChild.textContent=ui.importPortrait; $('#theme').setAttribute('aria-label',label('Toggle editor theme','Toggle editor theme')); 
  $('#preview-viewport').options[0].textContent = label('Desktop', 'دسکتاپ');
  $('#preview-viewport').options[1].textContent = label('Mobile', 'موبایل');
  $('.preview__bar strong').textContent = ui.preview; $('#refresh-preview').textContent = ui.refresh;
  $('#ai-close').textContent = label('Close', 'بستن');
}
function renderCatalog() {
  const groups = new Map();
  for(const item of resources) groups.set(item.group,[...(groups.get(item.group)||[]),item]);
  catalog.innerHTML = [...groups].map(([group,items]) => `<h2>${escape(ui.groups[group] || group)}</h2>${items.map(item=>`<a href="${currentPath(item.id)}">${escape(ui.resources[item.id] || item.label)} (${item.count})</a>`).join('')}`).join('') + `<h2>${ui.groups.Publishing}</h2><a href="/dev/content/edit/blog/?locale=${locale}">${ui.blog}</a><a href="/dev/content/new/project/?locale=${locale}">${ui.newProject}</a>`;
}
function payload() {
  const parsed = parseJsonBuffer(source.value);
  if (entity?.id && typeof parsed.value?.id === 'string' && parsed.value.id.trim() === entity.id) parsed.value.id = entity.id;
  value = parsed.value;
  return { resource:entity.resource, id:creating ? null : entity.id, value, expectedRevision:entity.revision };
}
function renderWorkspace() {
  const collection = isCollection();
  $('#title').textContent = (ui.resources[entity.resource] || entity.definition.label) + (entity.id ? ` · ${entity.id}` : '');
  $('#crumb').textContent = entity.kind;
  $('#description').textContent = collection ? label('Select a record, add an item, or explicitly import records. IDs preserve links across your portfolio.', 'یک رکورد انتخاب کنید، رکورد جدید بسازید یا داده وارد کنید. شناسه‌ها پیوندها را حفظ می‌کنند.') : ui.jsonHint;
  $('#new').classList.toggle('hidden', entity.kind !== 'collection');
  $('#delete').classList.toggle('hidden', !entity.id);
  $('#restore-id').classList.toggle('hidden', !entity.id);
  $('#import-tools').classList.toggle('hidden', !collection);
  $('#save').disabled = collection;
  $('#save').title = collection ? label('Select a record or use Review import.', 'یک رکورد انتخاب کنید یا داده وارد کنید.') : '';
  source.classList.remove('hidden'); source.value = collection ? '' : JSON.stringify(value,null,2);
  source.placeholder = collection ? label('Paste an array here to import; choose Append or Update explicitly.', 'برای ورود داده آرایه را اینجا قرار دهید و عملیات را انتخاب کنید.') : '';
  const list = $('#record-list'); list.replaceChildren();
  if(collection) {
    if(!value.length) {
      const p=document.createElement('p'); p.className='notice'; p.textContent=label(`No ${entity.resource} records yet. Add item starts a hidden bilingual record. Fill only verified facts. Required fields: id and locales.en/fa; Skills also needs category; Journey needs type.`, 'هنوز رکوردی وجود ندارد. با افزودن رکورد، نمونهٔ دوزبانهٔ مخفی ساخته می‌شود. فقط اطلاعات تأییدشده بنویسید. شناسه و دو زبان لازم است؛ مهارت به دسته و مسیر به نوع نیاز دارد.'); list.append(p);
      const example=document.createElement('pre'); example.textContent=JSON.stringify(entity.definition.template || resources.find(r=>r.id===entity.resource).template,null,2); list.append(example);
    }
    for(const item of value) { const a=document.createElement('a'); a.className='button'; a.href=currentPath(entity.resource,item.id); a.textContent=`${item.id} · ${item.locales?.[locale]?.title || ''}`; list.append(a); }
  }
  $('#profile-import').classList.toggle('hidden', entity.resource !== 'profile');
  renderAiWritingGuide($('#ai-writing-guide'), { ...guideForContext({surface:'home',resource:entity.resource,locale,entity:{value,template:entity.definition.template}}), locale });
}
async function loadEntity(resource,id) {
  previewVersion++; clearTimeout(previewTimer); creating=false;
  entity=(await request(`resource?resource=${encodeURIComponent(resource)}${id?'&id='+encodeURIComponent(id):''}`)).entity;
  entity.definition.template = resources.find(r=>r.id===resource)?.template;
  value=structuredClone(entity.value); dirty=false;
  $('#empty').classList.add('hidden'); workspace.classList.remove('hidden'); renderWorkspace();
  await refreshPreview();
}
function markDirty() {
  dirty=true; previewVersion++; clearTimeout(previewTimer);
  $('#preview-state').textContent=label('Preview updating…', 'در حال به‌روزرسانی پیش‌نمایش…');
  status(label('Unsaved changes', 'تغییرات ذخیره نشده'));
  previewTimer=setTimeout(refreshPreview,400);
}
async function refreshPreview() {
  if(!entity) return;
  const version=++previewVersion;
  try {
    let input;
    if(isCollection() && !source.value.trim()) input={resource:entity.resource,value:entity.value};
    else if(creating) {
      const draft=payload(); input={...draft,value:[...entity.value,draft.value],id:null};
    } else input={...payload(), ...(isCollection()?{mode:$('#import-mode').value}:{})};
    const result=await post('preview-session',{...input,locale:$('#preview-locale').value});
    if(version!==previewVersion) return;
    $('#preview').src=`/dev/content/preview/${$('#preview-locale').value}/${encodeURIComponent(result.id)}/`;
    $('#preview-state').textContent=label('Latest valid local preview', 'آخرین پیش‌نمایش معتبر محلی');
    $('#issues').replaceChildren();
  } catch(error) {
    if(version!==previewVersion) return;
    $('#preview-state').textContent=label('Preview outdated — fix the errors. Last valid preview retained.', 'پیش‌نمایش قدیمی است؛ خطاها را اصلاح کنید. آخرین نمای معتبر حفظ شد.');
    showError(error);
  }
}
async function operation(action) {
  if(busy) return; busy=true; $('#save').disabled=true;
  try { await action(); } catch(error) { showError(error); } finally { busy=false; $('#save').disabled=isCollection(); }
}
async function save() {
  return operation(async()=>{
    const input=payload(); const buffer=source.value;
    if(isCollection()) throw new Error(label('Select a record, or import with Append / Update.', 'یک رکورد انتخاب کنید یا از ورود داده استفاده کنید.'));
    const result=await post(creating?'create-resource':'save-resource',input);
    if(source.value!==buffer) { entity.revision=result.entity.revision; status(label('Saved earlier buffer; newer edits are unsaved.', 'نسخهٔ قبلی ذخیره شد؛ تغییرات جدید ذخیره نشده‌اند.')); return; }
    entity=result.entity; value=structuredClone(entity.value); creating=false;dirty=false;renderWorkspace();
    history.replaceState(null,'',currentPath(entity.resource,entity.id));
    status(label('Saved locally. Review Git changes before committing.', 'در فایل محلی ذخیره شد. تغییرات گیت را بررسی کنید.')); await refreshPreview();
  });
}
async function create() {
  if(dirty && !confirm(label('Discard current unsaved edits to start a new record?', 'تغییرات ذخیره‌نشده کنار گذاشته شود؟'))) return;
  await loadEntity(entity.resource); creating=true;
  const raw=prompt(label('Proposed new ID:', 'شناسهٔ پیشنهادی:')); if(!raw) {creating=false;renderWorkspace();return;}
  let id=raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'');
  if(!id) return status(label('Use lowercase Latin letters, numbers and hyphens.', 'از حروف لاتین کوچک، اعداد و خط تیره استفاده کنید.'),true);
  const base=id;let n=2;while(entity.value.some(item=>item.id===id))id=`${base}-${n++}`;
  if(raw!==id && !confirm(label(`Use normalized unique ID "${id}"?`, `شناسهٔ یکتای «${id}» استفاده شود؟`))) {creating=false;renderWorkspace();return;}
  value={...structuredClone(resources.find(r=>r.id===entity.resource).template),id};
  renderWorkspace();markDirty();
}
async function remove() {
  if(!entity?.id || !confirm(label(`Delete ${entity.id}? Unsaved edits will be lost.`, `رکورد ${entity.id} حذف شود؟ تغییرات ذخیره‌نشده از بین می‌رود.`))) return;
  await operation(async()=>{await post('delete-resource',{resource:entity.resource,id:entity.id,expectedRevision:entity.revision});dirty=false;location.href=currentPath(entity.resource);});
}
async function importRecords() {
  await operation(async()=>{
    const input=payload(); const mode=$('#import-mode').value;
    if(!Array.isArray(input.value)) throw new Error(label('Import expects an array of records.', 'ورود داده به آرایهٔ رکوردها نیاز دارد.'));
    if(!confirm(label(`${mode}: ${input.value.length} record(s). Other records are preserved. Continue?`, `${input.value.length} رکورد با عملیات ${mode} وارد شود؟ سایر رکوردها حفظ می‌شوند.`)))return;
    await post('import-resources',{...input,mode});dirty=false;await loadEntity(entity.resource);
  });
}
function format() {
  try {const parsed=parseJsonBuffer(source.value); const candidate=JSON.stringify(parsed.value,null,2); if(parsed.changes.length && !confirm(parsed.changes.join('\n')+'\n'+label('Apply these syntax changes?', 'این اصلاحات اعمال شود؟')))return;source.value=candidate;markDirty();}
  catch(error){showError(error);}
}
function viewport() { $('.preview').dataset.viewport=$('#preview-viewport').value; }
function expand() { const panel=$('.preview'); const expanded=panel.classList.toggle('expanded'); $('#expand-preview').textContent=expanded?label('Exit expanded preview','بستن نمای بزرگ'):label('Expand preview','بزرگ‌کردن پیش‌نمایش'); $('#expand-preview').setAttribute('aria-expanded',String(expanded)); }
$('#save').addEventListener('click',save);$('#new').addEventListener('click',create);$('#delete').addEventListener('click',remove);
source.addEventListener('input',markDirty);$('#import').addEventListener('click',importRecords);$('#format').addEventListener('click',format);
$('#restore-id').addEventListener('click',()=>{try{const parsed=parseJsonBuffer(source.value);if(confirm(label(`Restore ID to ${entity.id}?`,'شناسهٔ اصلی بازیابی شود؟'))){parsed.value.id=entity.id;source.value=JSON.stringify(parsed.value,null,2);markDirty();}}catch(error){showError(error);}});
$('#validate').addEventListener('click',()=>operation(async()=>{await post('validate-resource',payload());status(label('Content is valid. It has not been saved.', 'محتوا معتبر است؛ هنوز ذخیره نشده است.'));}));
$('#git').addEventListener('click',()=>operation(async()=>{const data=await request('git-status');status(data.status+'\n'+data.diff);}));
$('#refresh-preview').addEventListener('click',refreshPreview);$('#preview-locale').addEventListener('change',refreshPreview);$('#preview-viewport').addEventListener('change',viewport);$('#expand-preview').addEventListener('click',expand);
$('#theme').addEventListener('click',()=>document.documentElement.classList.toggle('dark'));
$('#ai-open').addEventListener('click',()=>{ if(entity)renderAiWritingGuide($('#ai-writing-guide'),{...guideForContext({surface:'home',resource:entity.resource,locale,entity:{template:entity.definition.template,value: (()=>{try{return parseJsonBuffer(source.value).value;}catch{return value;}})()}}),locale});$('#ai-dialog').showModal(); });
$('#ai-close').addEventListener('click',()=>$('#ai-dialog').close());
$('#profile-upload').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>operation(async()=>{const result=await post('upload-asset',{filename:file.name,contentType:file.type,data:String(reader.result).split(',')[1],project:'profile'});const parsed=payload();parsed.value.image=result.reference;source.value=JSON.stringify(parsed.value,null,2);markDirty();});reader.readAsDataURL(file);});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && $('.preview').classList.contains('expanded'))expand();});
async function start(){applyLocale();try{token=(await request(`context?path=${encodeURIComponent(location.pathname)}`)).token;resources=(await request('catalog')).resources;renderCatalog();const match=location.pathname.match(/^\/dev\/content\/edit\/resource\/([a-z-]+)(?:\/([a-z0-9-]+))?\/?$/);if(match)await loadEntity(match[1],match[2]);else $('#state').textContent=label('Choose a resource','یک منبع انتخاب کنید');viewport();}catch(error){showError(error);}}
start();

$('#import-mode').addEventListener('change',refreshPreview);
