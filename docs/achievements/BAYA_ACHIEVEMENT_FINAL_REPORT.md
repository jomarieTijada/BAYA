# BAYA achievement implementation

## Final release verification · 27 November 2026

The final mobile Jest command exited successfully with **1,107 passing tests across 93 suites**, zero failures, zero skipped and zero todo. Fifteen of the original 19 failures also reproduced in an isolated pre-achievement checkout. Four viewer failures came from the new playback-owner dependency. The original assertion outputs, comparison and corrections are linked individually. [Regression correction](BAYA_ACHIEVEMENT_REGRESSION_CORRECTION.md) · [Final Jest results](../verification/achievements/regression/final-jest.json)

The local production export passed the achievement acceptance gate. The catalog has 50 definitions, ten per category, distinct local icons and 49 conditions reachable against published content in the automated evaluator. Values Hero remains Coming Soon. Actual learner workflows exercised a subset of the 49. TypeScript, lint, export and offline asset validation passed.

Desktop Chrome and physical Android Chrome completed an eligible checkpoint after the network was disabled and an uncached request failed. The first attempt scored 2/3. The learner corrected the mistake in practice, resumed an unfinished attempt, and earned Offline Adventurer on completion. Home displayed the new achievement. A 3/3 retry earned Practice Makes Progress. Reopening preserved all earned IDs and their original timestamps. Desktop verification restarted the browser process. Android verification closed and reopened the isolated QA tab with the ADB origin tunnel removed. Tests used the standalone display-mode signal in Chrome. APK and launcher-installed PWA lifecycles are outside this evidence. [Desktop evidence](../verification/achievements/acceptance/browser-results.json) · [Android evidence](../verification/achievements/acceptance-android/browser-results.json)

The writing screen accepted pointer input replayed from a recorded human A trace. Real LiteRT inference returned A at 99.63% on desktop and 98.27% on the Android device. SQLite recorded a valid attempt, First Stroke and First Recognition. Against a different target, the same desktop trace produced an invalid educational result and left the correct-result count unchanged. No model, class mapping or recognition threshold changed. [Desktop handwriting](../verification/achievements/learning-Persisted/browser-results.json) · [Android handwriting](../verification/achievements/learning-Persisted-android/browser-results.json)

Final resource sizes are 3,065,298 bytes for the application entry, 140,042 bytes for the service worker and 139,380 bytes for the SQLite worker. The earlier reported worker size referred to the SQLite worker. All 258 required inventory entries are present, totaling 113,606,747 bytes. Achievement icons reuse the 389,724-byte shared Ionicons font and existing local art. The required item count stayed at 258. An isolated achievement-only byte delta remains unknown. [Export measurements](../verification/achievements/export.json)

## Historical implementation report

The collection contains 50 definitions across five categories. The published inventory supports 49, with Values Hero coming soon and zero pending validation. Reachability is tested using the published question inventory and event fixtures. [Catalog](BAYA_ACHIEVEMENT_CATALOG.md) Â· [Evidence mapping](BAYA_ACHIEVEMENT_DATA_MAPPING.md) Â· [Reward policy](BAYA_ACHIEVEMENT_REWARD_POLICY.md)

Migration 006 adds learner ownership, immutable unlock timestamps and deduplicated event evidence. Home reads persisted unlocks. The feature uses the existing settings, navigation, localization, content and SQLite services. [Architecture](BAYA_ACHIEVEMENT_ARCHITECTURE.md)

The export emitted a 3,063,346-byte application entry and a 139,380-byte worker. No isolated pre-change bundle measurement was captured. The offline inventory contains 258 assets. All badges use local artwork. [UI](BAYA_ACHIEVEMENT_UI_UX.md) Â· [Icon contact sheet](../verification/achievements/all-50-icon-contact-sheet.png)

The mobile suite recorded 1079 passing tests and 19 failures. The focused achievement suite subsequently passed all 12 tests, including catalog-wide reachability, duplicate suppression, learner isolation, module requirements, historic choice exclusion and board completeness.

Failing mobile suites

- components\learner\writing\__tests__\WritingPracticeScreen.recognition.test.tsx
- components\learner\story\__tests__\StorybookTopicScreen.test.tsx
- components\learner\characters\__tests__\CharacterViewer.test.tsx
- components\learner\home\__tests__\LearnerHomeScreen.test.tsx
- database\__tests__\characterActivityService.test.ts
- components\ui\__tests__\SwipeHint.test.tsx
- content\__tests__\characterActivities.test.ts
- modules\characterActivities\matching.test.ts
- modules\characterActivities\__tests__\curriculum.test.ts

Physical Android testing requires an attached device. Browser interaction covered the first real topic unlock and persisted Home integration. Matching and handwriting reachability were exercised in automated fixtures. The full release acceptance gate remains open. [Verification results](BAYA_ACHIEVEMENT_TEST_RESULTS.md)

The final exported app completed offline preparation in an isolated Chrome profile. With network emulation set to offline, a new page load rendered all 50 badges. [Offline reload screenshot](../verification/achievements/offline-reload.png). Earning Offline Adventurer by completing a checkpoint offline still needs end-to-end verification.

All 50 badge containers measured 80 Ã— 80 px at desktop size. The largest horizontal center error was 0 px. TypeScript and production export passed.
