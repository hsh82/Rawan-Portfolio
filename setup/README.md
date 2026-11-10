# Rawan Portfolio — Easy Setup Guide

This repository has two Docker distributions:

- **Easy Content**: an editable local authoring environment at `http://localhost:4321`.
- **Production**: a small immutable static website at `http://localhost:8080`.

Docker supplies the application. Your cloned checkout supplies the version-controlled `content/` directory. The editor never commits, pushes, or receives Git credentials.

## Prerequisites

- Docker Desktop 4.x on Windows or macOS, or Docker Engine with the Compose plugin on Linux.
- A cloned checkout of this repository.
- A content branch if you are authoring a personalized portfolio.

The official images are built for `linux/amd64`, which is the validated distribution target. ARM64 is not advertised until the Chromium résumé path and runtime tests are validated on that architecture.

## Quick start: Easy Content

From the repository root:

```sh
docker compose -f setup/docker-compose.yml pull
docker compose -f setup/docker-compose.yml up -d
```

The bundled validation scripts can run inside the authoring image, so Node.js is not required on the host:

```sh
docker compose -f setup/docker-compose.yml exec -T easy-content npm run content:validate
docker compose -f setup/docker-compose.yml exec -T easy-content npm run content:check-links
```

Open `http://localhost:4321/en/`, `http://localhost:4321/fa/`, or `http://localhost:4321/dev/content/`.

Useful commands:

```sh
docker compose -f setup/docker-compose.yml ps
docker compose -f setup/docker-compose.yml logs -f easy-content
docker compose -f setup/docker-compose.yml restart
docker compose -f setup/docker-compose.yml down
docker compose -f setup/docker-compose.yml pull
docker compose -f setup/docker-compose.yml up -d
```

The host checkout's `./content/` is mounted at `/app/content`. Edits, project JSON/MDX files, and uploaded media therefore appear in the host checkout and in `git status`. Container removal or an image update does not delete them. Do not mount `node_modules` or the whole repository.

An empty bind-mounted content directory is initialized once from the image's immutable owner-neutral starter template. A partially populated directory with missing required files stops with an error and is never filled silently. A normal clone uses its existing content unchanged.

## Method A — Docker Desktop on Windows

1. Install Docker Desktop from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/). Enable the WSL 2 backend when Docker Desktop offers it.
2. Start Docker Desktop and wait until its whale icon reports that Docker is running.
3. Open **PowerShell** and verify Compose:

   ```powershell
   docker version
   docker compose version
   ```

4. Clone the repository and choose your content branch:

   ```powershell
   git clone https://github.com/hsh82/Rawan-Portfolio.git
   Set-Location Rawan-Portfolio
   git switch content/hamed-sheikhan
   ```

5. Start Easy Content:

   ```powershell
   docker compose -f setup/docker-compose.yml pull
   docker compose -f setup/docker-compose.yml up -d
   Start-Process http://localhost:4321/dev/content/
   ```

6. Edit English/Persian homepage, structured records, projects, media, and MDX. Files are saved under the checkout's `content\` folder.
7. Review and push from PowerShell on the host:

   ```powershell
   docker compose -f setup/docker-compose.yml logs --tail 100 easy-content
   git status
   git diff -- content
   npm run content:validate
   npm run content:check-links
   git add content
   git commit -m "content: update portfolio"
   git push origin HEAD
   ```

Node.js is not required on the Windows host for Docker authoring. Use the `docker compose exec` validation commands above, or run the same checks in CI before merging.

Keep the repository on a normal local drive rather than a network share. Docker Desktop file sharing and WSL integration must be enabled for the drive containing the checkout.

## Method B — Docker on Linux or macOS

Install Docker Engine plus the Compose plugin on Linux, or Docker Desktop on macOS. From the repository root:

```sh
docker version
docker compose version
git switch content/hamed-sheikhan
docker compose -f setup/docker-compose.yml pull
docker compose -f setup/docker-compose.yml up -d
```

