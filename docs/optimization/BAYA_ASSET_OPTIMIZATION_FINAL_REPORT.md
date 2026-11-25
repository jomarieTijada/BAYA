# BAYA asset optimization implementation

Implemented a measured web delivery reduction while retaining original media, native PNG references and the existing offline contract. The full production export falls from **121.55 MB to 111.46 MB** (8.31%); required cached bodies fall from **98.39 MB to 88.30 MB** (10.26%). No commit or deployment was made, and existing work was preserved.

## Changes and causes

- Bayani's 50 PNG frames accounted for 16,931,436 export bytes. Lossless WebP derivatives use 10,949,292 bytes, saving 5,982,144 bytes with exact RGBA, alpha and dimensions. Native sources and original artwork remain intact. Frame order is canonical; generated web references are checked before every export. Animation controls/timing remain shared.
- A barrel icon import pulled in all 19 font families. A direct Ionicons import removes 18 unused families (3,687,116 bytes) and associated JS overhead while keeping the same icons. No glyph subsetting or typography redesign.
- Storybook syllables reuse the existing tracing-guide registry. Existing card, picture, mascot and audio components already compose shared behavior; no unnecessary inheritance layer was introduced.
- Reproducible inventory, SHA/dHash audit, format benchmarks, lossless generation/verification, stale-asset build gate, bundle attribution, export-integrity comparison, isolated offline browser tests and report generation were added.
- Audio, LiteRT runtime filtering, model selection and offline-readiness behavior had prior optimizations. Their savings are not credited to this task. The model, labels, preprocessing, recordings, educational content and persistent/sync code remain unchanged.

## Measurements

| Disjoint export category | Before bytes | After bytes | Saved bytes |
| --- | --- | --- | --- |
| animation | 16931436 | 10949292 | 5982144 |
| audio | 1534044 | 1534044 | 0 |
| font | 4076840 | 389724 | 3687116 |
| image | 4645239 | 4645239 | 0 |
| javascript | 3063201 | 2634431 | 428770 |
| litert-runtime | 22638204 | 22638204 | 0 |
| model | 44928344 | 44928344 | 0 |
| other | 641726 | 641726 | 0 |
| video | 23095890 | 23095890 | 0 |

The inventory contains 677 baseline source/archival resources and all 262 exported files, with hashes, image dimensions, media durations where applicable, reference hints, exact build/cache matches and candidates. Asset/cache/source totals overlap and are never added together. Full assets/public source directories grow by 10,949,292 bytes because originals are retained. No local repository-size reduction is claimed.

## Quality and verification

All 830 Jest tests, TypeScript, lint, production exports and new build-gate tests passed. All 50 transformed frames are pixel identical. Actual offline Chromium runs verified cache readiness, image/audio decoding, lesson/character/writing screens, WebGPU and forced-WASM inference, SQLite persistence across reload/reconnect, language switching and origin-storybook pages. Ba/Be/Bi clips played to completion offline. Visual samples retain layout and character appearance. See [test evidence](BAYA_ASSET_OPTIMIZATION_TEST_RESULTS.md) and [media review](BAYA_MEDIA_QUALITY_REPORT.md).

Storage and observed initial page-transfer savings are demonstrated. No faster startup, smaller decoded memory, smoother animation or improved recognition accuracy is claimed: local timing medians did not improve. See [performance](BAYA_PERFORMANCE_BEFORE_AFTER.md).

## Remaining acceptance gaps

Physical Android, Safari/Firefox/native validation, live cloud synchronization, human pronunciation listening and held-out model accuracy were not performed. No connected device was available. The repository's generic quiz activity remains a pre-existing unavailable placeholder, so full quiz completion cannot be certified. No optional quantized model was deployed. Existing source publication/educational review notes remain in force. These are explicit limits, not passing results; the entire requested acceptance matrix remains partly unverified.

## Reproduction and files

Follow [the pipeline README](../../scripts/optimization/README.md). `implementation-files.json` lists created/modified files; no source file was deleted. `working-tree-before.txt` records unrelated existing changes. `BAYA_ASSET_OPTIMIZATION_RESULTS.csv` lists each adopted frame and excluded font with validation; detailed before/after inventories and all nine supporting reports are in this directory.

Priorities for further work: run the same isolated tests on a physical Android browser; complete listening review using the existing audio worksheet; validate actual supported-browser/device performance; separately evaluate animated containers or model quantization only with the required compatibility and quality gates. Avoid broad source archive cleanup or removing fallback runtime files merely to shrink local disk usage.
