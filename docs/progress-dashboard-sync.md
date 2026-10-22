# Learning progress dashboard and synchronization

Implemented for the supplied Settings (independent/connected) and Mentor Dashboard wireframes. Settings uses the wide white card, workspace status, inset detail panel and bottom orange action. The mentor dashboard uses the workspace summary, copyable code, learner count, avatar rows, completion bars, sync dates and working View actions. Small screens wrap and scroll; unknown, loading and failure states never masquerade as an empty class or a completed sync.

## Real data flow

1. Joining a workspace creates the authenticated membership, then attempts an initial progress sync. A failed sync does not undo the join. The learner can retry from Workspace & Sync in Settings.
2. Settings loads actual active memberships. With multiple memberships, the learner can select which workspace details to inspect. Sync shares the same learner snapshot with all active joined workspaces.
3. A read-only SQLite query captures the current local learner and that learner's completed approved topics. The current approved curriculum is **3 modules / 9 topics**. The wireframe's ten stages and illustrative percentages are not used as production curriculum data.
4. The adapter resolves that learner's separate Supabase session. It sends the curriculum version, display name, topic keys and completion dates. The local profile UUID never serves as cloud ownership authorization.
5. `sync_learning_progress` resolves `auth.uid()`, checks active memberships, validates the curriculum and a maximum of nine completion records, locks the learner, and atomically merges completion records. Replays cannot create duplicates or remove previous completion. Future device times are capped at server receipt time.
6. The database derives module completion from topic completion and records the server receipt in active memberships. Only a successful response allows the app to report synchronization. Failure leaves SQLite untouched. Repeating a cumulative snapshot is the retry mechanism; no destructive outbox acknowledgement is needed for nine bounded topics.
7. Workspace entry opens the mentor dashboard. Percentages are completed topics divided by nine, rounded to an integer. The next topic/module comes from the approved order. No synchronized snapshot is shown as “Not synchronized yet,” with no invented percentage. “View” opens the same learner's nine topic statuses and completion dates.

This synchronizes **topic completion**, not handwriting images, raw strokes, confidence histories or review-item histories. It does not change lesson unlocking, recognition, or local completion rules. Offline completions remain local until joining/manual sync; no background synchronization or cross-device learner recovery is claimed.

## Responsibilities

| Module | Responsibility |
| --- | --- |
| `modules/progress/contracts.ts` | Service and presentation data contracts |
| `localProgressSnapshot.ts` | Read-only extraction of one learner's approved SQLite completion |
| `supabaseProgress.ts` | Authenticated RPC transport, bounded upload, per-learner submission deduplication, safe failures |
| `useCloudRead.ts` | Focus refresh, loading state and invalidation of stale read results |
| `presentation.ts` | Shared sync-date formatting |
| `components/progress/ProgressPage.tsx` | Reusable safe-area, heading and scrolling layout |
| `WorkspaceCode.tsx`, `LearnerProgressRow.tsx` | Reusable code action and learner row |
| `MentorDashboard.tsx`, `LearnerProgressDetail.tsx` | Mentor read views and navigation |
| `settings/SettingsScreen.tsx` | Membership loading and sync orchestration |
| `settings/WorkspaceSyncCard.tsx` | Wireframe presentation with injected state/actions |
| Migration `202610210002_learning_progress.sql` | Canonical UUID mapping, atomic merge, authorization and paginated reads |

Dashboard responses are limited to 50 active learners per page, backed by an ordered membership index. Read and sync functions use explicit grants and authenticated identity. Other mentors, removed members and archived workspaces cannot access the protected progress RPCs. This is learner-reported offline completion, not a claim of remotely proctored assessment.

## Connection and verification — 2026-10-22

All four migrations are installed in the hosted BAYA project. Learners now use verified email codes, while anonymous sign-ins remain disabled. The local profile is bound to its verified cloud account, and synchronization refuses a different identity. SMTP delivery was confirmed by the user. See [Supabase setup](supabase-setup.md) for current deployment status and exact limits.

The 40 base, 30 progress and 21 management/email-role SQL checks pass. The 67 focused service/UI tests pass. These include replay safety, role isolation, archive/removal, completion calculations and dashboard pagination. The production web export succeeds. Full real-account end-to-end and native testing remain outstanding; Netlify has not yet been redeployed.

Development previews include `dashboard`, `settings-empty`, `settings-connected`, `progress-detail`, `manage` and `learner-account` at `/debug/workspace-preview?screen=...`. They are explicitly labeled test data and excluded from production behavior.
