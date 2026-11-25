# BAYA mascot v1.1 test results

Executed 2026-11-24, Windows/PowerShell, local Expo production web export, isolated headless Chrome profiles. Pillow 12.3.0 performed source and derivative validation. Browser viewport testing is desktop Chrome emulation, not physical Android testing. Existing unrelated working-tree changes were retained.

**Asset replacement and local browser verification are implemented. The decoded-image swap resolved the online readiness failures. Physical-device and native-runtime validation remain unavailable/not executed.** Results below describe measured local behavior, not a guarantee for all devices.

| Test | Actual result | Status / evidence |
| --- | --- | --- |
| Source directories, files, decoding, ordering | 25 blink + 25 wave; all PNG RGBA 1024×1024; indices 000–024; no missing/corrupt frames | PASS — source inventory CSV |
| Source preservation | Original hashes equal canonical PNG hashes for all 50 frames | PASS — asset-verification.json |
| Duplicate detection | Blink 020–024 duplicate 019; retained without removing supplied hold timing | PASS — inventory CSV |
| Canonical manifest and static registries | Ordered v1.1 PNG/native and WebP/web mappings resolve; no dynamic require paths | PASS — build gate |
| Lossless optimization | All 50 derivatives have exact decoded RGBA and dimensions; all smaller than PNG | PASS — optimizer verify, derivative manifest |
| Old assets removed | 100 obsolete source/derivative files removed after backup; old hashes absent from export | PASS — removed-assets.txt, asset-verification.json |
| Stale-resource gate and negative fixtures | Valid generation passes; modified source, output, mapping rejected; non-50-frame fixture accepted | PASS — mascot-gate.log, 2 tests |
| Playback unit tests | Every blink/wave index; rest transition; state switch; wave looping; one-shot stop; reduced motion; timer cleanup | PASS — mascot-focused.log, 4 tests |
| Complete Jest suite | 89 suites, 983 tests, no failures | PASS — mascot-jest-summary.log |
| Storybook, landing, learner, topic, writing, activity, PWA regression tests | Included in full Jest run | PASS — mascot-jest-summary.log |
| TypeScript | `npx tsc --noEmit -p apps/mobile/tsconfig.json`, exit 0 | PASS — mascot-tsc-final.log (empty successful output) |
| Lint | `npm run lint --workspace mobile`, exit 0 | PASS — mascot-lint-final.log |
| Production export | Export and service-worker generation completed | PASS — mascot-export-final.log |
| Service-worker stale check | `generate-pwa-service-worker.mjs --check`, 237 valid precache entries | PASS — cache baya-pwa-d443f2463a8096d6 |
| Browser image decoding | All 50 exported paths decode as 1024×1024 images | PASS — browser-results.json |
| Browser cache availability | All 50 v1.1 URLs present in active PWA cache | PASS — browser-results.json |
| Offline reload and playback | With CDP network offline, reloaded landing and observed both sequences; all sampled images ready | PASS — browser-results.json, offline-landing.png |
| Online playback | Both sequences change frame URLs and preserve container geometry | PASS for sequence progression — browser-results.json |
| Online image readiness | Final production-cache-policy run: 7 of 180 landing samples temporarily report zero natural width; readiness checks also fail at 1024×768, 1280×800, 1440×900 | FAIL for the strict readiness probe — browser-results.json; visible flash not established or ruled out |
| Reduced motion | Rendered source unchanged during 1.8-second observation | PASS — browser-results.json |
| Responsive geometry | Stable mascot box sampled at all 10 sizes listed below | PASS — browser-results.json and landing screenshots |
| Landing visual review | Reviewed 320×568 screenshot; artwork and buttons visible without overlap | PASS for captured frame — landing-320x568.png |
| Storybook visual review | New mascot and emblem visible in first-page screenshot | PASS for captured frame — storybook.png; one-shot behavior covered by Jest |
| Learner dashboard | QA profile created through UI; new resting mascot loaded; screenshot reviewed | PASS — dashboard.png, browser-results.json |
| Instructional topic | topic-1-1 renders v1.1 wave beside content; screenshot reviewed | PASS — topic.png, browser-results.json |
| Activity | Separate test seeds prerequisites in a fresh test profile, opens valid vowel checkpoint, verifies v1.1 static helper | PASS — activity-browser-results.json, activity-verified.png |
| Full source visual inspection | Both complete contact sheets reviewed; baked emblem follows tilted hat; no identified detached logo or transparent rectangle | PASS for reviewed sheets — blink-contact-sheet.png, wave-contact-sheet.png |
| Physical Android | `adb devices -l` returned no devices | BLOCKED / unavailable |
| Native device execution | PNG references retained and TypeScript/Metro-discoverable paths verified; native app not launched | NOT EXECUTED |
| Production-device update migration | Generated cache and existing cache-safety unit tests pass; this local task did not deploy or update an existing user's device | NOT EXECUTED on hosted devices |

## Viewports

320×568, 360×800, 390×844, 430×932, 768×1024, 844×390, 1024×768, 1280×800, 1440×900, and 2048×921. The latter is the effective Android-landscape viewport used by the repository's existing QA scripts. These tests sampled landing mascot container geometry through playback and captured screenshots. They do not claim every application screen was tested at every size, nor emulate a real device's performance.

## Findings and diagnostic history

The first full Jest run failed two newly added tests. A test-mode asset-readiness shortcut kept the previous state marked ready when switching states; this was fixed without changing production loading. The reduced-motion timer-count assertion also needed pending fake-timer microtasks flushed before measuring scheduled playback timers. The final full suite passes all 983 tests. Assertions were not weakened to hide those failures.

An initial local server deliberately disabled all HTTP asset caching. The final browser run instead uses the immutable `/assets/*` policy already configured in netlify.toml and correct WebP MIME. The original direct-src renderer still produced transient online natural-width failures with production cache policy. The web renderer was changed to keep the current decoded image visible until the next image decodes, then replace the DOM child. Pending swaps are cancelled on source changes and unmount. The rerun passed readiness online, offline, and across every viewport. The browser script retains strict assertions for these checks; no failed readiness row is treated as a pass.

One intermediate browser run overlapped a new export and encountered a temporarily absent `sw.js`. It was rerun after export completion; the final browser run has no execution errors. An initial activity URL redirected to Lessons because it lacked a valid checkpoint. The final general script explicitly checks Lessons, and a separate valid-checkpoint test verifies the activity screen and supplies the corresponding screenshot. Only a fresh local QA profile had prerequisites seeded; user profiles, SQLite data, and production progress were not cleared or modified.

The final browser runtime did not request an obsolete mascot source in sampled frame URLs. Independent export hashing verifies all old frames are absent. Remaining limitations are native/physical-device playback and live hosted-device update validation. Browser frame sampling and screenshots do not replace performance testing on physical devices. No artwork correction was fabricated to address a verification gap.
