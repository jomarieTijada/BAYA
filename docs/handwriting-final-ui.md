# Pagsusuri actions and guided help — 18 October 2026

**SUCCESS — implemented and verified on web.** This later request supersedes the bottom-footer and inline-help designs in the earlier reports. Physical native-device and screen-reader QA remain unverified.

## Previous and current structure

The earlier correction put actions in a full-width footer to keep them reachable. This separated recognition feedback from its next action and consumed vertical writing space. The later inline help disclosure occupied the feedback scroll region and moved the stars/results downward when opened.

The current Pagsusuri hierarchy is:

1. Fixed **Pagsusuri** heading and question-mark help control.
2. Exactly two achievement stars, with no visible numeric count.
3. Internally scrollable prediction/feedback/mascot region.
4. One fixed primary action inside the card.

The full-width action footer, its styles and duplicate Back button are removed. Undo and erase remain beside the canvas. Back is consolidated into the existing top-left header: previous character, previous topic at a boundary, or lessons from the first character. It uses the existing guarded previous-navigation handler, preserving that workflow without a duplicate footer control. Busy inference/save guards still apply.

The action area does not scroll with feedback. Its button is at least 44 px high (48 px at larger sizes), capped at 280 px wide and uses existing BAYA colors and radii. On short screens the mascot is smaller and the feedback region may scroll; the action and stars remain reachable. No separate mobile/desktop implementation was introduced.

| Authoritative state | Primary action inside Pagsusuri |
|---|---|
| Empty canvas | Disabled Suriin |
| Fresh drawing | Enabled Suriin |
| Inference/attempt persistence | Disabled Sinusuri… |
| First accepted drawing | Ulitin, retaining the first earned star |
| Rejected prediction or error | Ulitin, retaining any earned stars |
| Two accepted drawings | Enabled Susunod; advances only when pressed |
| Final character of final topic | Existing Mga Paksa completion action |

## Guided pop-up

`ConfidenceCard` owns only help visibility and attention motion. `WritingHelpGuide` is mounted in a transparent React Native Modal above the unchanged lesson tree. Its title is **Paano Makakuha ng Bituin?**. It has a persistent 44 px close control, simple guide navigation, a scrollable body for short screens, rounded light surfaces and highlighted action words.

| Step | Exact main message | Real target |
|---|---|---|
| 1 | Tingnan ang simbolong isusulat mo! | Reference panel |
| 2 | Isulat ang simbolo rito! | Drawing canvas |
| 3 | Pindutin ang Suriin kapag tapos ka na! | Actual primary action, only while it is Suriin |
| 4 | Makakuha ng dalawang bituin upang makapagpatuloy! | Two stars |
| 5 | Kapag nakuha mo na ang dalawang bituin, pindutin ang Susunod! | Actual completion action, only after mastery |

Guide controls are **Susunod na Gabay**, **Bumalik** after the first guide, and **Tapos Na** on the last. **Isara ang gabay** and Escape/native request-close dismiss it at any step. Focus returns to the help control. The standard Modal provides focus containment on web. The help control exposes expanded state and remains recognizable without animation.

Real refs are measured with `measureInWindow`; no model or lesson state is changed to demonstrate an action. The spotlight uses a gold outline and four dimmed surrounding regions. It remeasures after viewport/inset changes. Popup placement selects a safe corner with the least overlap with the target. On narrow landscapes it can partially cover the target area as a modal, while preserving the visible spotlight and all underlying drawing data. Where no reliable target is measured, or the action is not currently available, a static illustration and label inside the popup explain the step. It never inserts or enables a fake Suriin/Susunod button in the lesson.

**Dagdag na Paliwanag** is optional inside the popup and explains:

> Kailangang ang unang nakilalang simbolo ni BAYA ay ang ipinapasulat, na may hindi bababa sa 80% kumpiyansa.
>
> Ang 80% ay kumpiyansa ni BAYA sa pagkilala, hindi grado ng iyong sulat.
>
> Bawat natanggap at bagong naitalang sulat ay isang bituin. Hindi binibilang muli ang parehong guhit. Kailangan ng 2 bituin upang magpatuloy.

