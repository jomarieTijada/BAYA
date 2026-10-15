# BAYA production ML cleanup

Completed validation: 2026-10-07, Asia/Taipei. This report describes the current workspace. Prior conversion and mastery reports are historical evidence.

The only production recognition model is `Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0.onnx`. Its source Keras and deployed ONNX SHA-256 values are unchanged from conversion. No training, weight changes, quantization, calibration, curriculum, XP, authentication or schema changes were made.

## A. Removed

All usages were traced before removal. The complete deletion inventory is `sandbox/cleanup-deleted.json`.

| Removed item | Scope |
|---|---|
| Old public models and contracts | Both `Baybayin_EfficientNetB0_BiLSTM_1.0` and `1.1`, including `.onnx` and `_onnx_contract.json`; the production export now contains only the active model |
| Old generated export/parity artifacts | `ml/deployment/onnx/artifacts/v1.1/`, root v1.0 ONNX, `parity_report.json`, `reference_cases.npz`, and old conversion log |
| Obsolete exporters/adapters | `export_baya_onnx.py`, `diagnose_baya_onnx.py`, `migrate_v1_1.py` |
| Browser sequence preprocessing | `allocatePointsPerStroke`, `selectEvenly`, `trajectoryTransform`, `preprocessNotebookSequence`; notebook point/stroke/row types; sequence length, feature count and trajectory-padding constants |
| Recognition/capture sequence adapter | `toNotebookSequenceRow` and capture `notebookSequenceRow` |
| Old fixture generator/tests | `generate_efficientnet_preprocessing_fixtures.py`, old mixed image/sequence preprocessing suite, and the complete `efficientnet-v1/` fixture directory |
| Sequence fixtures | All 15 old sequence tensors, sequence JSON inputs, shape/audit metadata and class mapping fixtures; current image goldens replace the old image tests |
| Python model event features | `TraceFeatures`, `FEATURE_NAMES`, `TraceValidationError`, `_normalized_points`, `normalize_trace`, `pad_feature_sequences` and their feature/padding tests |
| Previous image classifier preprocessing | Unused `ml/preprocessing/images.py` (224×224 MobileNet preprocessing) and its model-specific tests |
| Unused visual scoring path | `content/writingRecognitionService.ts`, `writingReferenceMasks.ts`, mask generator, `evaluateWriting`, raster/distance helpers, `WritingAttempt` interface and associated scoring test/mock |
| Legacy write branch | New writing records accept only `ModelWritingAttempt`; removed the visual-similarity write branch. Existing database rows remain untouched |
| Obsolete contract/diagnostic fields | Empty `staticNormalizationInputs`, smoke `logicalInputNames`/`staticInputNames`, unused sequence test name/import/mocks |
| Stale selectors/comments | Deployment asset checker and browser asset script point to the active model; runtime/readme documentation now describes image inference |

## B. Preserved

- Active ONNX, active manifest/contract, all 63 ordered labels, original Keras and training notebooks.
- Exact image preprocessing math. Only malformed-input guards were added; all **1,004,544 floats in 109 fixtures still match exactly**.
- The 15 edge-source PNGs were copied to `fixtures/imagenet-finetune-1.0/edge-sources/` before removing the old directory. The current exporter consumes these files and the 94 repository glyph PNGs without reading any former-model source.
- Raw canvas coordinates and optional timestamps remain for drawing, rendering, undo, clear, new-drawing detection and attempt storage. They are rasterized into an image and never converted into ML event features.
- Raw collection schema validation, metadata summaries, JSON/ZIP pairing and device/bounds audits remain. Dataset collection's five-sample requirement is independent of the learner activity's three-success requirement.
- Native platform stubs still return `UNSUPPORTED_PLATFORM`; web/PWA uses the sole image inference implementation.
- Existing unrelated workspace changes were preserved.

## C. Final architecture

```text
Canvas pointer strokes
  ↓ render/capture learner ink (guide excluded)
RGBA image
  ↓ white composite → grayscale → ink → crop/pad/square → bilinear resize → float32
[1,96,96,1] image_input
  ↓ image-only EfficientNetB0 ONNX
[1,63] Identity:0
  ↓ validate 63 finite raw probabilities; stable descending ranking
Top-1 / informational Top-3
  ↓ target Top-1 AND raw confidence >= 0.80
Trial result for current drawing version
  ↓ count once; reject duplicate/stale results
0/3 → 1/3 → 2/3 → 3/3
  ↓ completion unlocked only at 3/3
New character/activity → 0/3
```

`bayaActiveModel.json` supplies both TypeScript and service-worker configuration. Runtime input is exactly `image_input`, float32 `[1,96,96,1]`; output is `Identity:0`, float32 `[1,63]`. Actual ONNX checker and CPU metadata inspection passed, with no recurrent graph operations.

`bayaProbabilities.ts` validates the complete raw vector at both the runtime and recognition boundaries: float32, exactly 63, finite, in [0,1], sum within 1e-3 of one. It does not alter values. Input validation rejects malformed tensors and values outside [0,1]. Null/malformed runtime results produce a controlled inference error, and cleanup safely disposes available tensors.

