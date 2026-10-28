import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const source = resolve(root, 'content/media');
const destination = resolve(root, 'public/media');

if (!existsSync(source)) {
  console.log('No content/media directory to publish.');
  process.exit(0);
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
console.log('Published content/media to the generated public media mirror.');
