# Codex Master Task — Easy Content Studio V1

Status: implementation-ready plan; not yet implemented  
Repository: `/home/weinno/portfolio`  
Target application branch: `dev`, then synchronize the application changes into the owner-content branch without replacing its content  
Supersedes: the editor portions of `2026-10-29-easy-content-bilingual-authoring.md`; its unified bilingual entity and atomic-save decisions remain valid

## 1. Mission

Turn Easy Content into a professional, local-only content studio for the whole portfolio. An author must be able to select a canonical content resource, edit its general and localized fields, and inspect the unsaved result through the same visual components used by the public site.

The studio must support:

- site, profile, contact, résumé configuration, experience, education, certifications, skills, journey, blog landing, projects, and project articles;
- one logical bilingual entity instead of separate English and Persian records;
- exact read-only previews using the public design system;
- safe creation, editing, reordering, publication, unpublishing, and deletion;
- one project source shared by the homepage, Projects view, Blog, related content, and résumé selectors;
- activation through `npm run dev:content` or an explicit local environment flag;
- a local authoring companion for built-site preview, without ever shipping the editor or write API in the production artifact.

This task is an application/content-architecture enhancement. It is not a redesign of the public portfolio.

## 2. Verified current baseline

Before implementation, recheck these facts against the live tree and preserve any newer work:

- Easy Content already has one editor page with General, English, and Persian tabs.
- Bilingual blog records already use shared metadata and sibling locale files.
- The supported blog layout is currently:

  ```text
  content/blog/landing/{entry.json,en.mdx,fa.mdx}
  content/blog/projects/<project-id>/overview/{entry.json,en.mdx,fa.mdx}
  content/blog/projects/<project-id>/articles/<article-slug>/{entry.json,en.mdx,fa.mdx}
  ```

- The current editor tree covers projects and articles, but not all structured JSON resources.
- The current Visual mode compiles MDX into an editor-specific representation and uses placeholders for some rich components. It is not the exact public rendering.
- The public project registry is still `content/projects/entries.json`.
- Homepage project cards and Blog project cards already use common selectors from that registry, but localized project copy is duplicated between the registry and project overview MDX.
- There is no complete safe-delete API or local trash/restore workflow.
- Leaf homepage components often load global portfolio data themselves, which prevents an unsaved data snapshot from being passed into the real components.
- Production builds intentionally exclude Easy Content. Preserve that security boundary.
- Existing uncommitted activation work in `.env.example`, `astro.config.mjs`, `src/dev/easy-content/`, and `src/layouts/Layout.astro` belongs to the user and must be reviewed and preserved, not reset or overwritten.

## 3. Non-negotiable product decisions

### 3.1 One logical bilingual resource

Every localized entity is edited on one page:

- General: stable identity, status, dates, categories, relationships, assets, ordering, and other language-neutral fields.
- English: English copy and English-specific SEO/accessibility text.
- Persian: Persian copy and Persian-specific SEO/accessibility text.

Saving and publishing are entity-level operations. Never require English to be published before Persian or Persian before English. Never automatically turn a published entity into a draft merely because it was edited.

### 3.2 Forms are primary; source remains available

- Form mode is the normal editing experience.
- JSON Source mode is an advanced, lossless editor for JSON resources.
- MDX Source mode is the only place where article markup can be inserted or changed.
- Visual mode is strictly read-only. It must not expose insertion, formatting, drag/drop authoring, or content mutation controls.
- Diff mode compares the current unsaved snapshot with the filesystem revision.

Unknown valid JSON fields must survive form edits. Source and form modes must never silently discard data they do not display.

### 3.3 Projects become part of the Blog content graph

The separate project registry must stop being the long-term canonical project source. A project is the parent publishing entity for its overview and child articles.

Target structure:

```text
content/blog/
  landing/
    entry.json
    en.mdx
    fa.mdx
  projects/
    <project-id>/
      entry.json
      en.mdx
      fa.mdx
      articles/
        <article-slug>/
          entry.json
          en.mdx
          fa.mdx
```

