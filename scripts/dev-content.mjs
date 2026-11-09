import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { runNode } from './process-runner.mjs';
execFileSync(process.execPath, ['scripts/media-publish.mjs'], { stdio: 'inherit', windowsHide: true });
runNode([resolve('node_modules/astro/astro.js'), 'dev', ...(!process.argv.includes('--host') ? ['--host', '127.0.0.1'] : []), ...process.argv.slice(2)], { ...process.env, EASY_CONTENT_MODE: 'true' });
