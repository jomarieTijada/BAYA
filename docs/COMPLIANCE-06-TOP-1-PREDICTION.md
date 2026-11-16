# BAYA System Compliance #6 — Top-1 prediction

Implemented and verified on 7 November 2026. Recommendation from the Panel Chair: **“Only the top predicted character will reveal.”** Scope: handwriting recognition presentation only. No commit, push or deployment.

## Original behavior and audit

The active learner route `apps/mobile/app/learner/activities/[topicId].tsx` reaches `WritingPracticeScreen` for writing topics. `BayaWritingGuide` previously read a `predictions` array and rendered ranks 1–3 through `RecognitionMatchRow`, including an “Other matches” / “Iba pang nasuri” section. Compact feedback hid the heading in some configurations but still rendered the alternative rows. It displayed romanized labels and percentages, without a predicted glyph.

This was confirmed with **real inference before editing**: the controlled wave drawing produced HA 94.6%, BA 3.1%, and YA 0.8%, all visible together. See [before screenshot](verification/compliance-06/before-real-inference.png) and [captured text](verification/compliance-06/before-real-inference.json). These values are an observed test drawing result, not a claim about model accuracy.

The target character already appeared separately in `CharacterReferenceCard` and the faint canvas guide; these instructional references remain. Idle, analyzing, empty and error feedback already avoided presenting a prediction. No other active learner candidate-list surface was found in the application/components search. `ConfidenceCard` is a layout/help wrapper, not a second prediction source. No quiz or Adventure Mode surface was changed.

## Recognition pipeline and verified contract

1. `WritingCanvas` retains normalized strokes; Suriin invokes `WritingPracticeScreen.onCheck`. Existing canvas validation rejects insufficient input, and request/version/target guards prevent duplicates and stale responses.
2. `ml/writingRecognition.ts` captures RGBA at 256×256, preserving the existing capture width and geometry handling. `bayaPreprocessing.ts` / `inkImagePreprocessing.ts` prepare the existing 96×96 image tensor.
3. The sole active manifest, `ml/bayaActiveModel.json`, selects **BAYA_ResNet18_1.0.onnx**, model version 1.0, from `/models/baya/BAYA_ResNet18_1.0.onnx`. This is a ResNet18 image-only model, not the historical EfficientNet/BiLSTM models. ONNX Runtime Web 1.30.0 uses WASM and a cached session.
4. Logical input is float32 `image_input` `[1,96,96,1]`; output is float32 `Identity:0` `[1,63]`. The conversion report `ml/deployment/onnx/artifacts/resnet18-1.0/conversion-report.json` records softmax activation. Runtime validation checks shape, finite probabilities in [0,1], and sum within 0.001 of 1. No softmax, clipping or recalibration was added.
5. Inference ranks probabilities descending, resolving equal scores by class index. `BAYA_CLASS_LABELS` derives the exact ordered 63 labels from the active manifest. The existing presentation ranking preserves incoming order for equal scores; it does not change an inference tie decision. The requested internal Top-3 remains available for diagnostics.
6. The existing `isValidWritingResult` requires the Top-1 class to match the target and probability **≥0.80**. Mastery requires **two independent accepted attempts**, as before. There is no local visual-similarity override in this active handler; no similarity calculation was changed.
7. `localLearnerService.recordWritingAttempt` persists the existing top recognized class, raw confidence and valid/invalid decision. Only after the save succeeds and the request remains current does the screen reveal the result and update mastery. Storage fields and schemas are unchanged.

The model is preloaded and performs its existing warm-up inference. This does not reveal a learner prediction. Blank learner input does not start a recognition request; visible-ink validation also remains in preprocessing.

## Changes made

- The discriminated success state now contains **one `prediction`**, not a candidate array. `presentTopPrediction` validates its class/index/probability, copies only required fields, and resolves the existing bundled tracing-glyph asset. It cannot silently substitute the expected character or an arbitrary fallback.
- The adapter covers all 63 classes, including marked forms. Compound labels such as DE/DI identify one existing model class, not two alternative predictions. No class IDs, labels, glyph files or educational mappings were edited.
- The result row displays “Recognized Character” / “Nakilalang Simbolo,” one glyph, its established romanized label, and the unchanged percentage. Rank badges, secondary rows, alternative headings and their unused styles were removed.
- The existing success/retry wording, paper/orange bubble, mascot, feedback panel, controls and reduced-motion behavior remain. A wrong high-confidence class still receives retry feedback and no accepted-attempt credit. A below-threshold matching class still fails acceptance.
- The selected label and percentage have localized accessibility descriptions. The glyph image is decorative alongside the equivalent spoken label. The existing polite feedback live region remains, with no hidden alternative candidates in the rendered tree.
- Language changes use the existing provider and do not invoke inference, clear strokes or reset stars.

## Internal versus displayed information

Full 63-class probabilities remain in the internal inference layer. The request-local Top-3 list remains for existing acceptance evaluation and opt-in development capture. It is not stored in learner feedback state. Development-only diagnostic logs/capture downloads remain behind `__DEV__` and the existing explicit capture switch. No new production logging, handwriting collection or test hook was added.

The browser verification script instruments its own temporary browser session to supply clearly labeled controlled outputs for UI-state tests. This code lives under `scripts/testing`, outside the shipped application. Real inference checks leave the session output untouched.

## Files modified for Compliance #6

Paths are relative to `C:/BAYA`; the working tree already contained earlier compliance and other changes.

