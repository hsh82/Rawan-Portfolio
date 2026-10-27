# Portfolio content

This directory is the only source of public, owner-specific portfolio content. Application components and routes belong in `src/`.

- `site.json`, `profile.json`, and `contact.json` hold localized identity and contact details.
- `journey/`, `projects/`, `experience/`, `education/`, `certifications/`, and `skills/` contain structured JSON entries.
- `blog/{en,fa}/` contains nested MDX articles. Project articles belong under `content/blog/{locale}/projects/{project-id}/{article-slug}.mdx`; create them with `npm run content:new -- blog <locale> projects/<project-id> <article-slug>`. General technical articles can use topic folders. New AI-authored factual articles should start as drafts.
- `media/` holds public images; `documents/` holds intended public downloads.
- `resume/config.json` selects existing entries for the generated résumé view and PDF process.

The committed values are deliberately empty or generic. Populate only verified public facts. Run `npm run content:validate` and `npm run build` after editing.
