> Follow-up: [final investigation and verification](COMPLIANCE-12-FINAL-VERIFICATION.md) includes validity scores, real-UI false mastery reproduction, and the independent-data blocker.

# Compliance Matrix No. 12 — dual ResNet18 integration

Status: **partially addressed; real-handwriting validity rejection remains pending validation.** This report supersedes the runtime/model claims in the earlier high-confidence report, whose historical measurements remain intact. No models were retrained, weights modified, or deployment performed.

## Initial findings, reported before implementation

The panelist concern is incorrect/incomplete handwriting receiving high-confidence character predictions. At inspection, the working tree already contained extensive compliance and UI edits. These were preserved. `WritingCanvas.tsx`, `DrawingCanvas.tsx`, and `content/writingEngine.ts` capture normalized strokes. `writingCanvasValidation.ts` checks finite coordinates, at least 3 meaningfully spaced points, normalized travel >=0.07, extent >=13/1000, at most 4000 points, and consistent optional timestamps. These are input sufficiency safeguards, not Baybayin shape validation.

`writingRecognition.ts` rasterizes submitted strokes alone onto a white 256-square image, preserving canvas aspect ratio. `bayaPreprocessing.ts` and `inkImagePreprocessing.ts` composite alpha over white, convert Pillow grayscale, invert to ink (black=1, white=0), crop above 0.08, center with 15% padding, and perform Pillow-compatible bilinear resize to 96-square float32 NHWC. The historical implementation supplies the minimum-two-pixel padding/rounding details omitted by the short uploaded JSON; its golden fixtures remain exact. The original training image set and full new training source were not supplied, so this does not independently prove new training-data provenance.

ONNX Runtime Web 1.30.0/WASM was already integrated, with cached sessions, output validation, tensor disposal, and native unsupported-platform errors. The former public model was `BAYA_ResNet18_1.0.onnx`. The new models have symbolic batch axes; the old strict fixed-batch validator would reject them. Neither pixel reversal nor label-index errors were found in the current path.

The central problem is forced classification among 63 known classes: a softmax score measures preference among these classes, not the probability that the drawing is acceptable Baybayin. No calibrated validity detector was enabled. `writingMastery.ts` already required Top-1 class-ID equality with the lesson target and the historical 0.80 confidence requirement; two successful attempts earn mastery. That rule never accepted a different class merely for high confidence. It can still accept a scribble when its predicted class equals the target. Calibration/distribution shift are plausible contributors, not individually established causes.

`recognitionReliability.ts` already provided gentle uncertainty below the existing threshold, without recording an invalid attempt or awarding mastery. The 0.80 rule was preserved to avoid changing established progress behavior; it is not newly approved or validated for these candidates. Low confidence is informational retry guidance, not definitive invalid-input evidence. `recognitionPresentation.ts`, `ConfidenceCard.tsx`, `RecognitionMatchRow.tsx`, and `BayaWritingGuide.tsx` retain the existing Top-1 learner design. No active local visual-similarity calculation was found in this writing path; no similarity score was invented or blended with confidence. Reference artwork is not a similarity grade or stroke-order check.

## Implementation and final structure

Runtime assets are under `apps/mobile/public/models/baya/`, matching the established Expo/PWA convention:

- `baya_character.onnx`
- `baya_validity.onnx`
- `id_to_label.json`, `label_to_id.json`
- `preprocessing_contract.json`
- `validity_thresholds_research.json`
- `dual_onnx_contracts_research.json`
- `character_runtime_contract.json` (application manifest, not an additional model)

The original research directory remains untouched. ONNX SHA-256 values are preserved:

- Character: `7f47f008bb2cf858663ea2355685bc35bddda855161a3ec895396c4385f4b4e6` (44,974,469 bytes).
- Validity: `0c341f8e2dabc3f20c5efd8743d35d6e27399a8cb9b9adde2be17a06da6ea7c8` (44,942,257 bytes).

The previous active model and its metadata moved to the established `ml/rollback/models/baya/` archive. Only two ONNX files remain in public/exported assets. Metadata filenames now match the renamed files. Old parity claims were removed from the active manifest instead of being attributed to new weights.

Responsibilities remain in `apps/mobile/ml/`:

- `bayaActiveModel.json` / `bayaModelConfig.ts`: selected artifact, dimensions and deployment metadata.
- `bayaModel.web.ts`: shared WASM runtime and separate lazy character/validity sessions; symbolic batch metadata accepted only on axis zero, fixed remaining dimensions validated; actual output dimensions remain strict; load failures retry and tensors are disposed.
- `bayaClassLabels.ts`: authoritative uploaded `id_to_label.json`, checked against manifest order. Tests verify the inverse map and all 63 indices.
- `bayaPreprocessing.ts` / existing `inkImagePreprocessing.ts`: uploaded-contract checks and unchanged preprocessing.
- New `validityDetector.ts`: finite sigmoid decoding, exact research thresholds and explicit feature flag.
- `writingRecognition.ts`: same captured tensor for both models when research gating is enabled. `BayaModelError.ts` adds an experimental uncertainty outcome. `bayaModel.ts` retains native unsupported behavior.
- `WritingPracticeScreen.tsx`: experimental review/reject outcomes use existing uncertain feedback, stop before persistence/mastery, and preserve retry. Normal target comparison and progress are unchanged.
- `scripts/generate-pwa-service-worker.mjs`: retains both binaries and metadata in the export; precaches character/metadata, leaves validity binary optional and caches it on request. Content-derived cache version changes prevent using the former model URL as the new model.

