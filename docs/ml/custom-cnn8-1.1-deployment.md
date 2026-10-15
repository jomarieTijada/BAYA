# Custom CNN8 v1.1 deployment

**READY — Custom CNN8 v1.1 safely active; parity verified; previous models preserved.**

Date: 2026-10-08, Asia/Taipei. This report covers the model the user explicitly selected in the retry: **CNN8**, replacing the earlier CNN16 v1.3 deployment objective. The supplied `Custom_CNN_Model_8.ipynb` really configures, trains and exports CNN8 v1.1. CNN16 was investigated separately and was not activated. No training, pruning, quantization, probability adjustment or remote deployment occurred.

## 1. Starting state

Active model before this work: `Baybayin_EfficientNetB0_ExternalFirst_v2.onnx`. Existing registry entries: `previous` and `external-v2`. Existing web service already cached one ONNX Runtime Web 1.30.0 WASM session with a shared initialization Promise, validated tensor metadata and 63 finite probabilities, and ranked unmodified output values. Production initialization was lazy; production preload/warmup was added in this task.

The working tree was extensively dirty, including existing UI/database work, earlier model deployment changes and historical BiLSTM asset deletions. Starting and retry Git status/diffs, original active manifest and all five existing public deployment-file hashes were saved in `ml/deployment/onnx/artifacts/custom-cnn8-1.1/`. Unrelated edits were retained. The five original public deployment files still match their starting hashes; see [rollback/preservation evidence](custom-cnn8-1.1-rollback.json).

The user had replaced the exploratory EfficientNet notebook, breaking a test that bound original fixtures to its old whole-file hash. The original hash and tensors remain preserved. This task revalidated those tensors with the exact CNN8 loader and changed the test to assert that independent source provenance rather than assert the replaced file still exists unchanged.

## 2. Candidate Keras inspection and selection

| Absolute path | Bytes | SHA-256 | Keras output tensor | Saved timestamp |
|---|---:|---|---|---|
| C:\BAYA\Baybayin_CustomCNN8_1.1.keras | 14,710,604 | `6b8be8c4b4b2ae2c540288fa3dcd70a042218d32388a27f6cc24ae534ab40311` | keras_tensor_63 | 2026-10-06@06:25:43 |
| C:\BAYA\Baybayin_CustomCNN8_cp_1.1.keras | 14,711,751 | `296bfb6af87b867259082fe5b99991eba046fca0ad58545d12a4a0b60349781b` | keras_tensor_127 | 2026-10-06@06:06:13 |

Both load with compile metadata in TensorFlow 2.18.0 / Keras 3.13.2. Their inference architectures and all **44 weight arrays are bit-for-bit identical**. The later final save is selected because the notebook loads the best validation-loss checkpoint and saves it as the final model. This is corroborated by equal weights and optimizer iteration 1584, matching best epoch 16 × 99 batches. Filename alone was not used to choose quality.

Shared model properties:

- Model name: `BAYA_CustomCNN8`.
- Input: `image_input`, float32 `[None,96,96,1]`.
- Output layer: `character_output`, float32 `[None,63]`, softmax.
- Parameters: 1,215,583 total; 1,213,663 trainable; 1,920 non-trainable.
- Eight 3×3 same-padding, bias-free Conv2D layers, with filters `(32,32,64,64,128,128,256,256)`, each followed by BatchNormalization and ReLU. MaxPooling2D follows each pair. GlobalAveragePooling2D → Dense 128 ReLU → Dropout 0.40 → Dense 63 softmax.
- No embedded input rescaling, inversion, cropping or image augmentation.
- Restored optimizer: Adam, learning rate about 0.0005, clipnorm 1, epsilon 1e-7. Sparse categorical cross-entropy, accuracy, jit_compile true.

Notebook configuration cell 4, builder cell 27, best-checkpoint evaluation cell 35 and final export cell 41 match the selected model and accompanying artifacts. The training artifact reports TensorFlow 2.21.0; conversion uses the compatible environment above, with restored weights and measured inference parity. Full layer/compile inventories: [inspection](custom-cnn8-1.1-inspection.json). Both full model summaries are saved in the artifact directory. Best validation metrics and independent test-CSV class validation: [audit](custom-cnn8-1.1-audit.json).

## 3. Exact independently established preprocessing

