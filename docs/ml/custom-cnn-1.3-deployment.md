# Custom CNN 1.3 deployment investigation

Historical CNN16 investigation. On retry, the user explicitly selected **CNN8 v1.1**. Its completed deployment is documented in [custom-cnn8-1.1-deployment.md](custom-cnn8-1.1-deployment.md); the CNN16 results below remain historical and CNN16 was not activated.

**BLOCKED — model contract/preprocessing/class mapping cannot be proven safely.**

The unresolved part is the **exact CNN16 v1.3 training image loader**. Model architecture, equivalent final/checkpoint weights and exported class mapping are established. Experimental conversion and browser parity passed on a documented candidate image loader, but those measurements do not establish that loader's use during CNN16 training. Activation and application integration remain withheld. ExternalFirst v2 remains active.

Date: 2026-10-08, Asia/Taipei. No training, quantization, pruning or dataset modification occurred. No remote deployment occurred.

## 1. Starting state

Active: `Baybayin_EfficientNetB0_ExternalFirst_v2.onnx`. Registry versions: `previous`, `external-v2`. Runtime: ONNX Runtime Web 1.30.0, single-thread WASM. Existing inference service caches one session using a shared initialization Promise, validates actual tensor names/shapes, and checks 63 finite probabilities. Current production initialization is lazy; a development smoke-test path exists, but production preload/warmup is not installed.

The repository was extensively dirty at task start, including code changes from earlier work and pre-existing historical BiLSTM deletions. Full starting Git status/diff and deployed-asset hashes were saved under `ml/deployment/onnx/artifacts/custom-cnn-1.3/`. This task did not revert unrelated changes or change application source/configuration.

During investigation, the user replaced `EfficientNetB0_Augmented_Comparison.ipynb`. Its new content still trains EfficientNetB0 v1.0 and does not define CNN16 v1.3. The available Downloads `Custom_CNN_8Layer_Augmented.ipynb` is configured for CNN8 v1.1. A search of notebooks in the repository, Downloads, Documents and OneDrive found no CNN16 training source.

Audit notes: [custom-cnn-1.3-audit.json](custom-cnn-1.3-audit.json).

## 2. Both candidate Keras inspections

Both root files have identical copies in `C:/Users/jomsa/Downloads/Baybayin_CustomCNN16_1.3_artifacts/`. The archive `Baybayin_CustomCNN16_1.3_artifacts.zip` contains the same named models and metadata, but no notebook.

| Property | Saved final | Checkpoint |
|---|---|---|
| Absolute path | `C:/BAYA/Baybayin_CustomCNN16_1.3.keras` | `C:/BAYA/Baybayin_CustomCNN16_cp_1.3.keras` |
| Bytes | 33,643,748 | 33,645,783 |
| SHA-256 | `cdac4983f1e2c84b80a59bc424488af7d8378cc84261983e8d6d131656115baf` | `cca97dc094ee3ca845fc3c2139cea48f0a18352d0c30eb3b9e7cd34eb6eb7e6b` |
| Model name | BAYA_CustomCNN16 | BAYA_CustomCNN16 |
| Input | image_input, float32 `[None,96,96,1]` | Same |
| Output layer/tensor | character_output / keras_tensor_111 | character_output / keras_tensor_223 |
| Output type/shape | float32 `[None,63]` softmax | Same |
| Model parameters | 2,786,143 | Same |
| Trainable parameters | 2,782,303 | Same |
| Non-trainable parameters | 3,840 | Same |
| Optimizer iteration | 2475 | 2475 |
| Save metadata | Keras 3.13.2, 2026-10-06 07:08:56 | Keras 3.13.2, 2026-10-06 07:01:48 |

Exact architecture: four blocks with **four 3×3 Conv2D + BatchNormalization + ReLU operations per block**, with filters 32, 64, 128, 256 respectively. Each block ends with max pooling. GlobalAveragePooling2D → Dense 128 ReLU → Dropout 0.40 → Dense 63 softmax. There is no embedded rescaling, inversion or image augmentation layer. Full layer configurations are in [inspection](custom-cnn-1.3-inspection.json); both `model.summary()` outputs are saved under the artifact directory.

Both candidates loaded in TensorFlow 2.18.0 / Keras 3.13.2 with compile metadata restored. Adam has learning rate approximately 0.00025, clipnorm 1, epsilon 1e-7; loss is sparse categorical cross-entropy; metric is accuracy; jit_compile is true. **All 84 weight arrays are bit-for-bit identical**, and serialized inference architectures are identical. Archive differences are metadata/serialization rather than inference weights. The later saved final is therefore selected for experimental conversion without inferring quality from filenames.

