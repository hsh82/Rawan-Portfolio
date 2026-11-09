# Docker distribution delivery

## Scope

This change adds an editable Easy Content image, an immutable static production image, persistent content-only authoring mounts, GHCR publication, setup guides, and a design record for the runtime boundary. The existing Astro static architecture remains unchanged.

## Verification evidence

The following checks were run in the Linux Docker environment used for this checkout:

- `docker compose -f setup/docker-compose.yml config --quiet` — passed.
- `docker compose -f setup/docker-compose.production.yml config --quiet` — passed.
- `npm run test:docker` — passed (static Docker contract checks and Compose validation).
- `npm run test:easy-content` — passed, including Docker gateway trust and cross-origin rejection.
- Authoring target build — passed; local image was approximately 1.81 GB because it includes Node dependencies and Chromium.
- Production target build — passed; local image was approximately 55.3 MB and contains the generated static site only.
- Authoring container — passed: healthy on `127.0.0.1:1234`, English/Persian routes, Easy Content context API, content-only persistence, and restart route smoke test.
- Production container — passed: healthy on an alternate local port because host port 8080 was already occupied by another service; English/Persian/blog routes, `/healthz`, genuine 404, and absent Easy Content API.
- Production runtime inspection — passed: UID 101, read-only root filesystem, all capabilities dropped.

Host browser/PDF tests are available when Chrome is installed; cross-platform Windows/macOS runtime validation is not claimed from this Linux run. CI remains responsible for the GitHub-hosted Docker build, registry publication, and its Linux smoke tests.

## Operational contract

Use `setup/docker-compose.yml` for local authoring and commit the resulting host `content/` changes with Git. Use `setup/docker-compose.production.yml` only for the immutable build selected for static hosting. GHCR `latest` is published only after a successful `main` verification; version tags and SHA tags remain available for rollback.
