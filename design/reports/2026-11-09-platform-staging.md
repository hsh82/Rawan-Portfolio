# Platform staging engineering evidence — 2026-11-09

Baseline: origin/main e615fa907cf558a5620a7931ef893b1df368efd3. Personal reference: origin/content/hamed-sheikhan c71cc72c7a667626841285a5776fe059262dc53b; common ancestor 456e164612b93277b91ceaaab9cccef222f9ed8f. Direct comparison shows application/scripts/package content matches main; differences are owner content and associated housekeeping. Neither main nor the personal branch was changed. Worktree path contains spaces: F:/rawan/Rawan staging A. Local OS Windows; Initial baseline used Node 24.0.1/npm 11.3.0; final checks use Node 22.23.2/npm 10.9.8. Node 22 is selected for CI.

## Root causes

| Issue | Reproduced evidence | Files and solution | Regression |
| --- | --- | --- | --- |
| POSIX npm assignment | preview:content reports EASY_CONTENT_MODE is not recognized in Windows CMD | package.json + preview.mjs explicit --content launcher | test:smoke starts all four modes |
| File URL treated as path | check/build fail opening F:/F:/rawan/.../editor-bilingual.html | middleware.mjs and verify-build.mjs use fileURLToPath | check, build, test:static, test:mermaid |
| Browser fixed to google-chrome | enabled pipeline cannot find typical Windows/macOS executables | chromium.mjs supports CHROME_BIN, PATH and common installations; launch args never go through a shell | platform.test.mjs + pdf-smoke.mjs |
| Unescaped print/font paths | manual file:// concatenation mishandles drives and reserved characters | resume-generate.mjs pathToFileURL | URL round trip + PDF fixture with spaces and Unicode |
| Process lifecycle | wrappers did not forward stop signals or handle launch errors | process-runner.mjs preserves failures, forwards POSIX signals and terminates Windows child trees | exit-code unit + HTTP shutdown smoke |
| Hoisted imports | Vite, Zod, MDX evaluator, YAML, KaTeX and Preact SSR renderer used without direct declarations | declare existing locked versions; preserve lock resolution | npm install / npm ci / check / build |
| Stale PDF outputs | disabled generation left old files; renamed output could leave stale aliases | disabled cleanup and successful bilingual staging before replacing generated directory | disabled/enabled PDF smoke |
| Ubuntu-only checks | workflow had no Windows/macOS execution | CI matrix with full tests, command smoke, controlled Chrome PDF smoke | workflow runs must be examined separately |

## Local verification

| Command | Windows | Linux | macOS |
| --- | --- | --- | --- |
| npm ci | PASS | NOT RUN locally | NOT RUN locally |
| npm install --ignore-scripts | PASS | NOT RUN locally | NOT RUN locally |
| content:validate / content:check-links | PASS | NOT RUN locally | NOT RUN locally |
| check | PASS, zero errors/warnings; existing deprecation hints | NOT RUN locally | NOT RUN locally |
| build / Pagefind / test:static | PASS | NOT RUN locally | NOT RUN locally |
| npm test (all existing suites) | PASS | NOT RUN locally | NOT RUN locally |
| test:platform | PASS, three behavior tests | NOT RUN locally | NOT RUN locally |
| test:smoke | PASS: dev, dev:content, preview, preview:content startup/HTTP/security/shutdown | NOT RUN locally | NOT RUN locally |
| test:pdf | PASS: disabled without browser; enabled EN/FA signatures and aliases | NOT RUN locally | NOT RUN locally |

Baseline npm ci succeeded. Baseline content/link checks and existing Easy Content/content-query/guide tests passed. Baseline Astro check/build/Mermaid failed at the file URL bug; baseline preview:content failed at POSIX syntax. No baseline production artifact could be built. PDF smoke validates signatures/nonempty output; visual/font/portrait inspection is reported separately after realistic-content verification.

## Unicode filesystem regression

A stronger PDF stale-output test reproduced silent rmSync failure on Windows Node 24.0.1 for a directory containing résumé, plus a synchronous recursive copy failure on Node 22.23.2. The asynchronous fs/promises cp and rm APIs passed the same cases. Media publishing, PDF staging and relevant disposable test fixtures now use those APIs. Node 24 support starts at 24.13.1, whose official release includes the non-ASCII rmSync fix: https://github.com/nodejs/nodejs.org/blob/main/apps/site/pages/en/blog/release/v24.13.1.md. Both browser and stale PDF regressions now exercise real output, aliases, portrait assets and a path containing spaces, Unicode, # and apostrophe.

## Remaining acceptance limits

npm audit reports 31 advisories (1 critical, 19 high, 2 moderate, 9 low) in the unchanged dependency graph, including Astro 5.7.13, Vite 6.3.6, Zod 3 and native image/transitive tooling. Static deployment does not run an Astro server, so adapter/server-island/image-server findings do not describe a deployed static endpoint; local dev/file-read and rendering/compiler advisories still need a focused security upgrade review before unrestricted staging acceptance. No major framework/schema upgrade or blanket npm audit fix was applied. Gate E is blocked pending that review; this is an explicit known limitation, not a passed gate.

DeepWiki could not be opened through the available web tool and its search returned no repository architecture pages. Checked-out source and design documents governed implementation. Linux/macOS require actual CI evidence. No merge or deployment is authorized by this report. Full browser editor acceptance belongs to the separate Easy Content branch; Branch A alone does not fix its collection contract or DOM-patched preview.
