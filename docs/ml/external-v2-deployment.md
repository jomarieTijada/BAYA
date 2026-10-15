# ExternalFirst v2 deployment report

READY — new model safely active, old model preserved.

Validated locally on 2026-10-07/08 (Asia/Taipei). This is repository/export readiness; no remote Netlify deployment was performed. Conversion parity does not establish classification accuracy.

## 1. Current-system audit

At task start, the active asset was `C:/BAYA/apps/mobile/public/models/baya/Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0.onnx`. It is already image-only EfficientNetB0: `image_input` float32 `[1,96,96,1]`, `Identity:0` float32 `[1,63]`. Runtime: ONNX Runtime Web 1.30.0, WASM, one thread.

- Manifest/config: `apps/mobile/ml/bayaActiveModel.json` and `bayaModelConfig.ts`.
- Loader/inference/metadata validation: `apps/mobile/ml/bayaModel.web.ts`.
- Preprocessing: `apps/mobile/ml/efficientNetPreprocessing.ts`.
- Capture and stable descending Top-K: `apps/mobile/ml/writingRecognition.ts`.
- Capture independently rasterizes learner strokes onto a white 256×256 bitmap. Reference guides and decorative UI are excluded. No capture or canvas UX changes were needed.
- `WritingPracticeScreen.tsx` already guards duplicate submissions, drawing versions, target changes and unmounts. These guards remain intact.
- The current source already feeds only an image tensor. Stroke data remains available for UI/attempt metadata; no sequence/LSTM tensor is sent.
- PWA generation reads the manifest and hashes precached bytes. The new versioned URL cannot resolve to the old URL's cache entry. Netlify serves existing public files directly with immutable model caching.
- Extensive uncommitted changes existed before this task, including deleted BiLSTM 1.0/1.1 assets/contracts. This task neither introduced nor reversed those deletions. The previously active image-only model and its complete contract remain intact.

Initial working notes: [audit](external-v2-audit.json).

## 2. New model and provenance

Used `C:/BAYA/Baybayin_EfficientNetB0_ExternalFirst_v2.keras`. The copy at `C:/Users/jomsa/Downloads/BAYA_Model_v2/Baybayin_EfficientNetB0_ExternalFirst_v2.keras` is identical: 28,089,136 bytes, SHA-256 `6621a02ed0553580356d4b9529505e1d72240c25532e9fbe76b3b553310c3201`. The warm-up checkpoint was not used.

The authoritative labels file is `C:/BAYA/Baybayin_EfficientNetB0_ExternalFirst_v2_labels.json`, with an identical copy beside the Downloads model. SHA-256: `c68ade6537c59ab2d55872a9e3ed8d75083c89e35722a5b3d63e715ce47d4b91`. Both directions contain exactly 63 entries, unique canonical IDs, complete indices 0..62, and mutually consistent mappings. The order was also checked against notebook cells 6 and 36; deployment uses the JSON order.

The user supplied `C:/BAYA/BAYA_Dataset_Rescue.ipynb` during the task. Its configuration is cell 4, image loader/mapping cell 36, architecture cell 39, final checkpoint cell 43, and labels export cell 47. Only preprocessing functions/constants were executed; no training or dataset-building cells ran.

| Property | Actual value |
|---|---|
| Model name | BAYA_EfficientNetB0_ExternalFirst_v2 |
| Input count/name | 1 / image_input |
| Keras input | float32 `[None,96,96,1]`, NHWC ink map |
| Keras output | character_output, tensor keras_tensor_514, float32 `[None,63]` |
| ONNX input | image_input, float32 `[1,96,96,1]` |
| ONNX output | Identity:0, float32 `[1,63]` |
| Classifier | Dense 128 ReLU; Dropout 0.40; Dense 63 softmax |
| Embedded preprocessing | Repeat grayscale to RGB; Rescaling -255, offset 255; EfficientNet rescaling/normalization |

Model input is background 0, ink 1. The embedded conversion back to RGB pixel values is not duplicated in JavaScript. Full details: [inspection](external-v2-inspection.json).

## 3. Conversion

Tools: TensorFlow 2.18.0, Keras 3.13.2, tf2onnx 1.17.0, ONNX 1.18.0, Python ONNX Runtime 1.30.0, Pillow 11.3.0. Keras ONNX export uses tf2onnx with a fixed batch-one TensorSpec.

