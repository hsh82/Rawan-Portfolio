import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';

const loaded = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const enabled = (process.env.EASY_CONTENT_MODE ?? loaded.EASY_CONTENT_MODE) === 'true';
const astro = resolve('node_modules/astro/astro.js');
const command = enabled ? ['scripts/dev-content.mjs', ...process.argv.slice(2)] : [astro, 'preview', ...process.argv.slice(2)];

if (enabled) console.warn('\nEasy Content preview is local authoring mode. It serves source files through Astro dev so writes and unsaved previews work; the production dist artifact remains unchanged and write-free.\n');
const child = spawn(process.execPath, command, { cwd: process.cwd(), env: { ...process.env, ...(enabled ? { EASY_CONTENT_MODE: 'true' } : {}) }, stdio: 'inherit', windowsHide: false });
child.on('exit', (code, signal) => signal ? process.kill(process.pid, signal) : process.exit(code ?? 1));
