# Portfolio platform instructions

Read `design/plan.md` and the relevant component document before changing architecture. For ordinary authoring, edit only `content/` and use one of `.agents/skills/portfolio-*` skills. Do not invent employment, education, certifications, project outcomes, or personal contact data. Preserve stable IDs, translations, and references.

Run `npm run content:validate`, `npm run content:check-links`, and the relevant build checks after content changes. Application work belongs in `src/`; content work must not change application code unless explicitly requested. Keep `design/` accurate after architectural changes.

Engineering workflows: use portfolio-easy-content for local editor work and portfolio-staging-review for acceptance evidence. Platform portability instructions are supplied by portfolio-cross-platform on the platform staging branch.
