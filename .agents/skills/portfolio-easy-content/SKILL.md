# Easy Content Mode

Use this skill when maintaining the local developer-only content editor under `src/dev/easy-content/`.

## Boundaries

- This is a local file editor, not a CMS, database, production endpoint, or deployment workflow.
- Start it with `npm run dev:content`; it sets `EASY_CONTENT_MODE=true` and starts Astro in development mode.
- The Vite integration uses `apply: 'serve'`, and the launcher is gated by both `import.meta.env.DEV` and the flag. Production builds must not contain the editor, API, token, or write UI.
- Writes are limited to `content/` and media uploads to `content/media/`. Requests must be local, same-origin, and carry the per-process session token.
- Save operations use file revisions and atomic or multi-file transactions. A `409` means reload before overwriting an external change.
- Easy Content never commits, pushes, deploys, deletes, renames, or publishes remotely.

## Content model

- Home edits are constrained to the localized profile fields exposed by the adapter.
- Blog landing content lives in `content/blog/{en,fa}/_index.mdx`.
- A project is one canonical Blog hub at `content/blog/projects/{id}/`: shared card/publication data in `entry.json` and localized overview documents in `en.mdx` and `fa.mdx`. Public URLs still end in `/overview/`.
- Child articles are inferred from the project folder. The `overview` slug is reserved.
- Journey creation starts hidden; edit only verified milestone copy.
- Drafts stay out of the public collections until they are intentionally published through the editor and pass the normal validators.

## Editor behavior

The editor is a native Astro/DOM implementation because this repository does not ship a full MDX editor dependency. Source mode is authoritative. Visual mode previews common Markdown and becomes read-only when it detects advanced MDX components, preserving those components in source mode. The block menu inserts the existing safe component vocabulary; it does not attempt to edit arbitrary JSX.

Use the Studio at `/dev/content/` for structured site/profile/contact/career JSON. It provides General, English, Persian, and lossless JSON Source views plus a local read-only homepage preview. Use the dedicated document editor for project hubs and MDX articles. Use Media to upload safe image formats to a project-scoped content path. Use Changes to inspect Git status and the Diff mode before saving. Run Validate before review and commit.

After changes, run `npm run content:validate`, `npm run content:check-links`, `npm run test:easy-content`, `npm run check`, `npm run build`, and `npm run test` as appropriate.
