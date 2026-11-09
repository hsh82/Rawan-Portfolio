# Easy Content Mode

Easy Content is a local developer tool for editing this portfolio’s canonical files without introducing a CMS or a second runtime content source.

## Activation and production boundary

Run `npm run dev:content`, or set `EASY_CONTENT_MODE=true` for `npm run dev`. The Studio at `/dev/content/` edits canonical JSON resources and bilingual Blog documents from one local workspace. `npm run preview:content` (or `npm run preview` with the flag) deliberately starts a loopback authoring companion from source so writing and unsaved previews work locally. `npm run build` always emits a production-clean static artifact: it never contains the middleware, write API, session token, editor route, or editor UI.

## Architecture

```text
Public Blog/Project/Article page
        |
        v
ContentActionBar.astro  -- contextual links only in Easy Content dev mode
        |
        v
/dev/content/edit/* and /dev/content/new/*  -- injected dev-only Astro route
        |                                             |
        v                                             v
editor-bilingual.html + editor-bilingual.js     canonical content/
        |                                             |
        +-- /__easy-content/api/* -- local middleware --+
              session/revision checks / atomic transactions
```

The editor is a full-page native DOM authoring workspace. Its Studio resource browser covers Site, Profile, Homepage, Focus areas, Contact, Résumé, Experience, Education, Certifications, Skills, and Journey. Structured records use a lossless JSON Source view; bilingual MDX documents retain General/English/Persian tabs. Blog documents retain the dedicated bilingual MDX editor. Save operations use revisions and transactions; Source is authoritative for advanced MDX, while Visual is read-only. The Studio sends unsaved structured snapshots to a short-lived in-memory preview session, which renders the real reusable homepage composition in an isolated local iframe. The public Header remains a site Header; contextual authoring actions remain owned by `ContentActionBar.astro`.

Both the Homepage Studio and bilingual Blog editor expose a read-only, context-aware AI Writing Assistant from the top toolbar in a native dialog. Its prompt is generated from the verified homepage section map or the current Blog entity type, includes the actual supported MDX block syntax, and is copied locally with the Clipboard API plus a manual-selection fallback. It has no AI connection and cannot change editor state or save payloads.

Both the Homepage Studio and bilingual Blog editor expose a read-only, context-aware AI Writing Assistant below the editing guidance area. Its prompt is generated from the verified homepage section map or the current Blog entity type, includes the actual supported MDX block syntax, and is copied locally with the Clipboard API plus a manual-selection fallback. It has no AI connection and cannot change editor state or save payloads.

## Adapter rules

- Home: its underlying canonical site/profile/contact/career JSON is editable through the Studio; the public homepage itself is not an independent content file.
- Blog: the landing entity is `content/blog/landing/entry.json` with `en.mdx` and `fa.mdx`.
- Project: `content/blog/projects/<id>/entry.json` is the one canonical shared project/card record; its overview lives in sibling `en.mdx` and `fa.mdx`. Child articles are `content/blog/projects/<id>/articles/<slug>/{entry.json,en.mdx,fa.mdx}`. The public `overview` URL remains unchanged.
- Article: one shared entity with a stable slug, shared publication status, and two localized MDX bodies.
- Journey: localized milestone copy in `content/journey/entries.json`, initially hidden when created.

The action resolver exposes only `Edit Blog` + `New Project` on the Blog landing, and `Edit` + `New Article` on a Project or Article surface. An Article’s New Article action always uses its parent Project, so it creates a sibling rather than a nested child.

Project publishing updates the project hub and both localized overview sources together, keeps compatibility frontmatter synchronized, and validates registered icon IDs before changing status. Projects have only two states: `draft` and `published`; publication class and maturity are retained only as optional legacy metadata and are not editor controls. New project IDs are derived automatically from the English/Persian title, while the reserved `overview` URL is generated automatically. Save Draft keeps content private; Publish validates both locales and makes the project public; Unpublish returns it to draft. Project favorites and `favoriteAt` live in the hub entry, so homepage and Blog selection use the same source.

