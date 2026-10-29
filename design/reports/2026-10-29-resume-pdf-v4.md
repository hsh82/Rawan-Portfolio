# Résumé PDF v4 — Full homepage content

## Scope

The generated résumé now follows the canonical homepage content instead of presenting a reduced résumé-only selection. It includes the localized homepage introduction, About narrative and cards, professional focus, skills, education, experience, Journey, contact, and the selected-project appendix.

## Source mapping

- `content/profile.json` and `content/home.json`: identity, title, introduction, summary, About, focus, and portrait fallback.
- `content/contact.json` and `content/site.json`: contact links and location.
- `content/skills/entries.json`, `content/experience/entries.json`, `content/education/entries.json`, and `content/journey/entries.json`: career content.
- `content/blog/projects/<id>/`: published root project hubs only; nested articles remain excluded.
- `content/resume/config.json`: enabled locales, portrait, Journey inclusion, and project limit.

## Output

The Hamed résumé generates searchable A4 PDFs in English and Persian with embedded Vazirmatn fonts, the configured portrait, normal-flow pagination, contact before projects, and four selected root projects. The current output is five pages per locale and was visually inspected page-by-page at 100 DPI.

## Validation

- `node --check scripts/resume-generate.mjs` — passed.
- `npm run content:validate` — passed: 5 projects and 5 Journey entries.
- `npm run resume:generate` — passed for English and Persian outputs.
- `pdfinfo` — passed; both PDFs are tagged A4 documents.
- English and Persian rendered pages — inspected with no visible overlap or clipping.

The reusable template branch keeps its résumé disabled; its renderer and documentation stay structurally aligned with the content branch.