The project-root `entry.json` holds canonical shared project/card metadata, including:

- ID, publication status, visibility, priority, category, secondary categories, maturity, dates, favorite/featured flags;
- technology IDs, icon, optional image and localized image alternatives;
- repository/external links;
- journey, skill, related-project, article, and résumé relationships;
- any shared case-study configuration or diagram metadata.

The sibling `en.mdx` and `fa.mdx` hold the localized project overview, including title, summary, SEO copy, and body. Do not duplicate localized title or summary in another registry.

Child article folders use the same shared-plus-locales pattern. An article belongs to exactly one project.

Keep existing public URLs stable during this phase:

```text
/{locale}/blog/projects/<project-id>/overview/
/{locale}/blog/projects/<project-id>/<article-slug>/
```

The loader may map a root project document to the virtual `overview` route. Add redirects only if an existing route must change; do not break bookmarks or search indexing.

### 3.4 One normalized reader for every project surface

Build one project loader/selector over `content/blog/projects/*`. The following consumers must use it:

- homepage featured projects;
- Projects page and category filters;
- Blog landing project cards;
- project overview and article routes;
- related-project and related-article navigation;
- journey and skill relationships;
- optional résumé project selection.

Editing the project root must update all those surfaces automatically. Do not introduce dual writes or synchronization jobs between two canonical stores.

### 3.5 Exact preview means shared production components

Visual preview must use the same component implementations, styles, locale behavior, selectors, and layout primitives as the public site. Editor-only lookalikes and placeholder renderers are not acceptable final behavior.

The preview is read-only and receives an in-memory unsaved snapshot. It must not require saving a file merely to see a change.

### 3.6 Local-only authoring remains a security boundary

- `npm run build` always creates a production-clean static artifact.
- No editor UI, write middleware, secret token, preview-session data, or Easy Content endpoint may appear in `dist/`.
- Easy Content may run only in an explicitly enabled local process bound to loopback.
- A production or preview deployment must not become writable because an environment variable was accidentally set on Vercel.

## 4. Target studio information architecture

Use `/dev/content/` as the local studio entry point. Organize the resource browser into these groups:

```text
Site
  Site settings
  Profile
  Contact
  Résumé settings

Career
  Experience
  Education
  Certifications
  Skills
  Journey

Publishing
  Blog landing
  Projects
    Project overview
    Child articles

Assets
  Media library
  Downloadable files
```

The selected resource, item, tab, mode, locale, and preview viewport must be represented in the URL. Reloading or sharing a local URL should restore the same studio state.

Recommended route shape:

```text
/dev/content/
/dev/content/edit/<resource>
/dev/content/edit/<resource>/<stable-id>
```

Use query parameters for view state, for example:

```text
?tab=fa&mode=form&previewLocale=fa&viewport=390
```

## 5. Editor shell and responsive behavior

### Desktop

Use a three-region workspace:

1. Resource navigator: searchable tree, resource counts, draft/published badges, and relationship warnings.
2. Editor: breadcrumb, General/English/Persian tabs, Form/Source/Diff modes, validation summary, and explicit Save/Publish actions.
3. Preview: real read-only page or component preview with locale, theme, and viewport controls.

The preview pane may be resized with an accessible separator. Provide presets for approximately 390, 768, and 1440 CSS pixels without relying on JavaScript layout measurement.

### Tablet and mobile

- Collapse the navigator into a drawer.
- Switch editor and preview with an explicit segmented control or tabs.
- Keep Save and status visible without obscuring form fields.
- Ensure all controls meet touch-target requirements and no content requires horizontal page scrolling.

### Navigation protection

- Warn before leaving with unsaved changes.
- Preserve a local recovery snapshot after a crash or accidental reload.
- Recovery data must be scoped by resource and revision and must never be treated as published content.
- If the underlying file changes, show a conflict instead of silently overwriting it.

## 6. Resource catalog and schema architecture

Create a declarative resource registry for the studio. It should describe, but not duplicate, the canonical validation schema:

