# Compliance #9 — Mentor Results Summary Table

## Recommendation

“Add a summary in results using table.” — Panel Chair, Mentor Workspace.

## Pre-implementation audit (2026-11-08)

This section was written before implementation.

1. There is no separate Results tab. `MentorDashboard` is the existing results surface at `/mentor/workspaces/[id]`, protected by `MentorBoundary`.
2. It displays workspace name/code, active learner count, last synchronization, and learner progress cards with detail navigation.
3. Results are individual `LearnerProgressRow` cards, with current topic, numeric percentage, sync freshness and View action. Pagination is 50 learners.
4. Supabase stores curriculum/version/activities, completed `activity_attempts`, module-level `learner_progress`, profiles and active workspace memberships with `last_synced_at`.
5. Raw handwriting strokes, recognized predictions, validated writing attempts/mastery state and unfinished activity checkpoints remain local. They are not part of the mentor progress snapshot.
6. `readProgressSnapshot` uploads only approved stable topic IDs, earliest completion timestamps and learner display name/version through `sync_learning_progress`, under the learner's matching authenticated identity.
7. Completion is an explicit `result_status='completed'` activity record. The local snapshot groups by activity ID; cloud unique index `completed_topic_once` and UPSERT avoid double counting. Visits and resume checkpoints are not completions.
8. Handwriting uses the unchanged Top-1 matching-class ≥80% rule and two accepted independent attempts. Individual mastery/recognition confidence is not synchronized by this pipeline, so a mastery/grade column would be invented.
9. `workspace_memberships` links cloud learner profiles to workspaces, unique on learner/workspace. The dashboard RPC selects active memberships of the selected active workspace.
10. Existing join-request approval creates/activates membership. Pending requests are separate records; they are not selected by the progress RPC. Existing legacy memberships retain their established meaning.
11. `baya_private.progress_summary` already computes completed/total topic counts, percentage, current topic and sync time. `createProgressServices` validates the response. No duplicate progress formula is needed in UI.
12. Accurate columns are learner/current topic, completed eligible topics (C/N), topic completion percentage, last synchronized time, and existing detail action. Neither current unsynced work, last actual activity nor per-character handwriting mastery is exposed by the dashboard contract.

## Data and authorization sources

- `apps/mobile/modules/progress/contracts.ts`, `supabaseProgress.ts`, `localProgressSnapshot.ts`, `presentation.ts`.
- `supabase/migrations/202610210001_baya_cloud.sql`, `202610210002_learning_progress.sql`, and existing approval migrations.
- `get_progress_dashboard(workspace, offset)` authorizes with `owns_workspace`, requires active workspace, returns only active members, and bounds pages to 50. Ordering is `joined_at,membership_id`; retain this deterministic order instead of misleading page-local sorting.
- `get_learner_progress(workspace, profile)` separately reauthorizes the workspace and active membership. Workspace code/ID is not authorization. No all-learners query is used.
- Version is `version-baya-modules-1-to-3-v1`: nine topic activities across three modules. These are topics, not nine modules/lessons; table labels must preserve this distinction. Adventure/quiz placeholders are excluded.
- SQL percentage is rounded C/N×100, null when no sync or denominator unavailable. For the current nine topics, only 9/9 rounds to 100. Empty synchronized snapshot establishes cloud-recorded zero; it does not establish zero unsynced device work.
- `lastSyncedAt=null` is lack of a membership sync receipt, not proof of zero or a queued upload. UI must say no synchronized results, not infer pending sync.
- No schema/synchronization change is required. Existing SQL/RLS and progress writes must remain unchanged.

## Gaps identified

Cards are difficult to compare; no summary table. Dashboard refresh currently preserves old data even on authorization failure. `useCloudRead` ignores stale promises but can briefly render prior result on a changed read callback; dashboard offset should reset with workspace. Mentor boundary rechecks on focus but does not react to Supabase sign-out/expiry events while focused. These are narrow presentation invalidation issues, not reasons to replace authentication.

## Planned implementation

Use the existing dashboard RPC and detail route; replace repeated cards with a localized accessible table. Preserve pagination/order and manual refresh, add explicit stale/error/missing states, validate scoped/unique/consistent response data, invalidate protected presentation on authorization/session changes. Keep all learning, recognition, mastery, reward and synchronization rules intact.

