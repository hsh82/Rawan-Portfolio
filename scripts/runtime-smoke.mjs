import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run through npm run test:smoke');
for (const [index, name] of ['dev', 'dev:content', 'preview', 'preview:content'].entries()) {
  const port = 4700 + index;
  const child = spawn(process.execPath, [npmCli, 'run', name, '--', '--host', '127.0.0.1', '--port', String(port)], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (child.exitCode !== null) throw new Error(`${name} exited ${child.exitCode}\n${output}`);
      try { const response = await fetch(`http://127.0.0.1:${port}/en/`); ready = response.ok; } catch {}
      if (ready) break;
      await setTimeout(500);
    }
    assert.ok(ready, `${name} did not start\n${output}`);
    const response = await fetch(`http://127.0.0.1:${port}/__easy-content/api/context?path=/dev/content/`);
    assert.equal(response.ok, name.includes(':content'), `${name} authoring boundary`);
    console.log(`PASS ${process.platform}: ${name} startup + HTTP + authoring boundary`);
  } finally {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
    if (child.exitCode === null) await Promise.race([once(child, 'exit'), setTimeout(5000)]);
  }
  await setTimeout(250);
  await assert.rejects(fetch(`http://127.0.0.1:${port}/en/`), `${name} left a child listening`);
}