Authoritative source: `C:/BAYA/Custom_CNN_Model_8.ipynb`, configuration cell 4 and `load_image_array` cell 18, SHA-256 `1dba63acd076bd5460e7425c1347766563ede2abeb67b8f9412040fcebf969f1`. Exported CNN8 preprocessing metadata agrees with the actual source. The model input range is `[0,1]`: **white background is 0; black ink is 1**. Augmentation is outside the model and used only during training.

The exact order is:

1. Load as 8-bit RGBA and Pillow alpha-composite over opaque white.
2. Convert to Pillow L grayscale.
3. Cast grayscale to float32, divide by 255, then invert as `1 - gray/255`.
4. Detect ink strictly greater than 0.08.
5. Crop to the ink bounding box, including the final occupied row/column.
6. Let `max_extent=max(crop_height,crop_width)` and padding be `max(2,int(round(max_extent*0.15)))`, using Python ties-to-even rounding.
7. Place the crop on a zero-filled square of side `max_extent+2*padding`, with floor-centered integer offsets.
8. For blank rasters, retain the full inverted source raster before resizing.
9. Multiply the square by 255, clip, then truncate to uint8.
10. Resize the uint8 square to 96×96 with Pillow BILINEAR.
11. Cast to float32 and divide by 255; expand to one channel. Deployment adds batch dimension 1.

**External browser image preprocessing is identical to ExternalFirst v2**, independently established from the CNN8 source and zero-error checks, rather than inferred from its 96×96 input shape. EfficientNet-specific internal RGB conversion/normalization remains in its preserved graph; CNN8 has no such internal steps.

`bayaPreprocessing.ts` selects the verified `ink-square-pillow-v1` contract. Existing contracts stay byte-identical and resolve through their exact external preprocessing fields. Unknown pipelines or changed fields, including polarity, are rejected. The existing exact Pillow port is shared, avoiding duplicated image-processing code and filename-based routing.

All **109 original image tensors** were recomputed with this loader and matched every float exactly. All **114 browser corpus inputs** also matched the Python tensors exactly. Source and original-fixture provenance are recorded in [preprocessing evidence](custom-cnn8-1.1-preprocessing.json).

## 4. Authoritative class mapping

Read independently from `C:/Users/jomsa/Downloads/Baybayin_CustomCNN8_1.1_artifacts/Baybayin_CustomCNN8_labels_1.1.json`, SHA-256 `c68ade6537c59ab2d55872a9e3ed8d75083c89e35722a5b3d63e715ce47d4b91`. Exactly 63 unique canonical labels, indices 0..62, mutually inverse mappings. The sorted unique labels in this run's test-predictions CSV independently match the complete mapping and the notebook's sorted-class construction.

**k=18, ka=19, ke_ki=20, ko_ku=21.** These values are proven by the CNN8 export. Full exact mapping: [labels](custom-cnn8-1.1-labels.json). Existing label consumers receive the selected contract's exact order.

## 5. Faithful ONNX conversion

Keras ONNX export uses tf2onnx, fixed batch-one signature and opset 18. Versions: TensorFlow 2.18.0, Keras 3.13.2, tf2onnx 1.17.0, ONNX 1.18.0, Python ORT 1.30.0, Pillow 11.3.0; web ORT 1.30.0. Opset compatibility is verified by checker, CPU execution and actual WASM execution.

- Asset: `apps/mobile/public/models/baya/Baybayin_CustomCNN8_1.1.onnx`.
- Input: `image_input`, float32 `[1,96,96,1]`.
- Output: `Identity:0`, float32 `[1,63]` softmax probabilities.
- Bytes: **4,857,266**, 4.63 MiB.
- SHA-256: `422f683eb8447d56a6c327e7fae3333f814fab91c28bc99b69fed68ae1d8dbf2`.
- ONNX checker: passed.
- Architecture/weights/activations were exported faithfully; no retraining, quantization, pruning, heuristics or output correction.

The smaller inference asset excludes Keras optimizer/training state. It is not a quantized model. The versioned labels and complete contract are published beside it.

## 6. Golden references and Python parity

114 cases: four deterministic synthetic tensors (zeros, ones, seeded random and centered strokes), 94 available Gavino glyph PNGs, 15 edge rasters and one recovered learner KA capture. Thin, thick, tiny, off-center, transparent and blank inputs are covered. All three supplied base-K cancellation variants, KA, KIE and KOU images are included; cancellation filenames have no independently asserted canonical target in the diagnostic table. The glyph set is a reference-image convenience corpus, not a newly sampled held-out dataset.

