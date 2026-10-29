import { execFileSync, spawn } from 'node:child_process';
import { resolve } from 'node:path';

const astroCli = resolve('node_modules/astro/astro.js');
execFileSync(process.execPath, ['scripts/media-publish.mjs'], { cwd: process.cwd(), stdio: 'inherit' });
const child = spawn(process.execPath, [astroCli, 'dev', ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: { ...process.env, EASY_CONTENT_MODE: 'true' },
  stdio: 'inherit',
  windowsHide: false,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
