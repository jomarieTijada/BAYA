> Historical conversion/deployment evidence from 2026-10-06. The subsequent cleanup removes retained old assets/helpers and replaces the rollback instructions below with recovery through Git history. Current runtime state and checks are documented in [production cleanup](production-cleanup.md).

# Image-only EfficientNetB0 deployment report

Date: 2026-10-06, Asia/Taipei.

The application now selects the new, faithfully converted image-only model. The source Keras SHA-256 is unchanged. No training, fine-tuning, quantization, confidence calibration, curriculum, mastery-policy, XP or schema changes were made.

## 1–5. Source and architecture

1. Source: `C:/BAYA/Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0.keras`.
2. Loaded successfully using TensorFlow 2.18.0 / Keras 3.13.2. Name: `BAYA_EfficientNetB0`; type: Functional. Parameters: **4,221,666 total; 4,137,627 trainable; 84,039 non-trainable**. “Trainable” describes saved flags; no training was performed. Architecture: grayscale input → channel repeat → inversion/scaling → EfficientNetB0/global average pooling → Dense(128, ReLU) → Dropout(0.40) → Dense(63, softmax).
3. **Image-only**, proven by the loaded model's sole input. There is no BiLSTM/sequence branch.
4. Keras input: `image_input`, float32 `[None,96,96,1]`.
5. Keras output tensor: `keras_tensor_514`, float32 `[None,63]`; output layer/name: `character_output`.

Detailed layer/normalization inspection: [inspection JSON](imagenet-finetune-1.0-inspection.json). Source file size: **50,918,209 bytes** (48.5594 MiB). Source SHA-256: `d53e7becd5c15964b71198fb7b13dc90e2b6a8b2e4a0ad75527f895da130be1c`.

## 6. Proven preprocessing contract

The supplied `EfficientNetB0_Augmented_Comparison.ipynb` is authoritative. Cell 18 defines inference preprocessing; cell 27 defines the image-only model; cell 41 records the inference specification. Only selected preprocessing/class AST nodes were evaluated—no notebook training cells were run.

External image processing: composite RGBA onto white → Pillow L grayscale → float32 gray/255 → ink=1-gray → bounding box where ink>0.08 → padding `max(2, round(max_extent*0.15))` using Python ties-to-even → center on a zero-valued square with integer floor offsets → clip/multiply by 255 and cast uint8 → Pillow BILINEAR resize to 96×96 → divide by 255 → float32 channel-last `[1,96,96,1]`.

The preprocessing function's AST is identical to the previous notebook. The existing TypeScript image implementation was reused unchanged. **All 1,004,544 input floats across 109 new notebook-generated fixtures matched exactly (maximum difference 0)**.

Inside the model: repeat the grayscale channel three times → `255*(1-ink)` → EfficientNet's 1/255 rescaling and saved normalization. Saved normalization mean is `[0.4850000143,0.4560000002,0.4059999883]`; variance is `[0.2290000021,0.2240000069,0.2249999940]`. The additional EfficientNet channel rescaling is retained too; its exact values appear in the inspection JSON. None is duplicated externally.

Rotation, translation and scaling in the notebook's training augmentation are outside the model and are not used at inference. Export uses `training=False` behavior; dropout is inactive. Inputs and repeated inference are deterministic.

## 7. Exact class mapping

Notebook cell 16 explicitly sorts dataset labels. Cell 35's executed report contains all 63 grouped labels with support for each. Extracted groups, sorted order, first-20 printed indices, model output width and the app list agree. The existing canonical mapping therefore stays unchanged. There is no output-probability permutation.

| Index | Label |
|---|---|
| 0 | a |
| 1 | b |
| 2 | ba |
| 3 | be_bi |
| 4 | bo_bu |
| 5 | d |
| 6 | da_ra |
| 7 | de_di |
| 8 | do_du |
| 9 | e_i |
| 10 | g |
| 11 | ga |
| 12 | ge_gi |
| 13 | go_gu |
| 14 | h |
| 15 | ha |
| 16 | he_hi |
| 17 | ho_hu |
| 18 | k |
| 19 | ka |
| 20 | ke_ki |
| 21 | ko_ku |
| 22 | l |
| 23 | la |
| 24 | le_li |
| 25 | lo_lu |
| 26 | m |
| 27 | ma |
| 28 | me_mi |
| 29 | mo_mu |
| 30 | n |
| 31 | na |
| 32 | ne_ni |
| 33 | ng |
| 34 | nga |
| 35 | nge_ngi |
| 36 | ngo_ngu |
| 37 | no_nu |
| 38 | o_u |
| 39 | p |
| 40 | pa |
| 41 | pe_pi |
| 42 | po_pu |
| 43 | r |
| 44 | ra |
| 45 | re_ri |
| 46 | ro_ru |
| 47 | s |
| 48 | sa |
| 49 | se_si |
| 50 | so_su |
| 51 | t |
| 52 | ta |
| 53 | te_ti |
| 54 | to_tu |
| 55 | w |
| 56 | wa |
| 57 | we_wi |
| 58 | wo_wu |
| 59 | y |
| 60 | ya |
| 61 | ye_yi |
| 62 | yo_yu |