Training history contains 60 epochs. Minimum validation loss occurs at epoch 25, loss 0.2275401801 and validation accuracy 0.9571428299. Optimizer iteration 2475 agrees with 25 epochs × 99 batches, using the reported 3150 training examples and batch size 32. This corroborates best-checkpoint/final equivalence; no test accuracy was used to select weights.

The exported metrics call the model “Custom 8-layer CNN,” despite the inspected graph having 16 convolutions. That stale descriptive text is recorded, not treated as authoritative architecture. Its reported test accuracy is 98.5714%, rather than the historical 99.05% example. Neither is a deployment accuracy measurement here.

## 3. Preprocessing contract and unresolved provenance

The model-adjacent `Baybayin_CustomCNN16_preprocessing_1.3.json` specifies:

1. Image-only, one grayscale channel, 96×96, float32.
2. Values in `[0,1]`; white background is 0 and black ink is 1.
3. Ink bounds using threshold 0.08.
4. Crop, proportional padding 0.15, centered square, bilinear resize.
5. Augmentation is training-only.

The candidate loader extracted from the CNN8 notebook adds the following concrete implementation details: RGBA → alpha-composite over white → Pillow L → float32 grayscale/255 → inversion → ink >0.08 bounding box → crop → `max(2, round(max_extent*0.15))` padding with Python ties-to-even → zero square with floor-centered offsets → float32-to-uint8 truncation → Pillow BILINEAR 96×96 → float32/255 and channel expansion. Blank input retains the full source raster before resize.

That candidate loader produces **exactly the same browser input floats** as the existing TypeScript pipeline on the 114-case corpus. It agrees with the CNN16 exported metadata and the new EfficientNet notebook's loader. However, neither available notebook trains CNN16 v1.3. **The exact use of this loader for CNN16 is not yet independently established.** Consequently, “identical preprocessing” is currently a measured candidate implementation comparison, not a final training-provenance conclusion. No active preprocessing routing was changed.

Required next evidence: the actual CNN16 training notebook/script, or explicit confirmation that CNN16 v1.3 used the identified `load_image_array` unchanged. This question remains pending.

## 4. Authoritative class mapping

Loaded independently from `C:/Users/jomsa/Downloads/Baybayin_CustomCNN16_1.3_artifacts/Baybayin_CustomCNN16_labels_1.3.json`. Exactly 63 canonical labels, unique indices 0..62, mutually inverse mappings. SHA-256: `c68ade6537c59ab2d55872a9e3ed8d75083c89e35722a5b3d63e715ce47d4b91`.

**k=18, ka=19, ke_ki=20, ko_ku=21.** These values come from the CNN16 export; they were not inherited from EfficientNet. Full exact copy: [labels](custom-cnn-1.3-labels.json).

## 5. Experimental ONNX conversion

Tools: TensorFlow 2.18.0, Keras 3.13.2, tf2onnx 1.17.0, ONNX 1.18.0, Python ONNX Runtime 1.30.0, Pillow 11.3.0. Used Keras ONNX export with fixed batch-one TensorSpec, opset 18, then ONNX checker and real Python/Web execution. No architecture or activation approximation, pruning, quantization or probability transformation occurred.

- Candidate output: `C:/BAYA/ml/deployment/onnx/artifacts/custom-cnn-1.3/Baybayin_CustomCNN16_1.3.onnx`.
- Input: `image_input`, float32 `[1,96,96,1]`.
- Output: `Identity:0`, float32 `[1,63]`.
- Size: **11,131,978 bytes**, about 10.62 MiB.
- SHA-256: `c945a453a1b83054c10f65fee93c26060055c68fe40a280dd9cd8b089861dfaf`.
- ONNX checker: passed.
- Candidate is kept outside public deployment assets; registry and active selection are unchanged.

The smaller ONNX size reflects inference-only weights/operations without Keras optimizer state; it does not reflect quantization.

## 6. Golden corpus and Python parity

114 cases: zeros, ones, seeded random valid-range input, centered simple strokes, 94 available Gavino glyph images, 15 raster edge cases, and one recovered learner KA capture. Source images are reference glyphs rather than a newly sampled held-out training dataset. The recovered capture supplies a real learner case. No research dataset was edited.

Exact float32 inputs and raw 63-output Keras probabilities are saved in `golden-reference.npz`. Per-case Top-1 and Top-3 labels/indices/confidences are recorded in [Python parity](custom-cnn-1.3-python-parity.json). The golden inputs were created before ONNX export.

