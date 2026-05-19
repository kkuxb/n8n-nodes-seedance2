# Phase 17 Patterns

**Date:** 2026-05-19
**Phase:** 17 - 既有模式与 lifecycle 兼容性

## Test Patterns to Reuse

### Execute-Level HTTP Capture

Use fake n8n execution contexts and call:

```ts
await Seedance.prototype.execute.call(context);
```

Capture every `helpers.httpRequest(options)` call into an array and assert:

- `method`
- `url` or endpoint suffix
- `qs`
- `body`
- output `json`
- optional output `binary`

This is required for old create, get, list, delete, wait, and download compatibility checks.

### Parameter Read Guards

When proving saved workflow compatibility, record all `getNodeParameter()` names. For stronger isolation checks, throw if forbidden parameters are read without a fallback.

Use this for:

- old video modes must not read `referenceMaterials`
- image mode must not read video-only parameters
- multimodal mode must not read strict first/last-frame fields

### Existing File Placement

- Old video create and generic lifecycle compatibility: `test/seedanceVideoRegression.test.ts`
- Immediate get and wait outcomes: `test/seedanceGetWaitMode.test.ts`
- Wait plus download attachment behavior: `test/seedanceDownloadFlow.test.ts`
- Seedream image isolation: `test/seedanceGenerateImageExecute.test.ts`

### Assertion Style

- Prefer exact object assertions for request bodies and success envelopes.
- Use negative string/role assertions for forbidden `reference_image`, `reference_video`, `reference_audio`, `first_frame`, and `last_frame` roles.
- Use call-count assertions to prove guarded branches did not execute.
- Keep all tests on Node's built-in `node:test` and `node:assert/strict`.

### Build Before Test

Tests import from `dist`, so run `npm run build` before focused or full Node test commands.