Before export, exact float32 tensors and all 63 raw Keras probabilities were saved in `golden-reference.npz`. [Python evidence](custom-cnn8-1.1-python-parity.json) contains every raw Keras output, Top-1 and Top-3 indices/classes/confidences, ONNX ranks and errors. Browser input/reference JSON is saved alongside the NPZ.

| Samples | Top-1 matches | Top-3 order matches | Max abs difference | Mean abs difference |
|---:|---:|---:|---:|---:|
| 114 | 114 | 114 | 8.940696716308594e-07 | 7.516885564036173e-09 |

Original strict maximum-error gate: 1e-5. Shapes and all probabilities are finite and valid. No tolerance was relaxed.

## 7. Browser and actual app service parity

Real desktop Chromium with bundled ONNX Runtime Web 1.30.0, single-thread WASM. The harness compiles the actual `bayaModel.web.ts` and `bayaPreprocessing.ts` source and supplies the complete versioned contract without changing the active manifest. Its outputs match the independent browser session exactly on every case. Its smoke verifies concurrent loading and repeated inference share one session, and preload calls share their Promise.

| Samples | Top-1 matches | Top-3 order matches | Max abs difference | Mean abs difference | Input max difference |
|---:|---:|---:|---:|---:|---:|
| 114 | 114 | 114 | 1.192092895507812e-06 | 9.453705278344048e-09 | 0 |

Browser tolerances retain the previous 2e-5 maximum and 1e-6 mean gates; results also satisfy the stricter Python maximum. This measures conversion fidelity, not classification accuracy. Full case results: [browser evidence](custom-cnn8-1.1-browser-parity.json).

## 8. Measured performance

Same desktop Chromium/runtime/backend/corpus, local HTTP, alternating model order, three session-initialization/first-inference trials, five warmups, 114 warm timing cases and 110 image end-to-end cases. Times are milliseconds, displayed mean / median / p95.

| Metric | ExternalFirst v2 | CNN8 v1.1 |
|---|---:|---:|
| ONNX bytes | 16,799,019 | 4,857,266 |
| Session initialization | 315.11 / 310.58 / 411.31 | 323.74 / 57.10 / 787.33 |
| First inference | 34.65 / 33.75 / 45.99 | 74.80 / 66.41 / 93.03 |
| Warm inference | 30.04 / 30.02 / 40.15 | 48.84 / 48.46 / 61.62 |
| End-to-end recognition computation | 42.23 / 41.78 / 57.03 | 59.49 / 58.31 / 79.75 |

Shared preprocessing: 15.76 / 15.97 / 24.55 ms. End-to-end covers RGBA preprocessing, tensor creation, session execution and copied output; excludes UI stroke rasterization and cold remote download. Initialization includes local loading/runtime startup, and three trials provide a limited tail estimate.

**CNN8 is smaller but slower for warm inference in this measured WASM deployment.** The historical artifact reports 99.0476% test accuracy, 14.0291 MiB Keras size and 81.9514 ms Keras predict mean. Those are retained training-run metrics, not newly reproduced deployment accuracy/latency. Actual deployment numbers above were not forced to match them. [Full benchmark](custom-cnn8-1.1-benchmark.json).

## 9. Real problem cases

Targets come from unambiguous reference filenames or the saved capture's targetClass. Both models receive identical proven input tensors and use raw outputs.

| Input / target | ExternalFirst Top-1 / confidence | CNN8 Top-1 / confidence | External correct | CNN8 correct |
|---|---|---|---|---|
| Gavino Baybayin - KA.png / ka | ka / 0.723163486 | ke_ki / 0.988397419 | True | False |
| Gavino Baybayin - KIE.png / ke_ki | ka / 0.572363317 | ke_ki / 0.999979138 | False | True |
| Gavino Baybayin - KOU.png / ko_ku | ka / 0.556028008 | ko_ku / 0.997162402 | False | True |
| baya-capture-ka-2026-09-28T12-51-57-996Z.json / ka | re_ri / 0.330852896 | ko_ku / 0.553540409 | False | False |

CNN8 improves these KIE/KOU reference cases but still fails the plain KA image and real learner KA capture. The plain KA prediction is confidently wrong. Neither wrong Top-1 can earn mastery, regardless of target appearing at rank 2/3. Available BA/BE-BI/BO-BU, GA/GE-GI/GO-GU, MA/ME-MI/MO-MU and SA/SE-SI/SO-SU outcomes are in [all comparisons](custom-cnn8-1.1-problem-cases.json). No generalization or accuracy gain is claimed from this convenience corpus.