```ts
type ResourceDescriptor = {
  id: string;
  label: LocalizedLabel;
  kind: 'singleton' | 'collection' | 'document-tree';
  source: string;
  schema: CanonicalSchemaReference;
  fields: FieldDescriptor[];
  previewSurface: string;
  capabilities: {
    create: boolean;
    reorder: boolean;
    delete: boolean;
    localize: boolean;
    publish: boolean;
  };
};
```

Refactor validation so the public loader, command-line validation, and studio API consume the same exported schemas. Field descriptors add labels, help text, control types, grouping, and preview mapping; they do not redefine validation independently.

Required form controls include:

- text, textarea, URL, email, date, integer, boolean, and enum fields;
- localized field groups;
- repeaters with keyboard-accessible reorder controls;
- stable-ID selectors for relationships;
- technology/icon picker backed by the existing taxonomy;
- media picker backed by canonical content asset paths;
- status, maturity, category, featured/favorite, and ordering controls;
- conditional fields whose hidden values are never silently deleted.

Stable IDs must be validated at creation and locked afterward. A future explicit rename/migration workflow may change them, but ordinary editing must not.

## 7. Real preview architecture

### 7.1 Shared public compositions

Refactor public rendering at clear boundaries:

- Add a reusable homepage composition that accepts a complete normalized content snapshot and locale.
- Make content-driven homepage sections accept explicit data props instead of reading global content inside leaf components.
- Public route pages load the canonical snapshot once and pass it into the composition.
- Add a shared project-card/project-grid composition that accepts normalized project entities.
- Extract the article document shell and supported MDX component registry so public article rendering and studio rendering share the same implementation.

Defaults may exist at a route boundary for compatibility, but previewable leaf components must not secretly reread filesystem content.

### 7.2 Preview sessions

Use a development-only in-memory preview-session store:

1. The editor validates its current unsaved snapshot.
2. It posts the snapshot to a local preview-session endpoint with a revision number.
3. The endpoint returns an opaque, short-lived preview ID.
4. A same-origin iframe opens the appropriate preview surface with that ID.
5. The preview route loads the real composition with the unsaved snapshot overlaid on canonical content.

Requirements:

- debounce updates and cancel obsolete requests;
- latest revision wins, preventing stale previews from replacing newer ones;
- sessions expire and are held only in memory;
- responses use `Cache-Control: no-store`;
- the authoring token is never placed in an iframe URL;
- use a sandboxed, same-origin iframe with the minimum required capabilities;
- show explicit loading, stale, validation-error, and render-error states;
- support English/Persian direction, light/dark theme, and viewport presets;
- expose an “Open saved page” action only after a successful save.

### 7.3 MDX parity

Remove editor-only placeholders for supported blocks. Callout, tabs, figures, downloads, code blocks, Mermaid diagrams, mind maps, and future supported blocks must share rendering primitives with the public article reader.

Preferred implementation:

- extract framework-neutral/shared Preact rendering primitives where runtime compilation is required;
- use thin Astro wrappers for the public routes when necessary;
- keep the class names, semantics, sanitization, client behavior, and global styles identical;
- add DOM and screenshot parity tests for representative MDX fixtures.

Do not use an HTML-to-MDX round trip. Do not permit script execution or arbitrary component imports from article source.

### 7.4 Preview surfaces

At minimum, implement these exact preview targets:

- site/profile/contact: full homepage, with an optional focused section view;
- skills, experience, education, certifications, journey, and projects: their actual homepage/page section;
- blog landing: actual Blog index composition;
- project root: actual project card and full overview page;
- project article: actual article reader page;
- résumé configuration: structured HTML résumé preview, not a claim that a PDF was regenerated until generation succeeds.

## 8. Studio API and transactions

Keep all endpoints behind the existing local token, origin checks, loopback binding, and path allowlist. Add a versioned internal API with contracts equivalent to:

```text
GET  /__easy-content/api/catalog
GET  /__easy-content/api/resource
GET  /__easy-content/api/references
POST /__easy-content/api/validate-resource
POST /__easy-content/api/save-resource
POST /__easy-content/api/create-resource
POST /__easy-content/api/reorder-resource
POST /__easy-content/api/delete-resource
POST /__easy-content/api/restore-resource
POST /__easy-content/api/preview-session
GET  /__easy-content/api/preview-session/<opaque-id>
```

