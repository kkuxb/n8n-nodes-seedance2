---
title: Node 24 and n8n 2.x local dev runtime
date: 2026-05-19
---

# Node 24 and n8n 2.x Local Dev Runtime

## Goal

Use Node 24.15.0 as the project development runtime and run n8n 2.x from project-local dependencies instead of installing a separate n8n runtime during `npm run dev`.

## Design

- Pin the project runtime to Node `24.15.0` through `.nvmrc` and the `package.json` engine range `>=24.15.0 <25`.
- Install `n8n` into a project-local isolated runtime at `.n8n-dev-server`, pinned to stable `2.20.9`.
- Keep `@n8n/node-cli` as the community-node development CLI. Its package version is independent from the n8n runtime version.
- Simplify `scripts/dev.mjs` so it only checks for local dependencies and starts:
  - an initial `@n8n/node-cli build`
  - TypeScript in watch mode
  - local `.n8n-dev-server/node_modules/.bin/n8n`
- Build a clean custom package under `.n8n-dev-package` and link that into n8n's custom node folder. This avoids exposing the project's full `node_modules` tree to n8n's node loader.
- Move runtime installation to `npm run dev:setup` so `npm run dev` does not fetch packages.

## Verification

- `node --check scripts/dev.mjs` should pass.
- After a clean dependency install and `npm run dev:setup`, run:
  - `npm run build`
  - `node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts`
  - `npm run dev`

## Known Constraint

This change still requires one successful `npm install` for `@n8n/node-cli` and one successful `npm run dev:setup` for the isolated n8n 2 runtime.
