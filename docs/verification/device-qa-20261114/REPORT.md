# Physical Android verification — 2026-11-15

**PHYSICAL TESTING PASSED WITH LIMITATIONS.** Actual Samsung S23 tests passed. This is not a general production-readiness certification for low-powered phones, tablets, or every handwriting style. No production deployment occurred. The folder retains the date on which preparation started (November 14).

## A. Device inventory

- Authorized physical Samsung SM-S911B (S23), Android 17, arm64-v8a, SM8550/Adreno. ADB emulator property is 0.
- Chrome 157.0.8103.51; WebGPU and WebAssembly both exercised. The reduced browser user agent reports Android 10; the Android version above comes from ADB.
- Physical display 1080×2340, density 480. Observed landscape web viewport 747×274 CSS pixels, DPR 3.
- RAM 7,242,452 kB; initial available RAM approximately 2.7 GiB; /data free 163 GB.
- USB powered, battery 100%, battery saver off. Battery temperature increased from 36.9°C to 39.4°C during the overall session. No causal thermal-throttling or battery-drain conclusion is supported.
- Isolated localhost origins via ADB reverse; production Expo export served locally with COOP/COEP headers. Personal browser storage was not cleared. Test tabs and forwarding were closed after checks.

Evidence: `device.json`, `adb-devices.txt`, `resource-observations.json`.

## B. Test matrix

| Area | Result and scope |
|---|---|
| Real five-head model | PASS on WebGPU and WASM; 9 notebook parity fixtures per backend |
| Preprocessing | Exact fixture parity (maximum difference 0); all five output errors <= 3.8147e-6 GPU / 5.7221e-6 WASM |
| Cold and warm inference | PASS; measured separately; 60 warm runs per backend |
| GPU loss | PASS: actual LiteRT WebGPU device destroyed, inference recovered on WASM |
| Reinitialization/disposal | PASS: three cycles per backend and production model disposal |
| Finger handwriting | BA, BE/BI, BO/BU and B-with-virama confirmed by user and recognized correctly |
| Vowels | A, E/I and O/U submissions and two-attempt counters observed; earlier individual intended labels were not confirmed clearly enough to count as a labeled accuracy set |
| Touch/clear | PASS real browser injected touch draws, secondary touch does not extend stroke, Clear removes paths |
| Rotation during stroke | Regression test passes; updated fix not physically revalidated through device rotation |
| Online/offline export | PASS on both backends, with real model and local runtime assets |
| Offline persistence | PASS approximate BA trace replay: attempt count 0→1 online, reload offline retained 1, next submission 1→2 |
| Ambiguous inputs | PASS synthetic unclear inputs receive neutral retry feedback and save no attempts |
| Corrupt download/retry | PASS truncated HTTP 200 model rejected, no partial installed cache, valid retry succeeds |
| Service worker update | PASS old manual-test origin upgraded to final worker/export while saved vowel work remained |
| Final-topic Next | Existing prerequisite rule correctly rejects completion in direct-entry isolated test profile; previously invisible browser error now visible |
| Full regression/build | 75 suites / 779 tests pass; TypeScript, ESLint and production export pass |

The offline test uses CDP network emulation on the test tab; it is not an airplane-mode or cellular handover test. “Installation” here means service-worker/cache installation, not Android Add to Home Screen/WebAPK installation. Replay and injected touch are clearly separated from human samples.

## C. Defects, causes and corrections

1. **Corrupted HTTP 200 model could be cached (high, caching/runtime).** Before the fix, the truncated model was retained in an installed cache and compilation failed. Add SHA-256 fetch integrity to model loading and every service-worker precache asset. Corruption now rejects the fetch/install, leaves no partially installed cache, and recovers on valid download. Evidence: `corruption-before`, `corruption-after`, `s23-final-wasm-recovery`.
2. **Secondary touch could extend a stroke; layout changes could mix coordinate systems (medium, input).** Canvas now rejects multi-touch start, stops the current stroke on multi-touch movement, and ends active capture when layout dimensions change. Two meaningful regressions failed before the change and passed afterward. Physical injected multi-touch and Clear pass in final export. No style change.
3. **Browser save failures were invisible (medium, feedback).** The pinned React Native Web Alert implementation is empty. The user's Next report reproduced on the final vowel: all six valid vowel attempts existed, but earlier prerequisite lessons were incomplete in the isolated direct-entry test profile. The database correctly rejected completion. Shared localized two-argument dialogs now use browser alert on web and retain native Alert on Android/iOS. Actual S23 retest shows “Could not save progress / Please try again.” Evidence: `buttons-root-cause.json`, `dialog-after.json`. No prerequisite/mastery bypass was introduced. Error wording remains generic; it does not explain prerequisite locking.
4. **Test process kept MESSAGEPORT handles open (test infrastructure).** Investigation attributed 40 handles to real BroadcastChannels used by test database ownership. A test-only wrapper tracks and closes channels after suites. Real messaging remains intact; final suite exits without --forceExit. Production database code is unchanged.

## D. Performance and cache comparison

Measured with performance.now on actual hardware. Cold load includes download/runtime/compilation; runtime initialization is its own measured subset. Warm percentiles use 60 runs after warm-up. Download was local USB-forwarded HTTP, not mobile-network throughput.

