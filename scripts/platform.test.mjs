import assert from 'node:assert/strict';
import { test } from 'node:test';
import { browserCandidates, findChromium, printPdf } from './chromium.mjs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('browser discovery supports overrides, spaces, common OS paths and missing browsers', () => {
  assert.deepEqual(browserCandidates('win32', { CHROME_BIN: 'C:/Browser With Spaces/chrome.exe' }), ['C:/Browser With Spaces/chrome.exe']);
  assert.ok(browserCandidates('darwin', {}).some(file => file.includes('Google Chrome.app')));
  assert.ok(browserCandidates('win32', { PROGRAMFILES: 'C:/Program Files' }).some(file => file.includes('chrome.exe')));
  assert.ok(browserCandidates('linux', { PATH: '/bin:/usr/bin' }).includes('/usr/bin/chromium'));
  assert.match(findChromium({ env: { CHROME_BIN: '/browser path/chrome' }, probe: () => true }), /browser path/);
  assert.throws(() => findChromium({ env: {}, probe: () => false }), /CHROME_BIN/);
  assert.throws(() => printPdf('/nonexistent/chrome', [], '/nonexistent/out.pdf'), /launch failed/);
});

test('file URL round trips preserve spaces, Unicode and reserved characters', () => {
  const file = join(tmpdir(), 'Résumé path #1', 'متن.html');
  assert.equal(fileURLToPath(pathToFileURL(file)), file);
});

test('process wrapper preserves failed child exit codes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rawan process '));
  try {
    const child = join(dir, 'failure.mjs');
    writeFileSync(child, 'process.exit(37)');
    const runner = new URL('./process-runner.mjs', import.meta.url).href;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `import {runNode} from ${JSON.stringify(runner)};runNode([${JSON.stringify(child)}]);`]);
    assert.equal(result.status, 37);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
