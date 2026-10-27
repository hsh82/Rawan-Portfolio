# Portfolio template release V1 — 2026-10-28

## Release identity

- Original source branch: `content/hamed-sheikhan`
- Original HEAD: `9134b21e12133572757fb189261bd073f121c848`
- Protected source snapshot: recorded outside the repository during release preparation
- Release branch: `release/portfolio-template-v1`
- Release worktree: `/home/weinno/portfolio/.v7-release`
- Release history: one root commit, ten reachable commits, no merge commits

The original development branch, its uncommitted generated résumé files, existing branches, remote, tags, and default branch were not rewritten or deleted. No push, force-push, merge, deployment, or repository-setting change was performed.

## Ordered release history

1. `90e7140` — `chore: establish clean Astro portfolio template foundation`
2. `9d3340f` — `feat: restore bilingual responsive portfolio design`
3. `3aa4228` — `feat: introduce content-driven portfolio sections`
4. `77a94d0` — `feat: add blog and documentation authoring system`
5. `dde7075` — `feat: implement optional bilingual resume generation`
6. `7b52a42` — `feat: add portfolio authoring agent skills`
7. `6302718` — `chore: add validation workflows and secure deployment configuration`
8. `5a36bb7` — `docs: publish template setup and customization guides`
9. `3ce5a2f` — `fix: include shared locale runtime and template placeholder`
10. This report — `docs: document clean template release and bilingual guides`

## Content cleanup

The release `content/` tree retains the established schemas and directory conventions, but contains no owner biography, employment, education, certification, journey, skill, project, article, contact, portrait, or résumé data. Résumé generation is disabled. English and Persian neutral setup copy and a reusable portrait placeholder remain. Empty Blog, Skills, Journey, Projects, Experience, Contact, and Résumé views render intentional instructions rather than broken blank UI.

Personal articles, project directories, profile assets, generated résumé PDFs, the private editorial reference, and historical personal implementation reports were excluded from the release snapshot. Fictional examples live only under `tests/fixtures/` and are not loaded by production.

## Repository hygiene and security

- Replaced `.gitignore` with explicit Node, Astro, Vercel, environment, secret, test-output, generated-résumé, editor, and private-note rules.
- `.dockerignore` excludes design/agent material, generated résumé PDFs, dependency folders, build output, Git metadata, and private editorial input.
- `.vercelignore` excludes design/agent material, fixtures, logs, and private editorial input without excluding application source or content schemas.
- `git check-ignore` confirmed generated PDFs, `dist/`, `.astro/`, and private editorial input are ignored.
- No personal identifiers or generated résumé PDFs are tracked on the release branch.
- `gitleaks` and `trufflehog` were not installed in the environment. A targeted manual scan found no credential or private-key values; workflow secret references are GitHub Actions secret names only.
- `npm ci` completed, but npm reported 32 dependency audit findings (9 low, 2 moderate, 20 high, 1 critical). These are dependency-audit findings, not discovered project secrets, and should be reviewed before public publication.

## Documentation and skills

The English README now documents the actual stack, setup, content schemas, skills, journey, projects, nested MDX blog, localization, résumé generation, Agent Skills, Vercel deployment, validation, licensing, troubleshooting, upstream badges, and a linked preview image. `README.fa.md` provides a complete Persian guide covering setup, content, skills, blog, résumé, deployment, and Agent Skills. `AGENTS.md`, all repository-local portfolio skills, `design/`, and `docs/AUTHORING.md` remain present and generic. The README preserves upstream Nicremo attribution and the existing MIT license.

## Validation

- `npm ci` — passed.
- `npm run content:validate` — passed: 0 projects and 0 journey entries.
- `npm run content:check-links` — passed: 0 production article files.
- `npm run check` — passed with 0 errors; existing Lucide deprecation and inline-handler hints remain.
- `npm run build` — passed: 12 empty-template pages and Pagefind indexes generated; résumé generation correctly skipped while disabled.
- `npm run test:static` — passed: English/Persian pages, RSS, sitemap, search assets, and 0 published article routes verified.
- `git diff --check` — passed before history creation.
- Headless Chrome smoke test — passed for `/en/`, `/fa/`, `/en/blog/`, and `/en/resume/`; the empty states and disabled résumé view rendered, and a desktop English screenshot was captured outside the repository.

Build emits expected warnings for an empty MDX collection, stale Browserslist data, large diagram chunks, and deprecated icon names. None are build errors.

## Publishing guidance

Inspect the release without affecting the personal branch:

```sh
git worktree list
git show release/portfolio-template-v1
git log --reverse --oneline release/portfolio-template-v1
git rev-list --count release/portfolio-template-v1
```

After review, publish it as a new remote branch with:

```sh
git push origin release/portfolio-template-v1
```

Do not merge it into the old history with `--allow-unrelated-histories` merely to connect unrelated roots. If it should become the default later, review it on GitHub first, change the default branch in repository settings, and preserve/archive the existing development branches. A future maintainer can also keep this release branch as the clean template while continuing personal work on `content/hamed-sheikhan`.
