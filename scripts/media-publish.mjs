import { cp, rm } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const source = resolve(root, 'content/media');
const destination = resolve(root, 'public/media');

await rm(destination, { recursive: true, force: true });
if (!existsSync(source)) {
  console.log('No content/media directory to publish.');
  process.exit(0);
}

await rm(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
await cp(source, destination, { recursive: true });
console.log('Published content/media to the generated public media mirror.');
