# Homepage

The localized homepage is the portfolio's single page. It reads identity and portraits from `content/profile.json` and title, introduction, summary, About and Focus copy from `content/home.json` and composes anchored sections for introduction, About, professional experience, Journey, skills, contact, projects, and the blog call to action. Experience, skills, Journey, and projects read structured `content/` records and show neutral empty states when records are absent. Résumé access is a generated PDF button in the shared header rather than a homepage section.

Stable section IDs drive in-page navigation and the segmented progress navigator. The navigator exists only on the homepage. Former standalone Journey, Projects, Contact, and Résumé URLs redirect to the matching homepage anchor.

The homepage order is Hero → Skills → About → Focus → Experience → Projects → Journey → Contact → Blog. Project cards expose a structured maturity label (`organizational`, `internal-pilot`, `academic-mvp`, or `experimental-open-source`) and link to nested project articles under `content/blog/{locale}/projects/{project-id}/`.

The production page and script-free local unsaved preview share HomeSurface. parsePortfolioSource accepts a supplied validated snapshot; Layout, Navbar, Footer and FooterCTA accept that same data. Structured preview overlays only the edited resource and preserves remaining canonical resources. Preview sessions use locale-bearing dev-only routes to satisfy Astro i18n routing and never appear in static output.

Focus cards and their bilingual heading/eyebrow are editable through the Focus areas Studio entry, backed by `home.focus`. Older files retain the existing heading defaults until explicitly saved.
