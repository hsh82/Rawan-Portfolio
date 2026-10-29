# Rawan Portfolio

**A bilingual, AI-maintainable developer portfolio powered by Astro.**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md) [![Made with Astro](https://img.shields.io/badge/Made%20with-Astro-ff5d01?logo=astro&logoColor=white)](https://astro.build/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[![Portfolio preview](public/images/portfolio-preview.jpg)](public/images/portfolio-preview.jpg)

<a href="README.fa.md"><strong>راهنمای فارسی ←</strong></a>

Rawan Portfolio is a reusable English/Persian portfolio framework for developers, engineers, designers, and technical teams. It keeps public owner data in `content/`, presentation and behavior in `src/`, and maintenance guidance in repository-local Agent Skills. Normal content changes do not require editing Astro components.

The project originated from the [Nicremo Astro multilingual portfolio template](https://github.com/nicremo/astro-multilingual-portfolio-template) and has been extended with structured content loaders, RTL/LTR support, nested MDX publishing, Mermaid and Markmap readers, search, journey/project relationships, and optional bilingual résumé generation. The reusable `main` branch stays owner-neutral; personal content is maintained on a separate content branch.

The upstream project provides the visual starting point, responsive portfolio layout, theme switching, multilingual navigation, and MIT-licensed foundation. This repository keeps those useful ideas while moving owner data into the central `content/` tree and adding an empty-template workflow suitable for reuse.

The repository preview above is the maintained visual reference for this release. It is stored at `public/images/portfolio-preview.jpg` so GitHub, local documentation, and cloned checkouts use the same image.

## Features

| Area | Included |
| --- | --- |
| Locales | English and Persian routes with RTL/LTR document direction |
| UI | Responsive design, dark/light theme, sticky navigation, homepage progress navigator |
| Portfolio | Skills & Tools, Journey, Projects, About, Contact cards, intentional empty states |
| Publishing | Nested MDX blog, categories, tags, drafts, generated article navigation, RSS |
| Documents | Markdown/MDX reader, Mermaid, Markmap, KaTeX math, PDF attachments |
| Search | Pagefind production search index |
| Résumé | Optional content-driven bilingual PDF generator using Chromium and Vazirmatn |
| Maintenance | Repository-local Agent Skills, content validation, link checks, CI, Vercel workflows |

The main reusable sections are navigation, hero, values/about, skills and tools, projects, professional journey, contact, blog, and optional résumé output. Empty content is supported by design, so a fresh clone does not display a fictional owner or require placeholder employment data.

## Technology stack

- Astro 5 with TypeScript and static output
- Tailwind CSS with `@astrojs/tailwind`
- Astro Content Collections and `@astrojs/mdx`
- Preact compatibility for interactive client components
- Vazirmatn and `@fontsource/vazirmatn`
- Lucide icons through `@lucide/astro`
- Mermaid, Markmap, KaTeX, `remark-gfm`, and `rehype-katex`
- Pagefind for production search
- npm with the tracked `package-lock.json`

## Quick start

```sh
git clone <your-repository-url>
cd portfolio
npm ci
npm run dev
```

Open `http://localhost:4321/en/` or `/fa/`. Validate and build before publishing:

```sh
npm run content:validate
npm run content:check-links
npm run check
npm run build
npm run preview
```

The root route redirects to English. `npm run build` generates `dist/` and the Pagefind index. `npm run preview` serves the production output.

## Easy Content mode

Easy Content is the local authoring interface for editing JSON and bilingual project content without changing Astro components. It is disabled by default and is never enabled by a production build.

### Start the editable development site

```sh
npm run dev:content
```

Then open `http://localhost:4321/en/` or `http://localhost:4321/fa/`. When Easy Content is enabled, the site shows an editing action bar. Persian action links open the editor in Persian; English links open it in English.

### Preview with editing enabled

```sh
npm run build
npm run preview:content
```

Use `npm run preview` for a normal read-only production preview. Do not expose `EASY_CONTENT_MODE=true` on a public or deployed server because Easy Content writes to the local working tree.

### Recommended authoring flow

1. Start `npm run dev:content`, or build first and use `npm run preview:content`.
2. Open the site in the language you want to edit.
3. Use the edit action bar to open **Homepage content**, **Profile & portrait**, or **Edit Blog**.
4. Edit homepage copy in `content/home.json`. Keep identity and portrait fields in `content/profile.json`; import a portrait from the Profile & portrait editor so it is stored under `content/media/` and referenced automatically.
5. Use **Edit Blog** to create a project hub. A project is one folder containing shared `entry.json` metadata and sibling `en.mdx` and `fa.mdx` overview files. Add child articles inside that project folder when needed.
6. Save as draft while working. **Publish** validates, saves, and publishes the bilingual project/article together.
7. Review the real-site preview in both languages, then run validation and build checks.
8. Commit the authored content and push the branch:

```sh
npm run content:validate
npm run content:check-links
npm run check
npm run build
git status
git add content/ public/images/ README.md README.fa.md
git commit -m "content: update portfolio"
git push origin HEAD
```

The editor does not commit, push, or deploy. Review the Git diff before committing. Draft content remains out of public routes until it is explicitly published.

### Easy Content walkthrough

<a href="public/images/Home%20page%20edit%20helper.JPG"><img src="public/images/Home%20page%20edit%20helper.JPG" alt="Easy Content homepage JSON editor" width="720"></a>

<a href="public/images/Article%20edit%20helper.JPG"><img src="public/images/Article%20edit%20helper.JPG" alt="Easy Content bilingual article editor" width="720"></a>

## Upstream credits and license

This project is based on the [Astro Multilingual Portfolio Template](https://github.com/nicremo/astro-multilingual-portfolio-template) by Fabian Bitzer. The upstream [MIT license](LICENSE.md), copyright notice, and attribution are retained. See the upstream README for the original template context and visual reference. New features and documentation in this repository are described here and in `design/`.

## Repository structure

```text
src/                 Astro pages, layouts, components, styles, and utilities
content/             Owner data, bilingual articles, media, and résumé config
.agents/skills/      Repository-local authoring and review instructions
design/              Private engineering architecture and decision documentation
scripts/             Content, link, résumé, and static-build utilities
.github/workflows/   CI and Vercel preview/production workflows
tests/fixtures/      Isolated fictional examples; never loaded by production
```

## Personalizing the portfolio

1. Edit `content/site.json` with the site URL and English/Persian title and description.
2. Set `visible: true` and identity/portrait fields in `content/profile.json`.
3. Add localized greeting, display name, title, introduction, summary, and CTA text in `content/home.json`.
4. Import or replace the portrait under `content/media/` and update `profile.image` to a canonical path such as `media/profile/profile.svg`. Add optional `resumeImage` when the résumé should use a different portrait; otherwise the résumé falls back to `profile.image`.
5. Add verified email, phone, location, and `{ label, url }` social links in `content/contact.json`.
6. Add skill records to `content/skills/entries.json`.
7. Add employment or education records to their corresponding `entries.json` files.
8. Add important milestones to `content/journey/entries.json`.
9. Add projects as hubs under `content/blog/projects/<project-id>/` and connect related journey/article IDs in the hub `entry.json`.
10. Add bilingual MDX articles inside their project hub when appropriate.
11. Enable `content/resume/config.json` only after the profile and résumé data are verified.
12. Run content validation, link checks, type checking, and a production build.

The JSON schemas in `src/utils/portfolio-content.ts` are the source of truth. Keep stable IDs, provide both `en` and `fa` locale objects for records, and never invent employment, education, certifications, contact details, metrics, or outcomes.

## Skills & Tools

Skills use the categories `cicd`, `containers`, `infrastructure`, `network`, `scripting`, and `design`. Each record has an ID, category, visibility, priority, localized title/description, and a `technologies` array. Technology identifiers are mapped to Lucide icons in `src/utils/skill-icons.ts`; add a mapping there only when a new identifier needs a specific icon. Custom SVG assets can be used by the component asset conventions. Ordering is controlled by `priority`, and hidden records remain in the source without rendering.

## Journey

Journey records support `employment`, `milestone`, `education`, `certification`, `achievement`, `project`, `training`, `open-source`, and `other`. Use optional ISO dates, localized titles/descriptions, organizations, technologies, links, and `projectIds`. Journey is for meaningful professional milestones, not a chronological list of routine troubleshooting tasks.

## Projects

Projects use one bilingual hub under `content/blog/projects/{project-id}/` with automatic IDs, a shared `draft`/`published` status, localized copy, technologies, visibility, and priority. Optional `image`, `repository`, `externalUrl`, `journeyIds`, and `articleIds` connect the project to other content. The homepage and `/blog/projects/` read this same source; `content/projects/entries.json` is not a runtime project source. Featured projects appear in the homepage grid. Child articles live under `articles/{article-slug}/` inside the project hub and are shown with their parent project.

## Blog and documentation

The folder hierarchy becomes the URL hierarchy for regular articles:

```text
content/blog/en/devops/docker/docker-basics.mdx
→ /en/blog/devops/docker/docker-basics/
```

Frontmatter must include the real schema fields:

```mdx
---
title: Docker networking basics
description: A short introduction to container networking.
slug: docker-networking-basics
locale: en
category: devops
subcategory: docker
tags: [docker, networking]
pubDate: 2026-01-15
translationId: docker-networking-basics
draft: true
featured: false
toc: true
---

Start with a clear explanation.
```

Use matching translated files in `content/blog/fa/`, preserve `translationId`, and keep drafts out of published routes. For a project, use this structure:

```text
content/blog/projects/my-project/
├── entry.json
├── en.mdx
├── fa.mdx
└── articles/
    └── architecture/
        ├── en.mdx
        └── fa.mdx
```

Mermaid code blocks, Markmap content, KaTeX math, internal article links, images, and PDF attachments are supported by the existing reader components. `npm run content:new` creates a draft scaffold.

## Localization

English and Persian routes are generated under `/en/` and `/fa/`. Shared interface labels live in `src/i18n/en.json` and `src/i18n/fa.json`; owner-specific copy belongs in `content/`. The shared layout sets `lang`, `dir`, canonical URLs, and alternate-language links. To translate a profile, record, or article, add the corresponding `fa` object or Persian MDX file rather than duplicating a component.

## Automatic résumé generation

Résumé generation reads `content/profile.json`, `site.json`, `contact.json`, structured experience/education/certification/skill/project records, and `content/resume/config.json`. Set `enabled` to `true` only when the data is ready. Configure a lowercase `filenameSlug`, locales, portrait behavior, inclusion flags, and selected project IDs.

```sh
npm run resume:generate
```

The generator requires a Chromium-compatible executable (`google-chrome` by default; set `CHROME_BIN` when needed). It embeds Vazirmatn fonts, handles mixed-direction URLs, creates searchable PDFs, and derives filenames from the configured slug. Inspect output with `pdfinfo`, `pdftotext`, and `pdftoppm`. Generated PDFs are ignored by default because they are reproducible build artifacts.

## AI Agent Skills

The `.agents/skills/` directory contains the maintained skills discovered by Codex. They keep content work in `content/`, application work in `src/`, architecture notes in `design/`, and validation in the normal scripts. Useful skills include:

- `portfolio-profile`
- `portfolio-project`
- `portfolio-blog`
- `portfolio-journey`
- `portfolio-resume`
- `portfolio-assets`
- `portfolio-review`

Example requests:

```text
Add my new Kubernetes project.
Create a Persian article about Docker networking.
Update my professional experience.
Add Terraform to Infrastructure skills.
Generate my updated résumé.
Translate this article into English.
```

AI-generated factual claims require owner review. Validate content before building; drafts do not publish automatically.

## Deploy on Vercel

Vercel is a straightforward host for the generated Astro static output. Use one deployment path:

**Option A — Vercel Git integration.** Import the repository, use `npm run build`, and publish `dist`. Configure the production branch in Vercel and disable the workflow deployment if Git integration is used.

**Option B — GitHub Actions.** The repository includes two manual Vercel workflows. From the Actions tab, choose `Vercel Preview` or `Vercel Production`, then enter `main` or a `content/*` branch; no Git push deploys automatically. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as repository/environment secrets, configure the Vercel project, and protect the production environment. Never commit tokens, generated `.vercel` files, or local environment files. Disable Vercel Git auto-deployments if these workflows are the deployment path.

## Development and validation

| Command | Purpose |
| --- | --- |
| `npm run content:validate` | Validate JSON structure, IDs, locales, dates, and project relationships |
| `npm run content:check-links` | Check supported internal article links |
| `npm run check` | Run Astro/TypeScript diagnostics |
| `npm run test:static` | Verify generated locale, blog, sitemap, RSS, search, and empty-state routes |
| `npm run test` | Run content validation, link checks, and static verification |
| `npm run build` | Generate optional résumé output, Astro static pages, and Pagefind |
| `npm run preview` | Preview the production `dist/` directory |

## License and credits

This project preserves the upstream MIT license and attribution in [LICENSE.md](LICENSE.md). It originated from the Nicremo Astro multilingual portfolio template and adds the documented bilingual content, publishing, validation, résumé, and Agent Skill extensions. Review third-party licenses before redistributing new assets or dependencies. Contributions, issues, and feature requests are welcome through the repository's normal GitHub workflow.

## Troubleshooting

- **Validation errors:** compare the record with the schema in `src/utils/portfolio-content.ts`; check required `en`/`fa` objects and stable IDs.
- **Broken article links:** use repository-relative article paths and run `npm run content:check-links`.
- **Missing images:** confirm authored media is under `content/media/`, the content path starts with `media/`, and `npm run media:publish` has run. The README preview is the intentional exception and remains under `public/images/` for GitHub rendering.
- **Résumé not available:** set `profile.visible` and `resume.enabled` to `true`, provide sufficient records, and install Chromium.
- **Chromium cannot start:** set `CHROME_BIN` or use the supported local sandbox configuration; do not commit generated PDFs as a workaround.
- **RTL issues:** inspect the Persian route, keep URLs and code spans direction-isolated, and use the shared layout rather than custom document direction.
- **Vercel failures:** reproduce with `npm ci` and `npm run build`, confirm `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`, verify the selected branch is `main` or `content/*`, and ensure Vercel Git auto-deployments are disabled.
