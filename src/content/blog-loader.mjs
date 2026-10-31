import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { glob } from 'astro/loaders';
import { normalizeBlogEntryId, parseBlogEntryPath } from '../utils/blog-layout.mjs';
import { isRegisteredIcon } from '../utils/icon-registry.mjs';

function sharedMetadata(filePath) {
  if (!filePath) return {};
  const normalizedPath = filePath.replaceAll('\\', '/');
  const marker = '/content/blog/';
  const relativePath = normalizedPath.includes(marker)
    ? normalizedPath.slice(normalizedPath.indexOf(marker) + marker.length)
    : normalizedPath;
  const parsed = parseBlogEntryPath(relativePath);
  if (parsed.layout !== 'unified') return {};
  const entryFile = join(dirname(filePath), 'entry.json');
  if (!existsSync(entryFile)) return {};
  try {
    const value = JSON.parse(readFileSync(entryFile, 'utf8'));
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

/**
 * The MDX files remain the renderable source for Astro. Shared entity data is
 * merged into collection data at load time, while localized frontmatter keeps
 * the generated compatibility fields required by Astro's MDX renderer.
 */
export function bilingualBlogLoader() {
  const loader = glob({
    pattern: '**/*.mdx',
    base: './content/blog',
    generateId: ({ entry }) => normalizeBlogEntryId(entry),
  });

  return {
    name: 'rawan-bilingual-blog-loader',
    load: async (context) => {
      const originalParseData = context.parseData;
      context.parseData = ({ id, data, filePath }) => {
        const shared = sharedMetadata(filePath);
        const merged = { ...shared, ...data, id };
        for (const field of ['image', 'icon']) if (Object.prototype.hasOwnProperty.call(shared, field)) merged[field] = shared[field];
        if (shared.imageAlt && typeof shared.imageAlt === 'object') merged.imageAlt = shared.imageAlt[data.locale] || data.imageAlt;
        if (!isRegisteredIcon(merged.icon)) delete merged.icon;
        return originalParseData({ id, filePath, data: merged });
      };
      await loader.load(context);
    },
  };
}
