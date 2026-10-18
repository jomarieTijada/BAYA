# Handwriting UI correction — 18 October 2026

**Status: SUCCESS — implemented and verified on web.** This report supersedes the earlier stamp tracker and footer layout described in the stakeholder review. Physical native-device and screen-reader checks remain manual follow-up work.

## Cause and correction

The result branch of `WritingNavigation` always allocated its primary slot to Susunod, even at 0/2 or 1/2. Retry was secondary, and flex-growing action groups stretched across the viewport. The screen also enabled Suriin without checking whether strokes existed. A heading, count, numbered pencil stamps, connecting trail and explanation duplicated the same progress information. Reserved instruction height and stretched feedback sections introduced unnecessary gaps.

The footer now contains two equal-width buttons in a centered group capped at 440 px: outlined **Bumalik** and one filled primary action. Heights are 44 px on compact layouts and 48 px otherwise. It stays below the content at every size. Bumalik retains its previous-character/previous-topic/lessons behavior and is disabled during inference or saving.

| Screen state | Primary action | Behavior |
|---|---|---|
| Empty canvas | Suriin, disabled | Waits for a drawing. |
| Fresh drawing | Suriin, enabled | Submits the current drawing once. |
| Inference or attempt save pending | Sinusuri…, disabled | Blocks duplicate submissions, drawing, undo, clear and footer navigation. |
| First accepted drawing, 1/2 | Ulitin | Clears this drawing/result and retains the first star. |
| Rejected result or inference/save error | Ulitin | Prepares a fresh drawing, retaining earned progress. |
| Second accepted drawing, 2/2 | Susunod | Advances only when pressed; no automatic navigation. |
| Final exercise of final topic | Mga Paksa | Uses the existing topic-completion save and navigation. |

Susunod is absent before completion. Result canvases stay locked until Ulitin prepares a fresh attempt, at which point Suriin reappears. A synchronous mastery guard also prevents a stale retry callback from clearing the completed, locked canvas. Burahin is now an icon-only 44 px control with its existing accessible label; undo remains beside it.

## Visual design and instruction

The three-column reference/canvas/feedback layout remains. The feedback card fits its contents: small **Pagsusuri** heading, two stars, full top-three prediction result and BAYA mascot. The mascot stays in that panel even on short phones. The canvas receives the remaining height; no footer mascot or duplicate action row competes with it.

The tracker contains exactly two icon-only achievements and an external **0/2**, **1/2** or **2/2** counter. An outlined star indicates pending progress; a gold filled star with a small dark check indicates an accepted drawing. There are no pencil icons, numbered tiles, labels inside stars or connecting bars.

| State | Instruction above the canvas controls |
|---|---|
| Initial | Isulat ang simbolo at makakuha ng bituin! |
| First success | Magaling! Isa pa para makapagpatuloy! |
| Complete | Mahusay! Maaari ka nang magpatuloy! |
| Unsuccessful | Subukan muli! Isulat ulit ang simbolo. |

**Paano ito gumagana?** still opens the optional explanation without resizing the canvas, changing strokes or altering progress. It describes the policy accurately: two stars, correct top-ranked class, at least 80% raw model confidence, a fresh drawing and a successful save. It explicitly says confidence is not a handwriting grade. The count and threshold are interpolated from the centralized policy.

## Icons, motion and accessibility

