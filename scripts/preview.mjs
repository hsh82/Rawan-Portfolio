import { resolve } from 'node:path';
import { runNode } from './process-runner.mjs';
const args = process.argv.slice(2);
const enabled = args.includes('--content');
const forwarded = args.filter(arg => arg !== '--content');
if (enabled) console.warn('Easy Content preview serves source through Astro dev for local authoring. The static dist preview remains read-only.');
runNode(enabled ? ['scripts/dev-content.mjs', ...forwarded] : [resolve('node_modules/astro/astro.js'), 'preview', ...forwarded], { ...process.env, EASY_CONTENT_MODE: enabled ? 'true' : 'false' });
