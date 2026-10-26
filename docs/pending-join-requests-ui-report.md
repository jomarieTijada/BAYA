# Compact pending join requests

Implemented October 26, 2026. This change is limited to request presentation and its development fixtures/tests. No database, authorization, RLS, identity binding, lesson, or handwriting-model changes were made for this redesign. Nothing was committed, pushed, or deployed.

## What changed

The old layout combined generous section padding, a large security banner, a nested reference panel, regular-size action buttons, and a separate bottom refresh action. Those elements made one request occupy most of a screen.

The new section uses a compact header with the dynamic pending count and a labeled refresh icon button. A small help icon accompanies “Verify the learner and their request reference before approving.” Detailed verification guidance lives in the reference dialog.

Each bordered row uses 12px padding, the actual learner display name (or “Learner” fallback), a localized short timestamp, and a shortened request reference. Approve and Reject use the existing filled-orange and outlined-orange buttons, content-based widths, and minimum 44px heights. They sit beside learner information where space permits and wrap beneath it on narrow screens. The section count identifies the pending status without repeating badges in every row.

“View reference” opens the existing BAYA dialog with the complete authoritative request ID, selectable text, Copy Reference, and Close. Copy failures offer manual selection. The dialog explicitly explains that a matching reference or name alone is not identity proof.

Refresh uses the existing workspace-scoped service, suppresses duplicate reads, indicates loading, retains the current list during refresh, and shows an inline error on failure. Request controllers retain the existing per-request operation guard and review service. Confirmed reviews trigger list/count/member refresh and the existing success toast; rows are not optimistically removed.

## Exact source files modified for this redesign

- `apps/mobile/components/mentor/PendingJoinRequests.tsx`: compact section, controller/presentation separation, metadata, reference dialog, header refresh.
- `apps/mobile/components/mentor/WorkspaceSection.tsx`: optional compact styling and header action slot; defaults preserved for other sections.
- `apps/mobile/components/ui/BayaDialog.tsx`: optional selectable detail text.
- `apps/mobile/components/mentor/__tests__/joinApproval.test.tsx`: reference copy, large-list refresh, workspace-switch isolation, updated accessible refresh label.
- `apps/mobile/components/debug/workspaces/JoinApprovalPreview.tsx`: explicitly labeled development-only 3/10/24-request fixtures.

Reused BaseCard, AppButton, AppIcon, WorkspaceSection badge/typography styles, BayaDialog, BAYA toast notifications, Notice, ActivityIndicator, existing theme colors/fonts, useCloudRead, useOperation, and typed workspace services. No new generic UI system was introduced. The existing page scroll architecture and stable request-ID keys are retained.

## Verification

- Relevant Jest run: 37 tests passed across join approval, mentor flows, and notifications. After adding workspace-switch coverage, the join-approval suite passed again with 12 tests (38 unique tests across these suites).
- TypeScript `npx tsc --noEmit`: passed after the final source changes.
- Targeted ESLint for the five changed source/test files: passed.
- `npm run export:web`: passed, including service-worker generation.
- `git diff --check`: passed, with repository line-ending notices.
- Browser inspection: real rendered development components at 1280×720, 740×420 landscape, and 375×667 portrait. No horizontal overflow at the narrow sizes; measured Approve/Reject heights were 44px. Buttons wrap on portrait and remain beside identity on landscape.
- Inspected 1, 3, 10, and 24-request fixtures. Keyboard Enter opened/closed details; focus returned to the reference button. Tab reached Approve with a visible focus outline.
- Fixture approval visibly changed 1 Pending / 0 Active to 0 Pending / 1 Active and showed the success toast. Reference copying and review failures were verified by automated tests. No real learner requests were approved or rejected during this redesign.

## Screenshots

All screenshots show labeled development fixtures, not live learner data.

- [Single request](verification/pending-requests/single.png)
- [Multiple requests](verification/pending-requests/multiple.png)
- [Landscape with keyboard focus](verification/pending-requests/landscape.png)
- [Full reference](verification/pending-requests/reference.png)
- [After fixture approval](verification/pending-requests/approved.png)
- [24 requests](verification/pending-requests/24-requests.png)

## Limits and existing warnings

Native-device touch/screen-reader testing and a new live-Supabase end-to-end run were not performed for this UI-only change. Browser approval used the isolated development fixture. The existing mentor-flow test emits an asynchronous React act warning; export emits the existing expo-sqlite subpath-resolution and NO_COLOR warnings. These checks still exited successfully. This report does not claim a clean whole-repository lint/test run or production deployment.
