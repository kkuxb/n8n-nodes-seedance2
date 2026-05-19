---
title: Node 24 and n8n 2.x local dev runtime
date: 2026-05-19
---

# Node 24 and n8n 2.x Local Dev Runtime

## Goal

Use Node 24.15.0 as the project development runtime and run n8n 2.x from project-local dependencies instead of installing a separate n8n runtime during `npm run dev`.

## Design

- Pin the project runtime to Node `24.15.0` through `.nvmrc` and the `package.json` engine range `>=24.15.0 <25`.
- Add `n8n` as a dev dependency pinned to stable `2.20.9`.
- Keep `@n8n/node-cli` as the community-node development CLI. Its package version is independent from the n8n runtime version.
- Simplify `scripts/dev.mjs` so it only checks for local dependencies and starts:
  - `@n8n/node-cli` with `dev --external-n8n`
  - local `node_modules/.bin/n8n`
- Remove the startup-time `.n8n-dev-server` installation flow so `npm run dev` does not fetch packages.

## Verification

- `node --check scripts/dev.mjs` should pass.
- After a clean dependency install, run:
  - `npm run build`
  - `node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts`
  - `npm run dev`

## Known Constraint

This change still requires one successful `npm install` to materialize local `n8n`, `@n8n/node-cli`, and `dist` build tooling. In the current sandbox, npm registry access is blocked with `EACCES`, so the lockfile dependency tree cannot be fully regenerated here.
