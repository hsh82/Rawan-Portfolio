---
name: portfolio-project
description: Maintain project case studies and their journey or article links.
---

# Portfolio project

Read `content/projects/entries.json` and `design/components/projects.md`. Capture verified context, architecture, technologies, decisions, and results without inventing metrics. Keep project metadata in the registry; use `content/blog/{locale}/projects/{project-id}/overview.mdx` as the rich mother document and derive child articles from that folder. Use `favorite`/`favoriteAt` for homepage and Blog priority, not hard-coded lists. Use stable IDs and validate journey and article relationships with `npm run content:validate`.