The count and confidence are derived from the existing centralized policy. The goal uses “dalawang bituin” for the approved count of two.

## Motion and progress

- **Help:** the existing Ionicons question mark stays at a stable size. A soft gold/orange halo fades up and down twice (450 ms in, 600 ms out per cycle) when motion is allowed on initial display. It then stops. Opening help stops it immediately; closing does not restart it.
- **Next incomplete star:** stays outlined with no check or fill. After a 700 ms pause, it makes one quiet 1 → 1.04 → 1 breathing cycle with a faint warm halo. Only the next available achievement gets this emphasis. It does not run an endless loop or repeat on failed-result rerenders.
- **Newly earned star:** fills and gains a check only from authoritative accepted progress. It pops from 0.85 to 1.1 and springs back, accompanied by a brief glow. The final star reaches 1.16 and has a slightly longer glow fade.
- **Already earned:** remains filled without replaying the completion animation on rerender/remount.
- **Reduced motion/unknown preference:** static state. Animation setup failure leaves the correct icon state intact.

All motion uses existing React Native Animated, without a new dependency or online asset. Existing Ionicons star-outline/star/checkmark/help-circle-outline assets are reused ([Ionicons](https://ionic.io/ionicons), [MIT license](https://github.com/ionic-team/ionicons/blob/main/LICENSE)). The halo is decorative, not another achievement.

Visible **0/2, 1/2 and 2/2** fractions are removed, not replaced with a bar or percentage. The internal count and accessible progress values remain. Filipino announcements include **Isa sa dalawang bituin ang nakuha.** and **Nakuha na ang dalawang bituin. Maaari nang magpatuloy.**

## State and data integrity

The requirement remains two fresh accepted drawings, correct top-ranked class and raw model confidence **≥0.80**. A star is awarded only after SQLite attempt persistence succeeds. Duplicate checks, failed recognition, low confidence, clear, retry and errors do not grant progress. Earlier earned stars survive failure/retry. Topic completion/history semantics are unchanged.

No model, ONNX inference, preprocessing, class ordering, SQLite schema/services, Supabase or sync changes. `WritingCanvas` only gains a measurement ref and `collapsable={false}`; its drawing/coordinate logic is unchanged. Opening/closing help does not remount the canvas, alter strokes or invoke recognition. Once closed, the Modal is unmounted and no touch interceptor remains.

## Verification

- `npm test --workspace=apps/mobile -- --runInBand --forceExit`: **55 suites / 535 tests passed**. Includes help-step/target/layout tests, action states, motion and accessibility state, deferred-save guards, duplicate taps, failure/retry preservation, canvas, model and SQLite regressions.
- `node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json`: passed.
- `npm run lint --workspace=apps/mobile`: **0 errors, 14 existing warnings**.
- `npm run export:web --workspace=apps/mobile`: passed; **164 precached assets**, cache `baya-pwa-a4a925fc121bd83e`.
- Production Chrome: all four requested sizes, all five guides, keyboard Escape, close/finish, target resize tracking, technical disclosure, real ONNX results and offline guide/inference passed; **zero runtime exceptions**.
- Sampled help halo and pending-star transforms confirmed actual motion at all four sizes. **152 reduced-motion samples remained static** in the final production run.
- Development fixture: **41 state checks** across the four requested sizes plus 1536×864 passed, including first/second acceptance, low-confidence rejection, clearing, duplicate taps, inference error, orientation and reduced motion. Fixture screenshots carry a simulated-recognition banner. Only recognition predictions are replaced; the screen handlers and SQLite saves execute normally. They are not model accuracy evidence.

The production harness compared the exact canvas DOM node, bounds, SVG paths, mastery value and result across all help steps and after closing. All remained unchanged. A new stroke could be added after closing, proving no invisible overlay remained. After a viewport change, normalized stroke paths stayed intact and the measured spotlight matched the canvas again.

| Viewport | Current canvas (CSS px) | Prior height with footer | Current height |
|---|---|---|---|
| 667 × 375 | 293.625 × 209 | 148 | 209 |
| 844 × 390 | 385.40625 × 224 | 163 | 224 |
| 1024 × 768 | 429.546875 × 528 | 467 | 528 |
| 1366 × 768 | 606.890625 × 528 | 467 | 528 |

Primary actions remained inside Pagsusuri and within the viewport in every checked state. Any vertical scrolling is confined to feedback or the popup body; there is no document horizontal overflow. Screenshots were inspected, including small landscape ready/result states and every guide target.

## Screenshots and logs

Representative captures in the ignored `sandbox/handwriting-final/` QA folder:

| State | Screenshot |
|---|---|
| Initial | [667 × 375](../sandbox/handwriting-final/ready-667.png) |
| Drawing | [667 × 375](../sandbox/handwriting-final/drawing-667.png) |
| First accepted — fixture | [1366 × 768](../sandbox/handwriting-final/1366x768-first-accepted.png) |
| Failed — fixture | [667 × 375](../sandbox/handwriting-final/667x375-failed.png) |
| Second accepted — fixture | [667 × 375](../sandbox/handwriting-final/667x375-second-accepted.png) |
| Reference guide | [1366 × 768](../sandbox/handwriting-final/guide-1-1366.png) |
| Canvas guide | [667 × 375](../sandbox/handwriting-final/guide-2-667.png) |
| Suriin guide | [667 × 375](../sandbox/handwriting-final/guide-3-667.png) |
| Stars guide | [667 × 375](../sandbox/handwriting-final/guide-4-667.png) |
| Unavailable Susunod illustration | [667 × 375](../sandbox/handwriting-final/guide-5-667.png) |
| Guide closed | [667 × 375](../sandbox/handwriting-final/guide-closed-667.png) |
| Resized spotlight | [844 × 390](../sandbox/handwriting-final/guide-resized-canvas.png) |

Machine-readable evidence: `production-results.json` and `fixture-results.json`. Commands/harnesses: `check-production.mjs` and `check-fixture.mjs`. Final logs: `tests-final.log`, `typescript-final.log`, `lint-final.log`, `export-final.log`, `browser-final.log`.

## Files changed in this iteration

Modified components:

- `apps/mobile/components/learner/writing/WritingPracticeScreen.tsx` — refs, header Back, panel action placement, removed footer, compact mascot sizing.
- `apps/mobile/components/learner/writing/WritingNavigation.tsx` — single primary action, no duplicate Back.
- `apps/mobile/components/learner/writing/ConfidenceCard.tsx` — fixed progress/action slots, halo, modal visibility; removes superseded inline help.
- `apps/mobile/components/learner/writing/WritingMasteryIndicator.tsx` — no visible fraction, Filipino accessibility values, next-star state.
- `apps/mobile/components/learner/writing/WritingMilestoneBadge.tsx` — idle/earned motion and warm glow.
- `apps/mobile/components/learner/writing/WritingCanvas.tsx` — measurement ref only.

Created components/helpers:

- `apps/mobile/components/learner/writing/WritingHelpGuide.tsx`
- `apps/mobile/components/learner/writing/writingGuideLayout.ts`

Tests: updated `WritingNavigation.test.tsx`, `ConfidenceCard.test.tsx`, `WritingMasteryIndicator.test.tsx`, `WritingPracticeScreen.recognition.test.tsx`; created `WritingHelpGuide.test.tsx`, all under `apps/mobile/components/learner/writing/__tests__/`.

Documentation: updated `docs/stakeholder-feedback-review.md`; created this report. No files deleted, packages added, commits, pushes or deployments. Earlier unrelated working-tree changes remain intact.

## Limits

Physical native devices and assistive technology were not exercised. When a measured spotlight is unavailable, the popup uses its stable instructional illustration. On the shortest screens, some mascot content may require internal scrolling; the primary action is pinned and all top-three predictions remain accessible. Existing lint/asynchronous test warnings remain. The historical video-caching limitation is outside this handwriting task.