Opset 18 was selected for the installed converter/runtime and successfully executed in both Python ORT and actual Web WASM 1.30.0. No runtime upgrade was needed. Reference: [ORT compatibility](https://onnxruntime.ai/docs/reference/compatibility.html).

Two unconsumed normalization capture declarations were removed from graph inputs. No consumed operation, weight, normalization or output was altered. ONNX checker passes.

New asset: `C:/BAYA/apps/mobile/public/models/baya/Baybayin_EfficientNetB0_ExternalFirst_v2.onnx`.

- Size: **16,799,019 bytes**.
- SHA-256: `c09aac56b853841ca4013ecc3617c1e9fdcc3053b2eec40eaa3038393a0c9396`.
- Metadata: matching `_onnx_contract.json` beside the asset.
- Reproduce validation using `ml/deployment/onnx/.venv/Scripts/python.exe ml/deployment/onnx/inspect_export_external_v2.py`. The script writes validation artifacts without changing active deployment.

## 4. Measured parity

113 cases: zeros, deterministic synthetic input, seeded random input, 94 glyph images, 15 image edge cases, and one recovered KA browser capture. Every comparison covers all 63 raw probabilities.

| Check | Python ONNX vs Keras | Web WASM vs Keras |
|---|---:|---:|
| Samples | 113 | 113 |
| Top-1 matches | 113/113 | 113/113 |
| Top-3 ordering matches | 113/113 | 113/113 |
| Maximum absolute difference | 5.066394805908203e-6 | 1.6987323760986328e-5 |
| Mean absolute difference | 4.809130014930657e-8 | 1.3737861384797218e-7 |
| Absolute gate | 1e-5 | 2e-5, plus mean <=1e-6 |

Browser TypeScript preprocessing matched every Python input float exactly. The actual `bayaModel.web.ts` inference service was also executed in Chromium on all cases and matched the independent Web session exactly.

The initial browser gate of 1e-5 was exceeded. Disabling graph optimization produced a similar maximum difference of 1.811981201171875e-5 with unchanged rankings. The browser-specific gate accommodates measured CPU/WASM float32 accumulation differences. No probability transformation or prediction correction was introduced. The exploratory diagnostic retains its original failed gate.

Per-sample labels, confidences and differences: [Python parity](external-v2-parity.json), [browser parity](external-v2-browser-parity.json), [preprocessing evidence](external-v2-preprocessing.json), [optimization diagnostic](external-v2-browser-diagnostic.json).

## 5. Class mapping and KA-family behavior

Authoritative indices: **k=18, ka=19, ke_ki=20, ko_ku=21**.

| Available input | Keras/Python ONNX Top-1 | Keras confidence | Interpretation |
|---|---|---:|---|
| Gavino KA | ka | 0.723162770 | Correct Top-1, below mastery threshold |
| Gavino KIE | ka | 0.572363436 | Misclassified |
| Gavino KOU | ka | 0.556027651 | Misclassified |
| Recovered learner KA capture | re_ri | 0.330854505 | Top-3: re_ri, ra, ka; invalid attempt |

Browser rankings agree on these samples. These results prove pipeline fidelity, not improved generalization. Nothing forces KA or accepts rank 2/3.

## 6. Integration and change inventory

The active manifest selects **external-v2**. The existing centralized runtime/PWA architecture is retained. `bayaModelVersions.json` catalogs complete previous/new contracts. The selector checks hashes, labels and conversion/browser/preprocessing gates before switching only the active manifest.

Preprocessing and capture needed no behavioral changes: white alpha composite, Pillow grayscale, inversion, ink >0.08 bounds, crop, 15% padding with Python rounding, square centering, Pillow bilinear resize, float32 NHWC all match the final notebook exactly. All 109 existing image fixtures were independently recomputed using that notebook.

Labels now come from the selected model contract. The loader additionally rejects absent tensor dimensions. Mastery stays canonical target Top-1 AND raw confidence >=0.80 AND three distinct valid attempts. Navigation and database schemas are unchanged.

With explicit user approval, the four pre-existing DatabaseInspector lint errors were corrected: asynchronous initial loading handles unmount, selection handlers reset table/page state, and CSV export uses current filtered rows with correct callback dependencies.

Files modified by this task, relative to the already-dirty starting workspace:

- `apps/mobile/ml/bayaActiveModel.json`
- `apps/mobile/ml/efficientNetClassLabels.ts`
- `apps/mobile/ml/bayaModel.web.ts`
- `apps/mobile/ml/README.md`
- `apps/mobile/ml/__tests__/activeModelContract.test.ts`
- `apps/mobile/ml/__tests__/bayaModel.test.ts`
- `apps/mobile/ml/__tests__/imagenetPreprocessing.test.ts`
- `apps/mobile/scripts/__tests__/pwaCache.test.ts`
- `scripts/verify-netlify-assets.mjs`
- `scripts/test-writing-recognition-cdp.mjs`
- `apps/mobile/components/debug/DatabaseInspector.tsx`

Files added by this task:

- `ml/deployment/onnx/inspect_export_external_v2.py`
- `scripts/verify-external-v2-browser.mjs`
- `apps/mobile/scripts/select-baya-model.mjs`
- `apps/mobile/ml/bayaModelVersions.json`
- `apps/mobile/public/models/baya/Baybayin_EfficientNetB0_ExternalFirst_v2.onnx`
- `apps/mobile/public/models/baya/Baybayin_EfficientNetB0_ExternalFirst_v2_labels.json`
- `apps/mobile/public/models/baya/Baybayin_EfficientNetB0_ExternalFirst_v2_onnx_contract.json`
- `docs/ml/external-v2-audit.json`
- `docs/ml/external-v2-inspection.json`
- `docs/ml/external-v2-parity.json`
- `docs/ml/external-v2-preprocessing.json`
- `docs/ml/external-v2-browser-parity.json`
- `docs/ml/external-v2-browser-diagnostic.json`
- `docs/ml/external-v2-assets.json`
- `docs/ml/external-v2-deployment.md`

The root Keras/labels/notebook files were supplied by the user. Generated local files also include ignored conversion references, browser inputs, inspection/parity copies and a capture PNG under `ml/deployment/onnx/artifacts/external-v2/`, validation logs under `ml/deployment/onnx/external-v2-*.log`, and the Expo `apps/mobile/dist/` export. No thesis dataset files were modified.

## 7. Previous model preservation and rollback

Previous exact path: `C:/BAYA/apps/mobile/public/models/baya/Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0.onnx`.

Its SHA-256 remains `68462ffc7a85bc830086ddfae082935175c278f6e16063f02d51bef5668cd040`, size 16,778,379 bytes. The sibling `_onnx_contract.json` remains untouched. Both models/contracts are present in the production export with matching hashes/bytes. Old mapping and preprocessing remain usable.

From `C:/BAYA`, select rollback, then perform the normal rebuild/deployment:

```powershell
node apps/mobile/scripts/select-baya-model.mjs previous
npm run export:web
```

Deploy the rebuilt `apps/mobile/dist` normally. Use `external-v2` instead of `previous` to switch back. Both directions were exercised during candidate export; final selection is external-v2. There is no learner-facing model selector or silent runtime fallback. Load errors fail safely.

## 8. Test results

- TypeScript: `npx tsc --noEmit -p apps/mobile/tsconfig.json` passed.
- Lint: `npm run lint --workspace=apps/mobile` passed, zero errors and 14 pre-existing warnings.
- Tests: `npm run test --workspace=apps/mobile -- --runInBand --detectOpenHandles`: **41 suites, 461 assertions passed**. Jest retained 11 existing BroadcastChannel MESSAGEPORT handles from `database/ownership.ts` after completion; completed test processes were stopped. No assertion failures were hidden. React act warnings also remain.
- Production: `npm run export:web` passed, including ORT preparation and PWA generation.
- Real browser: `node scripts/verify-external-v2-browser.mjs` passed for all 113 cases, including the actual application inference service.
- Local Netlify-style routing: `node scripts/verify-netlify-assets.mjs` passed; both model URLs return binary HTTP 200.
- PWA: `node apps/mobile/scripts/generate-pwa-service-worker.mjs --check` passed. Cache `baya-pwa-1f69e4957883eaa5`, 99 precache entries.
- Model hashes, exported labels and contracts: [asset verification](external-v2-assets.json).
- Regression coverage includes shapes/ranges/finite values, missing metadata, image-only feeds, malformed outputs, Top-K, transparent/blank/tiny inputs, duplicate submissions, stale results and unchanged mastery.

## 9. Remaining risks

- The recovered KA capture and available KIE/KOU images are still misclassified. No heuristic correction or threshold relaxation was applied.
- Conversion fidelity is verified; held-out accuracy, writer-independent generalization and all-device performance are not established here.
- Browser tests used desktop Chromium WASM. Safari/mobile performance and a full offline-install UI flow were not manually tested.
- No remote Netlify deployment was performed. Local export bytes, routes and generated caching behavior were verified.
- Existing test BroadcastChannel handles prevent natural process exit despite passing assertions. Existing lint/React test warnings remain.
- Historical BiLSTM deletions predate this task. The model active when this task began is preserved exactly.

## 10. Final status

READY — new model safely active, old model preserved.
