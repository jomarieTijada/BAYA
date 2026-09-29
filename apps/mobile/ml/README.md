# BAYA browser inference service

The production inference API accepts `runBayaInference(imageData, sequenceData)`. `bayaModel.web.ts` privately loads the verified ONNX artifact on the first inference request, validates the exact four-input / one-output graph contract, supplies the two provenance-verified static normalization feeds, and returns the 63 float32 probabilities. It caches one session and shares in-flight initialization. `bayaModel.ts` is the native fallback and never imports ONNX Runtime Web.

The deployed model is `/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1.onnx`, selected by `BAYA_RECOGNITION_MODEL_VERSION` in `bayaModelConfig.ts`. Its contract is documented in `public/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1_onnx_contract.json`. The v1.0 ONNX file and contract remain beside it for rollback. ONNX Runtime Web 1.30.0 uses its WASM CPU provider. The matching `.mjs` and `.wasm` runtime files are copied from the installed package into `public/ort/` by `scripts/copy-ort-wasm.mjs` before web start and export; they are served from the app origin without a CDN.

## Installed PWA and offline recognition

Build with `npm run export:web` from `apps/mobile`. Its postexport step writes `dist/sw.js` and a content-derived cache name. The service worker precaches the exported entry and worker bundles, non-video app assets, the v1.1 ONNX file, and the three local ORT runtime files. It caches later same-origin app requests, serves the immutable ML and hashed bundle files from cache, and uses a cached app shell for offline navigation. On activation it removes older BAYA cache versions. The root layout registers this worker only in production web builds; the Expo development server remains uncached. Production hosting must serve `sw.js` from the origin root and should rewrite app routes to `index.html` for first-time deep links.

On Android, open the deployed HTTPS site in Chrome and install the web app from Chrome. Opening the Expo QR code in **Expo Go** launches the Android React Native bundle instead: `Platform.OS` is `android`, no browser `document` exists, Metro selects `bayaModel.ts` instead of `bayaModel.web.ts`, and browser canvas capture and ONNX Runtime Web cannot run. A BAYA icon opened through Expo Go is not the installed PWA. The desktop preview URL `localhost` also refers to the phone itself when entered on the phone; use the deployed HTTPS origin for phone installation and offline verification.

To verify the export, run `node scripts/generate-pwa-service-worker.mjs --check`. For a browser check, serve `dist`, open the writing route online, wait for service worker installation, then stop the server (or go offline), reload, draw a character, and press Suriin. The result must replace the idle bubble with a model label, confidence, and top three. A fresh installation needs one online visit to cache the required files. Browser storage eviction or a failed install requires another online visit.

In a development web session, open any app route with `?bayaMlSmoke=1`. The existing trigger runs three deterministic zero-input inferences, logs the actual runtime/provider, model URL, input/output names and shapes, verifies finite probabilities summing near one, and confirms that one session was reused. It does not show debugging UI or run in production. Mocked Jest tests verify service behavior; only a real browser smoke run verifies the shipped model and WASM files.

The v1.1 ONNX artifact passed 20-case Keras parity with maximum absolute difference `3.15904617e-6` against the required `1e-4` threshold. The historical v1.0 artifact passed four-case parity at `3.48687172e-6`. This service does not interpret output indices. For browser timing in development, open a route with `?bayaMlBenchmark=1`; it performs five warm-ups and 40 timed cached-session inferences using the same zero tensors for either version. See `docs/ml/v1.1-deployment.md` for results and rollback.

## Handwriting preprocessing

The active Module 3 `WritingCanvas` records normalized `x`/`y`, the canvas dimensions, and wall-clock `t` (milliseconds) for each accepted touch point. Before preprocessing, coordinates are restored to the canvas's physical width/height so the sequence and raster capture preserve the visible aspect ratio. `writingRecognition.ts` converts the first-to-last capture interval to the training field `duration_ms`, rasterizes the current ink without the trace guide, calls the notebook-backed image and sequence preprocessing functions, then passes those tensors to the ONNX service. The class output order comes from `efficientNetClassLabels.ts`. Recognition is web-only, matching the ONNX service; the existing local writing feedback remains separate.

### Authoritative notebook audit

The source present in this checkout is `ml/training/EfficientNet_B0–BiLSTM.ipynb` (the filename has an en dash). The executed and source cells used for the audit are:

- Cell 3: `IMG_HEIGHT=96`, `IMG_WIDTH=96`, `IMG_CHANNELS=1`, `SEQ_FEATURES=6`, `MAX_SEQ_LEN=512`.
- Cell 15: `classes = sorted(df["label"].astype(str).unique())`, then builds `label_to_id` and `id_to_label`.
- Cell 17: `IMAGE_PADDING_RATIO=0.15`, `INK_THRESHOLD=0.08`, and `load_image_array`.
- Cell 19: `TRAJECTORY_PADDING_RATIO=0.15`, `allocate_points_per_stroke`, `select_evenly`, `get_trajectory_transform`, and `build_sequence`.
- Cell 23: confirms the training arrays use the two functions above and have image `(N,96,96,1)` and sequence `(N,512,6)` shapes.
- Cell 41: verifies the grouped 63 labels have zero missing, extra, or duplicate entries.
- Cell 51: saves the preprocessing metadata and label mapping artifacts.

Cell 17 composites RGBA onto white, converts to Pillow grayscale, inverts to ink, thresholds at 0.08 for an all-ink bounding box (including kudlit), crops, adds `max(2, round(max(crop_h,crop_w)*0.15))` on each side, centers on a zero float32 square with floor integer offsets, truncates the multiplied values to uint8, and applies Pillow `Image.Resampling.BILINEAR` to 96×96 before dividing by 255 and adding the channel axis. For a blank raster, it resizes the original-sized ink raster. The TypeScript Pillow-compatible fixed-point bilinear resampler and RGBA conversion match all Python golden pixels exactly in the covered cases.

Cell 19 derives trajectory bounds from every point before sampling; bounds are converted to float32 for the extrema. It uses one centered scale `max(width,height,1e-6)*1.30`. It proportionally allocates overflow across strokes, samples with `linspace` plus ties-to-even rounding, computes `dx/dy` from un-clipped normalized positions, and computes `dt_norm` globally across strokes using `max(duration_ms or 0,1)`. The output order is `[x_shape,y_shape,dx,dy,dt_norm,stroke_start]`; rows after the retained sequence are all zero. The TypeScript port matches each gold float, including the per-feature values and exact `stroke_start` flags.

Cell 51's saved metadata was extracted to `ml/__tests__/fixtures/efficientnet-v1/notebook-audit.json`. It records the 96×96×1 input; white-to-zero / black-to-high rule; ink-box, 15%-padding, centered-square, resize rule; grayscale-to-RGB repetition and ×255 EfficientNet input conversion; built-in EfficientNet preprocessing; max sequence length and feature names; trajectory bbox/centered-square/max-dimension/15% rule; stroke-preserving proportional overflow; and grouped train/validation/test export split keys. The Colab-only JSON artifact itself is not present in this checkout, so the audit is from the notebook's actual save dictionary and executed cells.

### Golden parity fixtures

From the repository root, run:

```powershell
python ml/training/generate_efficientnet_preprocessing_fixtures.py
```

The generator parses and executes only the definitions in notebook cells 17 and 19. It never runs training cells. It creates deterministic transparent/opaque RGBA drawings and raw stroke JSON, invokes the extracted notebook functions, and saves little-endian float32 goldens under `ml/__tests__/fixtures/efficientnet-v1`. Fixtures cover single/multiple strokes, kudlit above/below, narrow/tall and wide shapes, tiny edge marks, alpha/grayscale, short and exactly-512 sequences, over-512 allocation, multiple-stroke downsampling, zero/degenerate duration, and blank input. The audit JSON includes a source-notebook SHA-256; the generated class mapping is derived from cell 41 groups, sorted per cell 15, checked against cell 15's executed first 20 IDs, and checked against cell 41's successful grouping output.

The Jest parity suite compares all 9,216 image values and all 3,072 sequence values for every fixture. Current result: image max/mean absolute error `0 / 0`; sequence max/mean absolute error `0 / 0`; maximum error for each feature is `[0,0,0,0,0,0]`; `stroke_start` matches exactly.

The notebook's allocator has a defensive limitation when the number of non-empty strokes itself exceeds `MAX_SEQ_LEN`: the base allocation can exceed 512, after which `build_sequence` clips the combined output. The training notebook reports a maximum of 12 strokes, and the port preserves this exact behavior. The fixtures cover realistic multi-stroke overflow and do not alter that notebook edge case.
