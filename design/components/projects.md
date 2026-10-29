# Projects

Projects use one canonical bilingual Blog hub at `content/blog/projects/<id>/`. Its `entry.json` has the stable ID, draft/published status, category, localized role, technology labels, favorite selection metadata, and validated relationships to Skills, Journey, and other projects. The sibling `en.mdx` and `fa.mdx` hold localized overview copy. External source and demo actions are optional; internal work must not receive a placeholder action.

The homepage renders up to six public records through the centralized project selector. `favorite: true` records come first by `favoriteAt` descending, with updated/publication dates as fallback; newest normal public records fill remaining positions. The localized `/{locale}/projects/` index renders all visible records with category filters. `ProjectVisual` supplies neutral CSS/icon illustrations so internal screenshots and topology are never implied.

Only a published record with bilingual `caseStudy` data receives a static route at `/{locale}/projects/{id}/`. Detail pages include context, direct contribution, sanitized decisions, qualitative outcome, limits, evidence boundary, technology labels, and verified cross-references. Draft records remain hidden and generate no public route.

Every visible project owns published `en.mdx` and `fa.mdx` overview siblings in its hub. Additional article entities in `articles/` are derived from the hub path. Cards use the stable `/blog/projects/<id>/overview/` route as their primary destination; a structured case-study route, when present, remains a concise portfolio compatibility summary. The validator requires matching English and Persian overview files for each visible project.

For an optional card cover, add a public image at `content/media/projects/{project-id}/cover.webp` (or another supported format), then set `image` to that content-relative path and provide bilingual `imageAlt` in the matching project record. If no image is configured, `ProjectVisual` renders the category icon illustration.
