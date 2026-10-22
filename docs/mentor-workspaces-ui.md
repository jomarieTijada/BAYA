# Mentor authentication and workspace UI

Status: **UI AND SUPABASE ADAPTER IMPLEMENTED — HOSTED PROJECT NOT CONFIGURED**

The follow-up request authorized Supabase integration. See [Supabase setup](supabase-setup.md) for the migration, configuration, identity design and remaining live-provider checks. UI verification below records the earlier UI-first phase.

## Implementation and architecture

The mentor placeholder now opens a responsive login form. Registration, OTP verification, password reset request, workspace selection (loading/empty/list/error), workspace creation, workspace details, learner join, confirmed join, and learner membership screens share the existing BAYA visual system. Inputs validate without clearing unrelated values, passwords are hidden by default, and a synchronous request lock prevents duplicate submissions. Errors are mapped from typed codes rather than rendering raw provider errors. Unmounted or superseded read requests cannot update the screen.

The app root now uses `CloudProvider`: valid public configuration selects the Supabase adapter, otherwise `pendingCloudServices` returns unavailable. No account, session, OTP, code or membership is fabricated. A successful provider response is required before success navigation. Mentor routes check the session on focus, while database RLS/RPCs enforce authorization independently. Returning to role selection does not sign out; an explicit Log out action is available in workspace selection.

| Module | Responsibility |
| --- | --- |
| `modules/cloud/services.ts` | Mockable auth/workspace contracts, outcomes, provider policy hooks, safe error messages, unavailable default adapter, React injection context |
| `modules/cloud/validation.ts` | Required fields, trimmed names, normalized emails/codes, matching passwords, optional provider policy rules |
| `modules/cloud/useOperation.ts` | Submission lock, busy/error presentation, safe exception handling |
| `components/mentor/FeatureScreen.tsx` | Shared safe-area/keyboard/scroll layout, card, heading, notice, text link |
| `components/mentor/PasswordField.tsx` | Shared input plus accessible password visibility control |
| `components/mentor/AuthScreen.tsx` | Login/register/reset forms and challenge-bound OTP screen |
| `components/mentor/WorkspaceScreens.tsx` | Session boundary, selection, empty state, creation, details |
| `components/mentor/WorkspaceCard.tsx` | One reusable workspace card; code copy on web, native share, optional real counts/sync time |
| `components/learner/LearnerWorkspaceScreens.tsx` | Join request, already-joined handling, confirmed membership view |
| `components/debug/workspaces/` | Explicit development/test-only preview and fixtures |

No new application dependency was added. No schema, RLS, SQLite service, curriculum, progress rule, or recognition implementation changed. Existing story/mascot edits were present before this task and were left untouched.

## Reuse

Reused `AppButton`, `BackButton`, `AppIcon`, `AppTextInput`, `BaseCard`, theme/font/shadow tokens, root `LandscapeGuard`, and the existing learner home/settings entry points. Extended `AppTextInput` with an opt-in rounded form density, trailing control slot, and label action slot; existing densities keep their behavior. Extended the existing icon map and regenerated its SVG paths. No parallel button/card system was introduced.

The new layout wrapper is needed for scrollable account/workspace forms; the password wrapper centralizes visibility/accessibility. The existing settings card's mock connection toggle and fabricated sync success were removed. Its sample connection data now lives only in a test. Settings routes to memberships; the learner header routes to joining.

## Activity diagram / route mapping

