---
name: portfolio-easy-content
description: Maintain the local Studio, structured JSON contracts, collections, live snapshots and bilingual MDX editor.
---

# portfolio-easy-content

Read AGENTS.md, design/plan.md and design/architecture/easy-content.md. Sources: src/utils/portfolio-schemas.mjs, portfolio-content.ts, src/dev/easy-content/server/resources.mjs, resource-validation.mjs, security.mjs and editor/studio.js. MDX uses adapters-bilingual.mjs/frontmatter.mjs; it is not JSON.

Career collections use one full-file JSON array editor, like singleton JSON resources. Empty collections open with an unsaved hidden bilingual template inside the JSON buffer. Users add, edit and remove array entries directly, then Save Changes replaces the validated complete file using expectedRevision and atomic writes. There are no record-selection, Add, Delete or import-mode controls in Studio. Preserve schema validation, unique IDs, canonical references and unknown authored fields. Never invent facts or persist the empty-file template automatically. Normalize syntax through editor/json-normalize.mjs.

Unsaved preview uses validated immutable snapshots and the dev-only preview.astro route with the actual HomeSurface composition. It must never write content files. Keep the iframe script-free; do not combine scripts and same-origin privileges. Preserve loopback Host/Origin, session tokens, revision hashes, bounded sessions and transaction rollback. Normal preview is read-only; preview:content is source-backed authoring. Studio JSON has no Publish state. MDX Save Draft, Publish and Unpublish retain separate behavior.

Run npm run content:validate, npm run content:check-links, npm run test:studio, npm run test:easy-content, npm run test:easy-content-guide, npm run check, npm run build, npm test and npm run test:studio-ui. The UI suite needs CHROME_BIN or installed Chrome and uses disposable content. Definition of done: real API and browser tests pass for both authoring commands, invalid input preserves last preview with a warning, production contains no editor, and canonical IDs/EN/FA records survive round trips.

Docker authoring uses the same editor and API through portfolio-docker-release. The host checkout's content directory is canonical; the container's generated public/media mirror is disposable. Never weaken Easy Content security globally to accommodate Docker networking.
