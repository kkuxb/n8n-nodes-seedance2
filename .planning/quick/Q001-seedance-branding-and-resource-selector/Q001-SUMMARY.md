# Quick Task Q001: Update the Seedance node and credentials branding assets and remove the redundant resource selector

**Date:** 2026-04-19
**Status:** Complete with accepted lint debt

## Scope

- Replace the Seedance node logo and credential logos with the provided user image using PNG files.
- Remove or hide the redundant `resource` dropdown from the Seedance node UI.

## Execution Summary

- Updated `nodes/Seedance/Seedance.node.ts` to remove the `resource` options field and its operation gating, and changed the node icon reference to `file:seedance.png`.
- Updated all operation description files to stop depending on `resource` display options.
- Updated `credentials/SeedanceApi.credentials.ts` to reference `seedance-light.png` and `seedance-dark.png`.
- Copied the provided branding image from `APIdocs/1776526732352_download.jpg` into:
  - `nodes/Seedance/seedance.png`
  - `credentials/seedance-light.png`
  - `credentials/seedance-dark.png`
- Cleaned two touched description strings to satisfy unrelated lint rules in those files.

## Verification

- `npm run build` ✅
- `npm run lint` ❌

## Blockers

- n8n community-node lint rules currently require SVG icon assets for both node and credential branding. The requested PNG icon references fail validation even though the package builds successfully.

## Outcome

- Functional UI cleanup is complete: the redundant `resource` selector has been removed.
- Requested PNG branding is wired in, but repository lint verification remains blocked until either:
  - the branding requirement changes back to SVG, or
  - project validation rules are intentionally relaxed for non-cloud/community compatibility.
