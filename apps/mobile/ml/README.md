# Production handwriting recognition

The deployed ONNX is now the exact user-supplied file (SHA-256 `32b63d2f36802e5792006c07f18bcc1aead2f9d20ed1181edc1feebf59ab70b1`). Its two additional static normalization inputs are supplied from the verified contract. See `docs/ml/supplied-bilstm-replacement.md`.

The sole active manifest is `bayaActiveModel.json`. It selects `Baybayin_EfficientNetB0_BiLSTM_1.1.onnx`, the unchanged stage B checkpoint selected by the supplied refinement metrics. Labels retain the exact 63 training indices.

`runBayaInference(imageData, sequenceData)` supplies float32 `image_input` [1,96,96,1] and `sequence_input` [1,512,6]. The private, shared ORT Web 1.30.0 WASM session returns `Identity:0` [1,63]. Warmup, retries, probability validation, stable ranking, learner feedback and mastery rules retain their existing behavior.

Image preprocessing is unchanged: white alpha composite, Pillow grayscale, inverted ink, threshold 0.08, bounding box, 15% padding, centered square, uint8 Pillow bilinear resize and float32 /255. The model itself repeats grayscale to RGB, multiplies ink by 255, and applies saved EfficientNet normalization.

`bilstmSequence.ts` ports refinement-notebook cell 10: trajectory bounding box and 15% square padding; stroke-preserving proportional downsampling; features x_shape, y_shape, dx, dy, dt_norm, stroke_start; trailing zero rows for the model's zero mask. Canvas coordinates are converted to pixels before shape normalization. Signed dx/dy are preserved. Image and trajectory preprocessing match 15 paired notebook goldens exactly.

The export service worker generator ships only the selected model and runtime metadata, hashes the selected bytes into its cache version, and removes previous BAYA asset caches on activation. It never clears SQLite/OPFS, profiles or progress. Unrelated research candidate source files are preserved but excluded from dist.

See `docs/ml/bilstm-v1.1-replacement.md` for provenance, limitations, reproduction commands and validation results.
