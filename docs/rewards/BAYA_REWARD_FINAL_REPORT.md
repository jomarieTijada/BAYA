# BAYA Stars and rewards verification report

The local production export implements earning, spending, assessment assistance, animated completion and per-attempt review. The tested PWA build is `baya-pwa-e55b528880564789`. Verification used isolated learner profiles. The implementation is in the working tree.

## Learning and reward behavior

First-time topics award 2 Stars, modules 5, eligible correct matching and handwriting sources 1, and a completed checkpoint 3. A genuine achievement unlock awards its catalog value of 1–5 Stars. The 50 definitions include 49 currently attainable awards. Values Hero awaits approved educational content. A confirmed clue costs 2 Stars.

The implementation reuses the existing curriculum, learner identity, achievement evaluation, approved question bank, SQLite transaction runner, audio controls, LiteRT writing model, modal and mascot. Assessment correctness and level progression continue through their existing services. The append-only ledger supplies the dashboard and review. Policy version 1 retains historical XP independently and backfills only proven achievement unlocks.

Matching help reveals the approved reading and glyph. Writing help uses an approved alternate example or kudlit placement. A revealed match can receive its actual score but cannot receive the question credit on that assisted attempt. Completion, review and retry read previously persisted outcomes. The summary groups by attempt and shows per-response assistance, correctness and actual signed transactions. Older completed attempts from the same learner and checkpoint can be selected in review.

## Verification

| Check | Result |
|---|---|
| Achievement-release baseline | 1,107 passed in 93 suites |
| Final mobile Jest run | 1,113 passed in 93 suites, 0 failed |
| TypeScript, Expo lint and production web export | Passed |
| SQLite migration | Version 6 upgraded with original unlock timestamp, notification state and evidence intact. Reconciliation granted one credit across two calls |
| Offline matching | Six instructional topics completed through the UI, three scored attempts, paid assistance, history and offline restart on desktop and physical Android Chrome |
| Handwriting | Desktop and Android each submitted all 25 questions through the real canvas and local model. One BA target earned a writing credit |
| Low funds and localization | Purchased hints until funds fell below cost. Learner continued answering. Captured reduced motion and Tagalog wallet |
| Sound and touch drag | Android replayed the approved BA clip twice for free, purchased one hint and completed the sound match with a touch drag |
| Responsive results | Checked the action buttons at nine desktop-emulated sizes from 320 × 568 to 1440 × 900 and inspected physical Android landscape |

Two earlier runs exceeded existing timeouts while browser verification was active. One timed out in the email-learner logout test after 5 seconds, and the other timed out in the final handwriting lesson test after 15 seconds. The final run used the same assertions and timeouts with browser verification finished. Expo reported its existing SQLite web module-resolution fallback during export.

| Evidence directory | Passed checks | Screenshots |
|---|---:|---:|
| android | 13 | 24 |
| android-sound | 4 | 2 |
| android-writing | 3 | 4 |
| desktop | 13 | 33 |
| desktop-low-funds | 4 | 3 |
| desktop-sound | 3 | 1 |
| desktop-writing | 3 | 4 |

The browser reports and screenshot sequences are under [verification/rewards](../verification/rewards). The writing, sound and insufficient-funds runs arranged topic prerequisites with the normal service. The writing tests replayed an archived human trace and used the model's predictions. The Android run used the physical phone's Chrome browser. Offline testing rejected uncached network requests through Chrome network emulation and exercised the installed service worker. These runs do not measure native APK behavior, airplane-mode radio behavior or animation frame rate.

## Production export

| Item | Baseline | Current | Change |
|---|---:|---:|---:|
| Application JS bytes | 3,065,298 | 3,083,176 | +17,878 |
| SQLite worker bytes | 139,380 | 139,380 | +0 |
| Service worker bytes | 140,042 | 140,042 | +0 |
| Offline assets | 258 | 258 | +0 |
| Offline package bytes | 113,606,747 | 113,624,625 | +17,878 |

## Implementation files

| Area | Files created or updated for this feature |
|---|---|
| New reward logic | `apps/mobile/modules/rewards/{policy,wallet,hints}.ts` |
| New learner controls | `apps/mobile/components/learner/rewards/{WalletButton,HintButton,RewardCelebration}.tsx` |
| Database and educational events | New `apps/mobile/database/migrations/007_star_wallet.sql`. Updated migration registry, `localLearnerService.ts` and `characterActivityService.ts` |
| Achievements | Catalog and achievement types, reconciliation service and AchievementCard |
| Learner UI | LearnerHeader, LearnerHomeScreen, QuestionScreen, MatchingChallenge, CharacterActivityHub, AssessmentResults and CompletionDialog |
| Regression tests | `database.test.ts` and `characterActivityService.test.ts` |
| Browser acceptance | Updated achievement acceptance entry point and device browser startup. Added reward, sound, low-balance and writing acceptance scripts in `scripts/testing` |
| Documentation and evidence | Seven documents in `docs/rewards`, historical achievement policy cross-reference and local export/browser/test evidence in `docs/verification/rewards` |

Star balances are local to the device and learner profile. Formal unassisted evaluation is a build setting. The live product uses the learning-mode policy unless configured otherwise. The screenshots include genuine learner outcomes, and the animation evidence is a frame sequence.