On macOS use `open http://localhost:4321/dev/content/`; on Linux use `xdg-open http://localhost:4321/dev/content/` when available. On Linux, the image runs as the standard Node user, so checkout content files must be writable by the container user (normally UID 1000). If a checkout was created by root, repair ownership on the host before authoring; do not run the container privileged.

## Method C — Production static hosting

The production image is immutable. It contains the content used during its build and has no Node.js runtime, write API, Easy Content server, source mount, or database.

```sh
docker compose -f setup/docker-compose.production.yml pull
docker compose -f setup/docker-compose.production.yml up -d
```

Open `http://localhost:8080`. Stop and update it with:

```sh
docker compose -f setup/docker-compose.production.yml down
docker compose -f setup/docker-compose.production.yml pull
docker compose -f setup/docker-compose.production.yml up -d
```

Change the host port without editing the file:

```sh
PORT=9090 docker compose -f setup/docker-compose.production.yml up -d
```

For Internet deployment, place this container behind an existing HTTPS reverse proxy or managed load balancer. The initial local setup does not require DNS, certificates, or a reverse proxy. To publish a personalized static site, build the production target from the intended content branch; mounting `content/` into an already-running production container does not rebuild `dist/`.

## Method D — Manual installation without Docker

Install Node.js 22 LTS (minimum 22.12) or Node.js 24.13.1+, then run:

```sh
git clone https://github.com/hsh82/Rawan-Portfolio.git
cd Rawan-Portfolio
npm ci
npm run dev:content
```

Use `npm run dev` for normal read-only development and `npm run preview:content` for a source-backed authoring preview. Validate and build with:

```sh
npm run content:validate
npm run content:check-links
npm run check
npm run build
npm run preview
```

Résumé generation is disabled in the owner-neutral template. When enabled in a personalized checkout, install Chrome, Chromium, or Edge and set `CHROME_BIN` to its executable path. The build fails visibly when enabled résumé generation cannot find a browser; it does not download one during `npm ci`.

## Folder layout

- `content/`: canonical structured JSON, bilingual MDX, and uploaded media; this is the persistent bind mount.
- `src/`: Astro application and Easy Content implementation.
- `public/`: static assets and generated media mirror during local development.
- `setup/Dockerfile`: `deps`, `builder`, `authoring`, and `production` targets.
- `setup/docker-compose.yml`: editable authoring distribution.
- `setup/docker-compose.production.yml`: immutable static distribution.
- `.github/workflows/docker-publish.yml`: verified GHCR publication on `main` or version tags.

## Git workflow

```sh
git switch -c content/my-portfolio
docker compose -f setup/docker-compose.yml up -d
# edit through http://localhost:4321/dev/content/
git status --short
git diff -- content
npm run content:validate
npm run content:check-links
git add content
git commit -m "content: update portfolio"
git push -u origin content/my-portfolio
```

Git credentials stay on the host. Do not copy SSH keys or GitHub tokens into the image or bind mounts. Use the normal pull-request review flow.

## Building locally

```sh
docker buildx build --target authoring -t rawan-easy-content:local -f setup/Dockerfile .
docker buildx build --target production -t rawan-portfolio:local -f setup/Dockerfile .
docker compose -f setup/docker-compose.yml config --quiet
docker compose -f setup/docker-compose.production.yml config --quiet
```

The builder installs Chromium and its sandbox helper so a checkout with enabled bilingual résumé generation can generate PDFs. BuildKit does not expose the namespace operation required by Chromium's sandbox during image construction, so the Dockerfile uses an explicit build-stage-only `CHROME_NO_SANDBOX=1`; the authoring runtime resets this to `0` and does not disable Chromium's sandbox. Chromium is not copied into the production image. The production image uses an unprivileged Nginx runtime and a read-only filesystem.

## Troubleshooting

### Port 4321 or 8080 is already in use

```sh
docker compose -f setup/docker-compose.yml down
EASY_CONTENT_PORT=1235 docker compose -f setup/docker-compose.yml up -d
PORT=8081 docker compose -f setup/docker-compose.production.yml up -d
```

On PowerShell use `Get-NetTCPConnection -LocalPort 4321` and `Get-Process -Id <OwningProcess>`.