`writingMastery.ts` defines `RECOGNITION_CONFIDENCE_THRESHOLD = 0.80` and `REQUIRED_SUCCESSFUL_TRIALS = 3`. The screen and database write boundary use the same `isValidWritingResult` assessment. Drawing-version, target, mount, evaluated-version and in-flight guards protect counting. Progress increments only after inference validation and attempt saving complete for the current drawing. Counts are bounded to [0,3].

## D. Threshold validation

Executed policy and screen tests:

| Case | Result |
|---|---|
| Correct Top-1, 0.799999 | PASS: unsuccessful; no increment |
| Correct Top-1, 0.800000 | PASS: successful |
| Correct Top-1, 0.800001 | PASS: successful |
| Wrong Top-1, 0.99 | PASS: unsuccessful |
| Target at rank 2 | PASS: unsuccessful |
| Target at rank 3 | PASS: unsuccessful |
| NaN/infinite/out-of-range confidence | PASS: rejected |
| Stable ties | PASS: original class-index order retained; no target promotion |

Comparison uses raw confidence. Display formatting is separate. Top-3 membership never awards credit.

## E. Three-trial validation

| Case | Executed result |
|---|---|
| 0.92 → 0.85 → 0.80, all correct | PASS: 1/3 → 2/3 → 3/3 |
| Three exactly-0.80 correct drawings | PASS: 1/3 → 2/3 → 3/3 |
| Correct 0.91 → correct 0.76 → wrong 0.98 → correct 0.84 → correct 0.93 | PASS: 1/3 → 1/3 → 1/3 → 2/3 → 3/3 |
| Success → failure → success → failure → success | PASS: failures preserve successes; final 3/3 |
| Same drawing submitted again / captured old handler | PASS: one inference and one saved trial |
| Double handler / double promise resolution | PASS: one increment |
| Late A after new activity B succeeds | PASS: A ignored; B remains 1/3 with its prediction |
| Clear, undo, target switch, unmount, invalidation during saving | PASS: stale result cannot award credit |
| More submissions after 3 successes | PASS: inference blocked, count remains 3/3 |
| Retry and canvas clear after success/failure | PASS: preserves earned successes |
| New target/activity and back navigation | PASS: new activity starts 0/3 |
| Completion before mastery / repeated Next | PASS: blocked before 3; once-only completion after every target is mastered |

Real production Chrome also drew **three separate A glyphs through mouse events**, using the actual model and raw policy. Displayed confidences were **94.5%, 94.7%, 94.4%**. It observed 1/3 → 2/3 → 3/3, disabled Next at 1 and 2, enabled Next at 3, rejected replay, and observed 0/3 after advancing. Evidence: `sandbox/cleanup-browser-validation/three-trials.json`.

Full topic completion (including all 14 consonants, three drawings each) was executed in screen tests with mocked predictions. The real browser run verified one character's mastery and advance; it did not complete the entire curriculum.

## F. Edge-case validation

| Input/failure | Tested result |
|---|---|
| Empty canvas | PASS: screen does not infer/store/count; image preprocessing itself returns finite zero ink |
| Tiny/weak mark | PASS: deterministic finite raster; unusable screen drawings/blank rendered ink do not infer/count |
| Single dot | PASS: image preprocessing safely returns 96×96 finite ink; screen's existing minimum drawing requirements reject a lone dot |
| Short line | PASS: finite preprocessing; real browser line returns wrong/low-confidence Top-1, remains 0/3 |
| Small drawing | PASS: valid finite dimensions, padding and resize |
| Large / edge-touching drawing | PASS: valid bounds and deterministic output |
| Off-center drawing | PASS: identical translated ink produces identical centered tensors |
| Thin / thick strokes | PASS: finite, deterministic 96×96 output |
| Disconnected marks | PASS: full ink extent retained and finite |
| Transparency | PASS: fully transparent black composites to white/zero ink; current fixtures cover alpha/grayscale |
| Different dimensions | PASS: square and rectangular cases all produce 9,216 float32 values |
| Malformed image | PASS: null, invalid/unsafe dimensions, wrong data type and byte count rejected |
| Invalid model result | PASS: null map/tensor, missing dimensions, non-float data, empty/62/64 outputs, NaN, ±Infinity, negative probability and bad probability sum rejected |
| Runtime inference failure | PASS: safe error, input disposed, subsequent inference can recover; screen preserves earned success |

Image preprocessing safety does not automatically award credit. Every counted drawing independently passes the complete model and policy path. Edge goldens exercise preprocessing; screen tests verify that unusable/invalid/error results never increment progress.

## G. Remaining legacy references

Repository search used `BiLSTM`, `LSTM`, `sequence_input`, `sequenceInput`, `sequence_tensor`, `sequenceTensor`, `strokeSequence`, `stroke_sequence`, `Xseq`, `MAX_SEQ_LEN`, `sequence normalization`, `image + sequence`, and `hybrid`. No matches remain in production source, configuration, executable ML utilities or current tests.

