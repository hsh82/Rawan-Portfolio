# Portfolio content

This directory is the only source of public, owner-specific portfolio content. Application components and routes belong in `src/`.

- `site.json`, `profile.json`, `home.json`, and `contact.json` hold site identity, portrait data, homepage copy, and contact details separately.
- `journey/`, `experience/`, `education/`, `certifications/`, and `skills/` contain structured JSON entries.
- `blog/landing/{entry.json,en.mdx,fa.mdx}` contains editable Blog landing copy. Each project is its own canonical Blog hub at `blog/projects/{project-id}/{entry.json,en.mdx,fa.mdx}`; child articles live below `articles/{article-slug}/`. The project hub is the only source for project cards, homepage favorites, Blog project hubs, and project reading routes. New AI-authored factual articles should start as drafts until publication is explicitly approved.
- `media/` holds public images; `documents/` holds intended public downloads. Use `media/projects/{project-id}/cover.webp` for an optional project-card cover, then reference it in the project record with bilingual `imageAlt`; category icons remain the fallback. `profile.json` owns the portrait and identity only; `home.json` owns homepage copy. The Studio’s Profile & portrait resource can import an image into `content/media/` and save its canonical reference automatically. Optional `profile.resumeImage` overrides the portrait only for résumé PDFs. The repository README preview is intentionally kept separately at `public/images/portfolio-preview.jpg` for GitHub rendering.
- `resume/config.json` selects existing entries for the generated résumé view and PDF process.

## Easy Content Mode foundation

The content hierarchy is:

```text
content/
  blog/
    landing/
      entry.json
      en.mdx
      fa.mdx
    projects/<project-id>/
      entry.json                  # Shared card/publication metadata
      en.mdx                      # English overview
      fa.mdx                      # Persian overview
      articles/<article-slug>/{entry.json,en.mdx,fa.mdx}
```

Set `favorite: true` on a project to prioritize it. Add `favoriteAt: YYYY-MM-DD` when the selection date matters; favorite projects sort by that date descending, then normal public projects fill the homepage up to six records by their update/publication date. Older `featured: true` records remain compatible as favorites.

Project-to-article relationships are derived from the hub path, so a child under `blog/projects/devops/articles/` belongs to the `devops` project without a repeated parent field. The validator checks the parent ID, locale, slug, translation ID, dates, and publication boundary.

Content branches may contain reviewed owner-specific values; the reusable `main` branch intentionally remains generic. Keep private editorial masters and working notes outside runtime content and commits. Populate only verified public facts. Run `npm run content:validate` and `npm run build` after editing.

For the optional local editor, run `npm run dev:content` and open `/dev/content/`; it edits these same files, previews unsaved structured content locally, and does not create a separate content database or automatically commit changes.
