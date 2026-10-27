# Padars Portfolio

**A bilingual, AI-maintainable developer portfolio powered by Astro.**

Padars Portfolio is a reusable English/Persian portfolio framework for developers, engineers, designers, and technical teams. It keeps public owner data in `content/`, presentation and behavior in `src/`, and maintenance guidance in repository-local Agent Skills. Normal content changes do not require editing Astro components.

The project originated from the [Nicremo Astro multilingual portfolio template](https://github.com/nicremo/astro-multilingual-portfolio-template) and has been extended with structured content loaders, RTL/LTR support, nested MDX publishing, Mermaid and Markmap readers, search, journey/project relationships, and optional bilingual résumé generation. The current repository is maintained by Hamed Sheikhan. Personal résumé data is intentionally absent from this template release.

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
2. Set `visible: true` and add localized `displayName`, `title`, `intro`, `summary`, and CTA text in `content/profile.json`.
3. Replace `content/media/profile/placeholder.svg` and update `profile.image` to a public path such as `/images/profile/avatar.webp`.
4. Add verified email, phone, location, and `{ label, url }` social links in `content/contact.json`.
5. Add skill records to `content/skills/entries.json`.
6. Add employment or education records to their corresponding `entries.json` files.
7. Add important milestones to `content/journey/entries.json`.
8. Add projects to `content/projects/entries.json` and connect related journey/article IDs.
9. Add bilingual MDX articles under `content/blog/en/` and `content/blog/fa/`.
10. Enable `content/resume/config.json` only after the profile and résumé data are verified.
11. Run content validation, link checks, type checking, and a production build.

The JSON schemas in `src/utils/portfolio-content.ts` are the source of truth. Keep stable IDs, provide both `en` and `fa` locale objects for records, and never invent employment, education, certifications, contact details, metrics, or outcomes.

## Skills & Tools

Skills use the categories `cicd`, `containers`, `infrastructure`, `network`, `scripting`, and `design`. Each record has an ID, category, visibility, priority, localized title/description, and a `technologies` array. Technology identifiers are mapped to Lucide icons in `src/utils/skill-icons.ts`; add a mapping there only when a new identifier needs a specific icon. Custom SVG assets can be used by the component asset conventions. Ordering is controlled by `priority`, and hidden records remain in the source without rendering.

## Journey

Journey records support `employment`, `milestone`, `education`, `certification`, `achievement`, `project`, `training`, `open-source`, and `other`. Use optional ISO dates, localized titles/descriptions, organizations, technologies, links, and `projectIds`. Journey is for meaningful professional milestones, not a chronological list of routine troubleshooting tasks.

## Projects

Projects require a stable lowercase `id`, `translationId`, maturity label, localized copy, technologies, visibility, and priority. Optional `image`, `repository`, `externalUrl`, `journeyIds`, and `articleIds` connect the project to other content. Featured projects appear in the homepage grid. Project articles belong under `content/blog/{locale}/projects/{project-id}/` and can have multiple articles per project.

## Blog and documentation

The folder hierarchy becomes the URL hierarchy:

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

Use matching translated files in `content/blog/fa/`, preserve `translationId`, and keep drafts out of published routes. Mermaid code blocks, Markmap content, KaTeX math, internal article links, images, and PDF attachments are supported by the existing reader components. `npm run content:new` creates a draft scaffold.

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

**Option B — GitHub Actions.** The repository includes preview and production workflows using the Vercel CLI. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as repository/environment secrets, configure the Vercel project, and protect the production environment. Preview runs on non-main pushes; production runs on `main`. Never commit tokens, generated `.vercel` files, or local environment files. Do not enable both approaches for the same branch unless duplicate deployments are intentional.

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

This project preserves the upstream MIT license and attribution in [LICENSE.md](LICENSE.md). It originated from the Nicremo Astro multilingual portfolio template and adds the documented bilingual content, publishing, validation, résumé, and Agent Skill extensions. Review third-party licenses before redistributing new assets or dependencies.

## Troubleshooting

- **Validation errors:** compare the record with the schema in `src/utils/portfolio-content.ts`; check required `en`/`fa` objects and stable IDs.
- **Broken article links:** use repository-relative article paths and run `npm run content:check-links`.
- **Missing images:** confirm the file is under `public/` and the content path starts with `/`.
- **Résumé not available:** set `profile.visible` and `resume.enabled` to `true`, provide sufficient records, and install Chromium.
- **Chromium cannot start:** set `CHROME_BIN` or use the supported local sandbox configuration; do not commit generated PDFs as a workaround.
- **RTL issues:** inspect the Persian route, keep URLs and code spans direction-isolated, and use the shared layout rather than custom document direction.
- **Vercel failures:** reproduce with `npm ci` and `npm run build`, confirm the three Vercel secrets, and ensure only one deployment mechanism is active.
