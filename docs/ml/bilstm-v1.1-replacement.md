> Superseded by the user-supplied ONNX replacement. See [current model](supplied-bilstm-replacement.md). The measurements below describe the earlier converted artifact.

# EfficientNet-B0 + BiLSTM v1.1 replacement — 2026-10-08

**SUCCESS — MODEL REPLACED AND VERIFIED**

No training, fine-tuning, weight changes, confidence adjustments, learner-storage migration or deployment was performed. Pre-existing working-tree changes were preserved.

## Selection and architecture

Selected `Baybayin_EfficientNetB0_BiLSTM_1.1_stageB.keras` (29,156,571 bytes), not stage A (20,177,819 bytes). The supplied `Baybayin_EfficientNetB0_BiLSTM_v1_1_metrics.json` explicitly names `v1.1_stageB` and records promotion. Validation accuracy/macro-F1: stage A 0.973545/0.972940; stage B 0.978836/0.978798. The refinement notebook uses best-validation-loss ModelCheckpoint files for both stages. The selected file is byte-identical to the promoted `Baybayin_EfficientNetB0_BiLSTM_1.1.keras`. Size was not a selection criterion. All original Keras files remain intact.

Both candidates have **4,307,426 parameters** and the same hybrid structure: grayscale-to-RGB concatenation, input rescaling by 255, EfficientNet-B0, masked bidirectional LSTM, separate 128-unit feature projections, concatenated fusion, 128-unit embedding, dropout and 63-way softmax. Saved trainability/optimizer state differs by training stage. The complete serialized layer inspection is in the staging `inspection.json`.

| Tensor | Keras | Deployed ONNX |
|---|---|---|
| `image_input`, float32 | `[None,96,96,1]` | `[1,96,96,1]` |
| `sequence_input`, float32 | `[None,512,6]` | `[1,512,6]` |
| Output, float32 | `character_output`, `[None,63]` | `Identity:0`, `[1,63]` |

Source SHA-256: `067a7005b6f656fd3ba32648adee580af55cd5a05fbb03d76892627b5745c539`.

## Conversion and equivalence

Python 3.12; TensorFlow 2.18.0; Keras 3.13.2; tf2onnx 1.17.0; ONNX 1.18.0; ONNX Runtime 1.30.0; Pillow 11.3.0. Dependencies remain development-only and are pinned in `ml/deployment/onnx/requirements.txt`.

Keras `model.export(format='onnx')` uses tf2onnx, opset 18, with a nested two-input signature and fixed inference batch size one. No layers were replaced. Two exporter-generated normalization graph inputs were removed only after recursively proving that no graph or subgraph consumes them. The normalization operations and weights remain in the graph. ONNX full structural checking passed; Chromium executed the graph with the app's installed ORT Web 1.30.0 WASM runtime, proving operator compatibility for this graph.

Output: **17,175,026 bytes**, SHA-256 `b53c69e28385eef71d0032667671692e97f670abc214f46e49d090dbd4f27149`.

| Metric | Python ORT | Chromium WASM |
|---|---:|---:|
| Paired samples | 16 | 16 |
| Top-1 agreement | 16/16 | 16/16 |
| Ordered top-3 agreement | 16/16 | 16/16 |
| Maximum absolute probability difference | 2.5033951e-6 | 5.9604645e-6 |
| Mean absolute probability difference | 3.3997454e-8 | 8.4491575e-8 |
| Output shape | `[1,63]` | `[1,63]` |
| Class order | Exact original 63 indices | Exact original 63 indices |

The gates require every full 63-probability vector to have maximum absolute error <=1e-5, mean error <=1e-6 and identical ordered top-3 results. These absolute tolerances accommodate float32 convolution/recurrent reduction differences while bounding confidence error to 0.001 percentage point. They do not depend on a matching top-1 alone. All probabilities and per-case results are recorded in `bilstm-v1.1-parity.json` and `bilstm-v1.1-browser-parity.json`.

Coverage is 15 notebook-derived synthetic edge cases plus one real KA capture that had previously been misclassified. Cases cover transparency, blank input, narrow/wide/tiny drawings, kudlit placement, multi-stroke trajectories, time degeneracy, short sequences, exactly 512 points and overflow/downsampling. **This is conversion parity, not a new handwriting accuracy evaluation.** A broad real-writer vowel/consonant/kudlit/virama test corpus was unavailable; no class-level accuracy claims are made from these probes.

## Audit and integration

