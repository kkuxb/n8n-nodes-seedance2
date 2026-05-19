---
phase: 16
slug: seedance-2-0
status: complete
created: 2026-05-19T08:45:00Z
---

# Phase 16 Pattern Map

## Existing Patterns to Reuse

| Need | Existing Pattern | Files |
|------|------------------|-------|
| First-error validation | Throw a concise Chinese `Error` from shared validators; node execution wraps it as `NodeOperationError`. | `nodes/Seedance/shared/validators/create.ts`, `nodes/Seedance/Seedance.node.ts` |
| Binary metadata collection | Read `items[itemIndex].binary?.[prop]?.mimeType`, then `helpers.getBinaryDataBuffer()` for byte data. | `nodes/Seedance/Seedance.node.ts`, `nodes/Seedance/shared/validators/seedreamImage.ts` |
| MIME/size constants | Keep official limits in `shared/constants.ts`, consume from validators. | `nodes/Seedance/shared/constants.ts`, `nodes/Seedance/shared/validators/seedreamImage.ts` |
| Official body fields | Mapper adds snake_case API fields from camelCase node input. | `nodes/Seedance/shared/mappers/createPayload.ts` |
| Description-level UI tests | Import `createOperationProperties` from built `dist` and inspect options/displayOptions. | `test/createPayload.test.ts` |
| Execute-level HTTP body tests | Fake `IExecuteFunctions`, capture `helpers.httpRequest` calls, assert no API call on local validation failure. | `test/seedanceVideoRegression.test.ts` |

## Implementation Boundaries

- Do not place runtime validation logic in `description/create.operation.ts`; description files define UI only.
- Do not make HTTP requests to inspect input media. URL/asset values should pass through when non-empty and within count/combination rules.
- Do not change `requestSummary` to include raw values, MIME types, byte lengths, binary property names, or encoded media.
- Do not add `web_search`, `safety_identifier`, `frames`, `service_tier`, `draft`, or `camera_fixed` UI in Phase 16.

## Likely File Ownership

| Plan | Files |
|------|-------|
| 16-01 | `nodes/Seedance/shared/constants.ts`, `nodes/Seedance/shared/validators/create.ts`, `nodes/Seedance/description/create.operation.ts`, `test/createPayload.test.ts` |
| 16-02 | `nodes/Seedance/Seedance.node.ts`, `test/seedanceVideoRegression.test.ts`, possibly small additions to `test/createPayload.test.ts` if execution wiring reveals a pure-contract gap |

## Test Commands

- Focused pure contract: `npm run build && node --test test/createPayload.test.ts`
- Focused execution regression: `npm run build && node --test test/createPayload.test.ts test/seedanceVideoRegression.test.ts`
- Full suite: `npm run build && node --test test/*.test.ts`