Every mutation must include the last-read revision. A stale revision returns a conflict with enough information for Diff mode; it must never overwrite newer disk content.

Multi-file entities save atomically:

- validate all shared and localized files first;
- stage every write;
- apply them as one transaction;
- roll back all files if any write fails;
- refresh indexes only after success.

Validation errors should include resource, tab, field path, message, and severity so the UI can activate the correct tab and focus the first invalid field.

## 9. Publication model

Use one shared status in `entry.json` for a bilingual project/article. The publish action validates both required locales in one operation.

- Editing does not change publication status.
- Save Draft writes content without publishing it.
- Publish validates the complete entity and sets shared status to published.
- Unpublish is an explicit separate action with confirmation.
- Missing optional translations may be allowed only if the canonical schema and public fallback policy explicitly support that entity type. Do not create implicit fallback rules in the editor.

Display publication state at the resource, project, and article levels. A published child article cannot exist beneath a hidden/deleted project; publishing must detect and explain that relationship error.

## 10. Creation and deletion rules

### Creation

- Creating a project creates its root folder, one `entry.json`, and both locale MDX files in one transaction.
- Creating an article requires a selected parent project and creates one article folder with the same three-file pattern.
- New entities start as drafts.
- Slugs and stable IDs must be checked for case-insensitive and Unicode-normalized collisions.

### Deletion

Never perform an immediate recursive delete.

- Move deleted material into a repository-local, ignored `.easy-content-trash/<timestamp>/...` location.
- Record original path, entity ID, deletion time, and dependency scan in a small manifest.
- Offer Restore/Undo in the current session.
- The trash directory must not be part of runtime content, build output, or Git by default.

Article deletion requires a danger-zone confirmation and a reference scan.

Project deletion is allowed only when:

- it has no child article directories;
- no journey, résumé, skill, related-project, or other content relationship references it;
- the user confirms the exact project name/ID.

If blocked, list every blocking article or reference with a studio link. Do not offer cascade deletion.

Singleton resources such as site, profile, contact, résumé configuration, and blog landing cannot be deleted. Collection items may be deleted only after the same relationship check.

## 11. Environment activation and build/preview behavior

Document and implement one canonical variable:

```dotenv
EASY_CONTENT_MODE=false
```

Expected behavior:

| Command/state | Studio | Public output |
|---|---:|---|
| `npm run dev` with flag unset/false | Off | Normal development site |
| `npm run dev` with `EASY_CONTENT_MODE=true` | On | Development site plus local studio |
| `npm run dev:content` | On | Force-enabled local studio |
| `npm run build` | Off in artifact | Production-clean static build |
| `npm run preview` with flag false | Off | Normal Astro preview |
| `npm run preview` with flag true | On through local companion | Built public site plus local-only authoring companion |
| `npm run preview:content` | On through local companion | Explicit equivalent of the previous row |

The preview companion must:

- serve the built site and local studio from a loopback-only process;
- edit the source `content/` tree, not `dist/`;
- reuse the same secured middleware and preview renderer as development mode;
- show a startup warning that this is a local authoring process;
- never be used by Vercel or included in deployment output.

Do not describe `astro preview` itself as a CMS. A small command wrapper/companion server is required. If `.env` is true, the normal preview script may delegate to that wrapper for convenience.

Add an automated artifact assertion that fails if `dist/` contains `/dev/content`, `__easy-content`, editor bundles, authoring tokens, trash data, or preview-session payloads.

## 12. Project migration plan

Create a migration command with dry-run as the default, for example:

```bash
npm run content:migrate-project-hubs -- --dry-run
npm run content:migrate-project-hubs -- --write
```

The migration must:

1. Read `content/projects/entries.json` and every existing project overview/article folder.
2. Match records by stable project ID, never by translated title.
3. Report missing records, duplicate IDs/slugs, conflicting titles/descriptions, invalid relationships, and orphan articles.
4. Build the proposed project-root `entry.json`, `en.mdx`, and `fa.mdx` without changing public URLs.
5. Preserve dates, publication state, images, icons, technologies, favorite flags, links, and relationships.
6. Produce a deterministic before/after manifest.
7. Refuse `--write` while any unresolved collision remains.
8. Use a transaction and leave the original source recoverable until validation passes.
9. Switch loaders and consumers to the new source in the same implementation change.
10. Remove `content/projects/entries.json` from runtime only after all consumers and tests use project hubs. Do not keep dual-write compatibility indefinitely.

The current `dev` branch may contain no real projects. Test migration with fixtures, then run a dry-run against the owner-content branch before writing its data.

## 13. UI and accessibility quality bar

Follow the current Vercel Web Interface Guidelines and the repository design system. At minimum:

- every control has a visible label or accessible name;
- use semantic buttons, links, inputs, tabs, dialogs, and navigation landmarks;
- tabs and resource trees are fully keyboard operable;
- focus is clearly visible and restored when dialogs close;
- errors appear inline, in a summary, and through an `aria-live` region;
- failed submit focuses the first invalid field;
- destructive actions use a focused confirmation dialog and a recoverable result;
- avoid `transition: all`; respect reduced motion;
- English and Persian directionality works inside forms and previews, including mixed LTR technical text;
- dark/light themes style native controls and preview consistently;
- long titles, code, URLs, empty collections, hundreds of entries, and validation failures have designed states;
- icon-only controls have tooltips and accessible labels;
- images declare dimensions/aspect ratios to avoid layout shift;
- dialogs work on narrow mobile screens without inaccessible off-screen actions;
- preview loading does not block editing, and stale-preview state is visible.

Do not add a generic dashboard aesthetic that conflicts with the existing portfolio. The studio can be denser than the public site, but it should reuse tokens, typography, colors, spacing, and focus styles.

## 14. Implementation phases

### Phase A — safety and contract tests

- Inspect Git status, current branch, current activation diff, repository rules, and all relevant design documents.
- Preserve uncommitted work.
- Add failing tests for resource catalog, project unification, revision conflicts, atomic bilingual operations, preview isolation, deletion blocks, trash restore, and production artifact exclusion.

### Phase B — canonical schemas and resource catalog

- Export one canonical schema layer used by runtime, scripts, and studio.
- Add resource descriptors and API catalog.
- Implement normalized reads for singleton and collection JSON files.
- Keep source editing lossless.

### Phase C — project-hub migration

- Implement and test dry-run migration.
- Migrate project fixtures, then real owner content only after a clean report.
- Update loaders, selectors, validators, routes, cards, relationships, and résumé selection.
- Remove registry duplication and retain public URLs.

### Phase D — shared rendering boundaries

- Refactor homepage sections to accept explicit normalized data.
- Extract shared project and article rendering primitives.
- Keep public output visually and semantically unchanged before adding preview behavior.
- Add regression screenshots before and after the refactor.

### Phase E — studio resource editing

- Build resource browser, descriptor-driven forms, JSON source, localized tabs, Diff mode, validation mapping, conflict handling, and local recovery.
- Add create/reorder capabilities according to descriptors.
- Preserve explicit save and publication semantics.

### Phase F — exact preview

- Add in-memory preview sessions and real preview routes.
- Support home/section, blog landing, project card/detail, article, journey, and résumé HTML surfaces.
- Remove placeholder MDX preview blocks.
- Add locale, theme, and viewport controls.

### Phase G — safe deletion

- Implement dependency graph, move-to-trash transactions, blocked-project explanations, and restore.
- Add tests for tracked and untracked content.

### Phase H — local built-site authoring

- Finish environment activation.
- Add the local preview companion and `preview:content`.
- Keep normal builds/deployments clean and add artifact leak tests.

### Phase I — documentation and cleanup