| Path | Purpose |
| --- | --- |
| `apps/mobile/components/learner/writing/recognitionPresentation.ts` | Single-prediction presentation type/adapter; validate existing ranking input |
| `apps/mobile/components/learner/writing/WritingPracticeScreen.tsx` | Map request-local results to one UI prediction; preserve acceptance and persistence |
| `apps/mobile/components/learner/writing/BayaWritingGuide.tsx` | Consume single result; remove alternative list/styles |
| `apps/mobile/components/learner/writing/RecognitionMatchRow.tsx` | One glyph, label, confidence and localized descriptions |
| `apps/mobile/localization/en.ts`, `tl.ts`, `messages.ts` | Result heading and confidence accessibility template |
| `apps/mobile/components/learner/writing/__tests__/recognitionPresentation.test.ts` | All-class glyph mapping, full score handling, stable ties and invalid data |
| `apps/mobile/components/learner/writing/__tests__/BayaWritingGuide.test.tsx` | Updated single-result contract |
| `apps/mobile/components/learner/writing/__tests__/WritingPracticeScreen.recognition.test.tsx` | Assert no secondary/hidden predictions; preserve workflow tests; correct stale NGO/NGU fixture index to the existing index 36 |
| `scripts/testing/compliance-06-before.mjs`, `compliance-06-browser.mjs`, `compliance-06-accessibility.mjs`, `compliance-06-accessibility.mjs` | Real-before capture and controlled/real browser verification |
| This report and `docs/verification/compliance-06/` | Audit, screenshots, execution evidence and preservation hashes |

## Preservation checks

[SHA-256 comparisons](verification/compliance-06/preservation-checks.json) confirm the active ONNX file, manifest, model runtime, preprocessing, probability validation, class labels, recognition service, mastery rules, tracing-asset registry and persistence service are byte-for-byte unchanged from the pre-edit snapshot. Source changes do not modify rewards, lesson progress rules, SQLite/Supabase schemas, membership, Module 1 or confidence calibration.

## Testing and visual evidence

Final results:

| Check | Result |
| --- | --- |
| Full Jest: `npm test --workspace apps/mobile -- --runInBand --forceExit --silent` | **71 suites / 689 tests passed** ([log](verification/compliance-06/full-jest.log)) |
| TypeScript: `npx tsc --noEmit -p apps/mobile/tsconfig.json` | Exit 0, no diagnostics |
| Lint: `npm run lint --workspace apps/mobile -- --no-cache` | Exit 0, no errors/warnings |
| Production: `npm run export:web --workspace apps/mobile` | Passed; 163 PWA assets, cache `baya-pwa-c784d5a167925f16` ([log](verification/compliance-06/export.log)) |
| Browser matrix | **62 captures**, no harness failures, no horizontal overflow or detected text clipping; 0 predicted rows before submission/loading/error, exactly 1 after valid results ([report](verification/compliance-06/browser-report.json)) |
| Real model | Online and offline wave input both displayed only HA, 94.6%; actual WASM inference completed with finite normalized output |
| Language/accessibility | Switching Tagalog→English retained strokes, selected result, stars and inference count. Accessibility tree contains only the selected result; English descriptions “BAYA read: HA” and “Confidence: 94.6%” ([evidence](verification/compliance-06/accessibility-switch.json)) |

The initial regression run identified a changed presentation tie-break; it was reverted to preserve stable incoming order, and the full suite was rerun successfully. Existing `--forceExit` use remains because the suite retains open handles; this work does not claim to resolve those handles. Model tests also emit Node's experimental SQLite warning.

All six English/Tagalog contact sheets were visually reviewed, plus full-size compact and real-inference captures. The selected glyph and label fit, the mascot and recognition controls remain clear, and no additional feedback scrolling was required in the captured states. Error/loading copy wraps without clipping. The instructional target and faint guide remain separately visible and are not alternate predictions. Relevant coverage includes all-class glyph resolution, full internal candidate input, invalid/empty/nonfinite outputs, invalid indices and label mismatches, deterministic ties, Top-1-only hidden/visible rendering, blank input, low confidence, wrong classes, failed saves/inference, independent-attempt mastery, duplicate prevention, stale/unmounted requests, retry/back/next and language switching without inference or progress changes.

Browser evidence uses the production PWA and an isolated temporary Chrome profile. The five requested sizes are 667×375, 844×390, 915×412, 1024×768 and 1366×768. Both English and Tagalog cover drawn-before-submit, loading, controlled correct/wrong/low-confidence/error states. `fixture-*` screenshots **are UI test fixtures, not actual model predictions**. Float32 probabilities retain existing truncation semantics: for example the 0.993 fixture displays 99.2% because its float32 representation is slightly below 0.993; no rounding or confidence correction was introduced.

`before-real-inference.png`, `after-real-inference-*.png` and `offline-real-inference-*.png` identify real model execution. The controlled wave drawing is intentionally not a validated handwritten A; successful acceptance screenshots use an explicit fixture. These checks do not measure recognition accuracy or establish calibration.

## Limitations and matrix remark

Native Android/iOS and assistive-technology speech output were not exercised; web DOM accessibility and React Native accessibility properties were checked. High-confidence misclassification remains a separate **Compliance #12** concern. This work does not retrain, calibrate or improve model accuracy, nor claim that 80% is a calibrated probability of correctness.

**Compliance matrix remark:** Replaced learner-facing Top-3 feedback with a single validated Top-1 glyph, label and existing confidence, in English and Tagalog. Kept internal diagnostic predictions, model/preprocessing/class mappings, 80% acceptance threshold, two-attempt mastery and persistence unchanged. Verified submission timing, retry/error behavior and responsive presentation; no alternative candidates are rendered or announced.
