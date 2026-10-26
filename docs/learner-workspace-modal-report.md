# Learner workspace navigation and join modal

## Root cause and navigation

Dashboard/header, settings, cloud-account and onboarding actions pointed directly to `/learner/workspaces/join`. My Workspaces also pushed that standalone route. The code-entry form was coupled to a full FeatureScreen.

All applicable actions now navigate to `/learner/workspaces`. The existing join route remains a compatibility redirect to that list, retaining an optional code parameter but never opening the form automatically. Independent learners see the same list-first flow. An onboarding code is preserved as the initial modal draft.

## Implementation

My Workspaces owns join visibility. Pressing JOIN WORKSPACE opens the form without changing routes or remounting the list. Closing preserves its draft, memberships, request status and local learner state. Opening/closing does not initiate workspace reads. Confirmed submission refreshes memberships and request status; existing membership cards stay visible during refresh.

The existing BayaDialog now supports form content and a compact close button. It retains its React Native Modal background isolation, focus containment/restoration, safe-area sizing, cream backdrop, web blur, fade/scale animation and reduced-motion behavior. Form headers omit the large icon and place the 44px close control beside the title. Scrollable content and native keyboard avoidance keep the input and action reachable. Back/Escape use the existing Modal dismissal hook and are guarded while submitting. Backdrop clicks remain non-dismissing under the existing dialog policy.

The original code validation, normalization, messages, operation guard and typed requestJoin service are reused in one form implementation. No email field, internal page Back button or Continue Learning link appears in the form. Validation and backend errors leave the entered code available. The keyboard Go action submits through the same guarded operation.

One dialog transitions from form to request confirmation, so the form is removed without stacking backdrops. Submitted/already-pending results accurately say approval is pending. Already-member responses offer MY WORKSPACES. Pending confirmations offer CONTINUE LEARNING. Title changes move focus to and announce the new dialog title. JoinRequestStatus retains rejected/pending states and independently verifies active membership before its approval success notice. Opening the form suppresses that competing approval dialog.

No Supabase query, schema, Auth policy, RLS rule, identity binding, approval requirement, SQLite progress operation, lesson or recognition code was changed.

## Exact files modified for this task

Application sources:

- `C:/BAYA/apps/mobile/components/learner/LearnerWorkspaceScreens.tsx`: default list, legacy redirect, reusable modal form and confirmed-result refresh.
- `C:/BAYA/apps/mobile/components/ui/BayaDialog.tsx`: optional form composition, compact close action, keyboard handling and focus on title changes.
- `C:/BAYA/apps/mobile/components/learner/home/LearnerHeader.tsx`: list-first shortcut.
- `C:/BAYA/apps/mobile/components/learner/settings/SettingsScreen.tsx`: list-first entry callbacks.
- `C:/BAYA/apps/mobile/components/learner/settings/WorkspaceSyncCard.tsx`: list-first fallback.
- `C:/BAYA/apps/mobile/components/learner/LearnerCloudAccount.tsx`: list-first account action.
- `C:/BAYA/apps/mobile/components/learner/ProfileSetupForm.tsx`: list-first onboarding navigation, preserving entered code.
- `C:/BAYA/apps/mobile/components/debug/workspaces/WorkspacePreview.tsx`: previews use the list/modal flow.
- `C:/BAYA/apps/mobile/components/debug/workspaces/JoinApprovalPreview.tsx`: approval fixtures use the list/modal flow.

Tests:

- `C:/BAYA/apps/mobile/components/mentor/__tests__/joinApproval.test.tsx`: modal open/close, no navigation or rereads, retained draft, native Back callback, required code, in-flight dismissal guard, single-modal transition, pending state.
- `C:/BAYA/apps/mobile/components/mentor/__tests__/flows.test.tsx`: existing member and failure cases through the modal.
- `C:/BAYA/apps/mobile/components/learner/home/__tests__/LearnerHomeScreen.test.tsx`: updated shortcut destination.
- `C:/BAYA/apps/mobile/components/learner/settings/__tests__/SettingsScreen.test.tsx`: updated settings destination.

Reused AppButton, AppTextInput, BaseCard, FeatureScreen, Notice, BayaDialog, JoinRequestStatus, useCloudRead and useOperation. No dependencies or competing modal system added.

## Verification and limits

- Six relevant Jest suites passed: 69 tests, including navigation, joining, mentor review, settings, onboarding and shared dialogs/notifications.
- TypeScript and targeted ESLint passed.
- Production web export and service-worker generation passed.
- Isolated PGlite database/security integration: 36 checks passed, covering pending-without-membership, duplicate prevention, ownership/RLS, atomic approval, rejection, archived workspaces and history retention. No live data was mutated.
- Existing React act warnings and expected profile-save failure logs appeared in tests. Jest required forced exit because an open handle remained. Export retained the existing expo-sqlite fallback and NO_COLOR warnings.

Browser tooling reports that local browser use is disabled in Work settings. New screenshots, the five requested viewport inspections (667×375, 844×390, 915×412, 1024×768, 1366×768), actual browser Escape/focus behavior and native on-screen keyboard behavior are therefore **unverified**. Automated tests exercise modal dismissal callbacks, in-flight guards and state preservation; they do not substitute for those visual/device checks. No new live Supabase end-to-end run was performed, and this UI change does not claim to fix backend configuration issues.

No commit, push or deployment was performed.