| Diagram action | Route / behavior | Service boundary |
| --- | --- | --- |
| Select Mentor | `/` already links to `/mentor` | None |
| Enter credentials | `/mentor` | `auth.login` |
| Create mentor account | `/mentor/register` | `auth.register` |
| Forgot password | `/mentor/reset-password` | `auth.resetPassword` |
| Submit/resend email OTP | `OtpScreen` replaces the active form only after a service challenge | `auth.verify`, `auth.resend` |
| Direct verification URL | `/mentor/verify` explains pending integration; actions disabled without a challenge | No invented challenge |
| Authenticated mentor | `/mentor/workspaces` | `auth.session`, then `workspaces.listOwned` |
| No workspace | Empty state only after an authoritative successful empty list | `listOwned` |
| Create workspace | `/mentor/workspaces/create` | `create(trimmedName)` |
| Generate/reserve code and save | Backend responsibility; read-only placeholder until confirmation | Atomic authoritative `create` |
| Select/load/display workspace | `/mentor/workspaces/[id]`, internal UUID parameter | `details(workspaceId)` |
| Learner participation | `/learner/workspaces` | `memberships` |
| Enter mentor code | `/learner/workspaces/join` | `join(normalizedCode)` |
| Confirm membership | Same join screen, then membership view | Verified `JoinedWorkspace`, including `alreadyJoined` |
| Return to learner interface | Membership back button → `/learner/home` | No learner data changes |

No unsupported settings/overflow operations are shown on mentor cards. There is no mentor settings implementation to link to. No fake learner counts or sync labels appear when those fields are absent.

## Cloud ERD mapping

| UI/domain value | ERD field / contract |
| --- | --- |
| Full name | `PROFILES.display_name` through authorized registration |
| Email/password | Auth provider, never a workspace/profile database column or local persistence |
| Authenticated identity | `PROFILES.auth_user_id`, `profile_id`, `role`; session exposes resolved mentor identity |
| Workspace name | `WORKSPACES.workspace_name` |
| Internal route identifier | `WORKSPACES.workspace_id` (UUID) |
| Display/copy/join code | `WORKSPACES.workspace_code` (public string), never used as the internal route ID |
| Mentor ownership | `WORKSPACES.mentor_profile_id` |
| Card status/date | `WORKSPACES.status`, `created_at` |
| Learner membership | `WORKSPACE_MEMBERSHIPS.membership_id`, `learner_profile_id`, `workspace_id`, `joined_at`, nullable `last_synced_at`, boolean `is_active` |
| Learner count | Optional authorized membership aggregate, not a new table field |
| Last workspace sync | Optional adapter-provided aggregate with documented semantics, not inferred from creation time |

Workspace structural fields reuse the existing domain type. Cloud membership explicitly maps `is_active` to boolean rather than SQLite's numeric representation.

**Chosen relationship (user delegated this decision):** `MENTOR_PROFILES.profile_id` links uniquely to the mentor's own `PROFILES` row. Learners participate through `WORKSPACE_MEMBERSHIPS`. The new Supabase migration uses this clear name; the pre-existing SQLite column is unchanged.

## Authentication and workspace integration status

The follow-up Supabase request adds `modules/cloud/{config,supabaseAdapter,CloudProvider}` and `supabase/migrations/202610210001_baya_cloud.sql`. It implements mentor registration/confirmation, password login, recovery code/password update, separate mentor/device learner sessions, workspace creation/list/details, atomic idempotent joining, memberships and ownership policies. The hosted project is now configured; see the current Supabase setup document for deployment and verification status.

See [setup and limitations](supabase-setup.md). Email OTP on every password login is not enforced; the real OTP flows are confirmation and recovery. The subsequent [progress dashboard and sync](progress-dashboard-sync.md) implementation adds canonical curriculum mapping, topic completion uploads and authorized dashboard reads. Raw handwriting and review histories are not uploaded. Existing offline data and curriculum are preserved.

## Development preview

Start Expo web and open `/debug/workspace-preview?screen=login`. Other screen values: `register`, `otp`, `empty`, `list`, `create`, `details`, `join`, `memberships`, `loading`, `error`. A visible TEST DATA ONLY banner distinguishes preview data. The route uses an explicit `__DEV__` branch; production redirects to `/`, and the exported JavaScript was checked for fixture names/codes/markers (none found).

