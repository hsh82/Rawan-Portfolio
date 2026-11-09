# First staging delivery — 2026-11-09

## 1. Root-cause analysis

| Issue | Reproduced evidence | Affected files / solution | Regression evidence |
| --- | --- | --- | --- |
| Shell-dependent preview | Windows CMD rejected EASY_CONTENT_MODE=true | package.json, preview.mjs: explicit portable --content option | Four server modes start, respond and stop in test:smoke |
| Windows file URL handling | Astro check/build tried to open F:/F:/.../editor-bilingual.html | middleware.mjs, verify-build.mjs: fileURLToPath; injected routes use project-relative entrypoints | Astro check, build, static/Mermaid tests and Unicode-path integration |
| Fixed browser name / unsafe print paths | generator assumed google-chrome and concatenated file:// URLs | chromium.mjs, resume-generate.mjs: CHROME_BIN/common-path discovery, argument arrays, pathToFileURL | Missing-browser/launch errors; enabled bilingual portrait PDFs; spaces/Unicode/#/apostrophe fixture |
| Native synchronous Unicode filesystem defects | Node24.0.1 silently retained Unicode directories; Node22.23.2 synchronous recursive copy omitted files | media/PDF/test fixture copy and removal use fs/promises; engines require supported LTS versions | Real filesystem reproduction, stale-PDF aliases and media-mirror tests |
| Incomplete font coverage | realistic PDFs used Arial/Segoe for Latin text | reuse bundled Fontsource 400/700 CSS including Latin, Latin-ext and Arabic subsets | Five pages per locale, all fonts embedded Vazirmatn, searchable text, visual inspection |
| Collection/object mismatch | empty Experience read returned [] but Save required an object | resources.mjs, Studio: individual CRUD and explicit Append/Update import plans | Eleven API/security behavior tests; real browser create/save/reload |
| Invalid JSON and schema writes | source used JSON.parse only; save-resource did not apply application schemas | shared unchanged portfolio-schemas.mjs, field-path diagnostics, safe JSON normalization and duplicate-key rejection | Invalid syntax/types/locales/IDs, preserved unknown fields and byte-identical failed writes |
| Stale/inaccurate unsaved preview | source input marked dirty without parsing; DOM patch script was sandbox-blocked | bounded immutable snapshots rendered through actual Astro Layout/HomeSurface; 400ms debounce and newest-response protection | Hero/About/Focus/Experience/project changes before Save, last good preview on errors, both locales |
| Unsafe MDX evaluation | existing visual preview could evaluate arbitrary expressions | static-mdx-preview.mjs AST guard rejects executable expressions/imports/active HTML and URLs | Malicious expression does not run; existing Mermaid/static blocks still render |
| Editor action/revision issues | scattered actions; unguarded submits; delete retained boot revision | toolbar dialogs/disclosures, MDX busy lock and saved-revision event | AI copy, menu, keyboard/Escape, draft/publish/unpublish/delete browser sequence |

## 2. Branch A delivery

Branch: fix/cross-platform-staging. Runtime source revision: 9464106. Focused commits: 8f1efb8 (portable launch/printing), 75696c2 (Unicode filesystem reliability), f0a81b5 (font subsets), 1877b9e (evidence), 9464106 (absent-source media cleanup). Later documentation commits do not alter tested runtime code.

Important files: package.json/lock, process-runner.mjs, dev-content.mjs, preview.mjs, chromium.mjs, resume-generate.mjs, media-publish.mjs, verify-build.mjs, platform.test.mjs, runtime-smoke.mjs, pdf-smoke.mjs and CI workflow. Complete file lists are available in the PR and branch report. Node 22.12+ LTS or 24.13.1+ LTS is enforced; no browser is downloaded on npm installation.

All three OS jobs passed on source 9464106: https://github.com/hsh82/Rawan-Portfolio/actions/runs/42655974069. This includes fresh npm ci, content/link checks, Astro diagnostics, build/Pagefind, all existing tests, four platform behavior tests, all four server-mode HTTP/shutdown checks and controlled enabled/disabled bilingual PDF smoke.

## 3. Branch B delivery

Branch: feat/easy-content-staging, independently based on e615fa9. Runtime source revision: 7a1896f. Focused commits: 3bd4463 (validated authoring/preview), e9dd421 (workflows/docs), 1f97d92 (owner-neutral fixtures), 7a1896f (homepage navigation parity in preview). The minimal portability prerequisites are repeated so it can be tested independently on Windows.

Important files: shared portfolio schemas/parser, resource validation/CRUD/imports, preview sessions and dev Astro route, Studio, bilingual editor/actions, static MDX guard, schema-derived fixtures, API/browser tests, architecture/user guides and the three-OS Studio workflow. Existing schemas were compared with the baseline and remain unchanged apart from extraction/export declarations. No content files or owner records are changed on either development branch.

The full three-OS browser matrix passed on source 1f97d92: https://github.com/hsh82/Rawan-Portfolio/actions/runs/42655031526. The final navigation-parity follow-up 7a1896f passed Astro check and both real-browser command flows locally; its fresh remote matrix is tracked at https://github.com/hsh82/Rawan-Portfolio/actions/runs/42656895426 and must be assessed separately from the earlier completed run.

## 4. Validation matrix

PASS below refers to the explicitly linked tested source revisions, not an inference from workflow configuration. Windows local final checks used Node22.23.2/npm10.9.8; initial Node24.0.1 baseline failures are documented separately.

