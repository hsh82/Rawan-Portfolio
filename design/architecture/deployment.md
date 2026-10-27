# Deployment

Vercel serves `dist/` from the static build. GitHub Actions performs validation then invokes Vercel CLI with secrets. Disable Vercel Git auto-deployments to avoid duplicates.
