# BAYA first-launch introduction and Settings replay

**17 November update:** Per the latest request, the welcome teaser has been removed. First-use automatic onboarding remains; manual replay is available from Learner and Mentor Settings only. Automatic dismissal now restores web focus to the Learner choice. Earlier references below to the welcome teaser describe the preceding version.

Implemented and verified locally on 16 November 2026. No commit, publication, deployment, dependency installation or schema migration. Earlier storybook/image work and unrelated working-tree files were preserved.

## Behavior

The existing five-page `OriginStorybook` opens on Page 1 on the first eligible visit to `/`. The root language provider finishes loading before Welcome mounts; the introduction controller then resolves its local preference asynchronously. No modal is displayed while that read is pending, and no arbitrary startup delay was introduced.

Close, Finish Reading, Escape and supported Android Back all use the same dismissal callback. Automatic dismissal immediately suppresses another presentation in the running session and starts one idempotent persistent write. Mounting, reading a page, rotation and route changes do not write acknowledgement. Reloading before intentional dismissal can offer the introduction again. Closing never waits for storage and never requires completion, login or internet. The existing Close control provides the optional early exit; no separate Skip button was added.

Returning users see the normal welcome experience. The installation-scoped preference is independent of account, role, learner progress, language and build version. Learner and Mentor destinations remain unchanged. Their handlers cancel a pending first-launch presentation before asynchronous routing begins; pathname eligibility also closes the welcome-owned modal when the route changes.

Manual opening from either Settings screen or the existing welcome teaser starts the same component at Page 1. It never clears or writes the introduction flag and returns to its originating screen. Manual opening during first-launch hydration wins over the pending automatic presentation. The welcome modal remains above the responsive layout branches, preserving its current page on rotation. A session-level presentation claim also prevents repeat automatic opening on remount or Strict Mode effect replay.

## Repository findings and storage

- Welcome is `apps/mobile/app/index.tsx`, rendering `LandingHero`. Its responsive branches replace the teaser, but the modal is owned by the stable parent.
- The root `LocalizationProvider` already hydrates the device language before rendering children. Root database initialization is shared through `getReadyDatabase`.
- Language preferences already use `local_app_state` in Expo SQLite. Introduction storage reuses that table and lifecycle, with **`baya.storybook.intro.seen.v1`** as `state_key` and **`true`** as `state_value`.
- Missing, false and malformed values are treated as unacknowledged. The key deliberately contains no app-build version or account identifier.
- Web uses the existing SQLite/OPFS implementation and database-ownership coordination. Native uses the existing Expo SQLite connection. No AsyncStorage, new table, Supabase synchronization or localStorage fallback was added.
- Read failures are logged and offer at most once during the session. Write failures log that acknowledgement was **not saved** and may be offered next launch; the UI still closes. Concurrent dismissal attempts share one write. No background retry loop is started.
- A small, feature-detected `BroadcastChannel` announces a successful persisted dismissal to other open welcome tabs. It closes another automatic introduction, while leaving explicit manual reading alone. Where browser messaging is unavailable, each new runtime reads the persisted preference normally. Listeners and channels are cleaned up on unmount.
- Sign-out and profile/activity cleanup were inspected: they do not remove this preference. Clearing application data can reset it. Storage eviction/private sessions remain subject to browser persistence rules. PWA installation is not assumed to create a separate storage context.

The introduction itself has no backend request, recognition import or model initialization. Existing Settings cloud-status behavior remains unchanged. Story content, historical facts, images, rights metadata, page order, wave frames and turn transitions were not changed by this task.

## Settings and accessibility

Both `/learner/settings` and `/mentor/settings` include the shared `StorybookSettings` section after Language. The mentor account menu now calls its existing settings destination **Settings**, reflecting its broader contents.

| English | Tagalog |
| --- | --- |
| About BAYA | Tungkol sa BAYA |
| Read BAYA’s Story | Basahin ang Kuwento ng BAYA |
| Discover Bayani, the inspiration behind BAYA, and the people who helped bring our learning journey to life. | Kilalanin si Bayani at tuklasin ang kuwento at mga taong tumulong sa pagbuo ng BAYA. |