| Operation | Windows | Ubuntu | macOS |
| --- | --- | --- | --- |
| Fresh npm ci | PASS | PASS, CI | PASS, CI |
| npm install | PASS, local (also --no-audit with separate audit) | NOT RUN as a separate command | NOT RUN as a separate command |
| content:validate | PASS | PASS, CI | PASS, CI |
| content:check-links | PASS | PASS, CI | PASS, CI |
| check | PASS | PASS, CI | PASS, CI |
| build / Pagefind / test:static | PASS | PASS, CI | PASS, CI |
| npm test / existing content, authoring, guide and Mermaid suites | PASS | PASS, CI | PASS, CI |
| test:platform (four behavior tests) | PASS | PASS, A CI | PASS, A CI |
| dev, dev:content, preview, preview:content startup/HTTP/shutdown | PASS | PASS, A CI | PASS, A CI |
| enabled/disabled EN/FA PDF smoke | PASS | PASS, A CI | PASS, A CI |
| eleven Studio API/security tests | PASS | PASS, B CI | PASS, B CI |
| both authoring commands in real Chrome, including project homepage preview | PASS | PASS on B 1f97d92 | PASS on B 1f97d92 |
| final 7a1896f navigation-parity browser assertion | PASS locally | Follow-up CI tracked above | Follow-up CI tracked above |
| combined branches in detached checkouts | PASS | NOT RUN combined | NOT RUN combined |
| realistic PDF visual/font inspection | PASS, five EN + five FA pages | NOT RUN visually | NOT RUN visually |

Combined Windows verification used F:/rawan/Rawan staging intégration فارسی. A separate clean detached checkout at F:/rawan/Rawan staging neutral verifies neutral content. Both flagged production builds (EASY_CONTENT_MODE=true) passed static artifact isolation. The realistic snapshot passed 28 published article-route checks; the neutral snapshot passed its empty-template checks. The full combined API/browser/process/PDF suites passed; navigation parity was additionally rechecked in the neutral combined checkout.

Personal content was copied from c71cc72 into the detached realistic checkout only. No content was committed in integration. Main remains e615fa9, the personal branch remains c71cc72 and their common ancestor is 456e164. The realistic checkout is intentionally retained for local review; a cleanup command was blocked by execution policy, so neutral verification used a new detached checkout rather than deleting that copy. Development branches and the neutral checkout remain clean.

Integration conflicts were resolved in package.json (union of scripts/dependencies), integration/index.mjs (dev-only editor and locale-bearing preview routes), middleware.mjs (B behavior plus portable process/file handling), and AGENTS.md/README.md/README.fa.md (both branches' additions). package-lock.json merged without a semantic conflict and was checked by npm. No permanent integration branch was created. Inspect the neutral detached checkout for the concrete combined result.

## 5. Regression audit

Preserved: Astro static output, bilingual EN/FA data and direction, canonical content ownership, stable IDs, existing public project/article routes, draft/publication semantics, source-mode MDX, Mermaid/static blocks, revision conflicts, atomic writes/rollback, local session/Host/Origin checks, upload restrictions, path/symlink boundaries and production editor isolation. Existing tests plus eleven API/security tests, four portability tests and real Chrome flows ran. Schema-valid templates are hidden and contain no fictional career facts. JSON saves retain unsupported authored fields. Collection imports do not replace collections.

Realistic PDFs contain only embedded Vazirmatn Bold/Regular fonts, five A4 pages per locale and 7273 EN / 6510 FA extractable characters. Page-boundary checks found no clipping; all ten page renders were visually reviewed for layout, RTL, portrait and overlap. The portrait is SVG/vector, so a raster-image count is not its presence test. Review artifacts, JSON inspection results and PDF copies are retained under the realistic checkout's ignored .astro/pdf-evidence/ directory. Poppler was unavailable; PyMuPDF was used for extraction, font inspection and page rendering.

## 6. Staging readiness

Gate A: PASS for the tested platform source and its three-OS CI matrix. Gate B: PASS automated structured-authoring scenarios on all collections. Gate C: PASS local final unsaved-rendering scenarios and the earlier full three-OS editor matrix; final navigation-parity CI follow-up remains explicitly tracked. Gate D: PASS automated AI/action/RTL/keyboard scenarios. Gate E: BLOCKED by known dependency security advisories pending a focused compatibility/security update review; no unrestricted staging acceptance is claimed.

No merge or deployment occurred. Both PRs remain drafts for review. Follow-up documentation-only pushes may launch another automatic workflow; they do not change runtime code under test.

## 7. Remaining limitations

npm audit reports 31 existing advisories: 1 critical, 19 high, 2 moderate and 9 low. These include Astro5.7.13, Vite6.3.6, Zod3 and native/transitive tooling. A static deployment does not expose an Astro SSR/image-server endpoint, but local development file-read/rendering/tooling advisories still require remediation review. No blind npm audit fix or unrelated major upgrade was applied. This is a recorded release blocker.

DeepWiki could not be read through the available web tool; checked-out source and design documents governed implementation. Full replacement import is intentionally unavailable; Append/Update are explicit. Preview scripting/forms/navigation are intentionally inactive in the read-only sandbox. Advanced executable MDX remains in Source and is rejected by visual preview. The current homepage has no separate Education/Certifications section. Manual screen-reader testing beyond browser keyboard controls was not performed. Node24 was not rerun on a supported patch; Node22 was used for final verification. Cross-drive shared dependency fixtures trigger an Astro5 path defect, so linked test fixtures stay on one volume. Fresh checkouts install their own dependencies.

## 8. Pull requests

- Platform: https://github.com/hsh82/Rawan-Portfolio/pull/3
- Easy Content: https://github.com/hsh82/Rawan-Portfolio/pull/4

An initial GitHub authentication failure recovered; both branches were pushed successfully. Neither PR was merged and no deployment was triggered. English and Persian staging guides and three repository-local engineering skills are included and validated.
