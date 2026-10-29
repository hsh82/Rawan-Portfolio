# Résumé PDF V3 implementation report

## Scope

Applied the approved résumé simplification plan on `dev` and
`content/hamed-sheikhan-v2`.

The new renderer uses a shared normalized content source for the website and
résumé. No owner-specific biography, contact invitation, project description, or
URL is maintained in the generator.

## Layout changes

- Page one: identity, portrait, one canonical profile paragraph, and experience.
- Page two: technical capabilities, education, and compact contact details.
- Page three: selected root projects in a readable single-column list.
- Contact now appears immediately before the project appendix.
- Body and metadata text were enlarged for comfortable reading.
- The large header contact card, duplicate profile summary, fixed footer, page
  counter, project card grid, and child-article explanation were removed.
- Pagination uses normal-flow sections and page breaks; fixed elements no longer
  overlap later pages.

## Content rules

- Profile/home, contact, experience, skills, education, and résumé settings come
  from the canonical `content/` records.
- Projects come only from direct root hubs under `content/blog/projects/`.
- Favorites are selected first, with the configured maximum of four.
- Nested child articles are excluded.
- Empty phone and website fields remain hidden.
- No graduation claim, private metric, internal hostname, credential, or editorial
  note was added.

## Verification

Passed on `content/hamed-sheikhan-v2`:

- `npm run content:validate`
- `npm run content:check-links`
- `npm run test:content-api`
- `npm run resume:generate`
- `npm run check` — 0 errors; existing deprecation hints remain

Both PDFs are A4, tagged, searchable, and three pages. EN and FA pages were
rendered with Poppler and inspected individually. The inspection confirmed:

- no overlap or fixed-footer artifact;
- no orphan section heading;
- correct portrait rendering;
- readable RTL and LTR ordering;
- aligned contact links before projects;
- exactly four root project entries;
- no nested article title in the appendix.

Build and static checks are run before the final commits. No E2E browser suite
was added for this print-only change.
