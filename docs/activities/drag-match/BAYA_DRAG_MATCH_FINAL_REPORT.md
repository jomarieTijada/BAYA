# BAYA Drag-and-Match final report

Date: 2026-11-25 (Asia/Taipei).

## Implementation

All normal choice-based Character Level checkpoints now use the shared drag-and-match player: audio to character, character to Latin, and Latin to character. Handwriting continues through its existing canvas and real LiteRT recognition path. Source questions, original options, topic placement, eligibility and prior attempts are preserved.

73 source-backed pairs are scoreable. DE (character-1-q-06) and RE (character-1-q-10) retain explicit pending-audio notices with null correctness. All 75 choice records and all 25 writing records appear in BAYA_MATCHING_QUESTION_MAPPING.csv. There are 26 matching boards plus two pending notices in the current checkpoint distribution. Some source-order/ambiguity boundaries require singleton boards; their easier elimination properties require content-adviser review before research use.

Provisional matches support mouse/touch dragging, tap pairing, keyboard activation, undo and reassignment. Checking saves one independently scored response per source question atomically. Feedback remains visible until Next. SQLite resume, history and retry use existing local storage. BAYA opens the existing shared speech bubble on tap.

## Files

Created: content/characterActivities/matching.ts; components/learner/characterActivities/MatchingChallenge.tsx; modules/characterActivities/matching.test.ts; MatchingChallenge.test.tsx; scripts/activities/report-matching.cjs; scripts/testing/drag-match.mjs, drag-match-offline.mjs, drag-match-android.mjs; this report package and screenshot evidence.

Modified: assessment.ts answer evaluation/parser; characterActivityService.ts transactional matching submission/advancement; CharacterActivityHub.tsx delivery; AssessmentSlide.tsx layout; AssessmentResults.tsx review and unscored denominator; app/_layout.tsx assessment portrait allowance; associated storage/result tests. Full-suite fixes also restored nonvisual glyph accessibility/error handling in StorybookVisual and consistent compact lesson keyboard scrolling in LessonJourney and its tests.

No new dependencies, source-question edits, model edits or remote deployment. Existing unrelated work was preserved. Source questions SHA-256: AC2FC0F73FE3B0610C82C23DEDE7864A6B20A4CF7CF262B491B34B414DEC6281.

## Verification and limits

Full Jest run: 91 suites, 1,093 tests passed. Subsequent focused matching/storage regression: 115 passed. TypeScript, lint and production export succeeded; Expo emits its existing SQLite package-export fallback warning. The production offline browser test verified network-disabled route reload, matching submission, feedback reload, completion and approved audio playback/scoring. No bundle dependency was added; no performance improvement is claimed.

Browser evidence includes all nine requested viewport sizes plus 667×375 and 568×320, mouse drag, emulated touch drag, invalid drop, keyboard pairing, correct/mixed scores, retry, topic checkpoints, audio and Tagalog. At 568×320, central scrolling is intentionally permitted to retain usable touch targets. Actions remain fixed and reachable.

Physical Android was detected, but Chrome is behind Xiaomi application lock (ConfirmAccessControl), preventing its DevTools socket from opening. Device gesture testing and human finger usability are BLOCKED, not passed. Unlock Chrome to execute the prepared Android test. TalkBack/VoiceOver review is not executed. Desktop emulation is not physical-device evidence.

The implementation is available locally on port 8081 with Android USB reverse restored. Final acceptance is conditional on the explicitly outstanding hardware/accessibility and DE/RE content validations.

## Evidence

See BAYA_DRAG_MATCH_TEST_RESULTS.md for 50 cases. Machine logs and screenshots are under docs/verification/drag-match. Browser-final.log contains the final responsive/interaction run; earlier browser.log records diagnostic attempts. offline/browser-results.json records production offline results. android.log records the blocked connection attempt.

Final browser run: 23 checks passed, 0 errors. Production offline run: 5 checks passed, 0 errors. All 11 viewport cases and all choice checkpoint sequences passed. Approved offline audio playback and scoring passed.
