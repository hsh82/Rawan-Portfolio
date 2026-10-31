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

The editor is a full-page native DOM authoring workspace. Its Studio resource browser covers Site, Profile, Contact, Résumé, Experience, Education, Certifications, Skills, and Journey. Localized records have General/English/Persian tabs plus a lossless JSON Source view. Blog documents retain the dedicated bilingual MDX editor. Save operations use revisions and transactions; Source is authoritative for advanced MDX, while Visual is read-only. The Studio sends unsaved structured snapshots to a short-lived in-memory preview session, which renders the real reusable homepage composition in an isolated local iframe. The public Header remains a site Header; contextual authoring actions remain owned by `ContentActionBar.astro`.

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

## Safety model

The API accepts only loopback requests with a matching origin/host and a per-process token for reads and mutations. Logical contexts are resolved from locale routes; clients cannot submit arbitrary filesystem paths. Path segments reject traversal, NUL bytes, separators, and symlink targets. Writes use temporary files and rename, while bilingual saves use a rollback transaction. Revisions are SHA-256 hashes of shared metadata and both localized sources. They produce a conflict response when any slice changed elsewhere.

Uploads are limited to matching PNG, JPEG, WebP, GIF, and SVG types and 12 MB. They are written under `content/media/projects/<project>/` and mirrored to `public/media` for the running dev server. This mirror is generated output and must not become a second source of truth.

Easy Content never commits, pushes, deploys, calls a production API, or automatically exposes private editorial masters. Git status and validation are read-only review aids.
