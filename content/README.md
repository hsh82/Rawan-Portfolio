# Portfolio content

This directory is the only source of public, owner-specific portfolio content. Application components and routes belong in `src/`.

- `site.json`, `profile.json`, and `contact.json` hold localized identity and contact details.
- `journey/`, `projects/`, `experience/`, `education/`, `certifications/`, and `skills/` contain structured JSON entries.
- `blog/{en,fa}/projects/` contains nested MDX articles owned by structured projects. Every visible project requires a published bilingual `overview.mdx` under `content/blog/{locale}/projects/{project-id}/`; project cards lead to that article. Add further articles with `npm run content:new -- blog <locale> projects/<project-id> <article-slug>`. New AI-authored factual articles should start as drafts until publication is explicitly approved.
- `media/` holds public images; `documents/` holds intended public downloads. Use `media/projects/{project-id}/cover.webp` for an optional project-card cover, then reference it in the project record with bilingual `imageAlt`; category icons remain the fallback. Profile images use the same canonical path convention, for example `media/profile/profile.svg`. The repository README preview is intentionally kept separately at `public/images/portfolio-preview.jpg` for GitHub rendering.
- `resume/config.json` selects existing entries for the generated résumé view and PDF process.

Content branches may contain reviewed owner-specific values; the reusable `main` branch intentionally remains generic. Keep private editorial masters and working notes outside runtime content and commits. Populate only verified public facts. Run `npm run content:validate` and `npm run build` after editing.