## 10. Integration and change inventory

Application/deployment changes:

- `apps/mobile/ml/bayaActiveModel.json`: final CNN8 selection through the selector after all candidate gates passed.
- `apps/mobile/ml/bayaModelVersions.json`: explicit `custom-cnn8-1.1` entry; earlier versions preserved.
- `apps/mobile/public/models/baya/Baybayin_CustomCNN8_1.1.onnx`, `_labels.json`, `_onnx_contract.json`: new versioned inference asset, independent mapping and complete evidence/metadata.
- `apps/mobile/ml/bayaModelConfig.ts`: normal active manifest plus explicit engineering candidate-build override, allowing pre-activation app/export validation.
- `apps/mobile/ml/bayaPreprocessing.ts`: central checked preprocessing-contract routing using shared exact implementation.
- `apps/mobile/ml/writingRecognition.ts`: call central preprocessing; capture, ranking and raw probabilities retained.
- `apps/mobile/ml/bayaModel.web.ts`: shared preload Promise and one-time warmup over the existing cached session; retry after preload failure.
- `apps/mobile/ml/bayaModel.ts`: matching unsupported native preload interface, keeping native isolated from web ORT.
- `apps/mobile/components/learner/writing/WritingPracticeScreen.tsx`: begin preload on web writing-screen mount; no UI or mastery change.
- `apps/mobile/scripts/select-baya-model.mjs`: require preprocessing/browser/application gates for CNN8 and add non-mutating `--validate-only`.
- `apps/mobile/scripts/generate-pwa-service-worker.mjs`: candidate export validation uses the same explicit version override; normal exports use active manifest.
- `scripts/verify-netlify-assets.mjs`: all registered model URLs, exact lengths/hashes and active-only model precache validation, replacing an EfficientNet-specific minimum-size assumption.
- `apps/mobile/ml/__tests__/bayaModel.test.ts`: concurrent preload, one warmup, session reuse and retry verification.
- `apps/mobile/ml/__tests__/bayaPreprocessing.test.ts`: all preserved contracts route correctly; unknown pipeline/polarity rejects.
- `apps/mobile/ml/__tests__/activeModelContract.test.ts`: independently bound CNN8 labels/notebook/hash and strict Python/browser evidence.
- `apps/mobile/ml/__tests__/imagenetPreprocessing.test.ts`: retain original fixture/hash record, validate preserved labels and rebind mutable-source test to independently recomputed CNN8 tensors.
- `apps/mobile/scripts/__tests__/pwaCache.test.ts`: use the configured validation model so candidate builds can be tested without changing selection.
- `apps/mobile/ml/README.md`, `ml/deployment/onnx/README.md`: active deployment and conversion/rollback instructions.
- `docs/ml/custom-cnn-1.3-deployment.md`: link the historical CNN16 investigation to this explicitly selected CNN8 result.

New tooling: `ml/deployment/onnx/inspect_custom_cnn8_1_1.py`, `export_custom_cnn8_1_1.py`, `scripts/verify-custom-cnn8-browser.mjs`, `scripts/verify-baya-pwa-browser.mjs`. New reports: this file and CNN8 audit, inspection, labels, preprocessing, Python parity, browser parity, benchmark, problem cases, activation gates and rollback JSON. Generated local artifacts/logs are under the ignored artifact directory. The earlier CNN16 retry audit remains historical.

No database, curriculum, profile, synchronization, lesson styling, navigation or settings architecture was changed. The mastery policy remains target canonical Top-1 with raw confidence >=0.80, three distinct valid attempts; failed attempts preserve successes, unchanged drawings cannot repeat, character changes reset progress, duplicate/stale guards stay intact. Existing recognition/mastery tests passed.

## 11. Registry and preservation

```json
{
  "previous": "Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0_onnx_contract.json",
  "external-v2": "Baybayin_EfficientNetB0_ExternalFirst_v2_onnx_contract.json",
  "custom-cnn8-1.1": "Baybayin_CustomCNN8_1.1_onnx_contract.json"
}
```