Reused existing `AppIcon` mappings to **Ionicons star-outline, star and checkmark**, including the existing locally bundled SVG paths on web. Source: [Ionicons](https://ionic.io/ionicons), [MIT license, copyright 2015–present Ionic](https://github.com/ionic-team/ionicons/blob/main/LICENSE). No new package, downloaded asset or runtime internet dependency.

Existing [React Native Animated](https://reactnative.dev/docs/animated) performs a scale from 0.85 to 1.1 over 140 ms, followed by a damped spring to 1. Each star animates only when its accepted state changes from false to true. The second star provides the final reward. There are no loops, layout changes, sound effects or blocking transitions. Saved count updates drive the animation; animation never writes learner data.

Reduced motion is static, including while the preference is initially unknown. Rerenders, remounts with already completed progress, failed recognition and retry do not replay the reward. Animation setup failure retains the correct static state. Accessible progress values, accepted/pending badge labels and polite instruction announcements remain. Icons supplement shape/check differences rather than depending on color alone.

## Integrity

The policy remains **two accepted drawings**, with matching top-ranked class and **raw confidence ≥0.80**. No changes to ONNX, EfficientNet-B0 + BiLSTM, class mapping, preprocessing, SQLite schema/services or backend. The count changes only after `recordWritingAttempt` resolves successfully. Failed saves, errors, duplicate submissions, clear, undo and rejected predictions cannot award a star. Earlier accepted progress survives retry/failure. A new character resets session progress; rotation preserves the mounted session. Saved history and completed topics retain existing persistence behavior.

## Verification

Final checks used the repository scripts:

| Check | Result |
|---|---|
| `npm test --workspace=apps/mobile -- --runInBand --forceExit` | **53 suites, 529 tests passed**, including focused action/indicator/instruction/recognition tests and persistence/model regression tests. |
| `node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json` | Passed. |
| `npm run lint --workspace=apps/mobile` | Passed: **0 errors, 14 existing warnings**. |
| `npm run export:web --workspace=apps/mobile` | Passed; PWA cache `baya-pwa-8d059f60df1d0b40`, **164 assets**. |
| Deterministic Chrome UI fixture | **41 state/layout checks passed**, no runtime exceptions. |
| Production Chrome | All four requested sizes passed; actual online and offline recognition succeeded; no runtime exceptions. |
| `node scripts/verify-baya-pwa-browser.mjs` | Passed: cached model/WASM available offline, **three offline inference runs**. |

The fixture covers **667×375, 844×390, 1024×768, 1366×768**, plus **1536×864**. It checks ready, drawing, analyzing, first success, clearing after success, rejected 0.79 result, second success and new character, plus inference error. Assertions cover equal button widths, touch-target height, visible actions/canvas/feedback, no horizontal overflow or unnecessary scrollbars, help preserving geometry/strokes, duplicate taps and blocked canvas mutations during inference. Sampled animation transforms confirm a real pop; **45 reduced-motion samples remained static**. Simulated Android portrait/landscape transitions retained 1/2 progress. Screenshots were visually inspected for all six requested interaction states and the desktop-sized correction.

**Fixture distinction:** only the recognition function is replaced in an isolated development browser. Actual screen handlers and SQLite persistence execute. Fixture screenshots carry a visible label; their 92% and 79% values are simulated and are not model accuracy evidence. Separately, the unmodified production model recognized the test stroke as NGA (63.4% online, 64.7% offline), correctly rejected it for target A, retained 0/2 and exposed Ulitin. Offline reload restored the screen and inference assets; this is handwriting offline verification, not a new claim about video caching.

Unchanged model SHA-256: `32b63d2f36802e5792006c07f18bcc1aead2f9d20ed1181edc1feebf59ab70b1` (17,175,276 bytes, model 1.1).

## Evidence

Local QA artifacts are under `sandbox/handwriting-ui-correction/` (ignored, not application code). Representative actual UI captures:

| State | Screenshot |
|---|---|
| Ready | [667×375](../sandbox/handwriting-ui-correction/667x375-ready.png) |
| Drawing | [667×375](../sandbox/handwriting-ui-correction/667x375-drawing.png) |
| First accepted | [1536×864](../sandbox/handwriting-ui-correction/1536x864-first-accepted.png) |
| Failed after first success | [844×390](../sandbox/handwriting-ui-correction/844x390-failed.png) |
| Second accepted | [667×375](../sandbox/handwriting-ui-correction/667x375-second-accepted.png) |
| New character | [844×390](../sandbox/handwriting-ui-correction/844x390-new-character.png) |
| Real offline model result | [844×390](../sandbox/handwriting-ui-correction/production-offline-real-model-result.png) |

Machine-readable evidence: `fixture-results.json`, `production-browser-results.json`, `pwa.json`. Final logs: `tests-final.log`, `typescript-final.log`, `lint-final.log`, `export-final.log`. Browser harnesses: `check-fixture.mjs` and `check-production.mjs`.

## Files changed in this correction

Paths below are relative to the repository. Earlier stakeholder/environment changes already present in the working tree were preserved.

- `apps/mobile/components/learner/writing/WritingNavigation.tsx` — state-specific primary action and balanced footer.
- `apps/mobile/components/learner/writing/WritingPracticeScreen.tsx` — authoritative action phase, empty-canvas enablement, stale retry guard, fixed footer and layout.
- `apps/mobile/components/learner/writing/WritingToolbar.tsx` — icon-only clear control.
- `apps/mobile/components/learner/writing/WritingMasteryIndicator.tsx` — compact stars and external count.
- `apps/mobile/components/learner/writing/WritingMilestoneBadge.tsx` — star/check presentation and completion motion.
- `apps/mobile/components/learner/writing/WritingInstructions.tsx` — short state-aware copy and compact placement.
- `apps/mobile/components/learner/writing/ConfidenceCard.tsx` — small feedback heading.
- `apps/mobile/components/learner/writing/BayaWritingGuide.tsx` — tighter result/mascot spacing.
- `apps/mobile/components/learner/writing/__tests__/WritingNavigation.test.tsx` — **new**, action-state contract.
- `apps/mobile/components/learner/writing/__tests__/WritingPracticeScreen.recognition.test.tsx` — action/empty/stale callback regression coverage.
- `apps/mobile/components/learner/writing/__tests__/WritingMasteryIndicator.test.tsx` — star states, animation/reduced-motion/fallback checks.
- `apps/mobile/components/learner/writing/__tests__/WritingInstructions.test.tsx` — revised copy and policy-derived help.
- `docs/stakeholder-feedback-review.md` — current correction status and historical distinction.
- `docs/handwriting-ui-correction.md` — **new**, this report.

No files deleted, dependencies added, commits created, pushes or deployments performed. The earlier offline-video limitation remains recorded in the stakeholder review and is outside this UI correction. Native hardware and assistive-technology behavior have not been exercised; browser emulation and Jest are not substitutes for those checks.
