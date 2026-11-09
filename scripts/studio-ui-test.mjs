import { cp, rm } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { writeStudioFixture } from './studio-fixture.mjs';

const root = process.cwd();
// Keep linked Astro dependencies on the same volume: Astro 5's injected built-in routes
// cannot be relativized across Windows drives. Real checkouts install their own dependencies.
mkdirSync(resolve('.astro'), { recursive: true });
const fixture = mkdtempSync(join(resolve('.astro'), 'Rawan UI staging '));
const browserPath = process.env.CHROME_BIN || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync);
if (!browserPath) throw new Error('Set CHROME_BIN to run real browser tests. No browser is downloaded by npm install.');
let browser;
try {
  for (const entry of ['src','scripts','public','astro.config.mjs','tailwind.config.mjs','tsconfig.json','package.json']) if (existsSync(resolve(entry))) await cp(resolve(entry), join(fixture,entry), {recursive:true});
  await writeStudioFixture(join(fixture,'content'));
  symlinkSync(resolve('node_modules'), join(fixture,'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  // Only the fixture shares dependencies; allow its linked package assets explicitly.
  const config = join(fixture,'astro.config.mjs');
  writeFileSync(config, readFileSync(config,'utf8').replace('clearScreen: false,', `clearScreen: false, server: { fs: { allow: ${JSON.stringify([fixture, resolve('node_modules')])} } },`));
  browser=await chromium.launch({executablePath:browserPath,headless:true});
  for (const [index,command] of ['dev:content','preview:content'].entries()) {
    const port=4900+index, origin=`http://127.0.0.1:${port}`;
    const child=spawn(process.execPath,[process.env.npm_execpath,'run',command,'--','--host','127.0.0.1','--port',String(port)],{cwd:fixture,stdio:['ignore','pipe','pipe'],windowsHide:true,detached:process.platform!=='win32'});
    let log='';child.stdout.on('data',chunk=>{log+=chunk;});child.stderr.on('data',chunk=>{log+=chunk;});
    const page=await browser.newPage({viewport:{width:1600,height:1000}});
    page.setDefaultTimeout(90_000);
    try {
      let ready=false;
      for(let i=0;i<150;i++){try{ready=(await fetch(origin+'/__easy-content/api/context?path=/dev/content/')).ok;}catch{}if(ready)break;if(child.exitCode!==null)break;await setTimeout(400);}
      assert.ok(ready,log);
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      page.on('dialog',dialog=>dialog.type()==='prompt'?dialog.accept('First Experience'):dialog.accept());
      await page.goto(origin+'/dev/content/edit/resource/experience/');
      await page.waitForFunction(()=>{try{return Array.isArray(JSON.parse(document.querySelector('#source').value));}catch{return false;}});
      assert.equal(await page.locator('#new,#delete,#import-tools,#record-list,#description').count(),0);
      assert.equal(await page.inputValue('#preview-viewport'),'mobile');
      assert.deepEqual(JSON.parse(readFileSync(join(fixture,'content/experience/entries.json'))),[]);
      const records=JSON.parse(await page.inputValue('#source'));
      assert.equal(records.length,1);assert.equal(records[0].visible,false);
      records[0].id='first-experience';records[0].locales.en.title='Synthetic experience';records[0].locales.fa.title='تجربهٔ آزمایشی';records[0].visible=true;
      await page.fill('#source',JSON.stringify(records));await page.click('#save');
      await page.waitForFunction(()=>document.querySelector('#state').textContent==='Saved');
      await page.reload();await page.waitForFunction(()=>document.querySelector('#source').value.includes('Synthetic experience'));
      records[0].locales.en.title='Unsaved experience';await page.fill('#source',JSON.stringify(records));
      await page.frameLocator('#preview').getByText('Unsaved experience',{exact:true}).waitFor();
      assert.equal(JSON.parse(readFileSync(join(fixture,'content/experience/entries.json')))[0].locales.en.title,'Synthetic experience');
      records.push({...structuredClone(records[0]),id:'second-experience',visible:false});
      await page.fill('#source',JSON.stringify(records));await page.click('#save');
      await page.waitForFunction(()=>document.querySelector('#state').textContent==='Saved');
      assert.equal(JSON.parse(readFileSync(join(fixture,'content/experience/entries.json'))).length,2);
      records.pop();await page.fill('#source',JSON.stringify(records));await page.click('#save');
      await page.waitForFunction(()=>document.querySelector('#state').textContent==='Saved');
      assert.equal(JSON.parse(readFileSync(join(fixture,'content/experience/entries.json'))).length,1);
      await page.goto(origin+'/dev/content/edit/resource/home/');
      await page.waitForFunction(()=>document.querySelector('#source').value.includes('locales'));
      const before=readFileSync(join(fixture,'content/home.json'),'utf8');
      const home=JSON.parse(await page.inputValue('#source'));home.locales.en.displayName='Live hero title';home.locales.fa.displayName='عنوان زنده';home.about={en:{title:'Live about',description:'About preview fixture',cards:[]},fa:{title:'دربارهٔ آزمایشی',description:'پیش‌نمایش درباره',cards:[]}};home.focus={en:[{title:'Live focus',description:'Focus preview fixture'}],fa:[{title:'تمرکز آزمایشی',description:'نمونه'}]};
      await page.fill('#source',JSON.stringify(home));
      await page.frameLocator('#preview').getByText('Live hero title',{exact:true}).first().waitFor();
      await page.selectOption('#preview-viewport','desktop');
      await page.frameLocator('#preview').locator('#progress-nav').waitFor({state:'visible'});
      await page.frameLocator('#preview').getByText('Live about',{exact:true}).waitFor();
      await page.frameLocator('#preview').getByText('About preview fixture',{exact:true}).waitFor();
      await page.frameLocator('#preview').getByText('Live focus',{exact:true}).waitFor();
      assert.equal((await page.request.get(origin + await page.locator('#preview').getAttribute('src'))).status(),200);
      const good=await page.locator('#preview').getAttribute('src');await page.fill('#source','{"locales":');
      await page.waitForFunction(()=>document.querySelector('#preview-state').textContent.includes('outdated'));
      assert.equal(await page.locator('#preview').getAttribute('src'),good);
      home.locales.en.displayName='Rapid old';await page.fill('#source',JSON.stringify(home));home.locales.en.displayName='Newest edit';await page.fill('#source',JSON.stringify(home));
      await page.frameLocator('#preview').getByText('Newest edit',{exact:true}).first().waitFor();
      await page.selectOption('#preview-locale','fa');await page.frameLocator('#preview').getByText('عنوان زنده',{exact:true}).first().waitFor();
      assert.equal(await page.frameLocator('#preview').locator('html').getAttribute('dir'),'rtl');
      await page.selectOption('#preview-viewport','mobile');assert.equal(await page.locator('#preview').evaluate(el=>el.getBoundingClientRect().width),390);
      const snapshot=await page.locator('#preview').getAttribute('src');await page.click('#expand-preview');assert.ok(await page.locator('.preview').evaluate(el=>el.classList.contains('expanded')));await page.keyboard.press('Escape');
      assert.equal(await page.locator('#preview').getAttribute('src'),snapshot);
      await page.selectOption('#preview-viewport','desktop');assert.equal(await page.locator('#preview').evaluate(el=>el.getBoundingClientRect().width),1280);
      await page.click('#ai-open');await page.locator('#ai-dialog').waitFor({state:'visible'});await page.locator('.ai-guide__copy').click();await page.click('#ai-close');assert.equal(JSON.parse(await page.inputValue('#source')).locales.en.displayName,'Newest edit');
      await page.locator('#more summary').click();await page.click('#format');await page.fill('#source',JSON.stringify(home));
      assert.equal(readFileSync(join(fixture,'content/home.json'),'utf8'),before);
      // Exercise the dedicated bilingual editor and its actual canonical publication state.
      const ctx=await (await page.request.get(origin+'/__easy-content/api/context?path=/dev/content/')).json();
      const auth={'x-easy-content-token':ctx.token};
      const created=await page.request.post(origin+'/__easy-content/api/create-project',{headers:auth,data:{title:{en:'Studio test project',fa:'پروژهٔ آزمایشی'},description:{en:'Synthetic description',fa:'توضیح آزمایشی'}}});
      assert.equal(created.status(),201);
      const editorUrl=origin+'/dev/content/edit/project/studio-test-project/?locale=fa';
      await page.goto(editorUrl);await page.waitForFunction(()=>document.querySelector('#app').getAttribute('aria-busy')==='false');
      await page.click('#ai-open');await page.locator('#ai-dialog').waitFor({state:'visible'});await page.keyboard.press('Escape');
      await page.click('[data-entity-tab="en"]');
      const mdx=await page.inputValue('#source');await page.fill('#source',mdx+'\n\nVerified synthetic body.\n');
      await page.click('#save-top');await page.waitForFunction(()=>document.querySelector('#status-message').textContent.includes('Git'));
      const entry=()=>JSON.parse(readFileSync(join(fixture,'content/blog/projects/studio-test-project/entry.json')));
      assert.equal(entry().status,'draft');
      await page.click('#publish-top');await page.waitForURL(/\/fa\/blog\/projects\//);assert.equal(entry().status,'published');
      await page.goto(editorUrl);await page.waitForFunction(()=>document.querySelector('#app').getAttribute('aria-busy')==='false');
      await page.click('[data-entity-tab="en"]');
      const projectFile=join(fixture,'content/blog/projects/studio-test-project/en.mdx');const savedProject=readFileSync(projectFile,'utf8');
      await page.fill('#source',(await page.inputValue('#source')).replace(/^title:.*$/m,'title: "Unsaved project heading"'));
      await page.click('#homepage-open');await page.selectOption('#homepage-locale','en');
      await page.frameLocator('#homepage-frame').getByText('Unsaved project heading',{exact:true}).first().waitFor();
      assert.equal(readFileSync(projectFile,'utf8'),savedProject);
      await page.click('#homepage-close');
      await page.locator('#more-actions summary').click();await page.click('#unpublish-top');
      await page.waitForFunction(()=>document.querySelector('#status-message').textContent.includes('Git'));assert.equal(entry().status,'draft');
      if(!await page.locator('#more-actions').evaluate(el=>el.open)) await page.locator('#more-actions summary').click();
      await page.click('#delete-top');await page.waitForURL(/\/dev\/content\/$/);assert.equal(existsSync(join(fixture,'content/blog/projects/studio-test-project')),false);
      await page.screenshot({path:join(root,`.astro/studio-${command.replace(':','-')}.png`),fullPage:true});
      assert.deepEqual(errors,[]);
      console.log(`PASS ${command}: collection CRUD + unsaved Hero/About/Focus/Experience + invalid JSON + newest edit + FA/RTL + viewports/expand + AI/menu + MDX draft/publish/unpublish/delete`);
      // Reset only fixture content before exercising the second command.
      await rm(join(fixture,'content'),{recursive:true,force:true});await writeStudioFixture(join(fixture,'content'));
    } catch(error) { console.error(log.slice(-4000)); throw error; }
    finally {
      await page.close({runBeforeUnload:false});
      if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});else try{process.kill(-child.pid,'SIGTERM');}catch{}
    }
  }
} finally { await browser?.close(); await rm(fixture,{recursive:true,force:true,maxRetries:5,retryDelay:500}); }
