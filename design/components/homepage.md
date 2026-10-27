# Homepage

The localized homepage is the portfolio's single page. It reads title, introduction, summary, and description from `content/profile.json` and composes anchored sections for introduction, About, professional experience, Journey, skills, contact, projects, and the blog call to action. Experience, skills, Journey, and projects read structured `content/` records and show neutral empty states when records are absent. Résumé access is a generated PDF button in the shared header rather than a homepage section.

Stable section IDs drive in-page navigation and the segmented progress navigator. The navigator exists only on the homepage. Former standalone Journey, Projects, Contact, and Résumé URLs redirect to the matching homepage anchor.

The homepage order is Hero → Skills → About → Focus → Experience → Projects → Journey → Contact → Blog. Project cards expose a structured maturity label (`organizational`, `internal-pilot`, `academic-mvp`, or `experimental-open-source`) and link to nested project articles under `content/blog/{locale}/projects/{project-id}/`.
