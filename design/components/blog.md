# Blog

Articles use the Astro Content Layer from `content/blog`. The blog index, category archives, and articles are nested below `/{locale}/blog/`; the blog has no section progress navigator. The listing derives categories and tags from metadata. The reader adds navigation, Table of Contents, Mermaid, Markmap, and print styles.

Project articles live at `content/blog/{locale}/projects/{project-id}/{article-slug}.mdx`. Every visible project has a published bilingual `overview.mdx` with matching `category: projects` and `subcategory: <project-id>`; its homepage and Projects-index card link directly to that article. Use `npm run content:new -- blog <locale> projects/<project-id> <article-slug>` for supplementary drafts. Existing general topic folders remain supported. Article links, translations, RSS, canonical URLs, and breadcrumbs are generated from the nested article ID.
