# Portfolio content

This directory is the only source of public, owner-specific portfolio content. Application components and routes belong in `src/`.

- `site.json`, `profile.json`, and `contact.json` hold localized identity and contact details.
- `journey/`, `projects/`, `experience/`, `education/`, `certifications/`, and `skills/` contain structured JSON entries.
- `blog/{en,fa}/_index.mdx` contains editable Blog landing copy. `blog/{en,fa}/projects/{project-id}/overview.mdx` is the rich mother document for one project; additional files in the same directory are child articles discovered automatically. The project registry remains the single source of project metadata. Project cards lead to the mother document, and the mother document lists its child articles. Add an article with `npm run content:new -- blog <locale> projects/<project-id> <article-slug>`. New AI-authored factual articles should start as drafts until publication is explicitly approved.
- `media/` holds public images; `documents/` holds intended public downloads. Use `media/projects/{project-id}/cover.webp` for an optional project-card cover, then reference it in the project record with bilingual `imageAlt`; category icons remain the fallback. `profile.image` is the main-site portrait; optional `profile.resumeImage` overrides it only for résumé PDFs. If `resumeImage` is absent, the résumé uses `profile.image`. The repository README preview is intentionally kept separately at `public/images/portfolio-preview.jpg` for GitHub rendering.
- `resume/config.json` selects existing entries for the generated résumé view and PDF process.

## Easy Content Mode foundation

The content hierarchy is:

```text
content/
  blog/
    en/_index.mdx                 # Blog landing copy
    fa/_index.mdx
    en/projects/<project-id>/
      overview.mdx                # Project / mother document
      <article-slug>.mdx          # Child article
    fa/projects/<project-id>/
      overview.mdx
      <article-slug>.mdx
  projects/entries.json           # One canonical project registry
```

Set `favorite: true` on a project to prioritize it. Add `favoriteAt: YYYY-MM-DD` when the selection date matters; favorite projects sort by that date descending, then normal public projects fill the homepage up to six records by their update/publication date. Older `featured: true` records remain compatible as favorites.

Project-to-article relationships are derived from the folder path, so a child under `blog/en/projects/devops/` belongs to the `devops` project without a repeated parent field. The validator checks the parent ID, locale, slug, translation ID, dates, and publication boundary.

Content branches may contain reviewed owner-specific values; the reusable `main` branch intentionally remains generic. Keep private editorial masters and working notes outside runtime content and commits. Populate only verified public facts. Run `npm run content:validate` and `npm run build` after editing.

For the optional local editor, run `npm run dev:content` and follow `design/architecture/easy-content.md`. It edits these same files; it does not create a separate content database or automatically commit changes.
