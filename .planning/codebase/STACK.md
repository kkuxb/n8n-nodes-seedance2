# Technology Stack

**Analysis Date:** 2026-05-18

## Languages

**Primary:**
- TypeScript 5.8.3 - n8n node implementation, operation descriptions, transport helpers, mappers, validators, and type declarations under `nodes/**/*.ts` and `credentials/**/*.ts`; configured by `tsconfig.json`.

**Secondary:**
- JavaScript ES modules - local development orchestration in `scripts/dev.mjs`.
- CommonJS JavaScript - Gulp asset-copy task in `gulpfile.js`.
- JSON - package metadata in `package.json`, lockfile metadata in `package-lock.json`, n8n node resource metadata in `nodes/Seedance/Seedance.node.json`, and compiler/lint config in `tsconfig.json` and `eslint.config.mjs`.
- Markdown - user and project documentation in `README.md` and `.planning/**/*.md`.

## Runtime

**Environment:**
- Node.js 22.x - declared in `package.json` `engines.node` and `.nvmrc`; `README.md` local development instructions also state Node.js `22.x`.
- n8n runtime - this package is loaded as an n8n community node through the `n8n` metadata block in `package.json`.
- Local shell currently reports Node.js `v24.15.0`; switch to Node 22 before running project scripts because `scripts/dev.mjs` exits when the major version is not 22.

**Package Manager:**
- npm 11.12.1 - declared by `package.json` `packageManager`.
- Lockfile: present as `package-lock.json` with lockfile version 3.

## Frameworks

**Core:**
- n8n community node package - `package.json` declares keyword `n8n-community-node-package`, n8n API version 1, strict node loading, one node entry at `dist/nodes/Seedance/Seedance.node.js`, and one credential entry at `dist/credentials/SeedanceApi.credentials.js`.
- n8n-workflow ^2.13.1 - provides node contracts and runtime types such as `INodeType`, `IExecuteFunctions`, `INodeExecutionData`, `INodeProperties`, `NodeOperationError`, and HTTP request option types used across `nodes/Seedance/Seedance.node.ts`, `nodes/Seedance/description/*.ts`, and `nodes/Seedance/shared/**/*.ts`.

**Testing:**
- Node.js built-in test runner - tests import `node:test` and `node:assert/strict` in `test/*.test.ts`.
- No dedicated Jest, Vitest, or Mocha dependency is present in `package.json`.
- No `test` script is declared in `package.json`; tests target compiled JavaScript in `dist/**` for several modules, so run `npm run build` before direct `node --test` execution.

**Build/Dev:**
- @n8n/node-cli ^0.23.1 - `npm run build` executes `n8n-node build`, `npm run lint` executes `n8n-node lint`, and `npm run lint:fix` executes `n8n-node lint --fix` from `package.json`.
- TypeScript ^5.8.3 - `tsconfig.json` targets ES2022, emits CommonJS, declarations, and source maps into `dist`.
- ESLint 9.29.0 - configured via `eslint.config.mjs`, which imports the default n8n node CLI ESLint config from `@n8n/node-cli/eslint`.
- Prettier - `.prettierrc` configures single quotes and trailing commas; Prettier is not listed as a direct dependency in `package.json`.
- Gulp - `gulpfile.js` copies node and credential JSON, PNG, and SVG assets into `dist`; Gulp is not listed as a direct dependency in `package.json` but is used by the build tooling path.
- Custom dev harness - `npm run dev` runs `scripts/dev.mjs`, which starts `n8n-node dev --external-n8n` and a pinned local n8n server.

## Key Dependencies

**Critical:**
- `n8n-workflow` ^2.13.1 - type and runtime contract surface for all node descriptions, node execution, HTTP helpers, binary handling, and errors.
- `@n8n/node-cli` ^0.23.1 - official build, lint, and dev tooling for the n8n community node package.
- `typescript` ^5.8.3 - compiles `credentials/**/*.ts` and `nodes/**/*.ts` into the distributable `dist` package.
- `@types/node` ^22.15.3 - Node 22 type definitions for buffers, timers, URL parsing, and dev script APIs.

**Infrastructure:**
- `eslint` 9.29.0 - lint engine configured through `eslint.config.mjs`.
- Node built-ins - `scripts/dev.mjs` uses `node:os`, `node:path`, `node:fs`, and `node:child_process`; tests use `node:test` and `node:assert/strict`.
- n8n pinned dev runtime - `scripts/dev.mjs` installs and runs `n8n@1.123.15` into `.n8n-dev-server` for local manual testing.

## Configuration

**Environment:**
- Node version is pinned by `.nvmrc` and `package.json` to Node 22.
- n8n package registration is declared in `package.json` under `n8n.credentials` and `n8n.nodes`.
- The credential type consumed by requests is `seedanceApi`, defined in `nodes/Seedance/shared/constants.ts` and referenced by `nodes/Seedance/Seedance.node.ts`.
- The API key is stored in n8n credentials and loaded through `executor.getCredentials(SEEDANCE_CREDENTIAL_TYPE)` in `nodes/Seedance/shared/transport/request.ts`; there are no required project `.env` files for production use.
- Local dev environment variables are set inside `scripts/dev.mjs`: `N8N_DEV_RELOAD=true`, `DB_SQLITE_POOL_SIZE=10`, `N8N_USER_FOLDER=<home>/.n8n-node-cli`, and `npm_config_cache=.npm-n8n-cache`.
- `.env` and `.env.*` are gitignored in `.gitignore`; no `.env*` files are present in the repository scan.

**Build:**
- `tsconfig.json` includes `credentials/**/*.ts` and `nodes/**/*.ts`, uses `rootDir` `.`, and emits to `dist`.
- `package.json` publishes only `dist` through the `files` array and sets `main` to `dist/nodes/Seedance/Seedance.node.js`.
- `gulpfile.js` copies `nodes/**/*.json`, `nodes/**/*.{png,svg}`, and `credentials/**/*.{png,svg}` into `dist`.
- `nodes/Seedance/Seedance.node.json` declares n8n AI category metadata and links to Volcengine credential and primary documentation.

## Platform Requirements

**Development:**
- Use Node.js 22.x and npm 11.12.1 for consistency with `.nvmrc` and `package.json`.
- Run `npm install`, `npm run build`, and `npm run dev` as documented in `README.md`.
- On Windows, `scripts/dev.mjs` requires Node 22 and checks for Python/node-gyp compatibility when the pinned n8n dev runtime needs native dependency installation.
- The local dev harness installs `n8n@1.123.15` under `.n8n-dev-server` and uses `.npm-n8n-cache`; both are ignored by `.gitignore`.

**Production:**
- Deployment target is npm distribution as `n8n-nodes-seedance2`, installed into an n8n instance as a community node.
- Runtime host is n8n; this repository does not define its own server, database, queue, container, or standalone deployment process.
- The package exports compiled artifacts under `dist` only, with n8n loading `dist/nodes/Seedance/Seedance.node.js` and `dist/credentials/SeedanceApi.credentials.js`.

---

*Stack analysis: 2026-05-18*
