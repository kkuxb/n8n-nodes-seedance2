---
status: resolved
trigger: "Investigate issue: npm-build-fails-n8n-workflow\n\n**Summary:** `npm run build` fails in this repo during TypeScript compilation."
created: 2026-04-16T00:00:00Z
updated: 2026-04-20T00:00:00Z
---

## Current Focus

hypothesis: Root cause confirmed: missing direct `n8n-workflow` dependency caused TypeScript module resolution failures.
test: Have user confirm the fix resolves their real workflow/environment issue.
expecting: User confirms the build now succeeds in their environment as well.
next_action: resolved during milestone close cleanup; `npm run build` has passed repeatedly in later phase verification gates

## Symptoms

expected: `npm run build` should complete successfully and produce the build output.
actual: `npm run build` fails during the TypeScript build step.
errors: Multiple files fail with `TS2307: Cannot find module 'n8n-workflow' or its corresponding type declarations.` Affected files include `credentials/SeedanceApi.credentials.ts`, `nodes/Seedance/Seedance.node.ts`, several `description/*.ts`, `shared/mappers/*.ts`, `shared/transport/request.ts`, `shared/types.ts`, and `shared/validators/create.ts`.
reproduction: From the project root, run `npm run build`.
started: The user reports this worked previously and recently regressed.

## Eliminated

## Evidence

- timestamp: 2026-04-16T00:03:00Z
  checked: knowledge base
  found: No `.planning/debug/knowledge-base.md` file exists.
  implication: No prior resolved pattern is available; investigate from first principles.

- timestamp: 2026-04-16T00:03:30Z
  checked: package.json
  found: `devDependencies` include `@n8n/node-cli`, `@types/node`, `eslint`, and `typescript`, but no explicit `n8n-workflow` dependency.
  implication: TypeScript may be compiling source that imports `n8n-workflow` without the package being declared for installation.

- timestamp: 2026-04-16T00:04:00Z
  checked: source imports
  found: Ten matches import `n8n-workflow`, including credentials, node entrypoint, description files, shared mappers, validators, transport, and types.
  implication: The failure is systemic and consistent with a missing package rather than a single bad file.

- timestamp: 2026-04-16T00:06:00Z
  checked: tsconfig.json
  found: TypeScript uses normal `moduleResolution: node` and includes `credentials/**/*.ts` and `nodes/**/*.ts`; there is no custom path alias for `n8n-workflow`.
  implication: The compiler expects `n8n-workflow` to be resolvable from `node_modules`.

- timestamp: 2026-04-16T00:06:30Z
  checked: `npm run build`
  found: The build reproduces exactly with repeated TS2307 errors for `n8n-workflow` across all importing files.
  implication: The issue is reproduced and isolated to module resolution during TypeScript compilation.

- timestamp: 2026-04-16T00:07:00Z
  checked: `npm ls n8n-workflow`
  found: npm reports the dependency tree as empty for `n8n-workflow`.
  implication: `n8n-workflow` is not currently installed in this project, which directly explains the TS2307 failures.

- timestamp: 2026-04-16T00:08:30Z
  checked: package-lock references for `n8n-workflow`
  found: The only lockfile reference is a peer dependency entry under `@n8n/ai-utilities`; there is no installed `node_modules/n8n-workflow` package and no root manifest entry.
  implication: The project likely relied on incidental transitive availability before; a direct dependency is required for stable builds.

- timestamp: 2026-04-16T00:11:30Z
  checked: `npm install -D n8n-workflow`
  found: npm successfully added `n8n-workflow` and updated lockfile state.
  implication: The required module should now be available to TypeScript from `node_modules`.

- timestamp: 2026-04-16T00:12:30Z
  checked: `npm run build` after dependency install
  found: `n8n-node build` completed successfully; TypeScript build passed and static files were copied.
  implication: The missing direct dependency was the build blocker, and the fix resolved the original reproduction.

## Resolution

root_cause: The project source imports `n8n-workflow`, but `package.json` no longer declares it, so npm does not install the package and TypeScript cannot resolve the module during `n8n-node build`.
fix: Added `n8n-workflow` as a direct development dependency so the compiler can resolve its types from `node_modules`.
verification: Reproduced the original TS2307 failure, added `n8n-workflow` as a direct dev dependency, and reran `npm run build` successfully with no module resolution errors.
files_changed: ["package.json", "package-lock.json"]
