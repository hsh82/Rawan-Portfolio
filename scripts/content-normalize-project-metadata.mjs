import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { canonicalProjectMetadata } from '../src/dev/easy-content/server/project-metadata.mjs';
import { contentPath, writeTransaction } from '../src/dev/easy-content/server/security.mjs';

const write = process.argv.includes('--write');
const root = resolve(process.cwd());
const projectRoot = contentPath('blog', 'projects');
const backupRoot = resolve(root, '.easy-content-trash', `metadata-repair-${new Date().toISOString().replace(/[:.]/g, '-')}`);

function targets() {
  const requested = process.argv.slice(2).filter(value => !value.startsWith('--'));
  const ids = requested.length ? requested : (existsSync(projectRoot) ? readdirSync(projectRoot, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name) : []);
  return ids.map(id => contentPath('blog', 'projects', id, 'entry.json')).filter(existsSync);
}

const repairs = [];
for (const file of targets()) {
  const value = JSON.parse(readFileSync(file, 'utf8'));
  if (!Object.prototype.hasOwnProperty.call(value, 'project')) continue;
  repairs.push({ file, source: `${JSON.stringify(canonicalProjectMetadata(value), null, 2)}\n` });
}

if (!repairs.length) {
  console.log('No recursively nested project metadata found.');
  process.exit(0);
}

for (const repair of repairs) console.log(`${write ? 'Repair' : 'Would repair'} ${relative(root, repair.file)}`);
if (!write) {
  console.log('Dry run complete. Re-run with --write after reviewing the listed files.');
  process.exit(0);
}

mkdirSync(backupRoot, { recursive: true });
for (const repair of repairs) {
  const backup = join(backupRoot, relative(root, repair.file));
  mkdirSync(resolve(backup, '..'), { recursive: true });
  copyFileSync(repair.file, backup);
}
writeTransaction(repairs);
console.log(`Repaired ${repairs.length} project metadata file${repairs.length === 1 ? '' : 's'}. Backups: ${relative(root, backupRoot)}`);
