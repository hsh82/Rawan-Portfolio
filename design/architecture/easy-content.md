# Easy Content Mode

Easy Content is a local developer tool for editing this portfolio’s canonical files without introducing a CMS or a second runtime content source.

## Activation and production boundary

Run `npm run dev:content`. The wrapper starts Astro with `EASY_CONTENT_MODE=true`. The write API is registered only for the development server, and the editor route is injected only while that flag is enabled. A normal `npm run dev` has no authoring controls. Production builds do not include the middleware, write API, session token, editor route, or editor UI.

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
editor.html + editor.js                         canonical content/
        |                                             |
        +-- /__easy-content/api/* -- local middleware --+
              session/revision checks / atomic transactions
```

The editor is a full-page native DOM authoring workspace. It has a logical content tree, metadata inspector, media upload, Git/validation controls, Source/Visual/Diff modes, onboarding, keyboard save, and draft/publish actions. It intentionally has no React/Preact/MDX editor dependency. Source mode remains authoritative for MDX components that cannot safely be represented by the lightweight visual preview. The public Header remains a site Header; authoring actions are owned by `ContentActionBar.astro`.

## Adapter rules

- Home: not editable in this phase. Home contexts, editor routes, and write requests return `unsupported content type`.
- Blog: localized landing copy in `content/blog/{locale}/_index.mdx`.
- Project: the registry record and the localized `overview.mdx` are saved as one transaction. Child articles are inferred from the project directory.
- Article: localized child MDX with a stable slug and translation relationship.
- Journey: localized milestone copy in `content/journey/entries.json`, initially hidden when created.

The action resolver exposes only `Edit Blog` + `New Project` on the Blog landing, and `Edit` + `New Article` on a Project or Article surface. An Article’s New Article action always uses its parent Project, so it creates a sibling rather than a nested child.

Project publishing updates the canonical registry and overview together, keeps the overview frontmatter synchronized, validates registered icon IDs, and refuses unsafe publication classes until they are explicitly moved to a public-sanitized state. Project favorites and `favoriteAt` remain registry data, so homepage and Blog selection continue to use the existing selectors.

## Safety model

The API accepts only loopback requests with a matching origin/host and a per-process token for reads and mutations. Logical contexts are resolved from locale routes; clients cannot submit arbitrary filesystem paths. Path segments reject traversal, NUL bytes, separators, and symlink targets. Writes use temporary files and rename, while project saves use a rollback transaction. Revisions are SHA-256 hashes of the source being edited and produce a conflict response when the file changed elsewhere.

Uploads are limited to matching PNG, JPEG, WebP, GIF, and SVG types and 12 MB. They are written under `content/media/projects/<project>/` and mirrored to `public/media` for the running dev server. This mirror is generated output and must not become a second source of truth.

Easy Content never commits, pushes, deploys, calls a production API, or automatically exposes private editorial masters. Git status and validation are read-only review aids.
