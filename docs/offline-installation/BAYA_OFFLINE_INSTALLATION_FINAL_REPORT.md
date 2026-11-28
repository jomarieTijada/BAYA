# BAYA offline installation final report

Date: 2026-11-26. Build: `baya-pwa-f3e7f5c64b484666`.

## Implementation

The existing PWA now prepares and verifies its complete independent-learning package automatically after bootstrap. Added actual progress/category counts, integrity validation, recoverable interruption/quota handling, Settings verification/repair, staged updates, and English/Tagalog setup/completion UI. The persistent offline header is replaced with temporary offline/reconnected toasts.

## Measured package

Initial current production export: 109,481,858 bytes in 246 files (not the historical figures in the request). Final required package: **109,426,288 bytes / 104.36 MiB, 240 files**. These are decoded resource bytes, not a guarantee of compressed network transfer size or total browser storage overhead. A fresh localhost setup including runtime validation took 8.903 seconds on this host; this is not an Android or mobile-network benchmark.

| Category | Files | Bytes |
| --- | ---: | ---: |
| Application shell | 1 | 1,762 |
| Other offline resources | 5 | 638,702 |
| Character illustrations | 100 | 3,738,301 |
| Handwriting model | 1 | 44,928,344 |
| LiteRT runtime | 4 | 22,638,388 |
| Lessons and activities | 2 | 2,711,335 |
| Pronunciation audio | 71 | 1,610,072 |
| Bayani animations | 51 | 8,778,203 |
| Educational videos | 1 | 23,095,890 |
| Storybook resources | 3 | 895,567 |
| Fonts and icons | 1 | 389,724 |

## Coverage and validation

The one current instructional video is included and actually played offline at the beginning, middle, and near end. All 71 pronunciation assets and 154 raster images decoded offline. Current v1.1 mascot assets, story resources, character references, bundled lessons/questions, fonts/icons, and activity code are inventoried. Unavailable lesson videos and content approval/withheld recording decisions were not changed.

The selected ResNet18 spatial model and all four LiteRT 2.6.0 fallback files are verified. Real WASM inference, actual handwriting UI submission/retry, matching completion/audio playback, and local result persistence passed offline. A full browser process restart retained learner profile/progress and supported offline lessons and inference. Synthetic stroke probes test runtime/persistence, not educational recognition accuracy.

## Recovery, storage, updates

A real interrupted model transfer resumed automatically after reconnect without redownloading 35 already verified files. Corrupt cached model bytes invalidated readiness and were repaired. A failed staged update preserved the previous cache and offline video; a repaired update activated after browser close, validated offline, then cleaned obsolete BAYA caches. Unit tests also cover low quota, range validation and checksum-based reuse. Resource maintenance never clears learner databases.

Browser storage can still be evicted or cleared. Persistent storage permission was not guaranteed. If all windows close before a staged update completes, a browser can activate its bootstrap; the previous resources remain available for reuse, but an arbitrary incomplete new release is not guaranteed to roll back to the old application UI.

## Compatibility and test status

Verified: production Desktop Chromium, fresh profile, mobile/desktop viewport emulation, disconnected browsing with HTTP cache disabled, process restart, forced LiteRT WASM fallback, and English/Tagalog setup. No physical Android device was attached. Android native installation UI, physical installed PWA behavior, iOS/Safari/Home Screen, and low-memory device performance remain unverified.

TypeScript, ESLint, production export, deterministic manifest checks, all 10 focused Jest tests, and all 6 worker behavior tests pass. Full Jest run: **82 suites / 1073 tests passed; 9 suites / 15 tests failed** in other writing/header/content/matching/curriculum/swipe tests. No baseline rerun established their provenance. Detailed failures remain in the log. Therefore the complete cross-platform acceptance matrix is not represented as fully passed.

## Files changed

- Root/learner layouts: setup boundary and one global connectivity listener.
- `components/learner/OfflineLearningStatus.tsx`: temporary existing-style toasts.
- `components/learner/OfflinePackageProvider.tsx`: setup, status, updates and management state.
- `components/learner/settings/OfflinePreparation.tsx`: Settings resource controls.
- `modules/offline/package.ts`: typed worker messaging and real runtime checks.
- `scripts/generate-pwa-service-worker.mjs`: build inventory, hashes, bootstrap and manifest generation.
- `scripts/offline-worker.js`: download/verification/recovery and cached range routing.
- English/Tagalog locale dictionaries.
- Generator/worker tests and adapted browser verification scripts under `scripts/testing/offline-installation*.mjs`.
- This report, architecture, UX, inventory and test results under `docs/offline-installation/`.

Evidence is stored under `docs/verification/offline-installation/`; command logs are adjacent. No deployment, cloud write, model/asset recompression, content approval change, or learner-record deletion was performed.
