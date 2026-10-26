# BAYA workspace approval implementation — 25 October 2026

> Later authorized live verification: the migration and anonymous sign-in setting are now applied; the real local application completed pending request, rejection, reapplication, and mentor approval against hosted Supabase. See [workspace-join-live-report.md](workspace-join-live-report.md). Earlier deployment-blocked statements below describe the original implementation pass. The frontend remains undeployed.

## Status

Implemented in the local repository, with PostgreSQL authorization tests, application tests, and responsive browser verification. **Not deployed. The reported hosted 422 remains until anonymous Auth is enabled in an authorized deployment.** The complete hosted Auth-to-membership integration test and true multi-connection concurrency test have not been run.

## A. Verified root cause

A diagnostic anonymous signup against the configured project returned this sanitized response:

```json
{"status":422,"code":"anonymous_provider_disabled","message":"Anonymous sign-ins are disabled","created":false}
```

The learner handler was already calling `signInAnonymously()`, not the mentor email/password `signUp()` method. Supabase's anonymous sign-in operation uses `/auth/v1/signup`; that endpoint alone does not imply that an email or password was supplied. No diagnostic account was created because the provider rejected the request.

Responsible path: `LearnerWorkspaceScreens.tsx` → `createSupabaseServices()` in `modules/cloud/supabaseAdapter.ts` → its `learner(true)` identity resolver → Supabase anonymous Auth. Previously `cloudFailure()` mapped the configuration failure to the generic “services are not available yet” message. It now returns a specific, child-safe administrator-configuration message.

The separate functional defect was `public.join_workspace(text)` immediately inserting an active membership. Migration `202610250005_workspace_join_requests.sql` replaces that behavior. The legacy function can now only return an existing approved membership; a new instant join is denied.

The application cannot fix a disabled hosted provider through its publishable key. The exact hosted fix is to enable anonymous sign-in **after** the new authorization migration has been audited and applied. Do not enable anonymous Auth against the old instant-join database behavior.

## B. Authentication and profile association

