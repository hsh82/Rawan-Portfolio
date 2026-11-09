---
name: portfolio-staging-review
description: Review staging acceptance gates, regressions, architecture boundaries and actual CI evidence for Rawan Portfolio.
---

# portfolio-staging-review

Read design/plan.md, design/architecture/easy-content.md, design/STAGING-AUTHORING.md and design/reports/. Source evidence lives in package scripts, the CI workflow and executable tests, not a successful build alone.

Run npm ci, npm run content:validate, npm run content:check-links, npm run check, npm run build, npm test, npm run test:studio and npm run test:studio-ui. When the platform branch is integrated, also run npm run test:platform, npm run test:smoke and npm run test:pdf. Inspect git status and production output for editor routes, tokens and write handlers. Test real content only in a detached checkout or temporary fixture; preserve personal branches and owner records.

Report gates A–E separately, with PASS/FAIL/NOT RUN per OS/command. Linux/macOS workflow definitions are not successful job evidence. Record browser/PDF visual checks separately from PDF signature smoke. Explain critical/high dependency advisories and unresolved limitations without silently upgrading the stack. Definition of done: focused branches and commits, regression evidence, accurate architecture docs, explicit remaining blockers, no automatic merge or deployment.
