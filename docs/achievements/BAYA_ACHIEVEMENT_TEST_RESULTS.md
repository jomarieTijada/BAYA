# Verification results

## Final acceptance · 27 November 2026

| Test Case ID | Description | Steps | Expected Results | Actual Results | Status |
|---|---|---|---|---|---|
| ACH-01 | Catalog reachability | Evaluate actual published inventory, all thresholds, translations and icon keys. | 50 definitions, five categories, 49 available. | 49 eligible conditions attained with fixtures. Values Hero remains unavailable. [Evidence](../verification/achievements/regression/final-jest.json) | Passed |
| ACH-02 | Full mobile regression | Run the complete mobile Jest workspace. | No failed, skipped or deleted cases. | 93 suites and 1,107 tests passed. [Evidence](../verification/achievements/regression/final-jest.json) | Passed |
| ACH-03 | Version-five database upgrade | Open a populated SQLite file, apply 006, reconcile and reopen. | Existing educational and synchronization records survive; new evidence stays learner-specific. | Snapshot equality, separate learner, historical scores, stable timestamps and zero fabricated events passed. [Evidence](../verification/achievements/regression/final-jest.json) | Passed |
| ACH-04 | First real topic and Home | Complete topic 1-1, open Home and inspect the notice and most recent unlock. | Unang Hakbang and Time Traveler persist. | Home displayed Time Traveler and a new-achievement notification. [Evidence](../verification/achievements/acceptance/home-first-topic.png) | Passed |
| ACH-05 | Character selection and natural playback | Select all fourteen references, repeat a selection and replay the same clip; then play another. | Canonical groups and recording IDs count once each. | First Feather, Seven Symbols, Fourteen Feathers and First Sound persisted. Two distinct recordings counted. [Evidence](../verification/achievements/acceptance/browser-results.json) | Passed |
| ACH-06 | Matching, retry and resume | Save an incorrect first match, restore the attempt, finish, retry and drag the final card. | Scores reflect the first submission and comparable improvement. | 2/3 then 3/3; Pair Pioneer, Triple Connection, Perfect Pairboard, Welcome Back, Second Chance Champion and Practice Makes Progress earned. [Evidence](../verification/achievements/acceptance/browser-results.json) | Passed |
| ACH-07 | Writing recognition | Send actual recorded pointer strokes to the canvas, check A, then submit against a different target. | Empty input gives no credit; model outcome is persisted and target match determines correctness. | Valid A earned both first-writing awards. Wrong target saved invalid with the same confidence. [Evidence](../verification/achievements/learning-Persisted/browser-results.json) | Passed |
| ACH-08 | First launch story and Settings replay | Read all five pages, finish, then reopen the story through Settings and finish. | Distinct story and replay events under the active profile. | BAYA Story Explorer and Story Revisited persisted in a real browser. [Evidence](../verification/achievements/learning/browser-results.json) | Passed |
| ACH-09 | Disconnected completion and restart | Prepare resources, complete prerequisites, reject an uncached request, finish disconnected and cold-start Chrome offline. | Offline Adventurer appears once and its timestamp survives restart. | Verified all earned IDs and timestamps and the Home card. The unready, unfinished, failed, unscored, online and reconnect cases also passed in automation. [Evidence](../verification/achievements/acceptance/cold-offline-restart.png) | Passed |
| ACH-10 | Responsive and bilingual collection | Inspect all 50 badge containers at each of ten sizes, use filters, open details, switch language and scroll to last card. | Icons stay centered and final card remains reachable. | 500 measurements per language; 80 × 80 px containers, max center discrepancy below 0.01 CSS px. All 50 artworks reviewed on the contact sheet. [Evidence](../verification/achievements/learning-Collection/browser-results.json) | Passed |
| ACH-11 | Physical Android | Use Android Chrome, touch drag, disconnected earning, handwriting, landscape and portrait collection. | Saved outcomes and responsive layout survive navigation and QA-tab reopening. | Touch drag and offline reopening passed. Portrait Tagalog final row was unobscured at 384 × 743. OS-text-scale probe measured 15 px at 150% against a 10 px reference. [Evidence](../verification/achievements/learning-Collection-android/browser-results.json) | Passed |
| ACH-12 | Rewards and learner isolation | Return Home after changing the active isolated learner. Reconcile saved progress repeatedly. | Second learner starts empty; existing award timestamps are stable. | First learner displayed BAYA Story Explorer. Second learner displayed No achievements yet and owned zero unlocks. [Evidence](../verification/achievements/learning-Home/browser-results.json) | Passed |

The combined learning run retains an earlier unclear handwriting result. The dedicated handwriting evidence above records the subsequent successful run and wrong-target check. The original individual-suite logs include runs from different stages of correction. Each original failing assertion and stack is preserved separately. Device tests used a local QA origin and a saved human stroke replay.

## Historical implementation verification

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

The isolated Chrome profile started with zero earned achievements. Completing the first instructional topic awarded Unang Hakbang and Time Traveler. Heritage Keeper showed 1/5. Reload retained both awards. Home displayed Time Traveler. Language switching retained the earned count. Screenshots include desktop, portrait, landscape, final row, dialog and empty filter. ADB reported no attached devices.

The final exported app completed offline preparation in an isolated Chrome profile. With network emulation set to offline, a new page load rendered all 50 badges. [Offline reload screenshot](../verification/achievements/offline-reload.png). Earning Offline Adventurer by completing a checkpoint offline still needs end-to-end verification.

All 50 badge containers measured 80 Ã— 80 px at desktop size. The largest horizontal center error was 0 px. TypeScript and production export passed.
