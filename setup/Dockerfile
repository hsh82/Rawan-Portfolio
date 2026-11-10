# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS deps

WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

FROM deps AS builder

# Chromium is only used while generating an enabled résumé during the build.
# It is deliberately not copied into the static production image.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends chromium chromium-sandbox ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node . .
ENV CHROME_BIN=/usr/bin/chromium
# Docker BuildKit's build sandbox blocks Chromium's setuid/user-namespace
# sandbox during image construction. This opt-in is limited to the build stage;
# the authoring runtime below explicitly leaves it disabled.
ENV CHROME_NO_SANDBOX=1
RUN chown -R node:node /app/node_modules \
    && mkdir -p /app/.astro /app/dist \
    && chown -R node:node /app/.astro /app/dist \
    && chown node:node /app
USER node
RUN npm run content:validate \
    && npm run content:check-links \
    && npm run build

FROM builder AS authoring

ENV NODE_ENV=development \
    EASY_CONTENT_MODE=true \
    EASY_CONTENT_DOCKER=false \
    PORT=4321 \
    HOST=0.0.0.0 \
    CHROME_BIN=/usr/bin/chromium \
    CHROME_NO_SANDBOX=0

# This immutable copy is used only when /app/content is an explicitly empty
# bind mount. Existing content is never merged with or overwritten by it.
RUN mkdir -p /app/.content-template /app/content /app/public/media /app/.easy-content-trash \
    && cp -a /app/content/. /app/.content-template/ \
    && chown -R node:node /app

# The entrypoint is installed outside the application tree, so install it as
# root before returning to the unprivileged runtime user.
USER root
COPY setup/authoring-entrypoint.mjs /usr/local/bin/rawan-authoring-entrypoint.mjs
RUN chmod 0755 /usr/local/bin/rawan-authoring-entrypoint.mjs

USER node
EXPOSE 4321
HEALTHCHECK --interval=10s --timeout=4s --start-period=25s --retries=6 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:4321/__easy-content/api/context?path=/dev/content/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
ENTRYPOINT ["node", "/usr/local/bin/rawan-authoring-entrypoint.mjs"]

FROM nginxinc/nginx-unprivileged:1.31.7-alpine3.24 AS production

COPY setup/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html/

EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=4s --start-period=8s --retries=5 \
  CMD ["wget", "--quiet", "--output-document=-", "http://127.0.0.1:8080/healthz"]
