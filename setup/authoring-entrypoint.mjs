import { cp, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const contentRoot = '/app/content';
const templateRoot = '/app/.content-template';
const requiredPaths = [
  'site.json', 'profile.json', 'home.json', 'contact.json', 'resume/config.json',
  'experience/entries.json', 'education/entries.json', 'certifications/entries.json',
  'skills/entries.json', 'journey/entries.json', 'projects/entries.json',
  'blog/landing/entry.json', 'blog/landing/en.mdx', 'blog/landing/fa.mdx',
];

async function meaningfulEntries(directory) {
  if (!existsSync(directory)) return [];
  return (await readdir(directory, { withFileTypes: true }))
    .filter(entry => !['.gitkeep', '.DS_Store'].includes(entry.name))
    .map(entry => entry.name);
}

async function initializeContent() {
  await mkdir(contentRoot, { recursive: true });
  const entries = await meaningfulEntries(contentRoot);
  if (!entries.length) {
    if (!existsSync(templateRoot)) throw new Error('The immutable starter content template is missing from the image.');
    await cp(templateRoot, contentRoot, { recursive: true, errorOnExist: false, force: false });
    console.log('Initialized the empty content bind mount from the immutable starter template.');
    return;
  }

  const missing = [];
  for (const relativePath of requiredPaths) {
    if (!existsSync(`${contentRoot}/${relativePath}`)) missing.push(relativePath);
  }
  if (missing.length) {
    throw new Error(`The mounted content directory is partially populated and is missing required files: ${missing.join(', ')}. Restore the checkout or start with an explicitly empty content directory; existing files were not changed.`);
  }
}

export { initializeContent, meaningfulEntries, requiredPaths };

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  await initializeContent();
  const child = spawn('npm', ['run', 'dev:content', '--', '--host', process.env.HOST || '0.0.0.0', '--port', process.env.PORT || '4321'], {
    cwd: '/app',
    env: { ...process.env, EASY_CONTENT_MODE: 'true' },
    stdio: 'inherit',
  });
  const forward = signal => child.kill(signal);
  process.on('SIGINT', () => forward('SIGINT'));
  process.on('SIGTERM', () => forward('SIGTERM'));
  child.once('error', error => { console.error(`Unable to start Easy Content: ${error.message}`); process.exitCode = 1; });
  child.once('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGTERM' ? 143 : 1); });
}
