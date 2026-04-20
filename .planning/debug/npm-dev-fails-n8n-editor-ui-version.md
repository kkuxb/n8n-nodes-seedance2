---
status: resolved
trigger: "Investigate issue: npm-dev-fails-n8n-editor-ui-version\n\n**Summary:** `npm run dev` fails while starting the n8n server in this repo."
created: 2026-04-16T23:22:00Z
updated: 2026-04-20T00:00:00Z
---

## Current Focus

hypothesis: `n8n@1.123.15` is the best available pinned fallback and should let the repo dev flow start because it avoids both the broken latest dependency and the 2.8.3 module-loading failure
test: update wrapper to `1.123.15` and run `npm run dev`
expecting: no `ETARGET n8n-editor-ui@2.16.1` and no `community-packages.module` crash
next_action: superseded by npm-run-dev-stuck-on-warnings session and resolved as planning cleanup; no product runtime change required

## Symptoms

expected: `npm run dev` should start the n8n development server and keep it running.
actual: TypeScript watch starts successfully, but the n8n server startup fails and exits.
errors: The key terminal error is `npm error ETARGET No matching version found for n8n-editor-ui@2.16.1.` There are multiple peer dependency warnings before that, but the fatal error is the missing `n8n-editor-ui@2.16.1` version.
reproduction: From the project root, run `npm run dev`.
started: The user reports this has never worked.

## Eliminated

## Evidence

- timestamp: 2026-04-16T23:23:00Z
  checked: .planning/debug/knowledge-base.md
  found: Knowledge base file does not exist yet.
  implication: No prior resolved pattern is available; proceed with fresh hypothesis formation.

- timestamp: 2026-04-16T23:23:00Z
  checked: package.json
  found: `dev` runs `n8n-node dev`; devDependencies include `@n8n/node-cli@^0.23.1` and `n8n-workflow@^2.13.1`.
  implication: The failing server startup is likely driven by node-cli's provisioning logic rather than a direct repo dependency on `n8n-editor-ui`.

- timestamp: 2026-04-16T23:24:30Z
  checked: package-lock.json and debug references
  found: Lockfile confirms the same top-level versions; common-bug-pattern review points to Environment/Config and Missing dependency/version mismatch as the closest pattern.
  implication: The most likely root cause is version selection/provisioning, not TypeScript source or runtime app logic.

- timestamp: 2026-04-16T23:26:30Z
  checked: node_modules/@n8n/node-cli/dist/commands/dev/index.js
  found: The dev command hardcodes `npx -y --color=always --prefer-online n8n@latest` for the n8n server subprocess.
  implication: If the latest published n8n release is inconsistent, `npm run dev` will fail even when this repo is otherwise correctly configured.

- timestamp: 2026-04-16T23:30:30Z
  checked: npm registry metadata for `n8n` and `n8n-editor-ui`
  found: `npm view n8n version` returns `2.16.1`, and `npm view n8n@latest dependencies.n8n-editor-ui` also returns `2.16.1`, but published `n8n-editor-ui` versions stop at `2.8.3`.
  implication: The failure is caused by an upstream broken latest release pair; any tooling that blindly installs `n8n@latest` will fail with ETARGET.

- timestamp: 2026-04-16T23:32:30Z
  checked: `npx -y --prefer-online n8n@2.8.3 --version`
  found: Installation progressed past the ETARGET issue and only emitted peer/deprecation warnings before the command timed out during package install.
  implication: A pinned older release avoids the missing `n8n-editor-ui@2.16.1` failure and is a viable workaround target.

- timestamp: 2026-04-16T23:46:30Z
  checked: `npm run dev` with wrapper using `n8n@2.8.3`
  found: The original ETARGET error disappeared, but the n8n subprocess failed with `Failed to load module "community-packages": Cannot find module ... community-packages.module`.
  implication: The wrapper proved the ETARGET diagnosis, but `2.8.3` is not a sufficient final fix because it introduces a different startup failure.

- timestamp: 2026-04-16T23:51:30Z
  checked: `npm view n8n@1.123.15 dependencies.n8n-editor-ui`
  found: `n8n@1.123.15` depends on `n8n-editor-ui@1.123.6`, which exists in the registry.
  implication: `1.123.15` is a plausible pinned fallback candidate to replace the broken `latest` path.

- timestamp: 2026-04-16T23:55:30Z
  checked: `npx -y --prefer-online n8n@1.123.15 --version`
  found: The run produced lengthy install/warning output and Windows cache cleanup errors, but importantly did not hit the original `ETARGET n8n-editor-ui@2.16.1` or the `community-packages.module` error seen with `2.8.3`.
  implication: Need a cleaner verification method, but evidence still favors `1.123.15` over `2.8.3` as the safer pinned fallback.

- timestamp: 2026-04-16T23:57:30Z
  checked: wrapper script selection
  found: Updated `scripts/dev.mjs` to launch `n8n@1.123.15` instead of `2.8.3`.
  implication: The next end-to-end `npm run dev` test will determine whether the workaround fully restores startup.
## Resolution

root_cause: `@n8n/node-cli@0.23.1` hardcodes `npx n8n@latest` for `npm run dev`, and the current npm `latest` release of `n8n` (`2.16.1`) depends on non-existent `n8n-editor-ui@2.16.1`, causing startup to fail before the server can launch.
fix: Replaced the `dev` script with a small wrapper (`scripts/dev.mjs`) that runs `n8n-node dev --external-n8n` and starts pinned `n8n@1.123.15` via `npx`, bypassing the broken upstream `n8n@latest` resolution path.
verification: Superseded by the later persistent-runtime investigation in `npm-run-dev-stuck-on-warnings`; no v1.2 shipped feature depends on this dev-only path.
files_changed: ["package.json", "scripts/dev.mjs"]
