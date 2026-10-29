# Easy Content Mode

Easy Content is a local developer tool for editing this portfolio’s canonical files without introducing a CMS or a second runtime content source.

## Activation and production boundary

Run `npm run dev:content`. The wrapper starts Astro with `EASY_CONTENT_MODE=true`. The Vite integration is registered only for the `serve` command, and the editor launcher is rendered only when Astro is both in development mode and the flag is enabled. A normal `npm run dev` has no editor controls. Production builds do not include the middleware, write API, session token, or editor UI.

## Architecture

```text
EasyContentLauncher.astro
        |
        v
/__easy-content/api/*  -- local same-origin middleware --  adapters
        |                                             |
        v                                             v
  session/revision checks                       canonical content/
        |                                             |
        +-- atomic writes / transactions -------------+
```

The launcher is a small native DOM editor. It has Content, Metadata, Media, and Changes tabs; Source, Visual, and Diff modes; onboarding; keyboard save; and draft/publish actions. It intentionally has no React/Preact/MDX editor dependency. Source mode remains authoritative for MDX components that cannot safely be represented by the lightweight visual preview.

## Adapter rules

- Home: limited localized profile fields in `content/profile.json`.
- Blog: localized landing copy in `content/blog/{locale}/_index.mdx`.
- Project: the registry record and the localized `overview.mdx` are saved as one transaction. Child articles are inferred from the project directory.
- Article: localized child MDX with a stable slug and translation relationship.
- Journey: localized milestone copy in `content/journey/entries.json`, initially hidden when created.

Project publishing updates the canonical registry and overview together, keeps the overview frontmatter synchronized, validates registered icon IDs, and refuses unsafe publication classes until they are explicitly moved to a public-sanitized state. Project favorites and `favoriteAt` remain registry data, so homepage and Blog selection continue to use the existing selectors.

## Safety model

The API accepts only loopback requests with a matching origin/host and a per-process token for reads and mutations. Logical contexts are resolved from locale routes; clients cannot submit arbitrary filesystem paths. Path segments reject traversal, NUL bytes, separators, and symlink targets. Writes use temporary files and rename, while project saves use a rollback transaction. Revisions are SHA-256 hashes of the source being edited and produce a conflict response when the file changed elsewhere.

Uploads are limited to matching PNG, JPEG, WebP, GIF, and SVG types and 12 MB. They are written under `content/media/projects/<project>/` and mirrored to `public/media` for the running dev server. This mirror is generated output and must not become a second source of truth.

Easy Content never commits, pushes, deploys, calls a production API, or automatically exposes private editorial masters. Git status and validation are read-only review aids.
