# Content authoring

Projects are knowledge hubs, not only cards. Keep metadata in `content/projects/entries.json`, write the rich project document at `content/blog/{locale}/projects/{project-id}/overview.mdx`, and place focused articles beside it.

## Add a project

Add one bilingual record to `content/projects/entries.json` using the existing schema. The author-facing selection fields are:

```json
{
  "id": "devops",
  "visible": true,
  "favorite": true,
  "favoriteAt": "2026-10-29",
  "publication": "public-ready",
  "locales": { "en": { "title": "DevOps", "description": "..." }, "fa": { "title": "دواپس", "description": "..." } }
}
```

Then create `overview.mdx` in both locale folders. The project card, homepage selection, Blog favorite section, breadcrumbs, and child-article list are derived automatically.

## Add a child article

```text
content/blog/en/projects/devops/cicd.mdx
content/blog/fa/projects/devops/cicd.mdx
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

For local, developer-only editing, run `npm run dev:content`. This enables a clearly marked Edit control and a file-backed editor only in Astro development mode. It requires no CMS or database and never commits, pushes, deploys, or writes outside the canonical `content/` tree. Read `design/architecture/easy-content.md` before using it.

The editor supports the Home profile, Blog landing, project mother documents, child project articles, and Journey milestones. Projects keep their registry metadata and localized `overview.mdx` synchronized; child articles are created beside the overview. Source mode is authoritative for advanced MDX. Visual mode is a lightweight preview/editor for basic Markdown and becomes read-only when advanced components are present. Use Diff, Git status, and Validate before saving or publishing locally. Drafts are the safe default for newly created projects, articles, and Journey entries.

Uploaded images are stored under `content/media/` and mirrored to `public/media/` for the current dev session. Use the returned logical `/media/...` path in the article or project content. The API accepts only loopback, same-origin requests and checks file revisions to prevent overwriting an external edit.

## Existing article capabilities

The filename, `slug`, and final URL segment must match. `category` and `subcategory` must match their folders. To translate an article, create the same relative path under `fa/`, use `locale: fa`, and keep the same `translationId`. If a translation is missing, the language switcher safely returns to that language’s Blog landing page.

Set `draft: true` to omit content from public pages, sitemap, RSS, and Pagefind. Optional local covers can sit beside the MDX file with `cover: ./cover.svg` and a locale-specific `coverAlt`. Shared public images use paths such as `![Diagram](/images/pipeline.svg)` or `<Figure src="/images/pipeline.svg" alt="Pipeline" caption="Example pipeline" />`. Put downloadable PDFs under `public/docs/` and use `<AttachmentDownload />`.

Fenced `bash`, `ts`, `yaml`, and other code blocks receive Shiki highlighting and copy controls. Markdown tables, task lists, footnotes, math, blockquotes, headings/anchors, callouts, Mermaid, Markmap, Tabs, and collapsible details remain supported by the existing reader. Use headings from H2 onward because the reader supplies the article H1 and table of contents.
