# Résumé PDF V2 implementation report

## Scope

Implemented the approved résumé plan on `dev` and on the Hamed content worktree
for `content/hamed-sheikhan-v2`.

The generator now derives résumé identity, localized profile copy, contact
details, experience, skills, education, and projects from the canonical content
model. The PDF uses a contact-first first page and a dedicated selected-projects
appendix page.

## Project selection

Projects are read from direct root hubs under `content/blog/projects/`. Nested
articles are intentionally excluded. Selection is favorites-first and limited by
`content/resume/config.json` (`projectLimit: 4`); when fewer favorites exist,
published root projects fill the remaining places.

The Hamed content branch currently selects:

1. Rahban — Remote Desktop Access Gateway
2. Infrastructure as Code with VMware
3. Camran — Cashback Demo MVP
4. DevOps Delivery & Automation

Child articles and the legacy `content/projects/entries.json` registry are not
used by the résumé.

## Content and privacy decisions

- Hamed's verified email, Isfahan location, GitHub, and LinkedIn are shown.
- Phone number and website remain omitted because they were not provided.
- Education copy avoids claiming graduation or inventing dates.
- No internal metrics, hostnames, credentials, customer data, or editorial notes
  enter the PDF.
- The generic `dev` template remains content-neutral and keeps its profile
  disabled; its résumé generation correctly skips until content is enabled.

## Changed implementation paths

- `scripts/resume-generate.mjs`
- `src/utils/project-source.mjs`
- `src/utils/portfolio-content.ts`
- `content/resume/config.json`
- `content/home.json` (Hamed branch)
- `content/education/entries.json` (Hamed branch)
- `design/components/resume.md`
- `design/architecture/content-model.md`

## Verification

Passed on the Hamed content worktree:

- `npm run content:validate`
- `npm run content:check-links`
- `npm run resume:generate`
- `npm run check`
- `npm run build`
- `npm test`

The Hamed build generated 72 pages. Both résumé PDFs are searchable, tagged,
A4-sized, and three pages long. Text extraction confirmed the contact panel on
page one and exactly four root projects on page three in both locales. Rendered
EN and FA pages were inspected for RTL direction, clipping, portrait rendering,
contact readability, and project-card layout.

On `dev`, `npm run check` and `npm run build` passed. Résumé generation skipped
as intended because the generic template profile is disabled.

No end-to-end browser suite was run, per request. No commit, push, or deploy was
performed.
