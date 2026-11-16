# BAYA System Compliance #7 â€” Navigation and Session Resume

## Recommendation and interpretation

> "Make sure to add instance and sessions for back button and resume of state."

Navigation history belongs to Expo Router. Mounted screen state belongs to React. An unfinished activity instance is identified by local profile, topic and start timestamp. Its versioned checkpoint lives in the existing SQLite `local_app_state` table. Completed progress and validated writing attempts remain in their existing tables. Supabase owns authentication sessions; no credentials or workspace authorization are stored in checkpoints.

## Pre-change audit and navigation matrix

Source inspection preceded implementation. Browser baseline evidence is in `verification/compliance-07/before.json` and the two before screenshots: an unfinished drawing disappeared on reload (one rendered stroke group before, zero after).

| Screen/flow | Current/expected Back destination | State retained before change | Reload recovery before change | Identified problem | Change |
|---|---|---|---|---|---|
| Home â†’ Lessons | Home | Progress in SQLite | Progress only | No last unfinished activity | Existing Home Continue card now reads eligible checkpoint |
| Module/topic list | Combined learning journey (`/learner/lessons`) | Mounted list and persisted completion | Completion | There is no separate live topic-list stack | Preserve route hierarchy |
| Storybook header Back | Learning journey | Mounted state while covered by Settings | Default introduction/content | Unfinished page lost after unmount | Persist stable introduction/content page |
| Storybook footer Previous | Introduction or previous topic | Local video/page state | Default page | Meaningful page not durable | Hydrate approved topic and page |
| Character lesson | Header â†’ journey; footer â†’ previous character/topic | Local selected index | First character | Index lost | Persist validated character index |
| Writing header Back | Previous target/topic; first target â†’ journey | Original reset/selection workflow | Empty canvas | Draft lost after leaving/reload | Persist current target and normalized strokes; preserve existing target-change reset semantics |
| Writing Settings â†’ Back | Originating writing screen | Mounted strokes | No draft | No durable recovery | Preserve mounted instance; persist draft |
| Learner Settings direct entry | Home fallback | Device preferences | Preferences | Already guarded by canGoBack | Preserve |
| My Workspaces | Learner Home | Existing memberships | Cloud re-read | Modal browser Back also left screen | Topmost dialog intercepts supported browser traversal |
| Join dialog | Underlying My Workspaces | Form while mounted | No unsent form persistence | Browser Back ignored local overlay | Dismiss dialog first; Escape/native Modal behavior retained |
| Action menu | Underlying screen | Local open state | Closed | Back could leave screen | Same topmost-overlay guard |
| Mentor login/register/reset | Existing auth routes | Supabase/session service | Supabase persistence | No learning checkpoint needed | Preserve auth system |
| Workspace selection â†’ dashboard/manage | Workspace selection | Workspace ID in route | Authorized service read | Remembered ID must not grant access | Existing backend authorization retained |
| Pending requests / active members | Existing workspace screen/section | Live fetched membership state | Authorized re-read | Not separate assessment instances | Preserve workflow |
| Mentor Settings | Origin if history; workspace selection otherwise | Language preference | Language preference | Unconditional back on direct entry | Add safe fallback |
| Mentor protected screens | Valid session required on every focus | Focus guard | Session revalidation | Previously ready content should be cleared on blur | Reset boundary to loading on blur |
| Quiz / Adventure / rewards | Existing placeholders and progress views | Existing progress | Existing progress | No live quiz answer/timer lifecycle | No invented quiz or Adventure features |

Browser history is not serialized or replaced by activity checkpoints. No raw arbitrary route is stored, and Home does not force a redirect. Existing `dismissTo`, `setParams`, and `push` behavior is retained. Writing topic transitions carry a validated optional initial index, preserving the previous-topic last-character destination when no unfinished checkpoint exists. Route redirects `/learner/lessons/[id]` and `/learner/lessons/current` continue to use the existing curriculum flow.

## Resume architecture