### Docker Desktop is not running or WSL reports an error

Start Docker Desktop, wait for the engine to become ready, then run `docker version`. In Docker Desktop settings, enable the WSL 2 engine and integration for the distribution containing the checkout. Restart Docker Desktop after changing file-sharing settings.

### Content is missing, invalid, or cannot be saved

```sh
docker compose -f setup/docker-compose.yml ps
docker compose -f setup/docker-compose.yml logs --tail 200 easy-content
ls -la content
```

The entrypoint never overwrites a non-empty directory. Restore missing required files from Git or use a new explicitly empty content directory. On Linux, correct host ownership/permissions; do not use `--privileged`.

### Live preview does not refresh

Restart the authoring container and check the mounted path. Docker Desktop file notifications can lag on network shares or very large folders, so keep the checkout on a local drive. The application uses the normal Astro watcher; broad polling is not enabled by default.

### Images or media are missing

Confirm the canonical file exists under `content/media/`, then reload the authoring page. Easy Content publishes a generated `public/media` mirror inside the container; the canonical source remains `content/media/`.

### Chromium or PDF generation fails

The owner-neutral template skips résumé generation. For enabled generation, inspect the build output for the missing browser path and set `CHROME_BIN` to an executable path. Docker builds include `/usr/bin/chromium`; no `--privileged` mode is required.

### GHCR image pull is denied

Check package visibility and that the image name is exactly `ghcr.io/hsh82/rawan-easy-content` or `ghcr.io/hsh82/rawan-portfolio`. Private packages require `docker login ghcr.io` with an appropriate token.

### Container restarts repeatedly

```sh
docker compose -f setup/docker-compose.yml ps
docker compose -f setup/docker-compose.yml logs --tail 200 easy-content
docker inspect --format '{{json .State.Health}}' "$(docker compose -f setup/docker-compose.yml ps -q easy-content)"
```

Look for a partial content directory, a permission error, a failed build, or port collision. Fix the host issue and recreate the container; content is in the bind mount.

### Disk space is low

```sh
docker system df
docker image prune
```

Do not prune volumes or remove the host `content/` directory unless you have a backup.

### Production shows old content

Production is a static image. Build and publish a new image from the desired content branch, then pull and recreate the production container. A running production container never reads a mounted content directory.

## Frequently asked questions

**Does Docker replace Git?** No. Docker runs the editor; Git on the host versions the resulting `content/` changes.

**Can I expose Easy Content publicly?** No. The Compose port is loopback-only and the editor is intended for local authoring. Do not publish it on `0.0.0.0`.

**Does production need a database or `.env` file?** No. It is a static Nginx image.

**Why is ARM64 not listed?** The current release validates Linux AMD64 only. ARM64 remains unadvertised until the Chromium and runtime matrix is complete.

**Can I mount content into production?** That does not update generated HTML. Build a new image instead.

## Security notes

Easy Content still requires a session token, matching loopback Host/Origin, bounded request bodies, safe content paths, symlink checks, atomic writes, and revision checks. Docker Compose binds the host port to `127.0.0.1` and uses a dedicated fixed bridge gateway. Only that exact gateway is accepted when `EASY_CONTENT_DOCKER=true`; arbitrary bridge addresses are rejected. Cross-origin requests and remote exposure remain blocked.

The authoring container is not privileged and has no Docker socket or Git credentials. The production container drops capabilities, enables `no-new-privileges`, uses a read-only filesystem, and exposes only static files.

## GHCR publishing

Pull requests run application tests, Docker configuration checks, image builds, and container smoke tests but do not publish `latest`. A successful push to `main` or a `v*.*.*` tag then publishes both images using the GitHub Actions `GITHUB_TOKEN`, SHA tags, and OCI source metadata. The workflow targets `linux/amd64` only until ARM64 is independently validated.

## Acceptance limitations

The repository CI validates Linux containers. Windows Docker Desktop with WSL 2 and macOS Docker Desktop require a local manual run of the commands in Methods A and B; they are not represented as successful Linux container jobs. Record those results separately before advertising additional platform support.
