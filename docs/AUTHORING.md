# Content authoring

Projects are knowledge hubs, not only cards. Keep shared metadata in `content/blog/projects/{project-id}/entry.json`, write the localized overview in sibling `en.mdx` and `fa.mdx`, and place focused articles in `articles/<slug>/`.

## Add a project

Create one project hub with a shared `entry.json` using the existing schema. The author-facing selection fields are:

```json
{
  "id": "devops",
  "status": "published",
  "favorite": true,
  "favoriteAt": "2026-10-29",
  "status": "draft",
  "role": { "en": "Engineer", "fa": "مهندس" }
}
```

Then create `en.mdx` and `fa.mdx` in the same project folder. The editor derives the project ID from the title and generates the `overview` URL automatically. Save as Draft while either translation is incomplete; Publish validates both translations and makes the project public. The project card, homepage selection, Blog listing, breadcrumbs, and child-article list are derived automatically. The project remains available at `/{locale}/blog/projects/{project-id}/overview/`.

## Add a child article

```text
content/blog/projects/devops/articles/cicd/entry.json
content/blog/projects/devops/articles/cicd/en.mdx
content/blog/projects/devops/articles/cicd/fa.mdx
```

Use the normal article frontmatter and keep the same `translationId` in both locales:

```mdx
---
title: CI/CD
description: A concise, evidence-based explanation.
slug: cicd
locale: en
category: projects
subcategory: devops
tags: [CI/CD]
pubDate: 2026-10-29
draft: true
featured: false
translationId: devops-cicd
toc: true
---

## The article
```

Set `draft: false` only after both language files and the public evidence are ready. Images, code blocks, tables, Mermaid, Markmap, KaTeX, callouts, and other documented MDX components continue to use the existing article renderer.

Run `npm run content:validate`, `npm run content:check-links`, `npm run test:content-api`, and `npm run build` before publication.

## Easy Content Mode

For local, developer-only editing, run `npm run dev:content`. On the Blog landing and project/article pages, this adds a contextual action bar below the normal site Header. Edit and creation actions open a full-page file-backed editor in Astro development mode; there is no popup editor. It requires no CMS or database and never commits, pushes, deploys, or writes outside the canonical `content/` tree. Read `design/architecture/easy-content.md` before using it.

The Studio at `/dev/content/` supports the Site, Profile, Contact, Résumé, Experience, Education, Certifications, Skills, Journey, Blog landing, project hubs, and child articles. General, English, and Persian fields share one editor route. Project card metadata and localized overview MDX remain in the same hub; child articles resolve the same parent Project. Source mode is authoritative for advanced MDX. Visual preview is read-only. Use Diff, Git status, and Validate before saving or publishing locally. New projects and articles default to drafts.

Uploaded images are stored under `content/media/` and mirrored to `public/media/` for the current dev session. Use the returned logical `/media/...` path in the article or project content. The API accepts only loopback, same-origin requests and checks file revisions to prevent overwriting an external edit.

## Existing article capabilities

The filename, `slug`, and final URL segment must match. `category` and `subcategory` must match their folders. To translate an article, create the same relative path under `fa/`, use `locale: fa`, and keep the same `translationId`. If a translation is missing, the language switcher safely returns to that language’s Blog landing page.

Set `draft: true` to omit content from public pages, sitemap, RSS, and Pagefind. Optional local covers can sit beside the MDX file with `cover: ./cover.svg` and a locale-specific `coverAlt`. Shared public images use paths such as `![Diagram](/images/pipeline.svg)` or `<Figure src="/images/pipeline.svg" alt="Pipeline" caption="Example pipeline" />`. Put downloadable PDFs under `public/docs/` and use `<AttachmentDownload />`.

Fenced `bash`, `ts`, `yaml`, and other code blocks receive Shiki highlighting and copy controls. Markdown tables, task lists, footnotes, math, blockquotes, headings/anchors, callouts, Mermaid, Markmap, Tabs, and collapsible details remain supported by the existing reader. Use headings from H2 onward because the reader supplies the article H1 and table of contents.