Tests inject `CloudServicesContext` directly. Preview mocks do not persist data and do not stand in for a live integration test. With no Supabase configuration, direct mentor workspace routes correctly report unavailable session services.

## Verification and limitations

- TypeScript: `npx tsc --noEmit -p apps/mobile/tsconfig.json` passed.
- 124 selected tests passed across 14 suites, covering new flows plus local database, ownership/concurrency/progress, learner setup/home/settings, cards, and landscape behavior. A subsequent UI-only rerun after layout changes passed 61 tests (including four additional flow cases). Jest reports an open handle after the combined regression suite; the focused initial flow suite exits normally. The final UI regression run used `--forceExit` after reporting all assertions passed.
- New flow suite: 21 tests covering validation, show/hide, normalization, repeat submission prevention, challenge/verification transitions, unavailable auth, registration mismatch, expired OTP, session guard, loading vs empty, UUID navigation, authoritative creation, existing membership, join authorization/offline/not-found/inactive failures, and membership display.
- Targeted ESLint on feature and touched UI/settings files passed. Full repository lint remains blocked by the pre-existing uncommitted `StoryMascotPopover.tsx:29` `react-hooks/set-state-in-effect` error, plus unrelated warnings.
- Production Expo web export and PWA service-worker generation passed. Existing Expo SQLite subpath warning remains.
- Browser CDP captures cover 15 screens/states (75 viewport/state combinations, plus bottom-of-form captures) at 667×375, 844×390, 915×412, 1024×768, 1366×768. Horizontal overflow is checked and screenshots are saved; long forms deliberately scroll, with bottom captures showing reachable submit controls.
- Screenshot evidence and logs: [verification folder](verification/mentor-workspaces/). `scripts/verify-mentor-workspaces.mjs` reproduces captures against Expo on port 8087.
- Visuals use established BAYA fonts/colors with responsive adaptations; no pixel-perfect claim. Phone virtual keyboards, native safe-area/device behavior, live Supabase auth/email/membership, and actual progress sync were not verified on physical devices.
- Recognition implementation is unchanged. Existing local database/progress and offline/PWA tests passed; this task does not claim a new end-to-end handwriting or native-device verification.

## Files changed by this task

New files:

- `apps/mobile/modules/cloud/{services,validation,useOperation}.ts`
- `apps/mobile/components/mentor/{AuthScreen,PasswordField,FeatureScreen,WorkspaceCard,WorkspaceScreens}.tsx`
- `apps/mobile/components/mentor/__tests__/flows.test.tsx`
- `apps/mobile/components/learner/LearnerWorkspaceScreens.tsx`
- `apps/mobile/components/debug/workspaces/{fixtures.ts,WorkspacePreview.tsx}`
- `apps/mobile/app/debug/workspace-preview.tsx`
- `apps/mobile/app/mentor/{register,reset-password,verify}.tsx`
- `apps/mobile/app/mentor/workspaces/{index,create,[id]}.tsx`
- `apps/mobile/app/learner/workspaces/{index,join}.tsx`
- `scripts/verify-mentor-workspaces.mjs`
- This document and `docs/verification/mentor-workspaces/` evidence.

Modified files:

- `apps/mobile/app/mentor/index.tsx`
- `apps/mobile/components/ui/{AppTextInput.tsx,AppIcon.tsx,ioniconPaths.web.ts}`
- `apps/mobile/components/learner/home/LearnerHeader.tsx`
- `apps/mobile/components/learner/settings/{WorkspaceSyncCard.tsx,ConnectionStatusBadge.tsx,workspaceSettingsData.ts}`
- `apps/mobile/components/learner/settings/__tests__/SettingsScreen.test.tsx`

No commit, push or Netlify deployment was performed. Four Supabase migrations are now installed on the hosted project. Learner email verification, mentor workspace rename/archive/restore, member access management and progress synchronization are implemented; see supabase-setup.md for current checks and limits.