- Key: `activity_resume:<profileId>:<topicId>` in the existing SQLite/OPFS database. No migration, second storage engine, cloud checkpoint, or state library.
- Common fields: version 1, approved content version, stable profile/topic IDs, instance start time and save time.
- Story draft: introduction/content page. Character draft: selected index. Writing draft: index, character ID, normalized grouped points (optional timestamps), canvas dimensions, and submitted flag.
- Validation rejects corrupt JSON, unknown topics, unsupported versions/content, wrong profile, wrong character/index, invalid coordinates, dimensions or excessive point counts. Explicit projection strips extra fields from stored objects.
- Read checks the currently selected existing learner and excludes completed topics. Home chooses the most recently saved eligible unfinished topic and gets its title/module from curriculum metadata.
- Screen focus checks ownership before hydration. The mounted subtree is keyed by profile and activity start time. Focus epochs prevent work started before leaving the screen from publishing when it returns.
- Save calls snapshot their arguments, run in invocation order and check active ownership inside the transaction. Clear/retry/target changes supersede older drafts. Completing a topic deletes its checkpoint in the same progress transaction; later saves cannot recreate a completed checkpoint.
- Unsupported/corrupt records are ignored rather than executed. Deleted profiles cannot resolve as the active learner. Invalid records may remain inert in local storage until superseded; no unrelated learner progress is removed.
- Point changes debounce for 250 ms; stroke-end saves immediately, as do submitted/empty drafts and stable lesson/index changes. Blur, background and page visibility changes also flush. SQLite writes remain asynchronous.
- The boundary shows localized restore/save failure feedback and a recovery action. A failure reading Home's checkpoint falls back to the normal curriculum Continue card.

## Handwriting correctness

Restoration only hydrates normalized stroke groups, selected target and canvas metadata. It does not call recognition or record an attempt. Model preloading still occurs through the existing writing screen and is distinct from drawing inference. The submitted flag requires Retry for a previously submitted drawing. Accepted counts are derived from existing validated writing attempts within the activity instance; draft JSON cannot supply mastery counters. The existing confidence threshold, required attempts, Top-1 presentation and model assets are unchanged.

Recognition retains its drawing-version, mounted, and target guards, with a focus-instance guard added. Writing and completion transactions accept an optional expected profile ID so late work cannot bind to a newly selected learner. Persisted completion remains idempotent. This does not add a new reward policy.

## Browser Back implementation

The shared overlay hook tracks only mounted overlay tokens (not arbitrary screen state). On modern supporting browsers it cancels a cancellable `navigation.navigate` traversal before Expo receives `popstate`, then dismisses the topmost overlay. It does not push synthetic history entries, rewrite URLs or bounce history forward. React navigation `beforeRemove` and existing RN Modal callbacks cover in-app/native removal and Escape paths.

