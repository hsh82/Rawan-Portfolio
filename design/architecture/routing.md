# Routing

`/` redirects to `/en/`. Each locale has two top-level areas: `/{locale}/` is the single-page portfolio, and `/{locale}/blog/` is the blog index. Blog category archives use `/{locale}/blog/category/{category...}/`; article URLs preserve their content folders under `/{locale}/blog/{folder...}/{slug}/`.

Journey, projects, contact, and résumé are homepage sections at `#journey`, `#projects`, `#contact`, and `#resume`. Legacy localized standalone routes redirect to those anchors. The homepage progress navigator is rendered only on the homepage. Blog pages have no section progress UI.

Blog articles are locale-prefixed in source. General topic articles may retain category folders such as `content/blog/en/devops/docker/article.mdx`. Articles for a portfolio project live at `content/blog/{locale}/projects/{project-id}/{article-slug}.mdx`; use `npm run content:new -- blog <locale> projects/<project-id> <article-slug>` to create a draft with matching `category`, `subcategory`, and `slug` frontmatter. Project IDs match `content/projects/entries.json`; their article links appear in the corresponding homepage project card. Drafts are filtered before static paths are generated.
