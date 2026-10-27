---
name: portfolio-resume
description: Maintain résumé inclusion rules from existing verified content and validate output readiness.
---

# Portfolio résumé

Read `content/resume/config.json`, existing structured records, and `design/components/resume.md`. Select entries by stable ID without duplicating career information. Do not enable résumé generation until profile content is verified and public. Keep all candidate copy, contact details, portrait paths, locale text, and filename identity in `content/`; the renderer must remain generic and must never hardcode a person’s name, title, URL, or achievement.

Use a safe lowercase `filenameSlug`, preserve the stable `/resume/en.pdf` and `/resume/fa.pdf` aliases, and keep preferred identity-based filenames available. Generate both locales with embedded searchable Vazirmatn fonts, semantic headings, content-provided portrait/fallback behavior, mixed-direction URL handling, and no browser print header/footer decorations. Inspect every rendered page with Poppler and visually check for clipping, overlap, broken RTL ordering, missing portrait, leaked file paths, dates, or editorial notes.

Run `npm run content:validate`, `npm run content:check-links`, `npm run resume:generate`, `npm run check`, `npm run build`, and `npm run test:static`. Record generated filenames, page counts, visual checks, and any intentionally omitted unverified fields in the dated design report. Do not commit, push, merge, or deploy without explicit authorization.
