# ResNet18 LiteRT migration — 2026-11-14

Implemented in the existing working tree. No deployment was performed. Existing UI styling, routes, learning/mastery rules, authentication, workspace/synchronization code and database schemas were not changed by this migration. The working tree already contained extensive unrelated edits; those remain intact.

## Architecture and workflow

Original normalized strokes → aspect-preserving 256×256 canvas capture → Pillow-compatible alpha/grayscale conversion → gray <225 complete ink box → 1.34× padded square, minimum side 10 → notebook-compatible float32 affine / OpenCV bilinear warp → 160×160 three-channel ImageNet normalization in NCHW → local LiteRT → stable softmax and typed five-head decoding → existing expected-character/confidence feedback → existing local progress service.

`bayaModel.web.ts` shares a single lazy runtime/model, serializes concurrent inference, attempts WebGPU fp32, falls back to WASM on GPU compilation/execution failure, rejects invalid tensors/metadata, releases temporary tensors, and permits retry after errors. Explicit disposal waits for pending work. The existing component guards suppress late results after unmount, navigation, drawing changes and learner changes.

`bayaOutputs.ts` exposes class/base/modifier predictions and consistency diagnostics, normalized spatial outputs and no kudlit location for vowels/base-only classes. Auxiliary heads never override the primary class or award progress. The affine inverse maps model coordinates to the source capture. Existing UI and persistence consume the compatible probability-array adapter.

## Model verification

- Supplied TFLite bytes: **44,928,344 bytes (42.847 MiB)**, copied unchanged into `apps/mobile/public/models/baya/resnet18-v1/` with original labels and preprocessing JSON.
- Actual LiteRT 2.6.0 metadata: input **`args_0`, float32 `[1,3,160,160]`**.
- Actual outputs: `output_0 [1,63]`, `output_1 [1,18]`, `output_2 [1,5]`, `output_3 [1,2]`, `output_4 [1,4]`, all float32. Mapped respectively to class logits, base logits, modifier logits, kudlit XY and body bounding box. Identity and shape are checked; runtime array order is not trusted.
- Authoritative class/base/modifier ordering comes directly from supplied `labels.json`.
- The provided `BAYA_ResNet18_Spatial_Training.ipynb` was inspected. Only its `prepare` function and model class definitions were extracted for reference generation; training cells were not executed.
- Nine fixtures (seven reference glyphs, random RGBA and edge strokes): **all 76,800 preprocessing values per fixture match the notebook bit-for-bit**.
- Browser output parity against supplied `best_resnet18.pt`: maximum absolute error **3.8147e-6 WebGPU**, **5.7221e-6 WASM**, across all five outputs and all nine cases.
- See [browser parity](browser-parity.json), [extracted notebook definitions](notebook-definitions.py), and checked-in fixture `reference.json` for notebook/checkpoint hashes and individual results.
- Supplier `README_MODEL_CONTRACT.md` and `SHA256SUMS.txt` were absent. [SHA256SUMS.local.txt](SHA256SUMS.local.txt) records independently calculated local hashes; it is not represented as a supplier checksum manifest. Supplier conversion/evaluation reports are preserved separately here.

## Verification results

- Full app test run: **74 suites / 772 tests passed**. The suite has lingering async handles, so the completed run used `--forceExit`; no test failures were suppressed. Existing React test warnings remain outside this migration.
- Subsequent final changes: **20 preprocessing/PWA tests passed**, including two newly added cache cleanup/failure tests; **64 recognition orchestration/UI tests passed** after removing the retired experimental-gating test. The last complete suite preceded those narrow changes.
- `npx tsc --noEmit -p apps/mobile/tsconfig.json`: passed.
- `npm run lint --workspace=apps/mobile`: passed.
- Production Expo export and generated service worker validation: passed. Expo reports its existing sqlite export-resolution warning.
- Real browser parity: both WebGPU fp32 and WASM CPU passed; model and tensor cleanup verified. Mocked runtime tests exercise missing GPU, failed compilation, device loss, retry, metadata mismatch, reordered outputs, nonfinite/malformed results and concurrent requests.
- Actual exported bundle: real inference, result rendering, expected-character mismatch, one attempt per submission, retry and **offline reload followed by real inference and submission** passed in an isolated Chrome profile. No model predictions were mocked. [Production evidence](production-browser.json), [online screenshot](online-ui-submission.png), [offline screenshot](offline-ui-submission.png).
- The synthetic wave was uncertain (~48% top probability), so it recorded no attempt. A separate synthetic shape produced TA (~97.1%) against expected A; each online/offline UI submission recorded exactly one non-mastery attempt. These cases exercise policy and plumbing, not independently validated handwriting accuracy.
- Local Netlify emulation passed all model, JSON, runtime JS/WASM MIME, integrity and SPA-route checks. This is not a live Netlify deployment test.

