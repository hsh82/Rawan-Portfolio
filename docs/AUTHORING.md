# Article author guide

Create a `.mdx` file at `content/blog/en/devops/docker/new-topic.mdx`:

```mdx
---
title: "New topic"
description: "A concise summary."
slug: new-topic
locale: en
category: devops
subcategory: docker
tags: [Docker, Example]
pubDate: 2026-10-27
updatedDate: 2026-10-27
draft: false
featured: false
# Optional: cover: ./cover.svg
translationId: new-topic
toc: true
---

## First section

Write your article here.
```

The first folder is the locale; the next folders are category and subcategory. The filename, `slug`, and final URL segment must match. Category and subcategory fields must match folders. Adding a valid file creates its card, category route, and article page on the next build. A new subcategory creates a nested category view automatically. Set `draft: true` to omit a file from public pages, sitemap, and Pagefind. Set `featured: true` to place it in the landing page's featured area.

To translate, create the same relative path under `fa/`, write Persian content and metadata, set `locale: fa`, and use the same `translationId`. The switcher links matching published translations; if one is missing, it links to that language's blog landing page. An English article is never presented as a Persian translation.

For a card cover, place an image beside the MDX file and add `cover: ./cover.svg` to its frontmatter. Use absolute site paths for shared files in `public/`: `![Diagram](/images/pipeline.svg)` or `<Figure src="/images/pipeline.svg" alt="Pipeline" caption="Example pipeline" />`. Put PDF files under `public/docs/` and link them with `<AttachmentDownload href="/docs/file.pdf" label="Download the report" />`. Local page links use `/{locale}/blog/.../`. External links should use normal Markdown links; add `rel="noopener noreferrer"` to links you explicitly open in a new tab.

Fenced code blocks use Astro's Shiki highlighting. Name the language after the opening fence, such as `bash`, `ts`, or `yaml`. Copy buttons are added automatically. Inline code stays LTR inside Persian articles. Markdown tables, task lists, footnotes, and math are supported. Use headings from H2 onward; the reader supplies the H1 title and generates the table of contents.

Reusable MDX components:

```mdx
<Callout type="tip" title="Tip">A short note.</Callout>

<CodeBlock filename="scripts/build.sh" language="bash" code={`npm run build`} />

<MermaidDiagram label="Deployment flow" chart={`flowchart LR\n  A[Build] --> B[Deploy]`} />

<MindMap label="Architecture" content={`# Architecture\n## App\n### Pages\n## Data\n### Files`} />

<Tabs labels={['Local', 'CI']}>
<div><code>npm run build</code></div>
<div><code>npm ci &amp;&amp; npm run build</code></div>
</Tabs>
```

Mermaid accepts flowcharts, sequence, state, Gantt, entity relationship, and supported mindmap syntax. Markmap accepts Markdown headings or lists. Both render only when scrolled near the viewport and have text fallbacks. Mermaid uses strict security mode. Diagram text and code examples should be authored as trusted repository content.

Use `<details><summary>More</summary>Content</details>` for collapsible sections. Keep attached assets small, give figures descriptive alt text, and test both locale routes with `npm run build && npm run preview` before publishing.