The shared row uses the existing book icon, chevron, typography and colors, a button role, descriptive accessibility hint, visible focus treatment and a minimum 48px target. It follows the existing localization provider and message dictionaries. The selected language carries into the story. Settings focus cleanup closes replay if its route loses focus; normal dismissal restores web keyboard focus to its still-mounted trigger. Welcome dismissal focuses the visible teaser. Existing modal semantics, heading focus/announcements, focus containment and reduced-motion behavior are retained.

Physical testing exposed an existing Android Chrome gap: browser Back on an automatically opened modal was not reliably a cancelable route traversal. `OriginStorybook` now feature-detects `CloseWatcher`, listens for its close request, and destroys it on unmount. This handles Android browser Back without artificial history entries. Existing navigation and Escape fallbacks remain for browsers without that API; native `Modal.onRequestClose` is retained. See the [CloseWatcher proposal](https://github.com/WICG/close-watcher) and [HTML interaction specification](https://html.spec.whatwg.org/dev/interaction.html). The failed pre-fix physical run is retained under `android/`; the final run passes under `android-final/`.

The existing app-wide landscape policy for learning and Settings remains unchanged. Welcome supports portrait; an open storybook preserves its responsive layout. Short landscape reading areas scroll while the header and navigation remain visible.

## Files for this change

Paths below are relative to the repository root. No files were deleted.

| File | Change |
| --- | --- |
| `apps/mobile/components/landing/storybookIntroduction.ts` | New SQLite preference adapter and session-level read/claim/acknowledgement coordination. |
| `apps/mobile/components/landing/useStorybookIntroduction.ts` | New automatic/manual lifecycle controller, cancellation and cross-tab acknowledgement. |
| `apps/mobile/components/landing/StorybookSettings.tsx` | New shared bilingual Settings replay row, using the existing storybook. |
| `apps/mobile/components/landing/__tests__/storybookIntroduction.test.tsx` | New focused storage, lifecycle, dismissal, replay and browser close-request tests. |
| `apps/mobile/app/index.tsx` | Supplies actual welcome-route eligibility. |
| `apps/mobile/components/landing/LandingHero.tsx` | Connects first-launch controller, teaser and role-navigation cancellation. |
| `apps/mobile/components/landing/OriginStorybook.tsx` | Adds feature-detected browser close-request support. |
| `apps/mobile/components/learner/settings/SettingsScreen.tsx` | Inserts shared About section. |
| `apps/mobile/app/mentor/settings.tsx` | Inserts the same About section. |
| `apps/mobile/components/mentor/MentorActionMenu.tsx` | Labels the existing settings destination Settings. |
| `apps/mobile/localization/en.ts`, `tl.ts` | Three bilingual About/replay messages. |
| `scripts/testing/baya-storybook-introduction.mjs` | New isolated production-browser and physical-device lifecycle verification, with screenshots. |
| `scripts/testing/baya-storybook.mjs`, `baya-storybook-final.mjs`, `baya-storybook-touch.mjs` | Existing manual-reading regression fixtures now intentionally dismiss first-launch introduction through the UI before testing replay. Existing assertions retained. |
| `docs/BAYA-STORYBOOK.md` | Links this lifecycle report. |
| `docs/BAYA-STORYBOOK-INTRODUCTION.md` | This report. |
| `docs/verification/baya-storybook-introduction/` | New actual browser reports and captures; earlier evidence retained. |

## Verification

| Check | Result |
| --- | --- |
| `npx tsc --noEmit -p apps/mobile/tsconfig.json` | Passed. |
| `npm run lint --workspace mobile` | Passed. |
| `npm test --workspace mobile -- --runInBand --forceExit` | **78 suites, 806 tests passed** on the final code, including storage, introduction, storybook, Settings and navigation-hook tests. |
| `npm run export:web --workspace mobile` | Passed. Existing expo-sqlite subpath-resolution and terminal color warnings remain. |
| `node apps/mobile/scripts/generate-pwa-service-worker.mjs --check` | Passed; **185 precached assets**, cache `baya-pwa-1c1c7c1bf6af5301`. No service-worker/model-cache strategy change. |
| Desktop lifecycle | **56 checks, 29 screenshots**; Chrome 157.0.8103.52 in an isolated temporary profile. |
| Dedicated automatic Escape / desktop Settings | **7 checks, 4 screenshots** in another isolated profile. |
| Storybook regression | **30 checks, 12 screenshots**; greeting, keyboard, page turns, rapid/cancelled navigation, reduced motion, offline bilingual reload and role entry. |
| Physical Android lifecycle | **56 checks, 29 screenshots**; Samsung SM-S911B, serial RFCW818ZGQX, Chrome 157.0.8103.51. |
| `git diff --check` | Passed. |

Total final browser/device evidence: **149 checks and 74 screenshots**. All final reports have no recorded browser warning/error. Jest retains existing asynchronous `act` warnings in unrelated screen tests and the repository's force-exit approach; no assertions or failures were suppressed.

The actual production export was served on localhost only. Desktop used fresh browser profiles; Android used dedicated test origins on port 5988. No personal browser storage or learner records were cleared. Both languages and all five pages were exercised from both role Settings screens. Physical testing used real orientation changes and an ADB system Back event; device rotation settings were restored afterward. Reload tests create new JavaScript runtimes and verify persistent suppression. No claim is made of restarting the entire Android Chrome process.

Offline verification used a separate untouched test origin: first load Settings and cache the app, save Tagalog, disable the target's network, then visit Welcome for its first eligible launch. The introduction opened in Tagalog, all pages loaded locally, Finish persisted offline, reload stayed suppressed, and Settings replay worked offline. This tests the installed service worker's cached app shell with browser network emulation; it is **not** a standalone installed-PWA test.

## Visual evidence

Selected captures were opened and inspected for layout, focus, reading controls and consistency with the prior landing design. These include actual phone portrait, landscape Settings, returning Welcome, full desktop Settings/replay and offline first launch. Short viewports deliberately use the existing scrolling reading surface.

- [Automatic introduction, physical portrait](verification/baya-storybook-introduction/android-final/automatic-portrait.png)
- [Automatic introduction, physical landscape](verification/baya-storybook-introduction/android-final/automatic-landscape.png)
- [Returning welcome, desktop](verification/baya-storybook-introduction/escape/returning-desktop.png)
- [Learner Settings → About BAYA](verification/baya-storybook-introduction/escape/settings-desktop.png)
- [Settings replay, desktop](verification/baya-storybook-introduction/escape/settings-desktop-replay.png)
- [Tagalog mentor Settings, physical Android](verification/baya-storybook-introduction/android-final/tl-mentor-settings.png)
- [Offline first launch in saved Tagalog](verification/baya-storybook-introduction/desktop/offline-first-launch.png)
- [Desktop lifecycle report](verification/baya-storybook-introduction/desktop/browser-report.json)
- [Physical-device report](verification/baya-storybook-introduction/android-final/browser-report.json)
- [Escape and focus report](verification/baya-storybook-introduction/escape/browser-report.json)
- [Animation/accessibility regression report](verification/baya-storybook-introduction/regression/browser-report.json)

## Limits

Native Android/iOS binaries, installed standalone PWA mode, browser-process restart, TalkBack and VoiceOver were not tested. Native uses the existing SQLite adapter and Modal request-close contract, covered by component tests, but is not certified by physical native execution. Browsers without `CloseWatcher` retain the existing supported keyboard/navigation dismissal paths; their hardware-Back behavior was not verified. No live account sign-in/out or account switch was performed: storage isolation and existing account tests establish that the new key is not coupled to those operations. No external Tagalog review occurred. Supplied image publication rights remain pending exactly as documented in the preceding enhancement report; this task did not change those permissions.