## Measured desktop performance

Chrome 157 headless on this Windows host, local loopback serving, 30 timed repeated inferences after parity cases. These figures vary with GPU driver compilation, browser cache and host load. No ONNX comparison was performed. Download timing is local transfer timing, not an internet estimate.

| Backend | Model transfer | Runtime/model load | First real inference | Warm median | Warm p95 |
|---|---:|---:|---:|---:|---:|
| webgpu | 212.4 ms | 3428.6 ms | 3148.3 ms | 31.0 ms | 59.4 ms |
| wasm | 253.1 ms | 472.1 ms | 74.3 ms | 57.4 ms | 65.1 ms |

The separate `benchmark.firstInferenceMs` field in the JSON is the first call of the already-warm benchmark; the table uses the top-level `firstInferenceMs` captured before parity runs. Production cold initialization/submission took several seconds, especially on WebGPU; it remains asynchronous behind the existing analyzing feedback.

Approximate measured JS heap: 23.0 MiB WebGPU / 15.4 MiB WASM in the probe. This does **not** include all WASM linear memory, GPU weights/intermediates, browser process memory or storage. No claim of bounded total device memory is made.

## Offline and deployment

The pinned `@litertjs/core` package's eight runtime JS/WASM variants (46,982,616 bytes / 44.806 MiB) are generated into same-origin `/litert/2.6.0/` during start/export. Generated runtime copies are git-ignored; the package lock and copy script reproduce them. There is no mandatory CDN request.

Successful PWA installation precaches model, metadata, runtime, app shell and existing learning assets: approximately **116 MB decimal / 111 MiB total, 168 entries**. Installation is all-or-nothing; a failed download removes its partial cache. Content-derived cache names and activation cleanup remove stale BAYA versions; export pruning removes unselected model files recursively. Both `netlify.toml` and `public/_headers` specify appropriate versioned asset types/cache policy. First-time offline operation requires a prior successful online installation. Existing media-streaming policy is preserved.

## Cleanup and file inventory

The original in-progress inference implementation was preserved without altering the working index on branch **`codex/pre-litert-migration`**, commit **`e6d66544593be9be70400c80d9fcf58b6ccc7eb1`**.

- Created: five-head output decoder/tests, LiteRT asset-copy script, versioned TFLite/metadata, notebook parity fixtures and browser/production verification tools/reports.
- Modified: model configuration, labels, preprocessing, web/native adapters, recognition orchestration, existing ML/PWA tests, package manifest/lock, service-worker generator, deployment headers, runtime docs and verification entry points. Writing screen changes only update runtime diagnostics and remove the dead experimental-validity error branch; no styles or navigation changed.
- Deleted: active ONNX character/validity assets and their old metadata, ONNX loader assets/copy script/model selector, superseded ink preprocessing, validity detector/tests, and retired preprocessing fixtures.
- Moved: none during this migration. Earlier rollback moves were pre-existing user work.
- **No ONNX npm dependency remains.** Historical model conversion Python dependencies, `ml/rollback` binaries, dated research reports and old comparison scripts remain outside deployment for research/recovery. They are explicitly historical and require their original snapshot/fixtures; they are not current recognition paths.
- The exact authored/source asset list is in [files.json](files.json); generated runtime assets are listed separately there. Most deleted paths are the 234 old preprocessing fixtures. The report and inventory themselves are new deliverables.

## Remaining limits

- `adb devices -l` found no connected Android device. Physical Android browser performance/compatibility, iOS/Safari and low-memory hardware remain unverified; responsive desktop rendering is not a substitute.
- Spatial targets are automatic pseudo-labels. Coordinate consistency, softmax confidence and recognition are not independently validated correctness, OOD rejection or stroke-order grading.
- Existing confidence/mastery thresholds were preserved, not recalibrated for the new model. The high-confidence synthetic result demonstrates why confidence alone must not be presented as proof of validity.
- The package's source README/checksum manifest was missing, but notebook preprocessing and checkpoint/browser parity were independently verified.
- No database migrations, authentication/workspace changes, cloud writes or deployment were introduced.