| Samples | Top-1 matches | Top-3 ordering matches | Max abs difference | Mean abs difference |
|---:|---:|---:|---:|---:|
| 114 | 114 | 114 | 7.748603820800781e-7 | 5.036141502538798e-9 |

Absolute gate: 1e-5. Shapes and all probability values are valid/finite. Conversion passed the original gate without tolerance changes.

## 7. Browser parity

Real desktop Chromium, actual bundled ONNX Runtime Web 1.30.0, single-thread WASM. The existing `bayaModel.web.ts` source was executed with an isolated candidate contract injected by the validation harness; the repository's active manifest stayed untouched. Its outputs exactly matched an independently created browser session for every case.

| Samples | Top-1 matches | Top-3 ordering matches | Max abs difference | Mean abs difference | Input max difference |
|---:|---:|---:|---:|---:|---:|
| 114 | 114 | 114 | 7.748603820800781e-7 | 5.317031472963448e-9 | 0 |

Browser gates retain the previous deployment's 2e-5 maximum / 1e-6 mean tolerances. Results also satisfy the stricter 1e-5 maximum. This proves raw numerical fidelity on the candidate tensors, while the training-loader provenance remains unresolved. Full results: [browser parity](custom-cnn-1.3-browser-parity.json).

## 8. Actual deployment performance

Same browser/runtime/backend/corpus, local HTTP, alternating model order, three initialization/first-inference trials, five warmups, 114 warm inference timings and 110 image preprocessing/end-to-end timings. Times are milliseconds.

| Metric | ExternalFirst v2 | Custom CNN 1.3 |
|---|---:|---:|
| ONNX bytes | 16,799,019 | 11,131,978 |
| Session initialization mean / median / p95 | 214.41 / 215.66 / 268.23 | 226.78 / 85.98 / 466.54 |
| First inference mean / median / p95 | 30.30 / 26.41 / 39.64 | 91.92 / 88.02 / 102.44 |
| Warm inference mean / median / p95 | 22.55 / 21.88 / 27.00 | 86.99 / 83.53 / 105.70 |
| End-to-end mean / median / p95 | 31.88 / 32.02 / 40.10 | 95.88 / 93.65 / 117.74 |

Shared preprocessing: mean 12.85, median 12.85, p95 20.48 ms. End-to-end here covers RGBA preprocessing, tensor creation, session execution and copied output; it excludes UI stroke rasterization and cold remote network download. Initialization includes local asset loading and runtime-startup effects; three trials are too few for a stable tail estimate. Historical research timings/accuracy were not forced onto these measurements.

**Custom CNN is smaller but slower in this deployment run.** Full measurements and methodology: [benchmark](custom-cnn-1.3-benchmark.json).

## 9. Problem-case comparison

Filename-derived targets for reference glyphs, saved targetClass for the learner capture. Same candidate preprocessing and raw model outputs, with no postprocessing correction.

| Input / target | ExternalFirst Top-1 / confidence | Custom CNN Top-1 / confidence | External correct | Custom correct |
|---|---|---|---|---|
| Gavino KA / ka | ka / 0.723163486 | ke_ki / 0.898064077 | Yes | No |
| Gavino KIE / ke_ki | ka / 0.572363317 | ke_ki / 0.998417497 | No | Yes |
| Gavino KOU / ko_ku | ka / 0.556028008 | ko_ku / 0.999077559 | No | Yes |
| Learner KA / ka | re_ri / 0.330852896 | to_tu / 0.999897122 | No | No |

The confidently incorrect learner KA output must remain an invalid attempt. Available BA/BE-BI/BO-BU, GA/GE-GI/GO-GU, MA/ME-MI/MO-MU and SA/SE-SI/SO-SU comparisons are also included where filename targets were identifiable: [all problem cases](custom-cnn-1.3-problem-cases.json). No general accuracy claim is made from this convenience corpus.

## 10. Integration/change inventory

**No application source, active configuration, registry, selector, public model asset, model contract, label asset, mastery code, database, lesson, navigation or UI file was modified by this task.** Application integration and production preload/warmup additions are withheld pending the preprocessing gate.

Added reusable inspection/experimental validation scripts:

- `ml/deployment/onnx/inspect_custom_cnn_1_3.py`: both candidates, full summaries, compile metadata and exact weight comparison.
- `ml/deployment/onnx/export_custom_cnn_1_3.py`: authoritative CNN labels, candidate preprocessing, golden references, faithful conversion, Python parity and raw model comparison.
- `scripts/verify-custom-cnn-browser.mjs`: actual browser service parity and fair two-model benchmarks without active selection changes.

