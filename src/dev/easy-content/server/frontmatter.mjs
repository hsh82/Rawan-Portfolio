const frontmatterPattern = /^---[ \t]*(?:\r\n|\n|\r)([\s\S]*?)(?:\r\n|\n|\r)---(?:(?:\r\n|\n|\r)|$)/;

function lineEndingOf(source) {
  return source.includes('\r\n') ? '\r\n' : source.includes('\r') ? '\r' : '\n';
}

/**
 * Remove only a UTF-8 BOM and blank lines before a valid frontmatter opener.
 * The body is otherwise left byte-for-byte untouched. Malformed documents are
 * returned unchanged so validation still rejects them.
 */
export function normalizeDocumentSource(source) {
  const text = String(source);
  const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const candidate = withoutBom.replace(/^(?:[ \t]*(?:\r\n|\n|\r))+/, '');
  return frontmatterPattern.test(candidate) ? candidate : text;
}

function splitInline(value) {
  const parts = [];
  let current = '';
  let quote = '';
  let depth = 0;
  for (const character of value) {
    if (quote) {
      current += character;
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") { quote = character; current += character; continue; }
    if (character === '[' || character === '{') depth += 1;
    if (character === ']' || character === '}') depth -= 1;
    if (character === ',' && depth === 0) { parts.push(current.trim()); current = ''; } else current += character;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseValue(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return splitInline(trimmed.slice(1, -1)).map(item => item.replace(/^['"]|['"]$/g, ''));
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try { return JSON.parse(trimmed.replaceAll("'", '"')); } catch { return trimmed; }
  }
  return trimmed.replace(/^['"]|['"]$/g, '');
}

function topLevelFields(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  const fields = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
    if (!match) continue;
    let end = index + 1;
    while (end < lines.length && (/^\s+/.test(lines[end]) || !lines[end].trim())) end += 1;
    fields.push({ key: match[1], start: index, end, value: match[2] });
    index = end - 1;
  }
  return fields;
}

export function parseDocument(source) {
  const normalizedSource = normalizeDocumentSource(source);
  const match = normalizedSource.match(frontmatterPattern);
  if (!match) return { frontmatter: {}, order: [], body: normalizedSource, hasFrontmatter: false, rawFrontmatter: '', source: normalizedSource, lineEnding: lineEndingOf(normalizedSource) };
  const frontmatter = {};
  const fields = topLevelFields(match[1]);
  for (const field of fields) frontmatter[field.key] = parseValue(field.value);
  return { frontmatter, order: fields.map(field => field.key), body: normalizedSource.slice(match[0].length), hasFrontmatter: true, rawFrontmatter: match[1], fields, source: normalizedSource, lineEnding: lineEndingOf(normalizedSource) };
}

function serializeValue(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value) || (value && typeof value === 'object')) return JSON.stringify(value);
  return String(value);
}

export function serializeDocument(frontmatter, body, order = Object.keys(frontmatter)) {
  const keys = [...order, ...Object.keys(frontmatter).filter(key => !order.includes(key))].filter(key => frontmatter[key] !== undefined);
  const lines = keys.map(key => `${key}: ${serializeValue(frontmatter[key])}`);
  return `---\n${lines.join('\n')}\n---\n${body.replace(/^\n?/, '\n')}`;
}

/**
 * Replace only the document body while preserving the original frontmatter
 * bytes. Body-only editor payloads use this explicit conversion path so YAML
 * values and unsupported metadata are never silently reconstructed.
 */
export function replaceBody(source, body) {
  const normalizedSource = normalizeDocumentSource(source);
  const parsed = parseDocument(normalizedSource);
  if (!parsed.hasFrontmatter) throw new Error('Cannot replace the body of a document without frontmatter');
  const frontmatterEnd = normalizedSource.length - parsed.body.length;
  return `${normalizedSource.slice(0, frontmatterEnd)}${String(body).replace(/^(?:\r\n|\n|\r)?/, parsed.lineEnding)}`;
}

export function updateFrontmatter(source, updates) {
  const parsed = parseDocument(source);
  if (!parsed.hasFrontmatter) return source;
  const lines = parsed.rawFrontmatter.split('\n');
  const fields = topLevelFields(parsed.rawFrontmatter);
  const replacements = new Map(Object.entries(updates).filter(([, value]) => value !== undefined));
  const output = [];
  let index = 0;
  while (index < lines.length) {
    const field = fields.find(candidate => candidate.start === index);
    if (!field) { output.push(lines[index]); index += 1; continue; }
    if (replacements.has(field.key)) {
      output.push(`${field.key}: ${serializeValue(replacements.get(field.key))}`);
      index = field.end;
      replacements.delete(field.key);
    } else {
      output.push(...lines.slice(field.start, field.end));
      index = field.end;
    }
  }
  for (const [key, value] of replacements) output.push(`${key}: ${serializeValue(value)}`);
  const lineEnding = parsed.lineEnding || '\n';
  return `---${lineEnding}${output.join(lineEnding)}${lineEnding}---${lineEnding}${parsed.body.replace(/^(?:\r\n|\n|\r)?/, lineEnding)}`;
}