The starting active model was image-only `EfficientNetB0_model.onnx`, selected by `apps/mobile/ml/bayaActiveModel.json`. `bayaModel.web.ts` loaded it; `writingRecognition.ts` captured/rasterized the drawing and decoded probabilities using `efficientNetClassLabels.ts`. The initial audit found no active sequence tensor construction. Existing image preprocessing matched refinement cells 9/10 and was preserved.

The trajectory port is now `bilstmSequence.ts`: pixel-coordinate bounding box, centered square, 15% padding, proportional stroke-preserving downsampling, ordered features `[x_shape,y_shape,dx,dy,dt_norm,stroke_start]`, and trailing zero rows for Keras masking. Signed deltas are retained. All 15 paired image and sequence goldens match the refinement notebook exactly, in Python and browser preprocessing. Sequence input length/type/finiteness and graph names/shapes are checked before use.

The supplied label JSON has 63 unique, mutually consistent index mappings, identical to the starting app order. Existing symbol/display mappings, stable probability ranking, feedback, confidence policy, progress persistence, navigation and responsive canvas remain unchanged. The existing shared web service now supplies both inputs during recognition, warmup and smoke/benchmark calls. Diagnostic captures record both tensors. Native remains the existing unsupported-platform fallback.

The PWA generator reads the same manifest and hashes model bytes into the cache name. Install uses reload requests; activation removes only prior `baya-pwa-*` asset caches. SQLite/OPFS and learner settings/progress are never cleared. Export now excludes unselected copied model files, while preserving unrelated research source artifacts.

## Cleanup and files

Removed from application public source: `EfficientNetB0_model.onnx`, `EfficientNetB0_model_labels.json`, `EfficientNetB0_model_onnx_contract.json`. Audit copies remain outside the application under the ignored staging directory. Unrelated CustomCNN8/ExternalFirst research candidates and all original source Keras files were preserved. They are not loaded or included in production dist.

`apps/mobile/dist/models/baya/` contains exactly the replacement ONNX, its contract and the authoritative labels. Shared ORT files remain present. Source preprocessing JSON and experiment metrics are retained for reproducibility. Historical research reports/exporters remain historical; current runtime/readme/deployment references point to the hybrid model.

The full added/modified/deleted file inventory relative to the initial working tree is `bilstm-v1.1-files.json`; it includes each regression fixture. Generated staging reports are under `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/` and dist was rebuilt.

## Verification

- ONNX full checker, Python parity and a second clean staging conversion: passed.
- Real Chromium WASM parity through both direct ORT and the production service: passed; same session reused, preload and repeated inference passed.
- TypeScript: `npx tsc --noEmit --project apps/mobile/tsconfig.json` passed.
- Focused ESLint on the changed runtime, preprocessing, tests, capture and export-generator files passed.
- Full Jest: **43 suites, 482 tests passed**. Initial warmup and image-only test assumptions failed and were fixed. The existing Jest open-handle warning required `--forceExit`; no test assertions were skipped.
- Production UI: real KA strokes replayed with native Chromium mouse events, Suriin triggered recognition, KA 84.5% and top-3/corrective feedback displayed, second attempt passed; no browser console errors. This checks feedback for a KA drawing on the A activity, not a claim that it should award mastery.
- Offline PWA: actual service worker installation, model/WASM byte/hash availability with networking disabled, three offline inference runs, old asset-cache removal and preserved local-storage marker passed. The test uses an isolated browser profile; full migration of a real user's pre-existing learner database was not exercised.
- `npm run export:web --workspace=apps/mobile`, generated service-worker freshness, and local Netlify-style asset/MIME/route checks passed. No Netlify deployment was made.

## Reproduce

From the repository root:

```powershell
.\ml\deployment\onnx\.venv\Scripts\python.exe ml/deployment/onnx/replace_bilstm_v1_1.py --source-dir 'C:\Users\jomsa\Downloads\BAYA_EfficientNetB0_BiLSTM_v1_1_results'
node scripts/verify-bilstm-v1.1-browser.mjs
npx tsc --noEmit --project apps/mobile/tsconfig.json
npm test --workspace=apps/mobile -- --runInBand --silent --forceExit
npm run export:web --workspace=apps/mobile
node apps/mobile/scripts/generate-pwa-service-worker.mjs --check
node scripts/verify-netlify-assets.mjs
$env:BAYA_PWA_REPORT='ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/pwa-browser-final.json'
node scripts/verify-baya-pwa-browser.mjs
node scripts/test-bilstm-ui-smoke.mjs
```

The conversion script only stages/validates; it does not silently replace a deployed model. The browser scripts require local Chrome at the documented Windows installation path. Numerical equivalence does not require byte-identical converter output across different environments; source hashes, graph contracts and full-vector parity are the authoritative checks.