- Kept the existing email-free anonymous authentication architecture and the optional, separate learner account flow. Joining asks only for the workspace code.
- Each local learner has a separate Supabase client/storage namespace. Mentor Auth uses a different namespace and never supplies learner authorization.
- Reuse the saved session; create an anonymous identity only when joining with an unbound local profile. Reading status does not create accounts.
- `verifyLearnerIdentity()` verifies the user through server Auth, checks the server-owned learner role, checks the existing local binding, and then binds through the local database transaction. The transaction checks that the selected local profile has not changed.
- The server creates the cloud profile, with a unique `auth_user_id`. All new request operations derive the learner from `auth.uid()`; neither local UUID nor caller-selected cloud profile ID is accepted as authorization.
- If a previously bound profile loses its session, both status reads and submissions report that identity recovery is needed. They do not silently replace the identity or report an empty membership list.
- Web sessions use existing browser storage; native sessions use existing SecureStore storage. Ordinary navigation does not sign learners out. Losing anonymous credentials does not provide automatic cross-device recovery. The join screen now explains this device/browser limitation. See [Supabase anonymous authentication documentation](https://supabase.com/docs/guides/auth/auth-anonymous).

**Shared-device boundary:** separate token namespaces prevent accidental session mixing and remote UUID impersonation. They are not a physical-child identity check or a local profile lock. Someone who controls the same unlocked browser/device can access its stored sessions. The existing local profile selector does not require a PIN or caregiver unlock. Strong isolation between people using the same unlocked device remains a product/security dependency; this implementation does not claim to solve that or silently add a child password requirement. Mentor review should compare the server-generated request reference with the intended learner's screen, not trust a display name alone.

## C. Database implementation

New versioned migration: `supabase/migrations/202610250005_workspace_join_requests.sql`.

`workspace_join_requests` stores `request_id`, `workspace_id`, `learner_profile_id`, `status`, `requested_at`, `reviewed_at`, and `reviewed_by`. Foreign keys reference the actual workspace, profile, and mentor tables. The verified mentor relationship in the local migrations is `mentor_profiles.profile_id → profiles.profile_id`, not the ambiguous ERD learner field.

Constraints enforce valid lifecycle statuses, complete review metadata, chronological review timestamps, and one pending request per learner/workspace using a partial unique index. Existing membership uniqueness remains `(learner_profile_id, workspace_id)`. Existing accounts, workspaces, and memberships are preserved; this was tested against a membership created before applying the new migration.

Backend operations:

| Operation | Authorization and behavior |
|---|---|
| `request_workspace_join(p_code)` | Auth-derived learner only; trims/uppercases actual `BAYA-` plus 12 hexadecimal digits; active workspace validation; serialized identity submissions; returns request_submitted, already_pending, or already_member. |
| `list_my_join_requests()` | Auth-derived learner's own history only. |
| `list_workspace_join_requests(p_workspace_id)` | Verified owning mentor only; pending requests and minimal learner context. |
| `review_workspace_join_request(p_request_id,p_decision)` | Verified owner; approved/rejected only; locks workspace and request; membership activation and review metadata commit together. |
| `list_owned_workspaces()` / `get_workspace_details()` | Include independent pending and active counts for the authorized workspace. |
| Legacy `join_workspace(p_code)` | New instant membership is blocked; existing membership remains readable. |

Approval retries return the same processed request/membership. Conflicting decisions are rejected. Failed membership creation rolls back the request update. Archived workspaces cannot accept requests or approvals. Rejected learners may reapply; a new request preserves prior history. Reapproving an old request does not silently restore a membership later removed by the mentor.

## D. Authorization

RLS is enabled on the new table. Authenticated clients receive SELECT only, scoped to the requesting learner or workspace owner. No direct request insert/update/delete grants exist. Existing membership write restrictions remain in force. The public `authenticated` role is never taken as proof of mentor status.

Security-definer functions use an empty search path, qualified references, explicit ownership checks, and restricted execution grants. Private JSON formatting has no client execution grant. The existing server-side progress-sync function still requires an active membership in an active workspace; pending and rejected requests confer no sync or mentor-progress access.

Backend tests directly verify denied self-approval, arbitrary profile insertion, direct membership insertion, role escalation, cross-mentor review/listing, unrelated profile reads, and pending sync. Tests also exercise the legacy join path to confirm it cannot bypass approval.

## E. Learner interface

- Preserved the cream/white/orange Join Workspace form, Back action, typography, and code-only input.
- Normalized code validation, synchronous duplicate-submit guard, loading state, retained code after failure, and retry.
- Separate information dialog: **JOIN REQUEST SENT!** / **WAITING FOR APPROVAL**. It never presents pending as joined or starts sync.
- `JoinRequestStatus` displays the latest authoritative lifecycle per workspace, with pending, rejected, active, inactive, loading, and unavailable states. Full history stays in the database.
- Status refreshes on screen focus, app resume, and manual refresh. No polling loop. Reconnection can be followed by the manual refresh action.
- **WORKSPACE JOINED!** appears only after an approved request and matching active membership in an active workspace are both confirmed. An in-memory presentation acknowledgement avoids repeated dialogs during the same app session; it is not an authorization cache.
- Reused in Join Workspace, My Workspaces, and Workspace & Sync. Approval also refreshes the settings membership data. Progress sync remains an explicit existing action after membership is authorized.
- Local lessons/progress persistence is unchanged. No SQLite reset, progress deletion, ONNX, or curriculum changes were made for this task.

## F. Mentor interface

The selected workspace management screen includes **PENDING JOIN REQUESTS**, the authorized pending count, request date, display name, server-generated reference, and Approve/Reject controls. Full request management is outside the floating settings menu.

Each card has its own operation lock and error/loading state, so other requests remain usable. Confirmed decisions refresh the pending list, member list, and workspace details and use the existing toast system. Failed operations retain the card and permit retry. Loading and failed queries never masquerade as an empty list. Active member counts exclude removed memberships; removed members retain their existing access-management controls.

Workspace cards show backend-provided pending counts alongside existing learner counts, code sharing, Enter, and Manage controls. Counts refresh on focus/navigation and after review.

## G. Reuse and separation

Reused `FeatureScreen`, `PageHeader`, `BaseCard`, `AppTextInput`, `AppButton`, `TextAction`, `Notice`, `BayaDialog`, `BayaNotifications`, `useCloudRead`, `useOperation`, theme tokens, Auth clients, and local identity binding.

New focused modules: `joinRequests.ts` (receipt validation), `JoinRequestStatus.tsx` (learner status presentation), and `PendingJoinRequests.tsx` (mentor review UI). UI calls typed services; the adapter handles Supabase protocol/parsing; SQL enforces authorization and atomicity. No UI component executes privileged database writes directly.

The shared dialog's modal accessibility marker now covers the complete card rather than only its title, making message/actions accessible. The programmatically focused title avoids an unnecessary web outline; interactive buttons retain focus indicators.

## H. Verification

| Check | Result and limits |
|---|---|
| Hosted Auth diagnostic | Verified actual 422 anonymous_provider_disabled; no user created. |
| PostgreSQL migration/security tests | **36 passed** using existing PGlite dependency, real SQL migrations, database roles, grants, RLS, functions, and constraints. Auth users/claims are isolated test fixtures, not live GoTrue. |
| Application/service/UI suites | **79 passed across 7 suites**, covering Auth, request receipts, mentor decisions, pending/approved distinction, offline retry, multiple cards, dialogs, settings, and dashboard regressions. |
| SQLite + learner home regressions | **36 passed across 2 suites**. |
| TypeScript | `npx tsc --noEmit` passed. |
| Lint | Targeted changed TypeScript/TSX files passed. |
| Production web export | `npm run export:web` passed, including PWA service-worker generation. |
| Browser | Verified actual components in explicitly labelled development fixtures at 667×375, 844×390, 915×412, 1024×768, 1366×768. Form inputs/buttons fit; approval actions are reachable; dialogs fit; no observed horizontal overflow. |
| Real hosted end-to-end | **Not run / blocked** by disabled anonymous Auth, unapplied new migration, and no separately provisioned isolated test project/mentor credentials. Visual fixtures are not claimed as live integration. |
| Concurrent independent DB sessions | **Not run.** PGlite serializes operations. Locking, uniqueness, retries, and rollback pass; true simultaneous HTTP approvals need the isolated integration runner. |
| Physical devices/screen readers | Not exercised. Native behavior has component-test coverage only. |

Reproduction:

```powershell
# Repository root: real SQL/RLS tests in isolated PostgreSQL/WASM
node scripts/test-workspace-approval.mjs

# apps/mobile: application checks
npx tsc --noEmit
npx jest --runInBand --forceExit modules/cloud/__tests__/supabaseAdapter.test.ts modules/cloud/__tests__/learnerEmailAuth.test.ts components/mentor/__tests__/joinApproval.test.tsx components/mentor/__tests__/flows.test.tsx components/learner/settings/__tests__/SettingsScreen.test.tsx components/ui/__tests__/BayaNotifications.test.tsx components/progress/__tests__/progress.test.tsx
npx jest --runInBand --forceExit database/__tests__/database.test.ts components/learner/home/__tests__/LearnerHomeScreen.test.tsx
npm run export:web
```

`scripts/test-workspace-approval-integration.mjs` is an additional syntax-checked, **not executed** real-Supabase runner. It logs into two existing confirmed test mentor accounts, creates email-free test learners, checks unauthorized operations, submits concurrent approval HTTP requests, verifies memberships/sync, and rejects a second learner. It deliberately blocks the current hosted BAYA project and requires `BAYA_TEST_ALLOW_ISOLATED=YES`, a separate `BAYA_TEST_URL`, `BAYA_TEST_PUBLISHABLE_KEY`, and `BAYA_TEST_MENTOR_A_EMAIL/PASSWORD` and `BAYA_TEST_MENTOR_B_EMAIL/PASSWORD`. Provision these privately through a local environment, never public frontend variables. It retains isolated test records for inspection and does not auto-delete them. This API integration runner does not substitute for the requested real browser workflow with an existing local SQLite profile.

## I. Screenshots

These are **development fixture screenshots**, not proof of hosted joining:

- [Join form, 667px](verification/workspace-approval/join-667.jpg)
- [Request sent](verification/workspace-approval/request-sent-667.jpg)
- [Pending approval](verification/workspace-approval/pending-desktop.jpg)
- [Approved membership dialog](verification/workspace-approval/approved-1366.jpg)
- [Rejected request](verification/workspace-approval/rejected-desktop.jpg)
- [Learner offline state](verification/workspace-approval/offline-desktop.jpg)
- [Workspace pending count](verification/workspace-approval/workspace-count-1366.jpg)
- [Mentor review controls](verification/workspace-approval/mentor-1366.jpg)
- [Mentor approved member / empty pending list](verification/workspace-approval/mentor-approved.jpg)
- [Mentor error and retry](verification/workspace-approval/mentor-error.jpg)
- [Measured viewport results](verification/workspace-approval/viewport-checks.json)

Additional screenshots for all five dimensions are in `docs/verification/workspace-approval/`.

## J. Deployment requirements

1. Inspect the target project's actual schema, existing policies, Auth trigger, and migration history against the four existing local migrations. **Live schema equivalence has not been verified**; no schema discrepancy has been asserted without access.
2. Apply only the new migration to an isolated development project with the expected preceding schema. Do not replay the initial fresh-project migration on existing production data. Back up and review production separately; no reset is needed.
3. Verify SQL/RLS behavior there, including closure of the legacy instant-join path, before enabling anonymous sign-in. Review project-wide policies because anonymous users have the authenticated database role. Configure appropriate anonymous signup abuse controls for that environment.
4. Enable anonymous Auth in that authorized test environment. No SMTP/email flow is needed for learners joining by code.
5. Run the real integration runner with two existing test mentor accounts, then the requested browser workflow using an existing local learner profile. Verify preserved local progress, focus/resume refresh, real approval and rejection, and concurrent/retried requests.
6. Deploy application and database changes only through the separately authorized release process. Check old-client behavior, service-worker updates, and final hosted signup response.

No hosted configuration change, migration application, commit, push, or deployment was performed.

## K. Remaining limitations

The local implementation and listed tests are complete, but the full task is **not fully verified end to end**. Hosted Auth configuration, migration deployment, actual live-schema comparison, multi-session concurrency, and the real browser integration scenario remain outstanding. Docker was available as a CLI but its local engine did not start successfully, so local full Supabase/GoTrue verification was unavailable; PostgreSQL/WASM was used for database security testing.

Shared-device physical-user isolation requires a profile-unlock/caregiver security design beyond namespace separation. Anonymous credential loss does not recover ownership automatically. There is no new cross-device recovery promise or offline approval. Request audit history is preserved; this change does not invent a retention/deletion policy. Request lists currently load the authorized history/list at once rather than paginating; normal multi-request scrolling is covered, but very large histories need a bounded/paginated follow-up.