| Metric (ms unless stated) | WebGPU | WASM |
|---|---:|---:|
| Runtime initialization | 478.50 | 426.20 |
| Cold model load including transfer | 2793.54 | 2213.43 |
| First inference after load | 78.30 | 75.76 |
| Warm median | 55.06 | 71.30 |
| Warm p95 | 59.09 | 71.95 |
| Warm p99 | 60.48 | 73.29 |
| Model transfer | 1487.57 | approximately 1466 |
| Transfer bytes including reported overhead | 44,928,644 | 44,928,644 |

Earlier S23 baseline: GPU cold load 2639 ms, first inference 362 ms, warm median 34.94/p95 37.69 (30 runs); WASM cold load 2025 ms, median 60.88/p95 61.75. These are sequential runs with differing thermal/cache conditions; no inference-speed improvement is claimed. The earlier desktop multi-second GPU first-inference behavior was not reproduced at that magnitude. GPU warm inference remained faster on this S23; existing GPU-first selection and WASM fallback remain.

Offline cache: **116,017,022 → 91,672,693 bytes**, reduction **24,344,329 bytes (~21%)**. Only non-threaded, non-JSPI default runtime variants are shipped/cached, including both SIMD and compatibility variants. Both final backend offline tests pass. The remaining ~91.7 MB is still substantial for constrained devices.

Chrome aggregate end memory: PSS 261,188 kB; RSS 360,560 kB; swap PSS 35,523 kB. This includes other Chrome tabs and cannot establish model memory usage or absence of leaks. Probe JS heaps were ~85–86 MB and exclude GPU/native allocations. No GPU-utilization measurement was available.

Evidence: `s23-baseline/browser-parity.json`, `s23-verified/browser-parity.json`, final production reports. Final offline invocation including pending preload was ~919 ms GPU / ~670 ms WASM in separate runs; these are not launch-to-interactive timings.

## E. Recognition verification

| Explicitly requested human sample | Actual output | Confidence |
|---|---|---:|
| BA | BA | 99.9% |
| BA + upper kudlit | BE/BI | 99.6% |
| BA + lower kudlit | BO/BU | 98.3%, 99.1% |
| BA + virama | B | 99.7% |

Evidence: `confirmed-manual-labels.json`, `s23-manual/manual-samples.json`. User confirmed completion after each explicit request. This small convenience sample does not measure population accuracy or confidence calibration. Earlier BO/BU and HA predictions were invalid against the current vowel lesson targets; intended human characters were ambiguous, so these are not labeled model-error estimates.

The actual model contract remains float32 NCHW [1,3,160,160], with named outputs [1,63], [1,18], [1,5], [1,2], [1,4]. Class, base, modifier, XY and bounding-box mapping passed parity. Weights and thresholds were unchanged. Automatically generated spatial targets have no independently verified coordinate ground truth; no kudlit-position accuracy claim is made.

## F. Regression and reproducibility

- Full Jest: 75 suites, 779 tests passed, normal exit. Logs: `.codex-tmp/device-qa-final-tests.log`.
- TypeScript: npx tsc --noEmit, exit 0. ESLint: npm run lint, exit 0.
- Production export: npm run export:web, exit 0. Worker `baya-pwa-e57827d7eff73210`, 164 assets.
- Final reports: `s23-final`, `s23-final-wasm-recovery`, `s23-final-persistence`; each has no recorded errors.
- Service-worker integrity, cache cleanup/configuration, model concurrency/fallback, recognition, mastery and broader application regressions are included in the suite. No production Netlify deployment was made.

Run from repository root with an unlocked, USB-authorized physical device:

```powershell
$env:BAYA_ANDROID_SERIAL='YOUR_ADB_SERIAL'
$env:BAYA_QA_OUTPUT='docs/verification/new-device'
node scripts/testing/probe-litert.mjs
node scripts/testing/litert-production.mjs
```

Optional fault test: set BAYA_FAULT_MODEL=truncate and BAYA_VERIFY_RECOVERY=1. Optional independent WASM path: BAYA_FORCE_WASM=1 (hides WebGPU in the test document only). Optional approximate handwriting persistence replay: BAYA_REPLAY_SAMPLE points to this report's s23-manual/manual-samples.json. Clear those environment variables for baseline runs. Never direct output at the original migration evidence directory unintentionally.

## G. Remaining risks and follow-up

- Only one high-end phone and Chrome version tested. Lower-memory phones, Android tablets, Firefox/Samsung Internet, iOS/Safari and installed standalone PWA require separate runs.
- No controlled quota-exhaustion, OS low-memory kill, battery-saver, extended soak, cellular/Wi-Fi handover, complete-download interruption, or physical mid-stroke rotation test in the final build. Avoided intrusive stress on a personal phone.
- No complete human-labeled set for K/D/S and all classes, size/displacement variation, modifier order, residual/overlapping strokes, speed variation, or independent spatial accuracy. No handwriting quality guarantee follows from high confidence.
- No finger-release-to-result trace or launch-to-usable timing; reported inference timing must not be presented as that metric.
- Prerequisite-complete end-to-end curriculum progression was not physically exercised on this isolated direct-entry profile. Existing tests cover topic completion; prerequisite restrictions remain unchanged.
- Browser dialogs now provide missing error feedback, but generic save wording does not tell a direct-entry tester that prerequisites are locked.
- Preserve the extensive pre-existing working-tree changes. This QA work did not change model weights, database schema, authentication, workspace/sync, lesson prerequisites or mastery thresholds, and did not deploy.
