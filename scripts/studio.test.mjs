import { rm } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { parseJsonBuffer } from '../src/dev/easy-content/editor/json-normalize.mjs';
import { resourceTemplate, validateResourceValue } from '../src/dev/easy-content/server/resource-validation.mjs';
import { createPreviewSession, previewSession } from '../src/dev/easy-content/server/preview-sessions.mjs';
import { writeStudioFixture } from './studio-fixture.mjs';

const original = process.cwd();
const fixture = mkdtempSync(join(tmpdir(), 'Rawan studio tests '));
await writeStudioFixture(join(fixture, 'content'));
process.chdir(fixture);
const { easyContentMiddleware, renderPreview } = await import('../src/dev/easy-content/server/middleware.mjs');
const { writeTransaction, safePath, assertLocalRequest } = await import('../src/dev/easy-content/server/security.mjs');
const middleware = easyContentMiddleware();
const server = createServer((req, res) => { req.url = req.url.replace('/api/', '/'); middleware(req, res, () => { res.statusCode = 404; res.end(); }); });
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}/api/`;
const context = await (await fetch(base + 'context?path=/dev/content/')).json();
const headers = { 'Content-Type': 'application/json', 'x-easy-content-token': context.token };
const get = async name => (await fetch(base + name, { headers })).json();
const post = async (name, body, extra = {}) => { const response = await fetch(base + name, { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) }); return { status: response.status, data: await response.json() }; };
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); process.chdir(original); await rm(fixture, { recursive: true, force: true }); });

test('safe JSON normalization preserves strings and rejects ambiguous syntax', () => {
  assert.deepEqual(parseJsonBuffer('\uFEFF ```json\n{"text":"a,}b", "items":[1,2,],}\n``` ').value, { text:'a,}b', items:[1,2] });
  assert.equal(parseJsonBuffer('{"text":"first\nsecond"}').value.text, 'first\nsecond');
  assert.throws(() => parseJsonBuffer('{wrong:1}'), /Invalid JSON/);
  assert.throws(() => parseJsonBuffer('{"id":'), /Invalid JSON/);
  assert.throws(() => parseJsonBuffer('{"id":"first","id":"second"}'), /Duplicate JSON field/);
  assert.deepEqual(parseJsonBuffer('{"en":{"title":"English"},"fa":{"title":"Persian"}}').value,{en:{title:'English'},fa:{title:'Persian'}});
});

test('templates use unchanged application schemas, localized field errors include exact paths', () => {
  for (const resource of ['experience','education','certifications','skills','journey']) validateResourceValue(resource, resourceTemplate(resource));
  assert.throws(() => validateResourceValue('experience', { id:'ok', locales:{en:{title:42},fa:{}} }), error => error.issues[0].path === 'experience.locales.en.title');
  assert.throws(() => validateResourceValue('home', {focus:{en:[],fa:'bad'}}), /home.focus.fa/);
});

test('preview snapshots do not share mutable state and remain bounded', () => {
  const value={data:{home:{title:'original'}},locale:'en'};
  const first=createPreviewSession(value);value.data.home.title='second';
  const second=createPreviewSession(value);
  assert.equal(previewSession(first).data.home.title,'original');
  assert.equal(previewSession(second).data.home.title,'second');
  for(let i=0;i<80;i++)createPreviewSession(value);
  assert.equal(previewSession(first),undefined);
});

test('MDX visual preview rejects executable code and active HTML while preserving safe blocks', async () => {
  globalThis.__rawanPreviewExecuted = false;
  for(const source of ['{globalThis.__rawanPreviewExecuted = true}', 'export const value = process.cwd()', '<script>alert(1)</script>', '<img src="x" onError="alert(1)" />', '<a href={"javascript:alert(1)"}>bad</a>']) await assert.rejects(renderPreview({source}));
  assert.equal(globalThis.__rawanPreviewExecuted,false);
  assert.match(await renderPreview({source:'<MermaidDiagram chart={`flowchart LR; A-->B`} />'}),/data-chart/);
});

test('real API collection create/save/reload/import/delete preserves revisions and canonical data', async () => {
  let entity = (await get('resource?resource=experience')).entity;
  assert.deepEqual(entity.value, []);
  const arraySave = await post('save-resource', {resource:'experience',value:[],expectedRevision:entity.revision});
  assert.equal(arraySave.status,200); assert.deepEqual(arraySave.data.entity.value,[]);
  const first = resourceTemplate('experience','first'); first.extra = {keep:'unsupported authored data'};
  let response = await post('create-resource',{resource:'experience',value:first,expectedRevision:entity.revision});
  assert.equal(response.status,201); entity=response.data.entity;
  assert.equal((await post('create-resource',{resource:'experience',value:first,expectedRevision:entity.revision})).status,400);
  assert.equal((await post('save-resource',{resource:'experience',id:'first',value:{...first,id:'renamed'},expectedRevision:entity.revision})).status,400);
  const before=readFileSync(join(fixture,'content/experience/entries.json'),'utf8');
  assert.equal((await post('save-resource',{resource:'experience',id:'first',value:{...first,locales:{en:{title:99},fa:{}}},expectedRevision:entity.revision})).status,400);
  assert.equal(readFileSync(join(fixture,'content/experience/entries.json'),'utf8'),before);
  first.locales.en.title='Verified fixture title';
  response=await post('save-resource',{resource:'experience',id:'first',value:first,expectedRevision:entity.revision});assert.equal(response.status,200);
  assert.deepEqual(response.data.entity.value,first);
  assert.equal((await post('save-resource',{resource:'experience',id:'first',value:first,expectedRevision:entity.revision})).status,409);
  entity=(await get('resource?resource=experience')).entity;
  response=await post('import-resources',{resource:'experience',value:[resourceTemplate('experience','second')],mode:'append',expectedRevision:entity.revision});assert.equal(response.status,200);assert.equal(response.data.entity.value.length,2);
  entity=response.data.entity;
  response=await post('import-resources',{resource:'experience',value:[{...first,organization:'Updated fixture'}],mode:'update',expectedRevision:entity.revision});assert.equal(response.status,200);assert.equal(response.data.entity.value.length,2);
  entity=response.data.entity;
  assert.equal((await post('import-resources',{resource:'experience',value:[],mode:'replace',expectedRevision:entity.revision})).status,400);
  response=await post('delete-resource',{resource:'experience',id:'second',expectedRevision:entity.revision});assert.equal(response.status,200);
  assert.equal((await get('resource?resource=experience')).entity.value.length,1);
});

test('every structured collection supports a validated create/edit/reload/delete round trip',async()=>{
  for(const resource of ['experience','education','certifications','skills','journey']){
    const root=(await get('resource?resource='+resource)).entity;
    const value=resourceTemplate(resource,'roundtrip-'+resource);
    let result=await post('create-resource',{resource,value,expectedRevision:root.revision});assert.equal(result.status,201,resource);
    value.locales.en.title='Synthetic round trip';value.locales.fa.title='نمونهٔ آزمایشی';
    result=await post('save-resource',{resource,id:value.id,value,expectedRevision:result.data.entity.revision});assert.equal(result.status,200,resource);
    const loaded=(await get('resource?resource='+resource+'&id='+value.id)).entity;assert.deepEqual(loaded.value,value);
    assert.equal((await post('delete-resource',{resource,id:value.id,expectedRevision:loaded.revision})).status,200,resource);
  }
});

test('preview validates without writes; local token/origin/path boundaries remain enforced', async () => {
  const entity=(await get('resource?resource=home')).entity;
  const file=join(fixture,'content/home.json');const before=readFileSync(file,'utf8');
  const response=await post('preview-session',{resource:'home',value:{...entity.value,locales:{en:{title:'Unsaved'},fa:{}}},locale:'en'});
  assert.equal(response.status,200);assert.ok(response.data.id);assert.equal(readFileSync(file,'utf8'),before);
  assert.equal((await post('preview-session',{resource:'home',value:[]}, {'x-easy-content-token':'wrong'})).status,403);
  assert.equal((await post('preview-session',{resource:'home',value:entity.value}, {Origin:'https://evil.example'})).status,400);
  assert.throws(()=>safePath(fixture,'..'),/Unsafe/);
  assert.throws(()=>assertLocalRequest({socket:{remoteAddress:'127.0.0.1'},headers:{host:'evil.example'}}),/loopback Host/);
});

test('deletion blocks real résumé relationships and leaves the record intact',async()=>{
  let journey=(await get('resource?resource=journey')).entity;
  const created=await post('create-resource',{resource:'journey',value:resourceTemplate('journey','linked-journey'),expectedRevision:journey.revision});assert.equal(created.status,201);
  const resume=(await get('resource?resource=resume')).entity;
  assert.equal((await post('save-resource',{resource:'resume',value:{...resume.value,journeyIds:['linked-journey']},expectedRevision:resume.revision})).status,200);
  journey=(await get('resource?resource=journey')).entity;
  const result=await post('delete-resource',{resource:'journey',id:'linked-journey',expectedRevision:journey.revision});assert.equal(result.status,400);assert.match(result.data.error,/referenced/);
  assert.ok((await get('resource?resource=journey')).entity.value.some(item=>item.id==='linked-journey'));
});

test('project homepage preview shares the save validator without persistence or publication changes', async () => {
  const created=await post('create-project',{title:{en:'Preview project',fa:'پروژهٔ پیش‌نمایش'},description:{en:'Synthetic fixture',fa:'نمونهٔ آزمایشی'}});
  assert.equal(created.status,201);
  const context={type:'project',project:'preview-project',id:'preview-project'};
  const entity=(await get('read?context='+encodeURIComponent(JSON.stringify(context)))).entity;
  const file=join(fixture,'content/blog/projects/preview-project/en.mdx');const before=readFileSync(file,'utf8');
  const locales=Object.fromEntries(['en','fa'].map(locale=>[locale,{source:entity.locales[locale].source}]));
  locales.en.source=locales.en.source.replace(/^title:.*$/m,'title: "Unsaved project title"');
  const result=await post('project-preview-session',{context,locales,shared:entity.shared,expectedRevision:entity.revision,locale:'en',publish:true});
  assert.equal(result.status,200);
  const snapshot=previewSession(result.data.id);const project=snapshot.data.projects.find(item=>item.id==='preview-project');
  assert.equal(project.locales.en.title,'Unsaved project title');assert.equal(project.status,'draft');
  assert.equal(readFileSync(file,'utf8'),before);
});

test('transaction failure restores files already replaced', () => {
  const file=join(fixture,'content/rollback.json');writeFileSync(file,'original');
  const second=join(fixture,'content/rollback-second.json');writeFileSync(second,'second original');
  const rename = fs.renameSync;
  fs.renameSync = (from,to) => { if(to === second && from.endsWith('.tmp')) throw new Error('Injected second rename failure'); return rename(from,to); };
  syncBuiltinESMExports();
  try { assert.throws(()=>writeTransaction([{file,source:'changed'},{file:second,source:'changed second'}])); }
  finally { fs.renameSync=rename;syncBuiltinESMExports(); }
  assert.equal(readFileSync(file,'utf8'),'original');assert.equal(readFileSync(second,'utf8'),'second original');
});

test('symlink roots and nested paths cannot escape the canonical boundary',()=>{ const target=join(fixture,'link-target');mkdirSync(target);const link=join(fixture,'content','link');symlinkSync(target,link,process.platform==='win32'?'junction':'dir');assert.throws(()=>safePath(join(fixture,'content'),'link','asset.png'),/Symlink/);assert.throws(()=>safePath(link,'asset.png'),/Symlink/);});

test('whole-file saves replace all five collection arrays and reject broken references',async()=>{
  for(const resource of ['experience','education','certifications','skills','journey']){
    let entity=(await get('resource?resource='+resource)).entity;
    const item=resourceTemplate(resource,'file-test-'+resource);
    let result=await post('save-resource',{resource,value:[...entity.value,item],expectedRevision:entity.revision});assert.equal(result.status,200,resource);
    entity=result.data.entity;item.locales.en.title='Edited in whole file';
    result=await post('save-resource',{resource,value:entity.value.map(record=>record.id===item.id?item:record),expectedRevision:entity.revision});assert.equal(result.status,200,resource);
    entity=result.data.entity;
    assert.equal((await post('save-resource',{resource,value:[...entity.value,item],expectedRevision:entity.revision})).status,400);
    result=await post('save-resource',{resource,value:entity.value.filter(record=>record.id!==item.id),expectedRevision:entity.revision});assert.equal(result.status,200,resource);
    assert.equal((await post('save-resource',{resource,value:{},expectedRevision:result.data.entity.revision})).status,400);
  }
  const journey=(await get('resource?resource=journey')).entity;
  const result=await post('save-resource',{resource:'journey',value:journey.value.filter(record=>record.id!=='linked-journey'),expectedRevision:journey.revision});assert.equal(result.status,400);assert.match(result.data.error,/references missing record/);
});


test('Focus projection previews without writes and saves without replacing other homepage fields', async () => {
  const home = (await get('resource?resource=home')).entity;
  const focus = (await get('resource?resource=focus')).entity;
  const file = join(fixture, 'content/home.json');
  const before = readFileSync(file, 'utf8');
  assert.equal(focus.revision, home.revision);
  assert.ok(focus.value.heading.fa.title);
  focus.value.en = [{ title: 'Synthetic focus', description: 'Preview only' }];
  focus.value.heading.en.title = 'Synthetic focus heading';
  const preview = await post('preview-session', { resource: 'focus', value: focus.value, locale: 'en' });
  assert.equal(preview.status, 200);
  assert.equal(readFileSync(file, 'utf8'), before);
  const saved = await post('save-resource', { resource: 'focus', value: focus.value, expectedRevision: focus.revision });
  assert.equal(saved.status, 200);
  const after = (await get('resource?resource=home')).entity;
  assert.deepEqual(after.value, { ...home.value, focus: focus.value });
  assert.equal((await post('save-resource', { resource: 'home', value: home.value, expectedRevision: home.revision })).status, 409);
  assert.equal((await post('preview-session', { resource: 'focus', value: {en: [], fa: 'bad'}, locale: 'fa' })).status, 400);
});