- Update `design/architecture/easy-content.md`, `design/architecture/content-model.md`, project/blog/home component docs, `docs/AUTHORING.md`, both READMEs, `.env.example`, and content authoring documentation.
- Update stale `portfolio-blog`, `portfolio-project`, `portfolio-easy-content`, and review skill instructions so they describe the new canonical layout.
- Remove obsolete compatibility code only after migration and branch synchronization pass.
- Create one final implementation report at the end; do not create repetitive progress reports.

## 15. Verification matrix

Run the repository's actual commands and report exact results. At minimum:

```bash
npm run content:validate
npm run content:check-links
npm run check
npm run test
npm run build
npm run test:static
```

Add focused Easy Content tests for:

- flag false, flag true, `dev:content`, normal preview, and `preview:content`;
- studio/API absence from `dist`;
- JSON form/source round trips with unknown fields;
- General/English/Persian atomic save;
- publishing and explicit unpublishing;
- revision conflict and no lost update;
- exact project/card synchronization across Home, Projects, and Blog;
- existing localized public routes after migration;
- draft exclusion from production;
- create project/article and collision rejection;
- delete article, blocked non-empty project delete, blocked referenced-item delete, restore;
- malicious paths, symlinks, cross-origin requests, missing/invalid token, and iframe/session isolation;
- representative MDX blocks in public and preview rendering;
- no visual mode mutation controls.

Browser-test at 390, 768, and 1440 widths in both locales and both themes. Cover keyboard-only navigation, focus restoration, long content, empty content, validation failures, unsaved navigation, preview errors, deletion confirmation, and mobile dialogs.

## 16. Acceptance criteria

- [ ] One studio page can edit all supported canonical content resources.
- [ ] Localized entities expose General, English, and Persian on one route.
- [ ] Form edits and raw JSON/MDX source edits are lossless and validated.
- [ ] Visual mode is read-only and uses real production rendering primitives.
- [ ] Unsaved changes preview without first writing them to disk.
- [ ] Projects live canonically under the Blog project tree.
- [ ] Homepage, Projects, Blog, related content, and résumé selectors read the same normalized project entity.
- [ ] A project edit cannot produce stale duplicate card copy elsewhere.
- [ ] Public project/article URLs remain valid.
- [ ] Article deletion is recoverable.
- [ ] A project with articles or references cannot be deleted.
- [ ] No destructive cascade delete exists.
- [ ] Editing a published item never silently unpublishes it.
- [ ] Publishing validates both required locales atomically.
- [ ] `EASY_CONTENT_MODE=true`, `dev:content`, and local built-site authoring behave as documented.
- [ ] Production `dist/` and Vercel deployments contain no editor or write API.
- [ ] EN/FA, RTL/LTR, dark/light, keyboard, mobile, conflict, and failure states pass.
- [ ] Content validation, links, type checks, tests, build, and static checks pass.
- [ ] Documentation and portfolio authoring skills match the implemented architecture.

## 17. Execution constraints for the next Codex run

When this plan is approved for implementation:

1. Read `AGENTS.md`, `design/plan.md`, this complete plan, the current Easy Content architecture, content model, component documents, and applicable repository skills before editing.
2. Inspect the live Git state and preserve all owner changes. Do not reset, clean, restore, or overwrite unrelated work.
3. Implement in the phases above; do not stop after producing another plan.
4. Do not create a second runtime content source or temporary permanent registry.
5. Do not modify personal facts while migrating architecture.
6. Do not commit, push, merge, deploy, or migrate the owner-content branch until explicitly authorized for those actions.
7. Use a dry-run before moving real project content.
8. Keep Easy Content local-only and production-clean even when Vercel environment variables exist.
9. At the end, report exact changed files, migration results, tests, browser evidence, remaining limitations, and the final report path.

## 18. Out of scope

- A hosted CMS or remotely writable production editor.
- Authentication for internet-facing authoring.
- Collaborative multi-user editing.
- Automatic translation or AI-generated biography/project claims.
- A public-site redesign.
- Cascade deletion.
- Breaking existing localized URLs merely to simplify the filesystem.
- Editing PDF binary output directly in Visual mode.

