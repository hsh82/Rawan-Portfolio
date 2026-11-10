import { cp, rm } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const fixture = mkdtempSync(join(tmpdir(), "Rawan PDF résumé # O'Name "));
try {
  await cp(resolve('content'), join(fixture, 'content'), { recursive: true });
  symlinkSync(resolve('node_modules'), join(fixture, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const write = (file, value) => writeFileSync(join(fixture, 'content', file), JSON.stringify(value));
  const script = fileURLToPath(new URL('./resume-generate.mjs', import.meta.url));
  write('resume/config.json', { enabled: false });
  execFileSync(process.execPath, [script], { cwd: fixture, env: { ...process.env, CHROME_BIN: '/not/installed' } });
  mkdirSync(join(fixture,'content/media/profile'), {recursive:true});
  writeFileSync(join(fixture,'content/media/profile/smoke.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><circle cx="40" cy="40" r="35" fill="blue"/></svg>');
  write('profile.json', { visible: true, name: 'Synthetic test', image: 'media/profile/smoke.svg' });
  write('home.json', { locales: { en: { displayName: 'Synthetic test', title: 'Test résumé', intro: 'Browser smoke fixture.' }, fa: { displayName: 'نمونهٔ آزمایشی', title: 'رزومهٔ آزمایشی', intro: 'آزمون چاپ فارسی.' } } });
  write('contact.json', { email: 'test@example.test' });
  write('resume/config.json', { enabled: true, portrait: true, filenameSlug: 'synthetic-test', locales: ['en', 'fa'] });
  execFileSync(process.execPath, [script], { cwd: fixture, stdio: 'inherit' });
  for (const locale of ['en', 'fa']) for (const name of [`synthetic-test-${locale}`, locale]) {
    const pdf = readFileSync(join(fixture, 'public/resume', `${name}.pdf`));
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.ok(pdf.length > 1000);
  }
  write('resume/config.json', { enabled:true, portrait:true, filenameSlug:'replacement-test', locales:['en'] });
  execFileSync(process.execPath,[script],{cwd:fixture,stdio:'inherit'});
  assert.equal(existsSync(join(fixture,'public/resume/synthetic-test-en.pdf')),false);
  assert.equal(existsSync(join(fixture,'public/resume/fa.pdf')),false);
  write('resume/config.json',{enabled:false});
  execFileSync(process.execPath,[script],{cwd:fixture,env:{...process.env,CHROME_BIN:'/not/installed'}});
  assert.equal(existsSync(join(fixture,'public/resume')),false);
  console.log('PASS disabled + enabled bilingual portrait PDF, aliases and stale-output cleanup');
} finally { await rm(fixture, { recursive: true, force: true }); }
