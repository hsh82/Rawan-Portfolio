---
name: portfolio-cross-platform
description: Diagnose and fix portable installation, npm launchers, Windows paths, Chromium PDFs and OS CI for Rawan Portfolio.
---

Read AGENTS.md, design/plan.md, design/components/resume.md and design/architecture/deployment.md. Source of truth: package.json and its lock, scripts/process-runner.mjs, scripts/chromium.mjs, scripts/resume-generate.mjs, scripts/verify-build.mjs and .github/workflows/ci.yml.

Use Node 22 LTS (minimum 22.12); Node 24.13.1+ LTS is also supported. Resolve Node package entry points and use process.execPath with argument arrays. Convert file URLs with fileURLToPath/pathToFileURL. Keep signal forwarding and nonzero exit codes. Exercise a checkout path containing spaces and Unicode. Do not upgrade unrelated dependencies or install browsers during npm installation.

Disabled r?sum? generation must work without a browser. Enabled generation must fail visibly when Chrome/Chromium/Edge is unavailable. CHROME_BIN is an executable path, never a shell command. Do not change owner content to conceal errors; test enabled content in a disposable fixture.

Validate with npm ci, npm run content:validate, npm run content:check-links, npm run check, npm run test:platform, npm run build, npm test, npm run test:smoke and npm run test:pdf. The PDF test requires a browser. Definition of done: passing local checks and recorded OS evidence; mark other operating systems NOT RUN until actual matrix runs complete. Inspect bilingual PDFs visually and record remaining limitations.