## 8–12. ONNX artifact and graph

8. Published model: `apps/mobile/public/models/baya/Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0.onnx`. Conversion artifacts: `ml/deployment/onnx/artifacts/imagenet-finetune-1.0/`.
9. Opset **18**, using the established Keras 3 ONNX export path. It passes `onnx.checker`, ONNX Runtime CPU 1.30.0 and ONNX Runtime Web 1.30.0 WASM execution. No unsupported-op approximation or quantization was needed.
10. Exactly one graph input: `image_input`, float32 `[1,96,96,1]`.
11. Exactly one output: `Identity:0`, float32 `[1,63]`.
12. ONNX size: **16,778,379 bytes** (16.0011 MiB). SHA-256: `68462ffc7a85bc830086ddfae082935175c278f6e16063f02d51bef5668cd040`. Production-export and public copies have identical hashes.

The exporter emitted two unconsumed normalization-capture input declarations. Inspection found no graph node or output consuming either declaration, so only those declarations were removed. Normalization operations/constants remain in the graph. Post-cleanup numerical parity and graph checking passed. Runtime supplies no normalization tensors.

## 13. Numerical parity

The same notebook-preprocessed tensors were evaluated by the untouched Keras model and exported ONNX Runtime CPU model. Samples: **94 repository Baybayin glyph PNGs spanning character families plus 15 image edge cases**, not random-only coverage. This is conversion parity, not a new model-accuracy evaluation.

| Metric | Result |
|---|---|
| Samples | 109 |
| Top-1 agreement | **109/109** |
| Ordered Top-3 agreement | **109/109** |
| Maximum absolute probability difference | **5.8114528656e-6** |
| Mean absolute probability difference | **3.8844258151e-8** |
| Gate | **PASS** (all Top-1 equal; max difference ≤1e-4) |

[Full per-sample parity table](imagenet-finetune-1.0-parity.md). Raw input/output tensors: `ml/deployment/onnx/artifacts/imagenet-finetune-1.0/conversion-reference.npz`; full report: `conversion-parity.json` in that directory.

## 14. Files created

- `ml/deployment/onnx/inspect_export_imagenet.py`: source inspection/export, notebook audit, fixture generation and publication after parity gate.
- `apps/mobile/public/models/baya/Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0.onnx` and matching `_onnx_contract.json`.
- `apps/mobile/ml/bayaActiveModel.json`: authoritative active deployment manifest.
- `apps/mobile/ml/__tests__/fixtures/imagenet-finetune-1.0/`: independent versioned notebook audit and 109 RGBA/float32 input fixtures.
- `apps/mobile/ml/__tests__/imagenetPreprocessing.test.ts` and `activeModelContract.test.ts`.
- This report, inspection JSON and per-sample parity Markdown in `docs/ml/`.
- Temporary browser harness/results in `sandbox/check-imagenet-browser.mjs`, `sandbox/imagenet-browser-validation/`, and test/build/lint logs in `sandbox/imagenet-*`.

The training notebook was supplied by the user during the task and was read without modification.

## 15. Files modified

- ML: `bayaModelConfig.ts`, `bayaModel.web.ts`, `bayaModel.ts`, `writingRecognition.ts`, `efficientNetClassLabels.ts` (provenance comment only), and `ml/README.md`.
- Writing: `bayaCapture.ts` (actual input diagnostics only), `WritingPracticeScreen.tsx` (model name/version diagnostics only during this task).
- Deployment: `scripts/generate-pwa-service-worker.mjs`, `ml/deployment/onnx/requirements.txt` (Pillow), and exporter README.
- Tests: `ml/__tests__/bayaModel.test.ts`, `writingRecognitionPhases.test.ts`, and `scripts/__tests__/pwaCache.test.ts`.

All paths above are under `apps/mobile/` unless explicitly rooted elsewhere. Pre-existing mastery, database/debug, PWA, and media edits were preserved. No database schema changes were made.

## 16–19. Active configuration and inputs

16. Before: version 1.1 of `Baybayin_EfficientNetB0_BiLSTM_1.1.onnx`, image + sequence + two static normalization feeds.
17. After: `bayaActiveModel.json` selects `Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0.onnx`, model version 1.0. Both TypeScript configuration and the service-worker generator read this one manifest.
18. The cached, private WASM loader now derives image/output names and shapes from that manifest and validates exactly one input. Public inference API: `runBayaInference(imageData)`. Session deduplication, disposal, error validation and WASM CPU execution remain. Development diagnostics include modelName, modelVersion and modelUrl.
19. **No sequence tensor is prepared or fed for the active model.** Canvas strokes, timestamps, undo, trace guides and SQLite sample metadata remain. The historical sequence helper/fixtures are retained for regression/rollback. Diagnostic capture schema 2 records only image data under `webInputs`; stroke metadata is still separate.

