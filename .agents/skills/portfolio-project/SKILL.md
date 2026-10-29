---
name: portfolio-project
description: Maintain project case studies and their journey or article links.
---

# Portfolio project

Read `content/blog/projects/<project-id>/entry.json` and `design/components/projects.md`. Capture verified context, architecture, technologies, decisions, and results without inventing metrics. Keep shared project metadata in the hub entry and localized overview copy in sibling `en.mdx`/`fa.mdx`; derive child articles from `articles/`. Use `favorite`/`favoriteAt` for homepage and Blog priority, not hard-coded lists. Use stable IDs and validate journey and article relationships with `npm run content:validate`.
