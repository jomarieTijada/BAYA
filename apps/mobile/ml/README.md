# Browser handwriting recognition

`bayaActiveModel.json` is the deployment contract for `resnet18-v1/BAYA_ResNet18_spatial.tflite` and `@litertjs/core` 2.6.0. Supplied labels and normalization metadata live beside the model. Evaluation and conversion records stay in `docs/ml/resnet18-spatial-v1`, outside public assets.

`writingRecognition.ts` rasterizes original normalized strokes at 256 square pixels, preserving the canvas aspect ratio. `bayaPreprocessing.ts` reproduces the training notebook's Pillow alpha/grayscale conversion, gray <225 bounding box, 1.34 padded square, float32 affine matrix and OpenCV INTER_LINEAR quantization. It returns ImageNet-normalized float32 NCHW `[1,3,160,160]` and an invertible affine transform. Blank/tiny captures are rejected before inference. `modelPointToSource` maps normalized model coordinates to capture pixels; multiply those pixels by `max(canvas.width, canvas.height)/256` to recover original canvas coordinates.

`bayaModel.web.ts` lazily initializes one local LiteRT runtime and compiled model, attempts WebGPU with fp32 precision, falls back to WASM, checks actual metadata, serializes inference, and frees temporary tensors. Failed loads can be retried; failed execution releases the model. Shared model lifetime spans screen changes; `disposeBayaModel` waits for queued work before releasing it. Existing component unmount/version guards prevent stale results or progress writes. Native builds report unsupported.

`bayaOutputs.ts` decodes the five heads: class/base/modifier logits via stable softmax, normalized kudlit X/Y, and body bounding box. Runtime names `output_0` through `output_4` and shapes were verified against real browser execution and the PyTorch checkpoint. Mapping uses tensor identity, not array order. `runBayaSpatialInference` exposes typed diagnostics; `runBayaInference` preserves the existing probability-array interface. Auxiliary heads never replace the primary prediction or determine correctness. Vowels/base-only predictions expose no kudlit position.

The existing 80% confidence rule, expected-character comparison, retry UI, two-attempt mastery policy and persistence schemas are unchanged. Confidence is not out-of-distribution detection. Spatial outputs were trained using pseudo-labels and are not independently validated handwriting correctness or stroke-order scores.

Build/start scripts copy the pinned package's entire WASM directory to `/litert/2.6.0/`. These generated files are git-ignored, served locally, and included in the PWA cache. Successful installation precaches the model, metadata, runtime, app shell and static learning assets. Cache identity hashes content; activation removes previous BAYA caches. A failed installation deletes its partial cache and retains the prior active worker. First-time offline use before successful preparation remains unavailable.

Verification:

- `npm test --workspace=apps/mobile -- --runInBand`
- `npx tsc --noEmit -p apps/mobile/tsconfig.json`
- `npm run lint --workspace=apps/mobile`
- `npm run export:web --workspace=apps/mobile`
- `python scripts/testing/litert-reference.py` (requires the supplied notebook/checkpoint, Python, PyTorch, torchvision, Pillow, NumPy and OpenCV)
- `node scripts/testing/probe-litert.mjs` (real model parity and desktop backend benchmarks)
- `node scripts/testing/litert-production.mjs` (exported app, isolated profile, real submissions and offline reload)
- `node scripts/verify-netlify-assets.mjs` (local hosting/MIME/integrity checks)

The pre-migration workspace is preserved at `codex/pre-litert-migration` (e6d66544593be9be70400c80d9fcf58b6ccc7eb1). Historical research/rollback files outside the app remain archival; old model-specific scripts are not current deployment checks. No ONNX dependency remains in the app. See the migration report for evidence and device limitations.

Native LiteRT `INFO:` stderr lines are routed to `console.info` during runtime asset copying so Expo does not report informational initialization messages as application errors. All other stderr output retains `console.error`. The copy script checks the pinned runtime binding before applying this scoped transformation; WASM/model bytes and the global console are unchanged.
