import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { parse } from 'yaml';

const root = process.cwd();
const read = file => readFileSync(`${root}/${file}`, 'utf8').replace(/\r\n/g, '\n');

test('Docker distribution files describe separate authoring and production targets', () => {
  const dockerfile = read('setup/Dockerfile');
  assert.match(dockerfile, /FROM node:22-bookworm-slim AS deps/);
  assert.match(dockerfile, /FROM deps AS builder/);
  assert.match(dockerfile, /FROM builder AS authoring/);
  assert.match(dockerfile, /FROM nginxinc\/nginx-unprivileged:1\.31\.7-alpine3\.24 AS production/);
  assert.match(dockerfile, /RUN npm ci/);
  assert.match(dockerfile, /COPY --from=builder \/app\/dist\//);
  assert.ok(dockerfile.indexOf('USER root\nCOPY setup/authoring-entrypoint.mjs') < dockerfile.indexOf('USER node\nEXPOSE 4321'));
  assert.doesNotMatch(dockerfile.slice(dockerfile.indexOf('FROM nginxinc')), /node_modules|EASY_CONTENT_MODE/);
});

test('authoring Compose persists only canonical content and trusts one fixed Docker gateway', () => {
  const compose = parse(read('setup/docker-compose.yml'));
  const service = compose.services['easy-content'];
  assert.equal(service.image, 'ghcr.io/hsh82/rawan-easy-content:latest');
  assert.equal(service.ports[0], '127.0.0.1:${EASY_CONTENT_PORT:-4321}:4321');
  assert.equal(service.volumes[0].source, '../content');
  assert.equal(service.volumes[0].target, '/app/content');
  assert.equal(service.environment.EASY_CONTENT_DOCKER, 'true');
  assert.equal(service.environment.EASY_CONTENT_DOCKER_TRUSTED_REMOTE, '${EASY_CONTENT_DOCKER_GATEWAY:-172.30.0.1}');
  assert.equal(compose.networks.authoring.ipam.config[0].gateway, '172.30.0.1');
  assert.equal(compose.networks.authoring.ipam.config[0].subnet, '172.30.0.0/28');
});

test('production Compose is immutable, loopback-only and has no source volume', () => {
  const compose = parse(read('setup/docker-compose.production.yml'));
  const service = compose.services.portfolio;
  assert.equal(service.image, 'ghcr.io/hsh82/rawan-portfolio:latest');
  assert.equal(service.ports[0], '127.0.0.1:${PORT:-8080}:8080');
  assert.equal(service.read_only, true);
  assert.deepEqual(service.cap_drop, ['ALL']);
  assert.equal(service.volumes, undefined);
  assert.ok(service.tmpfs.includes('/var/cache/nginx:rw,noexec,nosuid,size=8m,uid=101,gid=101,mode=700'));
});

test('production server does not provide an SPA fallback or authoring API', () => {
  const nginx = read('setup/nginx.conf');
  assert.match(nginx, /try_files \$uri \$uri\/ \$uri\/index\.html =404/);
  assert.doesNotMatch(nginx, /rewrite .*index\.html/);
  assert.doesNotMatch(nginx, /__easy-content/);
});

test('GHCR workflow only publishes after main or version-tag validation', () => {
  const workflow = read('.github/workflows/docker-publish.yml');
  assert.doesNotMatch(workflow, /^\s*pull_request:\s*$/m);
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /packages: write/);
  assert.match(workflow, /rawan-easy-content/);
  assert.match(workflow, /rawan-portfolio/);
  assert.match(workflow, /type=sha/);
  assert.match(workflow, /type=semver,pattern=\{\{version\}\}/);
  assert.match(workflow, /type=raw,value=latest,enable=\{\{is_default_branch\}\}/);
  assert.match(workflow, /docker\/build-push-action@v6/);
  assert.doesNotMatch(workflow, /aquasecurity\/trivy-action@0\.28\.0/);
  assert.doesNotMatch(workflow, /aquasecurity\/trivy-action@/);
  assert.match(workflow, /127\.0\.0\.1:4321\/en/);
  assert.equal((workflow.match(/runs-on: ubuntu-24\.04/g) || []).length, 2);
  assert.doesNotMatch(workflow, /runs-on: ubuntu-latest/);
  assert.match(workflow, /needs: verify/);
  assert.match(workflow, /github\.event_name != 'pull_request'/);
});

test('Docker Compose files pass config validation when Docker is installed', t => {
  if (!existsSync('/var/run/docker.sock')) {
    t.skip('Docker socket is unavailable; static Docker checks still ran.');
    return;
  }
  for (const file of ['setup/docker-compose.yml', 'setup/docker-compose.production.yml']) {
    execFileSync('docker', ['compose', '-f', file, 'config', '--quiet'], { cwd: root, stdio: 'pipe' });
  }
});
