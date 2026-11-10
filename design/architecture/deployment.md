# Deployment

Vercel serves the static Astro output through two manual GitHub Actions workflows. `Vercel Preview` and `Vercel Production` are triggered only with `workflow_dispatch`; each accepts `main` or any `content/*` branch. Preview creates a preview deployment, while Production creates a production deployment after the selected branch is explicitly chosen.

Configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as GitHub Actions secrets. The token authenticates the CLI; the org and project IDs select the Vercel project non-interactively. Disable Vercel Git integration's automatic deployments for this repository, otherwise it can deploy independently of the manual actions.

The staging CI matrix runs Node 22 on Ubuntu, Windows and macOS, including full tests, HTTP/process smoke checks and a controlled browser PDF fixture. Runtime launchers use process.execPath and forward exit status/signals. Standard preview explicitly disables authoring; preview:content explicitly starts a source-backed loopback authoring companion. See ../STAGING-PLATFORM.md.

Docker adds two independent distributions without changing the static architecture. The authoring image mounts only the host `content/` directory and exposes Easy Content on loopback port 1234; the production image contains only the generated `dist/` tree in an unprivileged Nginx runtime on port 8080. See [Docker distributions](docker.md) and the [delivery evidence](../reports/2026-11-09-docker-distribution.md).
