---
name: portfolio-docker-release
description: Build, test, document and release the Rawan Portfolio Easy Content and static production Docker distributions.
---

# portfolio-docker-release

Use this skill for Dockerfile, Compose, GHCR, container smoke tests, local persistence, or distribution documentation work.

Read `AGENTS.md`, `design/plan.md`, `design/architecture/easy-content.md`, `design/architecture/deployment.md`, `design/components/resume.md`, and the staging guides under `design/`.

## Architecture

- Keep the Astro static architecture. Do not add a database, CMS service, SSR runtime, or separate API service.
- `setup/Dockerfile` owns the `deps`, `builder`, `authoring`, and `production` targets.
- The authoring image runs the existing `npm run dev:content` command and exposes container port 4321.
- The production image copies only `dist/` into an unprivileged Nginx runtime on port 8080.
- The production runtime must not contain Node, `node_modules`, Easy Content middleware, source files, or write APIs.

## Content persistence and security

- The only default authoring bind mount is host `../content:/app/content`.
- Never overwrite a non-empty content directory. An explicitly empty directory may be initialized once from the immutable starter template.
- A partially populated directory must stop with a clear missing-file error.
- Git credentials, SSH keys, Docker sockets, and the host `.git` directory do not enter the image.
- Publish the authoring port on loopback only. Docker local trust must be explicitly enabled and limited to the exact Compose gateway; retain session tokens, Host/Origin checks, path/symlink checks, atomic writes, and revision protection.
- Production is immutable. Mounting content into it does not rebuild generated HTML.

## Release workflow

- A push to `main` after merge builds and smoke-tests both targets before publishing; pull requests do not run this Docker workflow.
- Successful `main` builds publish both exact repositories with `latest` and a long SHA tag.
- `v*.*.*` tags publish immutable version tags; they do not move `latest` unless the tag is also the repository default branch event.
- Use GitHub Actions `GITHUB_TOKEN` with `contents: read` and `packages: write`.
- Build both images from the same verified revision, include OCI source metadata, provenance and SBOM, and advertise only platforms that passed runtime tests. Current validated target: `linux/amd64`.

## Verification

Run, as applicable:

```sh
npm ci
npm run content:validate
npm run content:check-links
npm run check
npm run test:docker
npm run test:platform
npm run build
npm test
npm run test:smoke
npm run test:pdf
docker compose -f setup/docker-compose.yml config --quiet
docker compose -f setup/docker-compose.production.yml config --quiet
```

Then run both container smoke tests, including Easy Content HTTP readiness, English/Persian routes, the write-boundary response, production 404 behavior, health checks, and host-content persistence in a disposable checkout. Record actual OS and browser/PDF evidence. Do not call Windows/macOS supported from a Linux job alone.

## Rollback

- Stop the Compose stack and keep the host `content/` directory.
- Pin the previous image SHA or version tag in a local Compose override.
- For GHCR rollback, redeploy the prior immutable SHA tag; do not rewrite history or delete canonical content.
- If authoring fails, inspect logs and health status, restore the content branch if needed, and validate before restarting.
