# Portfolio content

This directory is the only source of public, owner-specific portfolio content. Application components and routes belong in `src/`.

- `site.json`, `profile.json`, `home.json`, and `contact.json` hold site settings, identity/portrait, homepage copy, and contact details separately.
- `journey/`, `experience/`, `education/`, `certifications/`, and `skills/` contain structured JSON entries.
- `blog/{en,fa}/_index.mdx` contains editable Blog landing copy. Each project is a canonical hub at `blog/projects/{project-id}/` with `entry.json`, sibling `en.mdx`/`fa.mdx` overviews, and optional `articles/{article-slug}/en.mdx` and `fa.mdx` children. Project cards and the homepage read these hubs directly. New factual articles should start as drafts until publication is explicitly approved.
- `media/` holds public images; `documents/` holds intended public downloads. Use `media/projects/{project-id}/cover.webp` for an optional project-card cover, then reference it in the project record with bilingual `imageAlt`; category icons remain the fallback. `profile.image` is the main-site portrait; optional `profile.resumeImage` overrides it only for résumé PDFs. If `resumeImage` is absent, the résumé uses `profile.image`. The repository README preview is intentionally kept separately at `public/images/portfolio-preview.jpg` for GitHub rendering.
- `resume/config.json` selects existing entries for the generated résumé view and PDF process.

## Easy Content Mode foundation

The content hierarchy is:

```text
content/
  blog/
    en/_index.mdx                 # Blog landing copy
    fa/_index.mdx
    projects/<project-id>/
      entry.json                  # Shared project metadata
      en.mdx                      # English overview
      fa.mdx                      # Persian overview
      articles/<article-slug>/
        en.mdx
        fa.mdx
  projects/entries.json           # Empty legacy migration marker; not runtime
```

Set `favorite: true` on a project to prioritize it. Add `favoriteAt: YYYY-MM-DD` when the selection date matters; favorite projects sort by that date descending, then normal public projects fill the homepage up to six records by their update/publication date. Older `featured: true` records remain compatible as favorites.

Project-to-article relationships are derived from the hub path, so a child under `blog/projects/devops/articles/` belongs to the `devops` project without a second project registry. The validator checks the parent ID, locale, slug, translation ID, dates, and publication boundary.

Content branches may contain reviewed owner-specific values; the reusable `main` branch intentionally remains generic. Keep private editorial masters and working notes outside runtime content and commits. Populate only verified public facts. Run `npm run content:validate` and `npm run build` after editing.

For the optional local editor, run `npm run dev:content` and follow `design/architecture/easy-content.md`. It edits these same files; it does not create a separate content database or automatically commit changes.