## Verification

The sections below record implementation and final validation. Controlled browser fixtures are labeled; no live mentor credentials or real learner access are assumed. No commit, push or deployment.

## Implemented table and calculations

The table replaces the repeated progress cards inside the existing Mentor Dashboard. It does not add another Results route, new database, table dependency, aggregation request or sync protocol. Current-topic context and the existing per-learner detail route are retained in each row. Workspace header, options, pagination and refresh remain.

| Column | Source and meaning | Missing/edge behavior |
|---|---|---|
| Learner | Authorized `displayName`, with existing `currentTopic` underneath | Names remain verbatim; long names wrap rather than being truncated |
| Topics completed | `completedTopics / totalTopics`, representing distinct eligible completed topic activities, not modules | Display unavailable without a sync receipt/percentage or when denominator is zero |
| Progress | Existing RPC `percentage`; SQL rounds completed eligible topic count divided by total eligible topic count | Null stays unavailable; confirmed synced 0/9 shows 0%; no client substitute for missing percentage |
| Last synchronized | Membership `lastSyncedAt`, using existing localized freshness formatter | Missing receipt says no synchronized results; no inference of pending upload or last actual learning activity |
| Details | Existing `/mentor/learner-progress?workspaceId=…&profileId=…` | The detail service independently authorizes workspace and membership |

For the current nine eligible topic activities, 4/9 is 44%, 6/9 is 67%, and 9/9 is 100%. Response validation verifies the existing rounded formula rather than recalculating a new display value. It rejects inconsistent/out-of-range counts, duplicate learner rows, another workspace's response, more than 50 rows, and misleading rounded 100% for incomplete requirements. Zero eligible topics with null percentage is accepted as unavailable. An invalid response is an error, never confirmed zero.

Duplicate completion handling remains in the existing local grouped snapshot and server unique completion index/UPSERT. Curriculum eligibility remains the existing version-bound RPC contract; this task does not silently reinterpret retired/future content using a second client curriculum list. An application supporting a new curriculum version will need the existing coordinated server/sync update. No handwriting, confidence, grade or reward metric has been invented.

Default row order remains the deterministic server membership order (`joined_at`, then membership ID). No page-local sort is presented as a whole-class sort. Existing previous/next pagination remains bounded to 50 learners and resets when the selected workspace changes. No N+1 requests, new polling or persistent private-data cache.

## Presentation and accessibility

- The localized heading and supporting copy identify approved-member synchronized progress. Freshness caveat and ordering note appear below the table.
- A shared React Native/Web component uses explicit table, row, columnheader, rowheader and cell roles. Each numeric/missing value also carries its column meaning in accessible text.
- Horizontal scrolling is confined to the table on smaller widths, with a translated hint and a keyboard-focusable scroll region. Font sizes remain 15–17 px for table content; user names wrap. Text and numeric percentages communicate outcomes without depending on color.
- Detail actions retain clear learner-specific labels and minimum 44-pixel height. Language changes preserve stable IDs, row order and values; they do not refetch or write learning data.
- Loading and initial failure continue through the shared live-region Notice component. Empty state now explicitly says no approved learners. A transient failed refresh has a visible stale-snapshot alert in addition to the existing toast. Retry remains available on initial/access failures.
- Browser accessibility-tree checks confirm one table and five column headers. Keyboard horizontal scrolling is exercised. This is DOM/AX evidence, not a claim of testing every screen reader or native assistive technology.

## Authorization and stale-result corrections

The established server security boundary is unchanged: the authenticated mentor RPC checks workspace ownership, active workspace and active membership; RLS/direct-table restrictions remain. Pending join requests never become normal result rows. Workspace codes remain joining information, not result-access credentials.

`useCloudRead` now tags results with their read callback owner and suppresses snapshots belonging to another source immediately. Its existing request cleanup rejects late/unmounted responses. Only network/offline failures may preserve an explicitly stale successful snapshot. Authorization, inactive workspace and other failures discard old result presentation. The dashboard remounts its local pagination/refresh state by workspace ID.

Known access denial is classified before offline detection, including HTTP 401/403 and revoked-session codes. This prevents a response arriving during a connectivity transition from being mistakenly retained as an offline snapshot.

