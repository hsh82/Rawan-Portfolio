function rejectDuplicateKeys(source) {
  const stack = [];
  for (const match of source.matchAll(/"(?:\\.|[^"\\])*"|[{}\[\],:]/g)) {
    const token = match[0], current = stack.at(-1);
    if (token === '{' || token === '[') stack.push({ object: token === '{', keys: new Set(), key: true });
    else if (token === '}' || token === ']') stack.pop();
    else if (token === ',' && current?.object) current.key = true;
    else if (token.startsWith('"') && current?.object && current.key) {
      const key = JSON.parse(token);
      if (current.keys.has(key)) throw new Error(`Duplicate JSON field ${JSON.stringify(key)} at position ${match.index}. Resolve it explicitly; no value was discarded.`);
      current.keys.add(key); current.key = false;
    }
  }
}

/** Meaning-preserving syntax cleanup only; identity/structure changes need an explicit action. */
export function parseJsonBuffer(buffer) {
  let source = String(buffer).replace(/^\uFEFF/, '').trim();
  const changes = [];
  const fence = source.match(/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  if (fence) { source = fence[1].trim(); changes.push('Removed Markdown code fence'); }
  let repaired = '', quoted = false, escaped = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (!escaped && char === '"') quoted = false;
      if (!escaped && (char === '\n' || char === '\r')) {
        if (char === '\r' && source[i + 1] === '\n') i++;
        repaired += '\\n'; changes.push('Escaped a literal newline in text'); continue;
      }
      repaired += char;
      if (escaped) escaped = false; else if (char === '\\') escaped = true;
    } else {
      if (char === '"') quoted = true;
      if (char === ',' && /^[\s]*[}\]]/.test(source.slice(i + 1))) { changes.push('Removed a trailing comma'); continue; }
      repaired += char;
    }
  }
  try { const value = JSON.parse(repaired); rejectDuplicateKeys(repaired); return { value, changes: [...new Set(changes)], source: repaired }; }
  catch (cause) {
    const position = Number(cause.message.match(/position (\d+)/)?.[1]);
    const before = Number.isFinite(position) ? repaired.slice(0, position) : '';
    const line = before ? before.split('\n').length : undefined;
    const column = before ? before.length - before.lastIndexOf('\n') : undefined;
    throw Object.assign(new Error(`Invalid JSON${line ? ` at line ${line}, column ${column}` : ''}: ${cause.message}. Check quotes, brackets, and field separators.`), { issues: [{ path: '$', message: cause.message, line, column }] });
  }
}
