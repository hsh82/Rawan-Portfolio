# Routing

`/` redirects to `/en/`. The localized areas are `/{locale}/` for the portfolio, `/{locale}/projects/` for the project index and case studies, and `/{locale}/blog/` for editorial articles. Blog category archives use `/{locale}/blog/category/{category...}/`; article URLs preserve their content folders under `/{locale}/blog/{folder...}/{slug}/`.

Journey, projects, contact, and résumé are homepage sections at `#journey`, `#projects`, `#contact`, and `#resume`. The Projects index is also a localized route. A visible project receives `/{locale}/projects/{id}/` only when its canonical record has a bilingual case study. Hidden review and backlog records generate no route. The homepage progress navigator is rendered only on the homepage and follows Home → About → Skills → Focus → Experience → Projects → Journey → Contact → Blog.

Blog articles are locale-prefixed in source. General topic articles may retain category folders such as `content/blog/en/devops/docker/article.mdx`. Every visible portfolio project has a published `content/blog/{locale}/projects/{project-id}/overview.mdx` in both locales; project cards link to this reading route. Use `npm run content:new -- blog <locale> projects/<project-id> <article-slug>` to create a supplemental draft with matching `category`, `subcategory`, and `slug` frontmatter. Draft articles are filtered before static paths are generated.
