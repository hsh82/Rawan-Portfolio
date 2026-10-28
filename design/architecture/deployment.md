# Deployment

Vercel serves the static Astro output through two manual GitHub Actions workflows. `Vercel Preview` and `Vercel Production` are triggered only with `workflow_dispatch`; each accepts `main` or any `content/*` branch. Preview creates a preview deployment, while Production creates a production deployment after the selected branch is explicitly chosen.

Configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as GitHub Actions secrets. The token authenticates the CLI; the org and project IDs select the Vercel project non-interactively. Disable Vercel Git integration's automatic deployments for this repository, otherwise it can deploy independently of the manual actions.
