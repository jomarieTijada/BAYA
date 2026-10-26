# Workspace joining follow-up — 2026-10-25

> Live follow-up completed later on 25 October: the authorized approval migration and anonymous Auth configuration are now applied, and actual pending, rejection, reapplication, and approval flows passed. See [workspace-join-live-report.md](workspace-join-live-report.md) for preservation checks, live evidence, and remaining limits. The blocked status below records the earlier pass.

## Root cause and hosted requirements

Fresh requests to the configured project confirmed two distinct blockers:

- POST /auth/v1/signup: HTTP 422, message `Anonymous sign-ins are disabled`, no account created. The raw response exposed numeric code 422; the earlier SDK diagnostic identified `anonymous_provider_disabled`. The client uses signInAnonymously, which legitimately uses this endpoint without email.
- POST /rest/v1/rpc/request_workspace_join: HTTP 404, `PGRST202`, function public.request_workspace_join(p_code) not found in the schema cache. This establishes that the required API is unavailable; it does not prove every live table's schema.

Path: LearnerWorkspaceScreens → createSupabaseServices.requestJoin → learner(true) → separate learner Auth client → verifyLearnerIdentity → request_workspace_join. No join-disabling application feature flag was found in that path. Public configuration is present and reaches the correct hosted API. The failure occurs before profile binding or code validation; changing the child's code cannot resolve it.

The existing local migration supabase/migrations/202610250005_workspace_join_requests.sql supplies requests, request/status/review RPCs, RLS and atomic membership approval, and closes the legacy instant-join path. Reuse it; do not create another schema. An administrator must compare the target migration history/schema, apply the reviewed migration after its predecessors through the authorized release process, and verify the RPC and grants. Then enable **Allow anonymous sign-ins** in the project's Authentication configuration (official dashboard link: https://supabase.com/dashboard/project/_/auth/settings). Review authenticated-role policies and signup abuse controls first. Do not enable anonymous Auth against the old instant-join implementation. See https://supabase.com/docs/guides/auth/auth-anonymous.

No hosted setting or migration was changed: the task explicitly prohibits automatic deployment. Hosted joining remains blocked until those steps are completed. No privileged credentials were accessed or exposed.

## Local changes

- Initial form contains code input, primary join action and Continue learning, with one short instruction. No initial refresh action or permanent device warning.
- Shared operation hook accepts screen-specific failure text; join network/invalid-code/configuration messages are concise. Errors remain visible and the entered code stays available for retry.
- Pending server requests replace the join form with status and Check Status. Status reads do not create identities. Submitted receipts use existing BayaDialog, and approved notifications require an active server membership. Overlapping success dialogs are suppressed.
- Existing-member receipts now use WORKSPACE JOINED, only after adapter validation of active membership and workspace.
- Optional Keeping your workspace access dialog in learner Settings explains device and recovery limits. No cross-device recovery promise.
- Opt-in dense FeatureScreen/PageHeader spacing limits the layout change to this form. Existing button keyboard-focus styling is retained; no outline suppression was added.

## Security and preservation

Existing server Auth verification, learner role validation, transactionally checked local identity binding and separate per-profile/mentor token namespaces remain unchanged. Local UUIDs are not authorization. The database derives the learner from auth.uid(); only the workspace owner may review requests. Pending/rejected requests grant no membership or sync access. Rejection permits a new audited request under the existing database policy. No schema duplication, automatic approval, fake email, RLS weakening, progress reset, lesson or model change.

Namespace separation prevents accidental session mixing; it is not physical-child verification on an unlocked shared device. The existing local profile selector has no PIN. Mentor confirmation of the server-generated request reference remains necessary; stronger local profile locking is a separate unresolved product requirement.

## Browser evidence and limits

Actual development app at port 8088 showed the simplified initial form and correctly rejected an empty code. Screenshot: verification/join-cleanup/initial-667.png (667×375). This capture precedes the final additional header-spacing reduction. Browser use then became disabled in Work settings. Final spacing, other four required sizes, keyboard focus transitions and final dialogs were not visually reverified. Existing earlier fixture screenshots are not evidence of this final UI or real hosted joining.

Real Request Sent → mentor approval → active membership, rejection and unauthorized-mentor browser scenarios are blocked by the two hosted dependencies. No fabricated success screenshots were produced. The earlier mentor login/creation verification is recorded separately in CODEBASE-CLEANUP-REPORT.md.

## Completion status

| Area | Status | Scope |
|---|---|---|
| Backend joining | Blocked | Local migration exists; hosted Auth and RPC unavailable |
| Identity verification | Partial | Server identity/binding implemented; live join and physical shared-device isolation not verified |
| Mentor approval | Partial | Existing local SQL and UI implemented; hosted workflow blocked |
| Learner UI | Implemented | State-driven form and optional help; final visual checks incomplete |
| Notifications | Implemented | Reused dialogs/toasts; server-confirmed states only |
| Security tests | Implemented | 36 isolated real PostgreSQL/RLS checks passed; hosted concurrency not run |
| Browser verification | Partial | Actual initial form/empty validation only this pass |

No commit, push or deployment performed. All unrelated work retained.

## Final validation

- Relevant Jest: **5 suites, 72 tests passed** (join UI, workspace flows, adapter, learner Auth and Settings). Added initial-control and pending-form regression cases. Initial runs hit filesystem errors and a timeout; rerun after correcting the changed success-copy assertion passed with a 15-second test timeout. Existing asynchronous act/open-handle warnings remain.
- SQL/RLS: **36 passed**, isolated PGlite with real migrations and role checks, not hosted GoTrue or simultaneous independent connections.
- TypeScript: npx tsc --noEmit passed.
- Lint: zero errors, one existing conditional debug-import warning.
- Production export: passed, 163 service-worker assets.
- Logs: sandbox/join-final-tests.log, join-refresh-rls.log, join-final-types.log, join-final-lint.log, join-final-export.log.
- Final browser viewport reset could not be performed after access was disabled; the last testing override was 667×375.
