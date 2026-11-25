# BAYA drag-and-match test results

Date: 2026-11-25 (Asia/Taipei). Isolated local QA learners; no remote deployment.

Full suite: 91 suites / 1,093 tests passed. After subsequent keyboard/audio-control and duplicate-advance fixes, the focused suite passed 115 tests. TypeScript, Expo lint and web export succeeded. Production offline reload, submission, feedback reload and completion passed with the network disabled. Physical-device testing is blocked by Chrome app lock.

## Functional cases

| ID | Description | Steps | Expected / actual result | Status | Evidence |
|---|---|---|---|---|---|
| MATCH-A-01 | Question-bank integrity: Original choice records | Count derived source references | 75 unchanged source IDs | Passed | matching.test.ts |
| MATCH-A-02 | Question-bank integrity: Writing records | Count and validate writing bank | 25 unchanged prompts | Passed | content/characterActivities.test.ts |
| MATCH-A-03 | Question-bank integrity: Authoritative keys | Compare each pair against correctLetter | 75 source-key checks pass | Passed | matching.test.ts |
| MATCH-A-04 | Question-bank integrity: Distractors | Check derived relationship only | No distractor converted to a key | Passed | matching.test.ts |
| MATCH-A-05 | Question-bank integrity: Traditional ambiguity | Supply duplicate glyph classes | Board rejected | Passed | matching.test.ts |
| MATCH-B-01 | Board generation: Coverage | Flatten checkpoint boards | All 75 source IDs appear once | Passed | matching.test.ts |
| MATCH-B-02 | Board generation: Determinism | Generate twice | Identical groups | Passed | matching.test.ts |
| MATCH-B-03 | Board generation: Target ordering | Shuffle with fixed attempt seed | Stable nonidentity order | Passed | matching.test.ts |
| MATCH-B-04 | Board generation: Topic boundaries | Generate each checkpoint | No cross-topic pairs | Passed | matching.test.ts |
| MATCH-B-05 | Board generation: Pending data | Validate DE and RE | Unscored notices, no fabricated pairs | Passed | coverage.json |
| MATCH-C-01 | Drag interaction: Mouse drag | Press, move, release onto target | One provisional connection | Passed | browser-results.json |
| MATCH-C-02 | Drag interaction: Invalid drop | Release outside targets | No response or connection | Passed | browser-results.json |
| MATCH-C-03 | Drag interaction: Touch drag | Inject Chromium touch sequence | Provisional connection | Passed | browser-results.json |
| MATCH-C-04 | Drag interaction: Reassignment | Connect a new source to owned target | Old ownership removed | Passed | matching.test.ts |
| MATCH-C-05 | Drag interaction: Human Android finger | Drag on unlocked physical phone | Reliable direct finger control | Blocked | Chrome protected by Xiaomi app lock; no human finger verification |
| MATCH-D-01 | Tap and keyboard: Tap source | Activate left card | Selected accessibility state | Passed | MatchingChallenge.test.tsx |
| MATCH-D-02 | Tap and keyboard: Tap target | Activate source then target | One provisional relationship | Passed | MatchingChallenge.test.tsx |
| MATCH-D-03 | Tap and keyboard: Undo | Activate same pair again | Connection removed | Passed | MatchingChallenge.test.tsx |
| MATCH-D-04 | Tap and keyboard: Keyboard | Focus source and target; Enter | Connection created | Passed | browser-results.json |
| MATCH-D-05 | Tap and keyboard: Partial board | Connect one of three | Check disabled | Passed | MatchingChallenge.test.tsx |
| MATCH-E-01 | Scoring: Per-pair score | Submit correct, swapped, swapped | True/false/false | Passed | matching.test.ts |
| MATCH-E-02 | Scoring: Mixed result | Submit one correct of three in browser | Summary 1 / 3 | Passed | browser-results.json |
| MATCH-E-03 | Scoring: Duplicate submission | Submit again with stale attempt | Original score retained | Passed | characterActivityService.test.ts |
| MATCH-E-04 | Scoring: Atomicity | Submit incomplete board | No responses written | Passed | characterActivityService.test.ts |
| MATCH-E-05 | Scoring: Duplicate advance | Advance stale board twice | State and timestamp unchanged | Passed | final-regression.log |
| MATCH-F-01 | Sound matching: Local asset mapping | Resolve approved prompts | Verified manifest entries reused | Passed | pronunciationMapping.test.ts |
| MATCH-F-02 | Sound matching: Neutral cues | Inspect audio board | Sound numbers only before checking | Passed | audio-matching.png |
| MATCH-F-03 | Sound matching: Played gating | Attempt without audioPlayed | Submission rejected | Passed | matching.test.ts |
| MATCH-F-04 | Sound matching: Pending DE/RE | Evaluate unavailable answer | Null correctness | Passed | matching.test.ts |
| MATCH-F-05 | Sound matching: No overlapping audio | Run controller race tests | One playback owner | Passed | modules/audio/__tests__/controller.test.ts |
| MATCH-G-01 | Topic progression: Vowels | Inspect topic-2-1 board | Only vowel source relationships | Passed | matching.test.ts |
| MATCH-G-02 | Topic progression: Consonants | Inspect topic-2-2 board | Only base consonants | Passed | matching.test.ts |
| MATCH-G-03 | Topic progression: Upper kudlit | Inspect upper checkpoint | Only upper relationships | Passed | matching.test.ts |
| MATCH-G-04 | Topic progression: Lower kudlit | Inspect lower checkpoint | Only lower relationships | Passed | matching.test.ts |
| MATCH-G-05 | Topic progression: Direct-route locks | Open incomplete checkpoint | Prerequisites enforced | Passed | AssessmentRoute.test.tsx and characterActivityService.test.ts |
| MATCH-H-01 | Persistence/results: Board resume | Reload after Check Matches | Feedback restored | Passed | browser-results.json |
| MATCH-H-02 | Persistence/results: Retry | Use completion Retry | New attempt; old history retained | Passed | browser-results.json and SQLite tests |
| MATCH-H-03 | Persistence/results: Offline reload | Disable network after preparation | Matching route restores | Passed | offline/browser-results.json |
| MATCH-H-04 | Persistence/results: Offline submission | Connect and submit without network | SQLite score and summary persist | Passed | offline/browser-results.json |
| MATCH-H-05 | Persistence/results: Legacy parsing | Parse original choice response | Letter, timestamp, correctness unchanged | Passed | matching.test.ts |
| MATCH-I-01 | Accessibility and layout: Shared help | Tap BAYA | Existing speech bubble opens | Passed | MatchingChallenge.test.tsx |
| MATCH-I-02 | Accessibility and layout: Selected state | Activate source | Accessible selected state | Passed | MatchingChallenge.test.tsx |
| MATCH-I-03 | Accessibility and layout: Announcements | Create connection | Live status message | Passed | MatchingChallenge.test.tsx and browser interaction |
| MATCH-I-04 | Accessibility and layout: Reduced motion | Inspect preference integration | Decorative scale disabled; no loops | Reviewed | useReducedMotionPreference hook tests; integration code review |
| MATCH-I-05 | Accessibility and layout: Screen-reader usability | Complete using TalkBack/VoiceOver | Understand connections and feedback | Not executed | Requires specialized manual accessibility validation |
| MATCH-J-01 | Regression: Writing canvas | Run canonical writing tests | Canvas and recognition behavior retained | Passed | jest-results.json |
| MATCH-J-02 | Regression: LiteRT contract | Run model/runtime tests | Model contract unchanged | Passed | jest-results.json |
| MATCH-J-03 | Regression: SQLite ownership | Switch active learner | Foreign writes rejected | Passed | characterActivityService.test.ts |
| MATCH-J-04 | Regression: Navigation | Run route and checkpoint tests | Lesson placement and locks preserved | Passed | jest-results.json |
| MATCH-J-05 | Regression: Build checks | Run TypeScript, lint, export | Successful build; no new packages | Passed | typescript.log, lint.log, export.log |

Evidence paths are relative to docs/verification/drag-match or the named repository test files. No manual validation is represented as an executed automated test. Browser-final.log is the final rerun; browser.log includes earlier diagnostic failures. At 568×320, central scrolling is allowed while actions remain fixed.

Final browser run: 23 checks passed, 0 errors. Production offline run: 5 checks passed, 0 errors. All 11 viewport cases and all choice checkpoint sequences passed. Approved offline audio playback and scoring passed.