Added reports:

- `docs/ml/custom-cnn-1.3-audit.json`
- `docs/ml/custom-cnn-1.3-inspection.json`
- `docs/ml/custom-cnn-1.3-labels.json`
- `docs/ml/custom-cnn-1.3-python-parity.json`
- `docs/ml/custom-cnn-1.3-browser-parity.json`
- `docs/ml/custom-cnn-1.3-benchmark.json`
- `docs/ml/custom-cnn-1.3-problem-cases.json`
- `docs/ml/custom-cnn-1.3-deployment.md`

Generated ignored local artifacts under `ml/deployment/onnx/artifacts/custom-cnn-1.3/`: candidate ONNX, golden NPZ, browser-case JSON, capture PNG, both summaries, starting Git status/diff, preserved hashes, starting active manifest and command logs. The existing ExternalFirst production export was regenerated for preservation checks.

## 11. Preserved registry and assets

Registry remains:

```json
{
  "previous": "Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0_onnx_contract.json",
  "external-v2": "Baybayin_EfficientNetB0_ExternalFirst_v2_onnx_contract.json"
}
```

All previously deployed files retain their initial SHA-256 hashes, and the active manifest is byte-for-byte unchanged. ExternalFirst ONNX remains `c09aac56b853841ca4013ecc3617c1e9fdcc3053b2eec40eaa3038393a0c9396`; previous EfficientNet remains `68462ffc7a85bc830086ddfae082935175c278f6e16063f02d51bef5668cd040`.

Custom CNN has not been registered or selected. No unvalidated version is exposed to learners.

## 12. Rollback

ExternalFirst is already active, so no rollback is necessary. Its existing selection/rebuild command remains:

```powershell
node apps/mobile/scripts/select-baya-model.mjs external-v2
npm run export:web
```

`custom-cnn-1.3` selection and both-direction fresh exports are intentionally untested/unavailable until its provenance and all activation gates pass. No claim of completed rollback integration is made.

## 13. Tests and activation gates

| Check | Result |
|---|---|
| Candidate final/checkpoint equivalence | Passed: identical architecture and all weights |
| Authoritative labels | Passed: exported CNN16 mapping, 63 unique labels/indices |
| Exact CNN16 training loader | **Unresolved** |
| ONNX checker | Passed |
| Python/browser numeric parity | Passed on candidate preprocessing |
| Browser input-float parity | Passed on candidate preprocessing, max difference 0 |
| TypeScript baseline | Passed |
| Full lint baseline | Passed: 0 errors, 14 existing warnings |
| Full Jest baseline | **460 passed, 1 failed**, 41 suites |
| Existing active production export | Passed |
| Existing active PWA check | Passed, generated content hash, 99 entries |
| Existing active static routes/assets | Passed, local binary HTTP 200 |
| Custom production integration/export/PWA | Withheld pending training-loader gate |
| Custom registry/selector round trips | Withheld |

The failed Jest assertion is `imagenetPreprocessing.test.ts:25`, which checks the old source notebook SHA-256. The user's replacement changed it from `20dc57f5bac5b7036377ea01e510d69fc02eb455689bf9302caf25264b07629e` to `a1ac35d853c62b9487ef6adbb43d21a79be27533e8535f8f5295711aa9e87754`. The image-float parity assertion still passes. The provenance test was not weakened or silently updated. Eleven existing BroadcastChannel handles also keep Jest alive after its results; the completed test process is stopped after recording the result. Existing React act warnings remain.

## 14. Remaining risks and required evidence

- Activation requires the CNN16 image-loader source or explicit confirmation of the identified unchanged loader. Exported coarse preprocessing metadata alone does not settle implementation details such as alpha composition and uint8 resampling behavior.
- The replaced notebook's old provenance-hash test must be addressed with preserved original evidence or a properly documented model-provenance test change before a clean full suite can pass.
- Custom CNN confidently misclassifies the recovered learner KA capture and the available plain KA glyph. Parity is not recognition accuracy.
- This corpus contains reference glyphs and one learner capture, not an unseen-writer generalization study. Reported historical dataset metrics were not independently reproduced.
- Mobile Safari/Android and remote network/PWA installation latency were not measured.
- Existing deployed assets remain safe and unchanged; Custom production activation has not occurred.

## 15. Final status

**BLOCKED — model contract/preprocessing/class mapping cannot be proven safely.**

Specifically, exact CNN16 training-preprocessing provenance is missing. Experimental conversion, numeric parity and performance comparison are complete, while application integration and activation are withheld. ExternalFirst v2 remains active; previous models are preserved.
