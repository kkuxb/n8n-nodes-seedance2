---
status: resolved
trigger: "Investigate issue: npm-run-dev-stuck-on-warnings\n\n**Summary:** `npm run dev` used to work, now it no longer starts successfully and appears to get stuck around warning output."
created: 2026-04-19T00:00:00Z
updated: 2026-04-20T00:00:00Z
---

## Current Focus

hypothesis: The persistent-runtime strategy is in place; user verification is now needed to confirm it delivers the desired stability once a compatible Python toolchain is configured.
test: Confirm the repo now uses `.n8n-dev-server` as a persistent local runtime and that `.gitignore` treats it as generated state.
expecting: After configuring npm/node-gyp to use Python 3.11/3.12, repeated `npm run dev` runs should reuse the same pinned local n8n install instead of doing transient installs.
next_action: resolved for milestone close as a local dev environment issue; generated runtime strategy documented, no product runtime change required

## Symptoms

expected: `npm run dev` should start the development server successfully and remain usable.
actual: The command does not start cleanly and appears to get stuck in the middle around warnings instead of completing startup.
errors: User reports multiple errors/warnings, but has not pasted the exact output yet.
reproduction: Run `npm run dev` in the repository with no extra setup steps.
started: It worked before and recently broke.

## Eliminated

## Evidence

- timestamp: 2026-04-19T00:00:00Z
  checked: .planning/debug/npm-dev-fails-n8n-editor-ui-version.md and package.json
  found: The repo already uses a wrapper `scripts/dev.mjs` for `npm run dev`, created after a prior failure where `@n8n/node-cli` launched broken `n8n@latest`; the historical candidate workaround was pinning `n8n@1.123.15`.
  implication: The current failure may be a regression in that wrapper path, an environment-specific issue during its execution, or a new upstream/tooling change.

- timestamp: 2026-04-19T00:04:00Z
  checked: .planning/debug/knowledge-base.md, scripts/dev.mjs, and @n8n/node-cli dev command
  found: No knowledge-base entry matches the current symptom pattern. The wrapper launches `n8n-node dev --external-n8n` plus `npm exec --yes --package n8n@1.123.15 -- n8n`, specifically to bypass node-cli's hardcoded `npx n8n@latest` behavior.
  implication: Investigation should focus on whether the wrapper's pinned-n8n startup path is now failing, stalling, or exiting under the current environment.

- timestamp: 2026-04-19T00:08:00Z
  checked: `npm run dev`
  found: Reproduction showed only the `n8n-node dev` terminal UI and the TypeScript watcher reaching `Found 0 errors. Watching for file changes.` No `n8n Server` logs or readiness output appeared within 120 seconds, and the process stayed alive until timeout.
  implication: This is not a simple compile failure; the problem is narrowed to the separate n8n server launch path or its visibility/output behavior.

- timestamp: 2026-04-19T00:11:00Z
  checked: wrapper-derived npm path and direct pinned n8n invocation
  found: The wrapper-computed npm CLI path exists (`C:\Users\maoru\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js`), but running `npm exec --yes --package n8n@1.123.15 -- n8n` directly from `C:\Users\maoru\.n8n-node-cli` fails immediately with `ENOENT` for a missing `_npx\...\package.json` under the default npm cache.
  implication: The apparent hang is likely the wrapper suppressing or obscuring a failing npm/n8n subprocess; cache handling is now a prime suspect.

- timestamp: 2026-04-19T00:15:00Z
  checked: wrapper cache/user folders and direct pinned n8n run with wrapper-equivalent env
  found: The repo-local `.npm-n8n-cache` exists and contains `_npx`; with `npm_config_cache` set to that folder plus the wrapper's `N8N_USER_FOLDER`, the direct pinned `npm exec ... n8n` command no longer throws ENOENT but also emits no output for 120 seconds.
  implication: The custom cache changes behavior from immediate npm failure to silent blocking, so the next question is whether n8n is actually starting in the background or hanging before readiness.

- timestamp: 2026-04-19T00:19:00Z
  checked: background pinned n8n startup plus localhost probe
  found: After starting the pinned command in a background PowerShell job and waiting 20 seconds, `http://127.0.0.1:5678/rest/settings` was unreachable (`unable to connect to remote server`).
  implication: The subprocess is not silently serving on the default port; there is a real startup failure or block before readiness.

- timestamp: 2026-04-19T00:23:00Z
  checked: npm cache logs, `.n8n-node-cli` state, and user npm config
  found: The repo-local npm logs show extremely long dependency-resolution/install activity for `npm exec --package n8n@1.123.15 -- n8n` and stop mid-install without a terminal error in the captured window. User-level npm config points to `https://registry.npmmirror.com`.
  implication: A long-running or degraded registry-backed ephemeral install is now a strong competing hypothesis alongside hidden startup failure.

