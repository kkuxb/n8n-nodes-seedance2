# Roadmap: n8n-nodes-seedance2

## Milestones

- ✅ **v1.0 milestone** — Phases 1-3 (shipped 2026-04-17)
- 🚧 **v1.1 milestone** — Phases 04-06

## Phases

<details>
<summary>✅ v1.0 milestone (Phases 1-3) — SHIPPED 2026-04-17</summary>

- [x] Phase 1: 凭证接入与文生查询闭环 (4/4 plans) — completed 2026-04-16
- [x] Phase 2: 图生创建模式与参数护栏 (3/3 plans) — completed 2026-04-17
- [x] Phase 3: 任务检索与生命周期控制 (3/3 plans) — completed 2026-04-17

</details>

- [x] **Phase 04: Bug Fixes & List Optimization** - Fix query/delete bugs and optimize list output (completed 2026-04-18)
- [x] **Phase 05: Smart Polling Orchestration** - Implement UI and logic to wait for task completion (completed 2026-04-18)
- [ ] **Phase 06: Auto-Downloading & Error Handling** - Implement UI and logic to download finished videos to binary format

## Phase Details

### Phase 04: Bug Fixes & List Optimization

**Goal**: Existing query, list, and delete operations function correctly and output optimized structures
**Depends on**: Phase 3
**Requirements**: BUG-01, BUG-02, OPT-01
**Success Criteria** (what must be TRUE):

1. User querying a specific task ID receives exactly one item, not the full list.
2. User deleting/canceling a task by ID succeeds without invalid action errors.
3. User retrieving task lists receives a single n8n Item with an array of tasks.
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md — Fix get/list/delete response shaping, delete error semantics, and user-facing list contract docs

### Phase 05: Smart Polling Orchestration

**Goal**: Users can opt to wait for a task to complete directly within the Get Task operation
**Depends on**: Phase 04
**Requirements**: POLL-01, POLL-02, POLL-03
**Success Criteria** (what must be TRUE):

1. User can toggle "Wait For Completion" and set polling settings in the Get Task UI.
2. Node execution waits and correctly outputs the finalized task state instead of the immediate state.
3. Node execution finishes successfully without hanging indefinitely if the timeout duration is reached.
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Build the bounded polling helper, additive wait metadata contract, and regression tests for terminal, timeout, and unknown-status exits
- [x] 05-02-PLAN.md — Add Get Task wait-mode UI fields and wire the execute branch for default-on bounded waiting without breaking immediate get behavior
**UI hint**: yes

### Phase 06: Auto-Downloading & Error Handling

**Goal**: Users can automatically download finished videos into n8n binary format
**Depends on**: Phase 05
**Requirements**: DL-01, DL-02, DL-03
**Success Criteria** (what must be TRUE):

1. User can toggle "Download Video" when "Wait For Completion" is enabled.
2. Node execution returns a binary item containing the video file when the task succeeds.
3. Node execution fails with a clear expiration message if the video is older than 24 hours.
   **Plans**: TBD
   **UI hint**: yes

## Progress

| Phase                                 | Milestone | Plans Complete | Status      | Completed  |
| ------------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1. 凭证接入与文生查询闭环                        | v1.0      | 4/4            | Complete    | 2026-04-16 |
| 2. 图生创建模式与参数护栏                        | v1.0      | 3/3            | Complete    | 2026-04-17 |
| 3. 任务检索与生命周期控制                        | v1.0      | 3/3            | Complete    | 2026-04-17 |
| 04. Bug Fixes & List Optimization     | v1.1      | 1/1 | Complete    | 2026-04-18 |
| 05. Smart Polling Orchestration       | v1.1      | 2/2 | Complete    | 2026-04-18 |
| 06. Auto-Downloading & Error Handling | v1.1      | 0/0            | Not started | -          |