`CloudProvider` listens to the existing Supabase mentor client's signed-in/signed-out/user-updated events and publishes an in-memory revision. `MentorBoundary` hides children immediately when that revision changes and revalidates through the established auth service. No replacement authentication tokens, custom login implementation or RLS changes were introduced. Focus revalidation and cleanup remain. Workspace authorization changes are detected by the next authorized request/focus/refresh; continuous revocation polling is not added.

## Files changed for Compliance #9

Paths are repository-relative. Earlier Compliance #1/#2/#3/#6/#7 edits were already present in the worktree; the total Git diff is not solely this task.

| Path | Responsibility |
|---|---|
| `apps/mobile/components/progress/ResultsSummaryTable.tsx` | New accessible, localized summary table |
| `apps/mobile/components/progress/MentorDashboard.tsx` | Table placement, accurate empty state, stale refresh notice, workspace-keyed state |
| `apps/mobile/modules/progress/useCloudRead.ts` | Source ownership, stale request guards and access-failure invalidation |
| `apps/mobile/modules/progress/supabaseProgress.ts` | Scoped, unique, bounded and consistent response validation |
| `apps/mobile/modules/cloud/mentorSessionRevision.ts` | Ephemeral presentation-invalidation context |
| `apps/mobile/modules/cloud/CloudProvider.tsx` | Subscribe to existing mentor Supabase auth events |
| `apps/mobile/components/mentor/WorkspaceScreens.tsx` | Session-revision guard before protected children render |
| `apps/mobile/modules/cloud/supabaseAdapter.ts` | Keep known access denial distinct from offline failures |
| `apps/mobile/localization/en.ts`, `apps/mobile/localization/tl.ts` | Table headings, values, missing/error copy and actions |
| `apps/mobile/components/progress/__tests__/ResultsSummaryTable.test.tsx` | Counts, missing/zero, localization, stale workspace responses, denied refresh and session invalidation |
| `apps/mobile/components/progress/__tests__/progress.test.tsx` | Existing dashboard regression expectations for approved-member empty state |
| `apps/mobile/modules/progress/__tests__/supabaseProgress.test.ts` | Aggregate consistency, zero denominator, duplicates and workspace scope |
| `apps/mobile/modules/cloud/__tests__/supabaseAdapter.test.ts` | Known authorization denial during offline transitions |
| `scripts/test-workspace-approval.mjs` | Isolated SQL assertions for results visibility before/after approval and sync |
| `scripts/testing/compliance-09-fixtures.mjs` | Explicit CDP-only test services; never imported by production app |
| `scripts/testing/compliance-09-browser.mjs` | Production browser scenario/layout/AX evidence |
| `docs/COMPLIANCE-09-MENTOR-RESULTS-TABLE.md`, `docs/verification/compliance-09/` | Audit, calculation definitions, checks, logs and screenshots |

No schema migration or learning/synchronization data-write changes were made. No commit, push or deployment.

## Visual and browser evidence

Table and scenario screenshots under `docs/verification/compliance-09/` use **controlled fixture data**, not actual student records. `unauthenticated-real.png` separately shows the unmodified production auth guard without any injected service fixture. The harness injects the existing service hook via CDP in an isolated Chrome profile and blocks Supabase hosts during fixture checks. No fixture values or fallback are shipped in production. The exported bundle was searched for the distinctive fixture names and workspace strings, with no matches.

- `before-cards-fixture.png`: pre-implementation progress cards with the same explicit test records.
- `table-en-1366x768.png`, `table-tl-1366x768.png`: full table and existing dashboard integration.
- `table-<en|tl>-<667x375|844x390|915x412|1024x768|1366x768>.png`: both languages at every required size.
- `table-<en|tl>-667x375-details.png`: right-hand columns remain reachable by table scrolling.
- `empty-fixture.png`, `loading-fixture.png`, `error-fixture.png`, `unauthorized-fixture.png`: no invented learner rows in non-data states.
- `workspace-b-fixture.png`: only workspace B's controlled learner is shown after actual Switch Workspace navigation.
- `browser.json`: structured assertions, query counts, table/column-header AX roles, keyboard scrolling, missing-versus-zero, retry, denied refresh, workspace switch and preserved detail parameters.
- `unauthenticated-real.png`, `unauthenticated-browser.json`: actual production guard denies access without a mentor session; no service fixtures injected.
- `preservation-checks.json`: 10/10 recognition/model hashes match the Compliance #7 baseline, including the active ONNX file, manifest, runtime, preprocessing, probability and mastery rules.

