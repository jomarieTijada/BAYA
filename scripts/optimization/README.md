# BAYA asset optimization pipeline

Run from the repository root. Existing reports describe the 2026-11-20 working tree, including pre-existing audio/offline changes. No command deploys, commits, deletes source artwork, clears learner storage, or modifies cloud data.

## Normal development/export

```powershell
npm run verify:optimized-assets --workspace mobile
npm run export:web --workspace mobile
```

The export pre-hook checks every original and derivative SHA-256 plus the generated static web registry. Python is **not** required by normal npm builds. The 50 committed WebP files are web-only; native retains the original PNGs. `frameSources.ts` is the sole editable frame ordering. `frameSources.web.ts` is generated from it. Playback timing and renderer behavior remain in their existing shared modules.

## Rebuild media after approved source-art changes

Use Python 3.12 with `python -m pip install -r scripts/optimization/requirements.txt` if these tools are not already installed. Recorded encoder versions are in `mascot-derivatives.json` (Pillow 12.3.0, libwebp 1.6.0); a different codec build may change compressed bytes. Always review generated output and manifest changes.

```powershell
python scripts/optimization/optimize-images.py benchmark
python scripts/optimization/optimize-images.py build
python scripts/optimization/optimize-images.py verify
node --test scripts/optimization/verify-optimized-assets.test.mjs
```

`build` preserves all PNGs, requires every derivative to be smaller, and rejects any decoded RGBA or dimensional difference. `verify` repeats source/output hashes and pixel comparison. It never resizes, trims, redraws or deploys lossy media. Benchmark AVIF/lossy/sprite/animated variants are measurements only. A source frame count change deliberately fails the build gate until its animation contract is reviewed. The existing audio pipeline remains `scripts/audio/process_audio.py`; no parallel audio manifest was introduced.

## Fresh export/inventory

Take the pre-change snapshot **before** edits. Keep each comparison's environment, Expo version and application changes fixed. Do not overwrite the saved BASELINE/AFTER evidence with today's source tree.

```powershell
$env:BAYA_WEB_OUTPUT_DIR = 'C:\BAYA\.codex-tmp\optimization\audit'
npm run export:web --workspace mobile -- --output-dir C:\BAYA\.codex-tmp\optimization\audit
python scripts/optimization/inventory-assets.py --export .codex-tmp/optimization/audit --label AUDIT_20261120
Remove-Item Env:BAYA_WEB_OUTPUT_DIR
```

Choose a new label/output for subsequent audits. The inventory refuses to overwrite its JSON snapshot. It hashes relevant source/archival resources and every export file, records exact precache membership, image dimensions/dHash and media duration, and measures physical logical repository bytes separately. Source reference matches are hints, not a deletion authorization. Source JSON/CSV selected-extension totals differ from full directory totals; `source-directory-measurement.json` documents the latter. Gzip-9 estimates are not measured hosted transfers. Full repository scans can take several minutes because this workspace includes large toolchains/research archives.

## Regression and browser verification

```powershell
npx tsc --noEmit -p apps/mobile/tsconfig.json
npm run lint --workspace mobile
npm run test --workspace mobile -- --runInBand
node scripts/optimization/browser-benchmark.mjs .codex-tmp/optimization/audit audit 3
$env:BAYA_FORCE_WASM = '1'
node scripts/optimization/browser-benchmark.mjs .codex-tmp/optimization/audit audit-wasm 1
Remove-Item Env:BAYA_FORCE_WASM
```

The browser harness needs desktop Chrome at the existing test helper's configured path. It starts an ephemeral local HTTP server and isolated temporary browser profile, then closes them. It can use the existing `BAYA_ANDROID_SERIAL` helper for a connected authorized Android browser, but this change was tested only on desktop. Runs create local QA learner records only in their isolated test origin; no cloud account is created. It tests real cached images/audio, playback completion, actual model inference, local SQLite persistence, language switching and the storybook. Playback events do not certify human pronunciation quality. `BAYA_FORCE_WASM` hides GPU capability solely in the isolated test page.

Do not treat localhost measurements as controlled field performance. Usable-interface timing is the first rendered interactive control; page CDP transfer excludes worker-owned downloads. Readiness waits for the controlling worker and then checks actual asset availability. Cache bytes are response body sizes, not full browser storage allocation. Baseline/after reports retain the measurements actually taken; an expanded later harness also records audio playback and all origin-storybook pages in `after-wasm`.

```powershell
python scripts/optimization/verify-export.py .codex-tmp/optimization/before apps/mobile/dist
node apps/mobile/scripts/generate-pwa-service-worker.mjs --check
```

The export verifier allows only the reviewed old-font and PNG-to-WebP substitutions plus changed JS/shell, and requires protected assets and every derivative in the precache. It rejects unexpected removed resources, changed model/runtime/audio, duplicate original frames, source maps and invalid integrity hashes. These default comparison paths refer to this initiative's saved local exports; they are ignored build artifacts, not portable checked-in files. Rebuild a matching pre-change tree to repeat the complete before/after experiment elsewhere.

## Bundle analysis and reports

Create an isolated source-map export with `npx expo export --platform web --source-maps --output-dir C:\BAYA\.codex-tmp\optimization\analysis` from `apps/mobile`. Do not deploy this output or precache its maps.

```powershell
python scripts/optimization/analyze-bundle.py .codex-tmp/optimization/analysis
python scripts/optimization/compare-results.py
```

Report generation consumes the saved BASELINE, AFTER, before/after browser and after-wasm evidence. It does not re-label the current tree as the old baseline. `implementation-files.json` identifies this initiative's files; `working-tree-before.txt` preserves the list of unrelated work already present.

Acceptance limits remain explicit in the final report: physical-device and other-browser verification, human listening, real workspace sync and held-out accuracy are unverified; the current generic quiz renderer is a pre-existing placeholder. No quantized model, unsupported runtime pruning or cache/data reset is part of this pipeline.