Publication is shared across both translations. Draft saves accept incomplete EN/FA content as long as each saved document retains valid frontmatter and its stable slug. Publish validates both tabs and writes shared metadata plus both bodies atomically. The editor route has no locale query parameter; a language tab changes local editor state without reloading. Save payloads use complete MDX sources; an explicit body-only payload is reconstructed from the existing document's original frontmatter, while empty or ambiguous payloads are rejected. Harmless leading blank lines and a UTF-8 BOM are normalized only when a valid frontmatter block follows; malformed documents remain invalid.

Project saves keep the canonical project record flat. The frontend sends only an editable project patch, while the server strips the legacy nested `project` wrapper, preserves unsupported fields from disk, rejects excessively nested payloads, and offers `npm run content:normalize-project-metadata` for reviewed, backed-up repair of affected entries.

Card media follows the same ownership rule: `entry.json` is canonical for shared `image` and `icon`, while each locale’s MDX mirrors those fields for Source-mode discoverability. `image` accepts a `media/...` path inside `content/media` or an HTTPS URL; `icon` must be registered. `imageAlt` is localized in `entry.json` and mirrored as one scalar value per locale. Saves reject present-but-conflicting mirrors, normalize both locale sources together, and preserve legacy files that omit mirrors until their next save.

## Safety model

The API accepts only loopback requests with a matching origin/host and a per-process token for reads and mutations. Logical contexts are resolved from locale routes; clients cannot submit arbitrary filesystem paths. Path segments reject traversal, NUL bytes, separators, and symlink targets. Writes use temporary files and rename, while bilingual saves use a rollback transaction. Revisions are SHA-256 hashes of shared metadata and both localized sources. They produce a conflict response when any slice changed elsewhere.

Uploads are limited to matching PNG, JPEG, WebP, GIF, and SVG types and 12 MB. They are written under `content/media/projects/<project>/` and mirrored to `public/media` for the running dev server. This mirror is generated output and must not become a second source of truth.

Easy Content never commits, pushes, deploys, calls a production API, or automatically exposes private editorial masters. Git status and validation are read-only review aids.

## Staging authoring contracts

Structured schemas are shared in src/utils/portfolio-schemas.mjs and consumed by the website parser, content validator and Studio validation. Validation never strips authored fields before persistence. Career resources are full-file JSON arrays edited and saved through saveResource, with no per-record or import workflow in Studio. Empty files seed only the editor buffer with a hidden schema-valid template. Full-array saves require the current revision and validate all entries and references before replacing the file atomically. Deletion validates candidate relationships including résumé selections and root project links.

The Studio parses its current buffer with shared safe JSON normalization. A 400ms debounce and monotonic request sequence prevent stale previews. candidateSource overlays a validated resource on freshly read canonical data, and a bounded ten-minute in-memory snapshot is rendered by the dev-only preview.astro route using parsePortfolioSource, Layout and HomeSurface. There is no DOM patching or nested homepage iframe. The iframe allows same-origin resource loading but no scripts; the response CSP also forbids scripts, forms and child frames. Navbar, footer and homepage composition accept the same supplied snapshot data.

AI prompts include current JSON context and are available in a top-toolbar native dialog. Secondary actions use native details/summary disclosure. Desktop/mobile and expanded preview controls retain unsaved data. Native dialog supplies focus containment and Escape handling. The fullscreen fallback is a fixed overlay with visible exit; it intentionally avoids script-enabled preview privileges.

MDX visual previews now reject imports/exports, executable expressions, event handlers, active HTML and active URL schemes before evaluation. Static Mermaid/Markmap template literals and safe registered components remain available. Unsupported advanced code stays intact in Source. Existing project hubs also have a top-toolbar Homepage preview dialog: prepareEntitySave builds the same validated write plan used by Save, but the preview overlays its shared metadata and localized title/description in memory without executing the write plan or changing publication state.

Focus areas has its own Studio entry projecting `content/home.json` → `focus`, including bilingual cards and optional `heading` (title and eyebrow). Existing headings appear in the buffer as editable defaults. Saving preserves all other homepage fields and shares the full home-file revision, so concurrent Homepage/Focus saves conflict safely. Validate Content sits immediately below the JSON source box.