All five prior public assets/contracts/labels are byte-identical to the starting state. ExternalFirst model hash remains `c09aac56b853841ca4013ecc3617c1e9fdcc3053b2eec40eaa3038393a0c9396`; previous EfficientNet remains `68462ffc7a85bc830086ddfae082935175c278f6e16063f02d51bef5668cd040`. There is no learner-facing selector.

## 12. Activation, rollback and PWA

All twelve requested candidate gates passed while the active manifest still selected ExternalFirst. Candidate app tests/export used the engineering environment override. Only then did the selector activate CNN8. Both switch directions were freshly exported and checked, then CNN8 was selected/exported again for final state.

Unset `EXPO_PUBLIC_BAYA_VALIDATION_VERSION` before normal selection/builds. Commands from `C:/BAYA`:

```powershell
node apps/mobile/scripts/select-baya-model.mjs external-v2
npm run export:web
node apps/mobile/scripts/select-baya-model.mjs custom-cnn8-1.1
npm run export:web
```

| Verified step | Selected version | Generated cache | Export / hashes / PWA |
|---|---|---|---|
| switch-to-custom | custom-cnn8-1.1 | `baya-pwa-e69f58c87dacaacd` | Passed |
| rollback-external | external-v2 | `baya-pwa-72363382a42b56a0` | Passed |
| final | custom-cnn8-1.1 | `baya-pwa-e69f58c87dacaacd` | Passed |

Cache identifiers above are measured outputs, not manually hard-coded configuration. Custom and ExternalFirst exports have different content-derived cache versions; repeated unchanged Custom export reproduces its version. Only the active model is precached, while all prior model URLs remain binary HTTP 200 with verified original hashes.

A real Chromium service worker installed all 99 precache entries for both model selections. With browser networking explicitly offline, the active model and WASM returned HTTP 200; model length and SHA-256 matched the contract. Final CNN8 offline model bytes: 4,857,266. The versioned CNN8 URL cannot contain stale EfficientNet bytes under these verified hashes. Tests validate existing cache eviction behavior. [Round-trip and final offline evidence](custom-cnn8-1.1-rollback.json).

## 13. Completed checks

| Check | Result |
|---|---|
| Exact notebook/model/preprocessing/class provenance | Passed |
| ONNX checker | Passed |
| Python all-output parity | 114/114 Top-1 and Top-3, strict original gate |
| Real browser all-output parity and app service | 114/114 Top-1 and Top-3 |
| Browser input parity | Every float equal, maximum 0 |
| Historical preprocessing fixtures recomputed with CNN8 source | 109/109 tensors exactly equal |
| TypeScript | Passed; repeated after final manifest selection |
| Full lint | 0 errors, 14 existing warnings |
| Full Jest, --runInBand --detectOpenHandles | 469 tests / 42 suites passed |
| Final active-model contract tests | 3/3 passed |
| Candidate production export before activation | Passed without changing active manifest |
| Fresh exports in both selector directions and final CNN8 export | Passed |
| Generated service-worker content verification | Passed after every export |
| Local static routes and all registered model hashes/lengths | Passed |
| Real Chromium offline active model and WASM | Passed for candidate/final CNN8 and rollback ExternalFirst |
| Existing asset byte preservation | All five existing public files unchanged |

Full Jest reports **11 pre-existing BroadcastChannel MESSAGEPORT handles** that keep its completed process alive. The task-owned process was stopped only after the full passing summary/open-handle diagnostics were captured. Existing React act warnings and lint warnings are recorded, not hidden or repaired through unrelated changes. Command logs are saved under the artifact directory. [Activation-gate record](custom-cnn8-1.1-activation-gates.json).

## 14. Remaining limitations

- Numerical conversion parity does not establish recognition accuracy or unseen-writer generalization.
- The available KA reference and saved learner KA still fail. No target-specific correction, threshold change or kudlit heuristic was added.
- CNN8 has a smaller ONNX download but slower warm inference than ExternalFirst in this desktop WASM measurement.
- Historical 99.0476% controlled-test accuracy was not independently rerun on the original held-out split; the available reference glyph/capture corpus is not that split.
- Mobile Safari/Android performance and cold remote network installation were not measured.
- Local static serving emulates Netlify routes/headers; no remote hosting deployment was performed.

## 15. Final status

**READY — Custom CNN8 v1.1 safely active; parity verified; previous models preserved.**

Final manifest and fresh local production export use `custom-cnn8-1.1`. The earlier CNN16 objective was superseded by the user's explicit CNN8 selection. Rollback remains verified and available.