Actual ONNX checker/graph inspection confirms opset 17, float input `image_input` `[batch,96,96,1]`, and `Identity:0` outputs `[batch,63]` with terminal Softmax and `[batch,1]` with terminal Sigmoid. No extra softmax/sigmoid is applied. Both sessions run successfully in Python CPU and browser WASM.

Research gating defaults off. Explicit development opt-in: `EXPO_PUBLIC_BAYA_EXPERIMENTAL_VALIDITY=true` before starting Expo. It also requires `__DEV__`; production builds remain disabled even if the environment flag is set. Exact thresholds: pass >=0.9605122804641724; reject <0.6407943367958069; otherwise review. Both review/reject use uncertain feedback, not a definitive invalid-character claim. Missing/malformed thresholds keep gating disabled. Disabled gating never calls the validity model. Experimental inference failures use technical-error feedback rather than silently penalizing the learner.

The supplied research metadata reports 4,480 synthetic negative images, zero reviewed real negatives, and `deployment_approved:false`. Writer identities were not verified; splitting is file-level. Reported character accuracy 97.46% and macro-F1 97.44% are research results, not independently reproduced accuracy here. Thresholds and observed sigmoid behavior are research evidence, not production approval.

## Actual verification

Evidence: `docs/verification/compliance-12/dual-model/`.

- Full existing Jest suite: **76 suites / 735 tests passed** before final focused additions. Final affected runtime/PWA tests: **3 suites / 47 tests passed**; final writing UI suite: **54 tests passed**. These overlapping counts must not be added. Two additional cases cover research pipeline gating and UI persistence/mastery barriers.
- TypeScript `tsc --noEmit`: passed. Expo lint: passed. Final Expo web export and service-worker `--check`: passed. Logs are included. Jest's existing forced-exit/open-handle advisory remains; this run is not proof that the entire app has zero open handles.
- Existing tests cover blank/insufficient input, malformed points, correct and wrong targets, high-confidence wrong-target answers, uncertain results, failure/retry, class-map corruption, preprocessing, repeated inference/disposal, progress and unrelated screens. New tests cover supplied hashes/maps, symbolic batch dimensions, validity decoding/threshold boundaries, default-off inference, explicit gating and uncertainty before persistence.
- ONNX checker passed for both actual files. Python CPU reference outputs were generated for **16 historical image fixtures**. Browser Chromium WASM used production service and preprocessing code on identical inputs. All 16 Top-1 outputs match; max character difference **4.76837158203125e-7**; max validity difference **1.1920928955078125e-7**; preprocessing max difference **0**. Separate existing preprocessing tests cover 109 historical glyph/edge fixtures. These fixtures establish regression/parity, not new-model accuracy on independent handwriting.
- Headless Chromium with 844x390 mobile viewport emulation: character cold load+first inference ~843 ms, validity ~534 ms, warm means ~43.86 ms and ~43.62 ms. Local server, desktop hardware, one run: no physical-mobile/network guarantee. Two total model requests, one per artifact; session reuse and default-off lazy loading passed. Production flag lockout passed. Unit tests verify tensor disposal, but native/WASM peak-memory profiling was not performed.
- All **eight** exported assets match source bytes; two and only two ONNX files; validity excluded from precache. Service-worker policy tests passed. A new installed-device/offline restart test and full actual-UI browser regression were not run for these weights; previous model screenshots are historical, not new evidence.
- Critical unresolved example: the procedural wave from production stroke capture predicts **HA at 0.9873320460319519** (98.7% displayed). Against a different target it earns no credit; against HA it can still qualify under existing mastery rules when validity gating is disabled. This is explicitly not reliable random-scribble rejection. No shape-specific exception was introduced.

Reproduce from repository root:

```powershell
python scripts/testing/verify-dual-resnet.py
node scripts/testing/verify-dual-resnet-browser.mjs
npm test --workspace apps/mobile -- --runInBand --forceExit --silent
npx tsc --noEmit --project apps/mobile/tsconfig.json
npm run lint --workspace apps/mobile -- --no-cache
npm run export:web --workspace apps/mobile
node apps/mobile/scripts/generate-pwa-service-worker.mjs --check
```

The Python verifier requires numpy, onnx and onnxruntime; the browser verifier uses installed Chrome and Node. These are local verification tooling, not new application dependencies. Browser evidence includes raw per-fixture errors and timings. No labeled source images corresponding to supplied prediction CSV rows were available for independently rerunning reported test accuracy.

## Minimum remaining work

Obtain expert-reviewed real negatives and valid/imperfect handwriting from representative learners, with authorized provenance and writer/source-disjoint calibration and untouched holdout sets. Evaluate positive false rejection, target-conditioned false mastery acceptance (including wave-to-HA and two-attempt behavior), per-class/category performance and uncertainty. Confirm the training preprocessing details against new-source code or exported training tensors. Revisit the historical 0.80 mastery policy using approved evidence, not ad hoc thresholds. Validate both models on physical low-end mobile browsers, cold-network startup, installed/offline PWA behavior and peak memory before enabling research rejection for real learners.

Integration and regression safeguards are implemented. General invalid-handwriting detection and production readiness remain unproven; Compliance No. 12 is **not fully resolved**.
