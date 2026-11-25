# Before/after measurements

Both builds came from revision `87aed72c6107fa97735751aad4ff6f506281aff3` plus the existing uncommitted workspace recorded in `working-tree-before.txt`. This task compares fresh local production exports, not historical deployments. Build logs record the existing environment variable names; no credentials are included. Browser evidence uses isolated desktop Chromium profiles at localhost, gzip level 6, 1280×800, no bandwidth throttling, three fresh profiles per build. The first run includes cold server compression; subsequent runs reuse the server's compression buffer. Background verification was active, so this is not a controlled device/network performance study.

| Measure | Before | After |
| --- | --- | --- |
| Raw full export | 121,554,924 | 111,456,894 |
| Required cached response bodies | 98,390,699 | 88,295,561 |
| Required cache entries | 255 | 237 |
| All export files | 262 | 244 |
| Median observed page transfer at usable interface (bytes) | 837139 | 703706 |
| Usable-interface times (ms) | [3364, 1040, 1004] | [3000, 1368, 1229] |
| Offline-ready times (ms) | [7507, 3032, 2814] | [5541, 3779, 3043] |
| Median usable-interface time (ms) | 1040 | 1368 |
| Median offline-ready time (ms) | 3032 | 3779 |
| Local gzip-9 estimate of all export bodies | 96062180 | 88936457 |

Storage saving: 10,098,030 export bytes (8.31%); 10,095,138 required-cache bytes (10.26%). The full cache was actually read and counted in Chromium, agreeing with manifest totals. Browser database/cache engine overhead, HTTP cache duplication and installed APK size are not included. Gzip estimates are not hosted transfer measurements. Page CDP transfer at the usable-interface checkpoint excludes service-worker-owned downloads, so it must not be advertised as the entire offline installation download.

Startup/offline-ready medians increased in these noisy local samples; **no speed or animation-smoothness improvement is claimed**. The observed page transfer at usable interface decreased, but field-network and physical-device tests remain necessary. No heap/decoded-memory reduction is claimed. Standalone image decode timings in browser JSON include fetching from cache and are not pure decoder benchmarks.

Baseline physical repository logical size was 27,409,200,640 bytes (25.53 GiB), including .git, dependencies, Android builds, research and scratch exports. Its top-level breakdown is in BASELINE.json. New derivatives deliberately add 10,949,292 source bytes while preserving originals; full assets/public directory bytes are 114,643,475 before and 125,592,767 after. Baseline/after source-asset inventory totals count selected media extensions, while `source-directory-measurement.json` includes every file. Scratch exports/evidence also increase local repository size. This is a delivered-web/offline-cache reduction, not a claim that local checkout disk usage shrank.