Browser traversal cancellation is feature- and event-dependent. Older engines and non-cancellable cross-document navigation cannot be trapped. This is an explicit limit, not a claim of universal browser interception. Implementation reference: [Navigation API proposal: cancellation and user activation](https://github.com/WICG/navigation-api/blob/main/README.md).

## Auth and profile isolation

The existing Supabase provider keeps mentor and learner auth namespaces separate, persists sessions through its established storage and uses normal refresh behavior. Protected mentor routes recheck sessions on focus; workspace service/RLS authorization remains required. No token, workspace code or remembered workspace ID substitutes for authentication.

The current product has one selected local learner and profile editing, not a multi-profile picker or delete UI. Two-profile tests use isolated test identities and switch the existing selected-profile database key, then reload. This validates the implemented persistence boundary without adding a profile-management feature. Ownership is also checked again at transaction time and on activity focus.

## Verification results

Validation completed on 2026-11-07:

| Check | Actual result |
|---|---|
| Full Jest | **73 suites, 703 tests passed**, 146.04 seconds |
| Final focused route/writing regression after the explicit previous-target parameter fix | **6 suites, 135 tests passed** |
| TypeScript (`npx tsc --noEmit --project apps/mobile/tsconfig.json`) | Exit 0, no diagnostics |
| Fresh lint (`npm run lint --workspace apps/mobile -- --no-cache`) | Exit 0, no lint diagnostics |
| Production web export | Exit 0; **baya-pwa-b5f80955cfde2f0a**, 163 precached assets |
| Drawing reload | Two real pointer-drawn stroke groups; exact SVG geometry retained; attempt rows unchanged |
| Settings and browser Back/Forward | Same draft restored; Home/Continue opens the intended topic |
| Join dialog Back and Escape | Overlay dismissed; underlying My Workspaces retained |
| Profiles A/B | B has no A drawing; switching selected identity back to A and reloading restores A geometry |
| Clear | Empty draft remains empty after reload |
| Restore failure | Explicit browser-only injected read failure shows friendly feedback and a working Back-to-Lessons fallback |
| Offline | Cached PWA reload restores identical geometry; no attempt recorded and no Supabase dependency blocks hydration |
| Process restart | Closed Chrome and relaunched with the same isolated storage profile; Home Continue restored identical geometry |
| Storybook | Content page survives leaving, Continue and reload; video remains paused |
| Module 2 | E/I character selection survives production reload |
| Direct/invalid routes | Unknown topic falls back to Lessons; mentor Settings with no history falls back to guarded workspace selection |
| Mentor unauthenticated browser | Protected workspace content not displayed |
| Responsive | Writing, Home and Join dialog checked at all five specified sizes in both languages; 30 layout screenshots; no page overflow, Continue target at least 44 px high, dialog buttons within viewport; Escape returns focus to the trigger in both languages |
| Model/rules preservation | 10/10 hashes match Compliance #6: active manifest, ONNX asset, recognition runtime/preprocessing/probabilities/class labels/mastery-related files |

Logs are copied into `verification/compliance-07/`. Jest uses the repository's existing force-exit invocation; the runner prints its standard open-handle advisory. This is not a claim that all asynchronous handles naturally drain. The production export emits existing Node/environment warning notices without failing.

### Requirement coverage

| Matrix items from brief | Evidence and scope |
|---|---|
| 1–9 navigation/history/direct entry | Real browser scenario reports plus existing lesson/settings/navigation tests; desktop Chrome |
| 10 mentor context | Existing mentor flow/service tests and route audit; live authenticated account unavailable |
| 11–20 checkpoints/reload/offline/invalid data | Real SQLite lifecycle tests, browser lesson/draft/offline/restart reports; OS-installed PWA launch unverified |
| 21–32 writing safety | Real pointer geometry and clear checks; SQLite ordering and validated count tests; submitted draft UI test; existing inference/target/unmount/retry/next regressions |
| 33–36 profiles/language | Real SQLite owner/deletion tests, two identities in real browser storage, English/Tagalog restoration; selected identity changed through isolated test harness because product has no picker |
| 37–40 mentor security | Existing auth/adapter/authorization tests, guarded unauthenticated browser route, focus cleanup; real expiration/logout with credentials unverified |
| 41–48 regressions | Full suite, export, hashes and local offline restoration; no model evaluation or cloud schema changes | Browser evidence is generated against the exported PWA with real SQLite/OPFS, using an isolated Chrome profile. The test harness discovers production Metro modules only through CDP instrumentation, allowing controlled test identities and DB assertions without shipping a debug API. It never accesses real student records.

## Evidence

- `verification/compliance-07/before-draft.png` and `before-reload.png`: baseline loss on reload.
- `verification/compliance-07/after-draft.png` and `after-reload.png`: exact two-group geometry retained.
- `verification/compliance-07/browser.json`: structured assertions and screenshot list.
- `verification/compliance-07/writing-<language>-<width>x<height>.png`: restored layouts.
- `verification/compliance-07/home-<language>-<width>x<height>.png`: Continue card layouts.
- `verification/compliance-07/join-dialog.png`: workspace dialog.
- `verification/compliance-07/offline-restored.png`: offline restored draft.
- `verification/compliance-07/restart.json`, `restart-restored.png`: full desktop Chrome process restart.
- `verification/compliance-07/lesson-navigation.json`: story page, direct entry and unauthenticated mentor checks.
- `verification/compliance-07/dialog-layouts.json` and `dialog-*.png`: all ten dialog layouts.
- `verification/compliance-07/preservation-checks.json`: unchanged recognition/model hashes.
- `verification/compliance-07/restore-error.json`: injected storage-read failure recovery (explicit test fixture).

## Known limits

- Recovery requires the same device/profile and retained local storage. Clearing browser data removes checkpoints; cross-device recovery is not implemented.
- An abrupt process kill or storage failure before an asynchronous save commits may lose the latest changes. No unload-time durability guarantee is claimed.
- Lesson page markers are persisted, not old pixel scroll offsets. Language, viewport and content changes therefore do not reuse stale reading coordinates.
- Video time is not durably restored. Existing mounted media behavior is preserved; resumption does not initiate playback.
- Clearing/Retry and target changes intentionally replace the current draft. This is not a history of every drawing.
- Native Android hardware Back and OS-installed PWA launching require device verification; desktop browser evidence is labeled separately.
- Live mentor account expiration/logout cannot be claimed without test credentials; existing mocked service/auth tests and unauthenticated browser route checks are reported separately.
- No live quiz/Adventure state was added.

## Files involved in Compliance #7

All paths are relative to `C:/BAYA`; the pre-existing worktree also contains extensive changes from earlier compliance tasks.

| File | Responsibility |
|---|---|
| `apps/mobile/modules/resume/checkpoint.ts` | Typed draft contract and defensive validation |
| `apps/mobile/modules/resume/ActivityResumeBoundary.tsx` | Ownership, hydration, lifecycle flushing, focus instances, errors |
| `apps/mobile/database/services/activityResumeService.ts` | Ordered profile-owned SQLite checkpoints and validated attempt counts |
| `apps/mobile/database/services/localLearnerService.ts` | Expected owner checks and completion cleanup |
| `apps/mobile/app/learner/activities/[topicId].tsx` | Activity boundary integration |
| `apps/mobile/components/learner/story/StorybookTopicScreen.tsx` | Story page restore/save and completion ownership |
| `apps/mobile/components/learner/characters/CharacterTopicScreen.tsx` | Character selection restore/save |
| `apps/mobile/components/learner/writing/WritingPracticeScreen.tsx` | Draft/target restore, save and stale-result guards |
| `apps/mobile/components/learner/writing/WritingCanvas.tsx` | Stroke-end checkpoint callback |
| `apps/mobile/components/learner/home/LearnerHomeScreen.tsx` | Existing Continue card selects latest unfinished context |
| `apps/mobile/components/learner/home/ContinueLessonHero.tsx` | Minimum 44-pixel Continue target |
| `apps/mobile/hooks/useDialogBack.ts` | Topmost overlay Back handling |
| `apps/mobile/components/ui/BayaDialog.tsx` | Shared dialog Back integration |
| `apps/mobile/components/ui/BayaActionMenu.tsx` | Popover Back integration |
| `apps/mobile/app/mentor/settings.tsx` | Safe direct-entry Back fallback |
| `apps/mobile/components/mentor/WorkspaceScreens.tsx` | Clear authenticated presentation on blur |
| `apps/mobile/localization/en.ts`, `tl.ts` | New restore/save status messages |
| `apps/mobile/database/__tests__/activityResume.test.ts` | Real SQLite lifecycle, ordering, ownership, corruption tests |
| `apps/mobile/components/learner/writing/__tests__/WritingPracticeScreen.recognition.test.tsx` | Submitted-draft restoration without inference or duplicate attempt |
| `scripts/testing/compliance-07-browser.mjs` | Production browser regression and evidence |
| `apps/mobile/hooks/__tests__/useDialogBack.test.tsx` | Topmost, busy, replacement and listener cleanup tests |
| `scripts/testing/compliance-07-lessons.mjs`, `compliance-07-dialogs.mjs`, `compliance-07-restart.mjs`, `compliance-07-errors.mjs` | Lesson navigation, dialog dimensions and isolated process restart verification |
| This report and `docs/verification/compliance-07/` | Audit, validation and evidence |

## Compliance matrix remark

Implemented profile-owned, versioned local activity resumption through the existing Continue Learning card. Lesson page/character context and grouped handwriting drafts survive verified navigation, reload, offline loading and a full desktop browser restart without awarding progress or replaying recognition. Added topmost-overlay Back handling on supported browser traversals, safe mentor Settings fallback and stale-operation ownership guards. Full suite: 73 suites/703 tests passed; TypeScript, fresh lint and production export passed. Native/OS-installed PWA and live authenticated mentor scenarios remain separately unverified.

No commit, push or deployment was performed.
