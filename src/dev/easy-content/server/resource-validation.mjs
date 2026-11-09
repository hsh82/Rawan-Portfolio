import { resourceSchemas } from '../../../utils/portfolio-schemas.mjs';

export function contentError(path, message, extra = {}) {
  return Object.assign(new Error(`${path} — ${message}`), { issues: [{ path, message, ...extra }] });
}

export function validateResourceValue(resource, value, { collection = false, id } = {}) {
  const schema = resourceSchemas[resource];
  if (!schema) throw contentError(resource, 'unknown resource');
  if (collection && !Array.isArray(value)) throw contentError(resource, 'expected an array of records. Select a record to edit one object.');
  if (!collection && (!value || typeof value !== 'object' || Array.isArray(value))) throw contentError(resource, 'expected a JSON object. Use Import for an array of records.');
  const records = collection ? value : [value];
  const issues = [];
  records.forEach((record, index) => {
    const prefix = collection ? `${resource}[${index}]` : `${resource}${id ? `[${id}]` : ''}`;
    if (['experience','education','certifications','skills','journey'].includes(resource)) {
      for (const locale of ['en','fa']) if (!record?.locales?.[locale] || typeof record.locales[locale] !== 'object' || Array.isArray(record.locales[locale])) issues.push({ path: `${prefix}.locales.${locale}`, message: 'expected a localized object. Supply verified text or an empty object for a hidden scaffold.' });
    }
    const result = schema.safeParse(record);
    if (!result.success) for (const issue of result.error.issues) issues.push({ path: [prefix, ...issue.path].join('.'), recordId: record?.id, expected: issue.expected, message: `${issue.message}. Correct this field using the resource example.` });
  });
  if (issues.length) throw Object.assign(new Error(issues.map(issue => `${issue.path} — ${issue.message}`).join('\n')), { issues });
  // Deliberately persist the original value: Zod defaults/stripping must never erase unsupported authored fields.
  return value;
}

export function resourceTemplate(resource, id = 'new-item') {
  const value = { id, visible: false, priority: 0, locales: { en: { title: '', description: '' }, fa: { title: '', description: '' } } };
  if (resource === 'skills') value.category = 'cicd';
  if (resource === 'journey') Object.assign(value, { type: 'milestone', projectIds: [], articleIds: [] });
  validateResourceValue(resource, value);
  return value;
}
