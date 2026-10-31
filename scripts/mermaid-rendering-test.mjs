import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPreview } from '../src/dev/easy-content/server/middleware.mjs';

const english = `# Mermaid rendering fixture

<MermaidDiagram label="Basic flow" chart={\`flowchart LR
  A --> B\`} />

<MermaidDiagram label="Labeled flow" chart={\`flowchart LR
  A[Start] --> B[Finish]\`} />

<MermaidDiagram label="Sequence" chart={\`sequenceDiagram
  Alice->>Bob: Hello Bob, how are you?\`} />

<MermaidDiagram label="Static string" chart="flowchart LR; A --> B" />

| Feature | Status |
| --- | --- |
| Table | Supported |

\`\`\`js
const answer = 42;
\`\`\`

---
`;

const persian = `# نمودار فارسی

<MermaidDiagram label="جریان انتشار" chart={\`flowchart LR
  A[شروع] --> B[پایان]\`} />
`;

const englishHtml = await renderPreview({ source: english });
const persianHtml = await renderPreview({ source: persian });

assert.equal((englishHtml.match(/data-mermaid(?:=|\s)/g) || []).length, 4, 'all English diagrams should reach the preview DOM');
assert.equal((englishHtml.match(/data-chart=/g) || []).length, 4, 'all English chart sources should be preserved');
assert.match(englishHtml, /Basic flow/);
assert.match(englishHtml, /sequenceDiagram/);
assert.match(englishHtml, /Feature/);
assert.match(englishHtml, /const answer = 42/);
assert.match(persianHtml, /data-mermaid(?:=|\s)/);
assert.match(persianHtml, /جریان انتشار/);
assert.match(persianHtml, /شروع/);

const renderer = readFileSync(new URL('../src/components/blog/mermaid-renderer.js', import.meta.url), 'utf8');
const publicComponent = readFileSync(new URL('../src/components/blog/MermaidDiagram.astro', import.meta.url), 'utf8');
const editor = readFileSync(new URL('../src/dev/easy-content/editor/editor-bilingual.js', import.meta.url), 'utf8');
const middleware = readFileSync(new URL('../src/dev/easy-content/server/middleware.mjs', import.meta.url), 'utf8');

assert.match(renderer, /securityLevel: 'strict'/);
assert.match(renderer, /Unable to render diagram\. Check Mermaid syntax\./);
assert.match(publicComponent, /observeMermaidDiagrams\(document\)/);
assert.match(editor, /renderMermaidDiagrams\(visual\)/);
assert.match(middleware, /data-chart': chart \|\| ''/);
assert.doesNotMatch(middleware, /MermaidDiagram: \(\{ children, label \}\) => previewElement\('div', \{ class: 'preview-diagram' \}/);

console.log('Mermaid rendering regression tests passed');
