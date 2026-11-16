# Compliance 01 — pre-implementation audit

Recommendation: "Add Tagalog and English language in the app" (Settings; Panel Chair).

| Module | Actual Files (under apps/mobile) | Current Language | Hardcoded Strings | Translation Needed |
|---|---|---|---|---|
| Root and onboarding | app/_layout.tsx, app/index.tsx, app/learner/setup.tsx, components/landing/*, components/learner/ProfileSetupForm.tsx | English | Role actions, profile validation, confirmation, accessibility | Yes |
| Settings | components/learner/settings/*, app/mentor/settings.tsx, components/mentor/MentorActionMenu.tsx | English | Workspace sync, logout, notifications; mentor route redirects | Yes |
| Home and navigation | constants/filipinoLabels.ts, components/learner/home/*, components/learner/LearnerAppShell.tsx | Mostly English | Cards, counts, navigation, menus | Yes |
| Lessons | components/learner/lessons/*, components/learner/story/*, components/learner/characters/* | Mixed | Instructions, sources, titles, pronunciation actions | Yes; curriculum review |
| Writing | components/learner/writing/* | Tagalog | Feedback, mastery, recognition, canvas actions, accessibility | Yes |
| Activities/media | components/learner/activity/*, components/media/* | Mostly Tagalog | Controls, completion, unavailable/loading | Yes; recordings unchanged |
| Learner workspaces | components/learner/LearnerWorkspaceScreens.tsx, LearnerCloudAccount.tsx, JoinRequestStatus.tsx | English | Requests, approvals, errors, empty states, email verification | Yes |
| Mentor authentication | components/mentor/AuthScreen.tsx, PasswordField.tsx | English | Login, register, OTP, reset, validation | Yes |
| Mentor workspaces | components/mentor/Workspace*.tsx, ActiveMembers.tsx, PendingJoinRequests.tsx | English | Create, manage, review, remove/restore, confirmations | Yes |
| Progress | components/progress/*, modules/progress/presentation.ts | English | Sync dates, counts, dashboard, empty states | Yes |
| Shared UI | components/ui/*, components/layout/* | Mixed | Buttons, placeholders, dialogs, toasts, accessibility | Yes |
| Indirect messages | modules/cloud/services.ts, validation.ts, supabaseAdapter.ts, modules/progress/presentation.ts | English | Failure-code map, policy validation, relative dates | Yes |
| Educational data | content/approvedCurriculum.ts, approvedStorybook.ts, baybayinIntroduction.ts, baybayinSyllabary.ts, topics/*.ts, writingLessonData.ts | Mostly Tagalog | Explanations, titles, mascot teaching text | Source fallback until expert review; never change identities |
| Rewards/adventure/profile | app/learner/achievements.tsx, profile.tsx, components/learner/home/learnerHomeDemo.ts | English placeholders | Coming-soon, locked and reward cards | Translate existing placeholders only |
| Quiz | content/types.ts, components/learner/activity/ActivityRenderer.tsx | No active quiz implementation found | Unavailable activity fallback | Translate fallback; no new quiz/scoring |

No existing localization library/provider or language preference exists. FilipinoLabels is an English constant map, not a language system. fil-PH is used only for character pronunciation and must remain unchanged.

Preferences: local_app_state (migration 004) stores device state including active learner and pending workspace; no USER_SETTINGS or cloud language preference exists. Add one namespaced device preference in that existing table, with no migration. Profiles and cloud accounts share the device language deliberately. Default en; explicit saved tl persists. No cloud synchronization.

Content is TypeScript bundled data, also seeded/read through SQLite activity/curriculum services. Preserve records and stable topic/activity IDs. Translate at presentation boundaries; do not rebuild or re-key ActivitySession data, which would reset activity state. Existing source curriculum and media are the fallback, and translations are drafts pending content review.

A raw source-string inventory was captured before editing in COMPLIANCE-01-STRING-INVENTORY.json (includes technical strings for audit transparency).