## 20–22. Assessment regressions

20. Raw probabilities are sorted descending with stable tie behavior; no target promotion. Top-1/Top-3 mapping tests pass, with browser/Keras Top-3 agreement 20/20.
21. The policy remains target Top-1 **and raw confidence >=0.80**. 0.799999 fails; 0.80 passes; wrong Top-1 and target rank 2/3 fail.
22. The three-valid-attempt requirement remains unchanged. Handler guards, failure preservation, count cap, new-drawing requirement, duplicate requests, stale results, retry/back/next and completion tests all pass. No confidence boosting/calibration was added.

## 23–25. Browser, PWA and performance

23. Production Desktop Chrome exercised actual pointer drawing → capture → preprocessing → new ONNX → Top-3 → result UI. Network observations show only the new ONNX filename, never BiLSTM. `inferenceCompleted=true` is recorded in the browser validation output. A simple line with A as target produced PA Top-1 below threshold, showed Malapit na!, retained 0/3, and disabled Next. Browser float32 parity on 20 spaced glyph samples: **20/20 Top-1 and 20/20 ordered Top-3**, maximum difference **4.5299530029e-6**, mean difference **2.7498962806e-8** relative to Keras.
24. Desktop PWA loaded after a network-disabled reload and performed fresh real inference offline using the new model. No Android device/emulator was attached (`adb devices -l` returned none), so physical Android/PWA validation is unavailable. Responsive checks at widths 360,390,430,768,1024,1366,1440 showed no horizontal overflow.
25. In the same Desktop Chrome runtime, ONNX Runtime Web **1.30.0**, WASM CPU, **one thread**, one cached benchmark session, **5 warm-ups / 40 measured runs**: mean **23.5575 ms**, median **22.8925 ms**, p95 **29.2343 ms**. These measure ONNX execution on this machine, excluding initial download and canvas preprocessing. No cross-hardware/Keras timing comparison is claimed.

Browser evidence: `sandbox/imagenet-browser-validation/browser-benchmark.json`, `model-requests.json`, `offline.json`, `checks.json` and screenshots.

## 26–27. Production export and cache

26. `npm run export:web` passed. The exact new ONNX exists under `apps/mobile/dist/models/baya/`, and its hash equals the public source artifact.
27. Generated cache: `baya-pwa-011c8f09449a2fb5`. Precache contains the active model, app shell, ORT and required assets (99 entries). It excludes both old ONNX models. Historical model files remain in the export/public repository for rollback but are not downloaded by the precache strategy. Cache identity hashes filenames and asset contents. Existing controller-change update handling remains intact; the new URL is never reused for an old binary.

## 28. Rollback procedure

Keep the v1.1 ONNX and its contract. Roll back the model integration as a unit: restore the previous four-input `bayaModel.web.ts`, native signature and image+sequence `writingRecognition.ts`; set the active manifest to the v1.1 contract with modelName/modelVersion fields; keep model config and the cache generator reading that manifest; then restore matching model tests and rebuild/export. The previous runtime sources are available at Git commit `fbd19528efc2ce6c1f8a2a9b1fc737a0d43c5dd0` for those ML files. Do not restore the whole writing screen or database files, because that would discard the separately implemented mastery work. Re-run contract, preprocessing, parity, browser and offline checks. Changing only the filename is not a valid rollback because input signatures differ.

## 29. Full validation results

- Source load, graph checker, CPU session and 109-sample parity: PASS.
- New-notebook versus TypeScript preprocessing: exact equality on 109 fixtures.
- Full mobile Jest: **40 suites / 365 tests passed, zero failed** (`sandbox/imagenet-full-tests.json`). This includes mastery/races, mapping, input feeds, database, media and PWA regressions.
- TypeScript `npx tsc --noEmit -p apps/mobile/tsconfig.json`: PASS.
- Targeted ESLint on changed runtime/config/capture/deployment/test files: PASS.
- Full `npm run lint`: **FAIL on four existing unrelated errors** in `components/debug/DatabaseInspector.tsx` (lines 165,170,239,262); 16 warnings elsewhere. These pre-existing debug/UI files were not edited for this model task.
- Production web export, active asset hash check, precache selection, Desktop Chrome inference, browser numerical parity, offline reload/inference: PASS.
- `git diff --check`: PASS.

Jest used `--forceExit` because existing background handles remain after the assertions; existing React act warnings were emitted. Export also emits the existing Expo SQLite subpath fallback warning. These are reported rather than hidden.

## 30. Remaining issues

No model-conversion or supported-browser integration failure remains. Full-project lint is not clean because of the four unrelated existing debug-screen errors. Physical Android validation remains unperformed because no device was available. Desktop timing is not a mobile latency guarantee. This task did not deploy the build to a remote hosting service.