| Remaining file/category | Why retained |
|---|---|
| `EfficientNetB0_Augmented_Comparison.ipynb` | User-supplied authoritative training/comparison notebook includes historical comparison text; explicitly left unmodified |
| `ml/training/EfficientNet_B0–BiLSTM.ipynb` | Historical research/training source; explicitly outside notebook-edit scope, with no current exporter/runtime dependency |
| `docs/ml/v1.1-deployment.md` | Every remaining matching line documents the historical 2026-09-29 source, architecture, signature, export or migration. A banner identifies it as historical and warns that assets/scripts were removed |
| `docs/ml/imagenet-finetune-1.0-deployment.md` | Historical conversion evidence: prior model selection, absence of a recurrent branch, and old-model network exclusion. A banner points to this cleanup report; its retained-assets rollback procedure is superseded |
| This report | Removal inventory/search terms explaining the cleanup |

The two old root `.keras` archives are retained as user research source artifacts, alongside the untouched notebooks. They are outside public/export directories, unreferenced by runtime and the current exporter, and never downloaded. All old deployed ONNX models, contracts and generated parity artifacts were removed. Temporary ignored `sandbox/` logs/scripts contain historical validation references and are not application code or bundled assets.

Git history is the recovery mechanism for removed runtime implementations/assets. There is no old-model fallback or selectable branch in the current application.

## H. Verification results

| Check | Status / evidence |
|---|---|
| TypeScript | **PASS**, `npx tsc --noEmit -p apps/mobile/tsconfig.json`; `sandbox/cleanup-tsc.log` |
| Full mobile Jest | **PASS**, 40 suites / **415 tests**; `sandbox/cleanup-full-tests.json` |
| Final changed preprocessing/recognition checks | **PASS**, 2 suites / 13 tests after final constant/provenance changes; `sandbox/cleanup-final-targeted.log` |
| Threshold / trials / duplicate / stale / cap / reset | **PASS**, policy and screen suites included above |
| Preprocessing / 63-class mapping | **PASS**, 109 exact fixtures and notebook SHA provenance check |
| Python dataset/schema checks | **PASS**, 7 tests; `sandbox/cleanup-python-tests.log` |
| ONNX graph/input/output/public/export contract | **PASS**, checker, CPU Runtime and hash comparison; `sandbox/cleanup-artifact-check.json` |
| Current capture diagnostic | **PASS**, exact notebook input equality and CPU replay; included in artifact check |
| Targeted lint | **PASS**, zero errors/warnings across changed runtime, tests, canvas helper and recognition persistence files; `sandbox/cleanup-lint.log` |
| Full mobile lint | **FAIL**, four existing unrelated errors in `components/debug/DatabaseInspector.tsx` at lines 165,170,239,262; 14 warnings elsewhere. `sandbox/cleanup-full-lint.log` |
| Production export | **PASS**, `npm run export:web`; `sandbox/cleanup-export.log` |
| Production network | **PASS**, only active ONNX requests; `sandbox/cleanup-browser-validation/model-requests.json` |
| Browser drawing/inference/Top-3/mastery/advance | **PASS**, real pointer drawings, one image input, zero browser exceptions; `three-trials.json` and `checks.json` |
| Browser parity | **PASS**, 20/20 Top-1 and ordered Top-3 agreement versus saved source-Keras reference; max difference 4.5299530029e-6, mean 2.7498962806e-8 |
| PWA offline reload/inference | **PASS**, network disabled, fresh drawing and actual inference after reload; `offline.json` |
| Responsive browser checks | **PASS**, widths 360,390,430,768,1024,1366,1440; no horizontal overflow |
| Physical Android | **NOT RUN**, no connected device/emulator available |
| New Keras export/retraining | **NOT RUN / unnecessary**, validated ONNX bytes and source hashes were preserved |
| Whitespace diff check | **PASS**, `git diff --check` |

The integration test that executes 42 consonant checks has a 15-second timeout. An earlier simultaneous build/test run exceeded its prior five-second timeout; the subsequent full run passed. Jest uses `--forceExit` for existing background handles and emits existing React act warnings. Export retains the existing Expo SQLite subpath fallback warning.

Production cache: **`baya-pwa-583422c30bcd5323`**, 99 precached assets. Both public and exported model directories contain only the active ONNX and contract. Model SHA-256: `68462ffc7a85bc830086ddfae082935175c278f6e16063f02d51bef5668cd040`. Source Keras SHA-256: `d53e7becd5c15964b71198fb7b13dc90e2b6a8b2e4a0ad75527f895da130be1c`.

Final Desktop Chrome benchmark: ONNX Runtime Web 1.30.0, WASM one thread, 5 warmups / 40 measured runs, mean **22.0735 ms**, median **20.7500 ms**, p95 **28.5535 ms**. These measure session execution on this desktop, excluding image processing and initial downloads.

The final browser harness waits for service-worker activation/reload stability before offline drawing. An earlier rerun raced a legitimate update reload and read a missing DOM result; after correcting the harness timing, the final production run passed. This was a validation-harness timing failure, not an awarded stale trial.

The build is local; no remote hosting deployment was performed.
