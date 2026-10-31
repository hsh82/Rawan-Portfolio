import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ICON_REGISTRY } from '../../../utils/icon-registry.mjs';
import { repositoryRoot } from './security.mjs';

const lucideIconRoot = resolve(repositoryRoot, 'node_modules/@lucide/astro/src/icons');

function iconNode(lucideName) {
  const file = resolve(lucideIconRoot, `${lucideName}.ts`);
  if (!existsSync(file)) return [];
  const source = readFileSync(file, 'utf8');
  const match = source.match(/createLucideIcon\('[^']+',\s*(\[\[[\s\S]*?\]\])\)\s+as/);
  if (!match) return [];
  try {
    return JSON.parse(match[1]);
  } catch {
    return [];
  }
}

export function iconCatalog() {
  return ICON_REGISTRY.map(icon => ({
    id: icon.id,
    label: icon.label,
    keywords: icon.keywords,
    node: iconNode(icon.lucide),
  }));
}
