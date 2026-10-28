# Projects

Projects use one canonical bilingual registry at `content/projects/entries.json`. Each record has a stable ID, publication state, maturity, categories, localized role and copy, technology labels, and validated relationships to Skills, Journey, and other projects. External source and demo actions are optional; internal work must not receive a placeholder action.

The homepage renders the curated records marked `featured`, sorted by their configured priority. The localized `/{locale}/projects/` index renders all visible records with category filters. `ProjectVisual` supplies neutral CSS/icon illustrations so internal screenshots and topology are never implied.

Only a record with bilingual `caseStudy` data receives a static route at `/{locale}/projects/{id}/`. Detail pages include context, direct contribution, sanitized decisions, qualitative outcome, limits, evidence boundary, technology labels, and verified cross-references. Review and backlog publication states remain hidden and generate no route.

Every visible project owns a published bilingual overview at `content/blog/{locale}/projects/{project-id}/overview.mdx`. Cards use that article as their primary destination; a structured case-study route, when present, remains a concise portfolio summary. The validator requires matching English and Persian overview files for each visible project.

For an optional card cover, add a public image at `content/media/projects/{project-id}/cover.webp` (or another supported format), then set `image` to that content-relative path and provide bilingual `imageAlt` in the matching project record. If no image is configured, `ProjectVisual` renders the category icon illustration.
