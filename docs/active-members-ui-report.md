# Compact Active Members

Implemented October 26, 2026.

## Files and reused components

- `apps/mobile/components/mentor/ActiveMembers.tsx`: compact member list, separate presentation and service controller, confirmation and feedback.
- `apps/mobile/components/mentor/WorkspaceManageScreen.tsx`: integrates the member list using the existing members read and refresh.
- `apps/mobile/components/mentor/WorkspaceSection.tsx`: shared compact row, name and action styles.
- `apps/mobile/components/mentor/PendingJoinRequests.tsx`: uses those shared styles without changing its layout or operations.
- `apps/mobile/components/mentor/__tests__/activeMembers.test.tsx`: member display, confirmation, cancel, submission guard, success, failure, empty, missing-name, loading and retry tests.
- `apps/mobile/components/debug/workspaces/JoinApprovalPreview.tsx`: explicitly labeled member fixtures with long names and simulated access changes.

Reuses WorkspaceSection, BaseCard, AppButton, AppIcon, BayaDialog, BAYA toast notifications, Notice, useOperation, and existing colors/fonts/badge styles. No new generic card or button system.

## Layout

The former cards placed a long Remove action on a separate centered line. Each member now has an approximately 66px row when content fits, with a 22px avatar, readable 17px name, Active badge and outlined Remove button on the right. The button has a 44px minimum height and an accessible label identifying the learner. Rows use thin existing card borders, 12px horizontal and 10px vertical padding, and no added shadow.

Flex wrapping allows names and action groups to grow without clipping. Long names remain visible. The header uses the same compact presentation as Pending Join Requests. The count is derived from active member records. Inactive records remain available under Removed members with Restore actions, preserving the existing restoration capability. Loading and read errors do not masquerade as a zero count.

## Removal behavior

The previous UI removed access immediately. Remove now opens the existing BAYA confirmation dialog naming the learner. Cancel performs no mutation. Only confirmation calls the existing `setMemberActive(workspaceId, profileId, false)` service. The operation guard prevents duplicate submissions and disables dialog actions while pending. On success, the member list is re-read and a success toast appears. Failures keep the member and display the error in the dialog. Restore also uses confirmation and the existing service.

Backend authorization, RLS, membership schema, progress storage and recognition logic were not changed. No real memberships were removed during this task. No commit, push or deployment was performed.

## Verification

- Relevant Jest run: 42 tests passed across member, pending-request and mentor-flow suites. Added loading/error coverage afterward and reran the member suite: 6 tests passed, bringing the unique tested total to 43.
- TypeScript: `npx tsc --noEmit` passed.
- Targeted ESLint on the changed source/test files passed.
- Production `npm run export:web` passed, including service-worker generation.
- Inspected rendered development fixtures at all requested dimensions: 1366×768, 1024×768, 844×390 and 667×375. Learner names, badges and actions remained aligned and readable, including a long name. Desktop row height measured 65.6px and button height 44px. DOM checks confirmed no page horizontal overflow at 1024 and 844; the 667 screenshot was visually inspected without clipped actions.
- Screenshots saved: [desktop](verification/active-members/desktop.png), [tablet](verification/active-members/tablet.png), [844 landscape](verification/active-members/landscape-844.png). These show labeled test fixtures, not live learner records.

## Limitations

Browser access was disabled in Work settings after viewport inspection. The 667 screenshot could not subsequently be saved, the temporary viewport override could not be reset, and the removal dialog was not visually checked in this run. Confirmation/cancel/success/failure behavior was verified with automated tests. Native-device touch and screen-reader verification, and new live-Supabase removal testing, were not performed.

The existing mentor-flow suite emitted asynchronous React act warnings. Export emitted the existing expo-sqlite subpath fallback and NO_COLOR warnings. All listed checks exited successfully. This is not a claim that every unrelated repository test or lint check was run.