Browser fixtures demonstrate UI behavior and request/context handling. The separate PGlite tests execute repository SQL in isolated PostgreSQL/WASM with simulated auth roles. Neither constitutes hosted Supabase end-to-end authorization verification with a real mentor account.

## Remaining limitations

- Mentors see cloud-synchronized topic completion, not live unsynchronized learner-device state. No local SQLite access is added to mentor results.
- No synchronized per-character mastery, raw writing attempts, recognition confidence or reliable last-learning-activity field exists in this RPC. Those columns are deliberately omitted.
- Current server version has nine eligible topics across three modules. No new future-version/retirement protocol is implemented.
- Date display uses existing localized freshness/date formatting; last sync is not last learning activity.
- Membership order and 50-row pagination are preserved. Whole-class sorting/search is not introduced.
- The table makes the service contract inspectable; it does not independently prove the authenticity of historical completion uploads or change existing completion-validation policy.
- Live hosted mentor authentication, RLS configuration and token-expiry behavior were not exercised with credentials. Known session changes and failed authorization are covered by component/service/SQL tests and controlled browser scenarios.
- Native Android/iOS accessibility and spoken screen-reader output remain unverified. Web keyboard and accessibility-tree behavior were checked.
- Existing Expo SQLite export-resolution and Node color notices may appear in successful build logs. Jest's existing force-exit invocation reports its standard open-handle advisory.

## Automated verification and coverage

**Final full Jest rerun after all implementation changes: 74 suites, 719 tests passed in 134.714 seconds.** TypeScript, fresh lint and production export returned exit 0. Production cache identifier: `baya-pwa-0236c76de3048826` (163 precached assets).

| Check | Evidence |
|---|---|
| Focused original integration regression | 3 suites / 47 tests passed (dashboard, mentor flows, progress adapter) |
| New table cases | 5 tests passed: semantics and values, localization without fetch, workspace race, stale/denied refresh, session revision |
| SQL progress | 30 PostgreSQL/WASM assertions passed: curriculum mapping, duplicate-safe completion upload, percentages, pagination, access rejection |
| SQL current approval flow | 41 database/security checks passed: pending exclusion, approved membership, newly approved missing results, confirmed synced zero, unrelated/signed-out denial and existing approval workflow |
| Browser | Ten table layouts plus small-screen right-column views; one table/five AX column headers in each language; keyboard horizontal scroll; bounded request count; empty/loading/error/retry; denied refresh; actual workspace switch and scoped detail route |
| Actual unauthenticated entry | Unmodified production mentor boundary displays login requirement and no results table |
| Preservation | All ten tracked recognition/model files match prior hashes; no completion/sync-write/schema changes |

| Brief test areas | Coverage and limits |
|---|---|
| 1–10 aggregation | Existing SQL summary/sync and local snapshot tests plus new adapter validation; no new mastery calculation. Incorrect confidence is not a summary input and existing mastery regression tests still run. |
| 11–20 table | New component tests and controlled production browser checks. Last sync is intentionally used instead of unsupported last activity. No optional sorting implemented; server order preserved. |
| 21–25 authorization/races | SQL ownership/RLS tests, new source/session invalidation tests, denied-refresh and workspace-switch browser checks; live hosted authorization remains unverified. |
| 26–30 localization/accessibility | English/Tagalog browser layouts and AX checks; component language switch does not refetch or change results; native spoken output unverified. |
| 31–40 regressions | Full final suite includes mentor creation, join approval, progress sync, writing/Top-1/mastery, resume and detail tests. |

## Compliance matrix remark

Implemented a localized results summary table within the existing Mentor Dashboard, showing approved members' synchronized topic counts, authoritative percentages and sync freshness while preserving detail navigation. Missing results remain distinct from confirmed zero. Workspace-scoped RPC/RLS contracts and all learning/mastery/synchronization rules are preserved; stale results are cleared on known access/session changes. All 719 tests, TypeScript, fresh lint and production export pass. Responsive production-browser fixtures and isolated SQL authorization tests pass. Live hosted mentor authorization and native assistive technologies remain unverified.