- timestamp: 2026-04-19T00:27:00Z
  checked: direct pinned startup with a 10-minute timeout
  found: Even after 600 seconds, `npm exec --yes --package n8n@1.123.15 -- n8n` with the wrapper environment still produced no server output and did not reach readiness.
  implication: The current dev script path is operationally unusable even if it is not technically crashing; startup strategy must change or be bypassed.

- timestamp: 2026-04-19T00:29:00Z
  checked: official-registry comparison and pinned package metadata
  found: Forcing `npm_config_registry=https://registry.npmjs.org` still produced no output within 180 seconds, while package metadata confirmed `n8n@1.123.15` exposes the expected `n8n` binary and is a normal installable package.
  implication: The main failure is not just a bad mirror response; the transient `npm exec --package ...` startup approach is itself the unreliable bottleneck.

- timestamp: 2026-04-19T00:36:00Z
  checked: attempted local install of `n8n@1.123.15`
  found: `npm install --save-dev n8n@1.123.15` failed in `node_modules/sqlite3` after `prebuild-install` fell back to `node-gyp rebuild`, and `node-gyp` selected `C:\Python314\python.exe` where importing `distutils.version` failed with `ModuleNotFoundError: No module named 'distutils'`.
  implication: The dev flow is blocked by a native dependency build environment regression on Windows, not merely by warning noise or a bad wrapper UX.

- timestamp: 2026-04-19T00:41:00Z
  checked: Python and npm/node-gyp environment
  found: `py -0p` shows only `Python 3.14` installed, `npm config get python` is unset, and `py -3.14` reports neither `pip` nor `distutils` available.
  implication: node-gyp has no usable older Python configured, so the sqlite3 native build path is predictably broken on this machine.

- timestamp: 2026-04-19T00:43:00Z
  checked: `npm run dev` after adding the prerequisite guard
  found: The command now exits immediately with an explicit message explaining that Python 3.14/no-distutils breaks sqlite3/node-gyp during n8n startup and telling the user to configure Python 3.11/3.12.
  implication: The misleading stuck behavior is resolved at the UX level, and the underlying environment remediation is now clearly identified.

- timestamp: 2026-04-20T00:01:00Z
  checked: user checkpoint response
  found: The user wants `npm run dev` made more stable and less dependent on transient install-on-demand behavior, not only clearer diagnostics.
  implication: The investigation must continue toward a deterministic startup strategy that avoids `npm exec --package ...` where possible.

- timestamp: 2026-04-20T00:07:00Z
  checked: repo/user cache and global n8n availability
  found: There is no reusable cached/global `n8n` binary available; `.npm-n8n-cache/_npx` only contains a lock directory, `.n8n-node-cli/.cache` contains frontend assets not an executable install, and `n8n` is not globally installed.
  implication: A stable launch path must provision and reuse its own persistent installation instead of relying on existing global or transient cache state.

- timestamp: 2026-04-20T00:16:00Z
  checked: syntax and runtime behavior after wrapper rewrite
  found: `node --check scripts/dev.mjs` passed; default `npm run dev` still fast-fails on the known Python 3.14/node-gyp issue, and bypassing the guard showed the wrapper now explicitly bootstraps a persistent `.n8n-dev-server` install via `npm install n8n@1.123.15` before any launch attempt.
  implication: The dev strategy no longer depends on transient `npm exec --package ...`; remaining failure is the same machine-level Python/toolchain problem during bootstrap.

- timestamp: 2026-04-20T00:18:00Z
  checked: git status and ignore rules
  found: The new persistent local runtime created `.n8n-dev-server/`, which is currently untracked because `.gitignore` does not exclude it yet.
  implication: The runtime directory should be ignored as local generated state so the fix remains small and repo-safe.

## Resolution

root_cause: The unstable behavior comes from the wrapper launching `n8n` through a transient install-on-demand path (`npm exec --package ...`). That path hides provisioning work and failures behind the dev UI, so startup becomes non-deterministic and especially fragile on Windows when native dependencies like `sqlite3` need a working node-gyp/Python toolchain.
fix: Reworked `scripts/dev.mjs` to bootstrap a persistent project-local `.n8n-dev-server` runtime containing pinned `n8n@1.123.15` and then launch its local binary directly, while keeping the Windows prerequisite guard for the known Python 3.14/node-gyp failure case. Added `.n8n-dev-server/` to `.gitignore` so the persistent runtime remains local generated state.
verification: `node --check scripts/dev.mjs` passes. Default `npm run dev` still fails fast on the known Python 3.14/node-gyp issue. When the guard is bypassed for testing, the wrapper now explicitly bootstraps `.n8n-dev-server` with `npm install n8n@1.123.15` before launch, proving the transient `npm exec --package ...` path has been removed.
files_changed: ["scripts/dev.mjs", ".gitignore"]
