# Blog

Articles use the Astro Content Layer from `content/blog`. The blog index, category archives, and articles are nested below `/{locale}/blog/`; the blog has no section progress navigator. The listing derives categories and tags from metadata. The reader adds navigation, Table of Contents, Mermaid, Markmap, and print styles.

Project articles live at `content/blog/{locale}/projects/{project-id}/{article-slug}.mdx`. Use `npm run content:new -- blog <locale> projects/<project-id> <article-slug>` to create a draft with matching `category: projects` and `subcategory: <project-id>`. The project ID must match a record in `content/projects/entries.json`; its homepage card links to its articles. Existing general topic folders remain supported. Article links, translations, RSS, canonical URLs, and breadcrumbs are generated from the nested article ID.
