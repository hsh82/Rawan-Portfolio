export const PROJECT_EDITABLE_FIELDS = [
  'favorite',
  'favoriteAt',
  'featured',
  'category',
  'secondaryCategories',
  'role',
  'technologies',
  'icon',
  'image',
  'imageAlt',
  'publishedAt',
  'updatedAt',
  'repository',
  'externalUrl',
  'priority',
  'journeyIds',
  'relatedSkillIds',
  'relatedProjectIds',
  'articleIds',
];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Remove only the save-loop wrapper; all canonical root fields remain intact. */
export function canonicalProjectMetadata(value) {
  if (!isObject(value)) throw new Error('Project metadata must be a JSON object');
  const canonical = { ...value };
  delete canonical.project;
  return canonical;
}

function nestedProjectDepth(value) {
  let cursor = value;
  let depth = 0;
  while (isObject(cursor) && Object.prototype.hasOwnProperty.call(cursor, 'project')) {
    depth += 1;
    cursor = cursor.project;
  }
  return depth;
}

export function assertSharedPayload(value, maxDepth = 1) {
  if (!isObject(value)) throw new Error('Shared metadata must be a JSON object');
  if (nestedProjectDepth(value) > maxDepth) throw new Error('Project metadata payload is excessively nested; reload the project before saving');
  return value;
}

/**
 * Extract only fields the bilingual editor is allowed to change. The full
 * canonical record is preserved from disk by saveEntity; this patch cannot
 * replace caseStudy, diagram, relationships, or other unsupported fields.
 */
export function editableProjectPatch(value) {
  if (!isObject(value)) throw new Error('Project metadata must be a JSON object');
  if (nestedProjectDepth(value) > 0) throw new Error('Project metadata must not contain a nested project object');
  const patch = {};
  for (const key of PROJECT_EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(value, key)) patch[key === 'category' ? 'projectCategory' : key] = value[key];
  }
  if (patch.favoriteAt == null) delete patch.favoriteAt;
  return patch;
}
