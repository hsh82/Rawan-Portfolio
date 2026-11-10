# Docker distributions

Rawan keeps one Astro static application and exposes two runtime distributions. Docker does not add a database, CMS service, SSR adapter, or second content system.

## Images and build stages

`setup/Dockerfile` uses four logical stages:

- `deps` installs the lockfile-pinned Node 22 dependencies with `npm ci`.
- `builder` copies the checkout, installs Chromium plus its sandbox helper, validates content, and produces `dist/`. BuildKit does not expose the namespace operation required by Chromium's sandbox during image construction, so `CHROME_NO_SANDBOX=1` is explicitly limited to this build stage; the authoring runtime resets it to `0` and keeps Chromium sandboxed.
- `authoring` keeps the Node/Astro/Easy Content runtime and an immutable starter-content template. It listens on port 4321 and is published by Compose only on host loopback port 4321 by default.
- `production` copies only `dist/` into an unprivileged Nginx image listening on port 8080. It has no Node runtime, Easy Content API, source files, or writable content volume.

The images are published as:

- `ghcr.io/hsh82/rawan-easy-content`
- `ghcr.io/hsh82/rawan-portfolio`

The `main` branch receives `latest` plus an immutable `sha-<commit>` tag after verification. A Git tag such as `v1.4.0` receives the `v1.4.0`, `1.4.0`, and `1.4` tags plus its immutable SHA tag. Docker verification and publication run after a push to `main` (including a merged pull request), not on pull requests themselves.

## Content persistence

The authoring Compose file bind-mounts only `../content` to `/app/content`. The host checkout remains the canonical, Git-tracked source. The container does not receive Git credentials and does not commit or push.

An empty mounted directory is initialized once from `/app/.content-template`. A non-empty directory is never merged with template data: the entrypoint checks required structure and exits with an actionable error when a partial directory is invalid. This prevents an image upgrade or restart from replacing personal content.

The production image is immutable. Mounting `content/` into it cannot change the already-generated `dist/`; a personalized production image must be rebuilt from the intended content branch.

## Local security boundary

Easy Content remains a local authoring service. Compose publishes `127.0.0.1:4321` by default. The existing session, host/origin, allowed-path, symlink, and revision-conflict checks remain active. Docker authoring explicitly trusts one fixed Compose gateway address (`172.30.0.1`) only when `EASY_CONTENT_DOCKER=true`; other bridge addresses and cross-origin requests remain rejected. The gateway is configurable only for a deliberately changed local network, not as a general remote trust list.

Production drops all Linux capabilities, uses `no-new-privileges`, a read-only root filesystem, and small writable tmpfs paths for Nginx runtime state. Static routes use `try_files` and return genuine 404 responses; there is no SPA fallback.

## Release and rollback

`.github/workflows/docker-publish.yml` runs application/content checks, builds, résumé tests, and image smoke tests before publication. It does not run a CVE scanner because this distribution is a public static frontend and upstream base-image advisories must not block delivery. Runtime hardening remains enabled: unprivileged Nginx, read-only production filesystem, dropped capabilities, loopback-only authoring, provenance, and SBOM attestations. If a release is unsuitable, deploy the previous immutable `sha-<commit>` or version tag instead of moving content inside a running container.

Validated platform coverage is Linux Docker Engine in this checkout. Windows Docker Desktop and macOS Docker Desktop are documented and target the same Linux/amd64 images; their bind-mount/file-watch behavior still requires a host-platform run.
