# Easy Content Mode — Phase 2 implementation report

Date: 2026-10-29  
Branch: `main`  
State: uncommitted; no commit, push, deploy, or automatic Git mutation performed.

## 1. Existing architecture discovered

The site is a static Astro 5 bilingual portfolio with Tailwind, MDX, Preact compatibility, JSON content under `content/`, localized routes under `src/pages/{en,fa}/`, and existing Markdown/MDX rendering for blog content.

## 2. Phase 1 architecture discovered

Phase 1 established the project-as-mother-document hierarchy: one canonical project record in `content/projects/entries.json`, a localized `overview.mdx` under `content/blog/{locale}/projects/<id>/`, and child articles beside it. Homepage and Blog selection use centralized published/favorite selectors; root routing and localized error pages are already handled.

## 3. Editor technology selected and why

Easy Content uses a native Astro component plus browser DOM APIs. No new editor package was installed because the repository has no full MDX editor dependency and the requested workflow can be covered with a small source-first editor, preview, metadata inspector, and diff view.

## 4. React/Preact compatibility decision

No React or Preact editor was added. Existing Preact compatibility remains unchanged; the development editor is isolated from the public application bundle.

## 5. Files/directories added

- `src/dev/easy-content/`: blocks, editor shell, Vite integration, security helpers, frontmatter handling, adapters, and middleware.
- `scripts/dev-content.mjs` and `scripts/easy-content-test.mjs`.
- `src/utils/icon-registry.mjs`.
- `design/architecture/easy-content.md`.
- `.agents/skills/portfolio-easy-content/SKILL.md`.
- Two editable Blog landing documents under `content/blog/{en,fa}/_index.mdx`.
- `src/components/platform/ErrorPage.astro` and localized 404 routes from the preceding Phase 1 work.

## 6. Development server/write architecture

Run `npm run dev:content`. It starts Astro with `EASY_CONTENT_MODE=true`; the Vite `configureServer` middleware is registered only for `serve` and exposes `/__easy-content/api/*` locally.

## 7. Security protections

Requests require loopback access, matching origin/host when an Origin header is present, and a per-process session token for reads and writes. Logical route contexts are used instead of client filesystem paths. Path traversal, separators, NUL bytes, and symlink targets are rejected. JSON request and image upload sizes are bounded.

## 8. Content adapter design

Adapters support Home, Blog landing, Project, Article, and Journey contexts. Project registry metadata and its localized mother document save in one transaction. Child articles are inferred from their project directory.

## 9. Project editing behavior

Projects expose localized title/description, tags, icon, favorite state/date, draft state, and source content. Publishing synchronizes overview frontmatter and registry metadata, validates icons, and safely moves a review-class project to `public-sanitized` before making it visible.

## 10. Article editing behavior

Articles keep their stable slug and parent project. New articles are created in both locale folders as drafts; `overview` is reserved for the mother document. Renaming is deliberately not implicit.

## 11. Home editing boundaries

Home editing is restricted to profile identity and localized presentation fields exposed by the editor. It does not permit arbitrary route redesign or arbitrary JSON path writes.

## 12. Blog editing behavior

The Blog landing is edited through `content/blog/{locale}/_index.mdx`. Project overviews and child articles remain in their canonical project folders and appear in the existing Blog/project presentation.

## 13. Visual/Source/Diff implementation

Source mode is authoritative. Visual mode previews and allows basic Markdown editing; it becomes read-only when advanced MDX components are detected. Diff mode compares the loaded revision with the current source. Unsaved changes trigger close/unload protection, and Ctrl/Cmd+S saves a draft.

## 14. Rich content blocks supported

The insert menu covers the existing safe vocabulary: Callout, fenced code, Mermaid, Markmap/MindMap, tables, Figure, and KaTeX math. Unsupported JSX is preserved in source mode rather than rewritten by the visual preview.

## 15. Image/media behavior

Images are limited to matching PNG, JPEG, WebP, GIF, and SVG MIME/extensions with a 12 MB limit. Uploads go to `content/media/projects/<project>/` and are mirrored to generated `public/media/` for the current dev server. Content remains the single source of truth.

## 16. Icon selector implementation

Project icon choices come from the canonical `src/utils/icon-registry.mjs` list and are validated again by the adapter before saving. The project visual uses the existing technology icon resolver and falls back safely when an icon has no specialized glyph.

## 17. EN/FA behavior

The editor opens from localized EN/FA pages, edits the locale-specific document, preserves bilingual project/article creation, and sets RTL for Persian UI text. Existing locale routing and translation IDs remain the source of truth.

## 18. Draft/publish behavior

New projects, articles, and Journey entries start hidden/draft. Save draft preserves that boundary. Publish explicitly changes the supported entity’s public state; normal content validators still gate the result.

## 19. Favorite behavior

Favorite and `favoriteAt` are project registry fields. Homepage and Blog favorite ordering continue to use the existing centralized selectors; the editor does not create a parallel featured list.

## 20. Git integration

The Changes tab exposes read-only `git status -- content` and content diff statistics. Easy Content never stages, commits, pushes, deploys, or changes branches.

## 21. Conflict protection

Loaded files receive SHA-256 revisions. Saves compare the revision before writing and return `409` on an external change. Multi-file project saves use temporary files and rollback behavior.

## 22. Tests executed

- `npm run content:validate` — passed; 0 projects and 0 Journey entries on the generic template.
- `npm run content:check-links` — passed; 2 landing documents checked.
- `npm run test:content-api` — passed.
- `npm run test:easy-content` — passed.
- `npm run check` — passed with 0 errors; existing Lucide deprecation hints remain.
- `npm run test` — passed.
- `git diff --check HEAD` — passed.
- Local API smoke test — passed for context and authenticated Blog read.

## 23. Build/production-isolation verification

`npm run build` passed, including media publishing, résumé generation step, Astro static generation, and Pagefind. The generated `dist/` contains no `easy-content`, `DEV CONTENT`, `__easy-content`, or editor-button markers. The expected existing Pagefind warnings for contact compatibility pages and large Mermaid chunks remain.

## 24. Deferred Phase 3 improvements

The visual editor is intentionally lightweight: advanced MDX remains source-first. Rename/delete workflows, richer structured field forms, media browsing/cropping, automated browser screenshots, and a full AST-aware MDX editor can be added later without changing the canonical content model or local-only security boundary.

## Usage

```bash
npm run dev:content
# open http://localhost:4321/en/ or /fa/
# click Edit, acknowledge the local warning, then use Source/Visual/Diff

npm run content:validate
npm run content:check-links
npm run check
npm run build
npm run test
```
