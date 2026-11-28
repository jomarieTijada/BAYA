# BAYA offline installation test results

Date: 2026-11-26. Browser evidence uses isolated localhost production profiles with HTTP cache disabled and network emulation disconnected. Recovery also forcibly interrupts a real HTTP model stream and injects a failing update resource. No personal browser data or cloud accounts were changed.

| ID | Description | Steps | Expected | Actual | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| OI-01 | Fresh profile | Open production app in isolated Chromium; await setup | Automatic complete preparation | 240 resources verified; real runtime validation; 8903 ms | PASS | browser-results.json |
| OI-02 | Disconnected media | Disable network and HTTP cache; play/seek video at beginning, middle, near end | Playback advances at each point | One required MP4 passed all positions | PASS | browser-results.json |
| OI-03 | Offline audio/images | Decode every exported recording and raster image disconnected | All resources decode | 71 audio files and 154 images decoded | PASS | browser-results.json |
| OI-04 | Cold restart | Terminate browser; reopen same profile disconnected | Offline shell/routes/model/progress available | WASM inference: 63 classes; profile and progress identical | PASS | browser-results.json |
| OI-05 | Offline matching | Complete real tap-to-Bayani and audio matching; reload | Scored results persist | Completion, offline reload, audio scoring passed | PASS | activities/browser-results.json |
| OI-06 | Writing UI | Draw and submit through actual production canvas, offline; retry | Real inference saves local attempts | Offline submission and retry increased attempts; WASM; model disposal passed | PASS | litert-wasm/production-browser.json |
| OI-07 | Interrupted download | Interrupt a real model response and disconnect browser; reconnect | Retain verified files and auto-resume | 35 completed files were not redownloaded | PASS | recovery/results.json |
| OI-08 | Corruption repair | Overwrite test cached model with invalid bytes; verify then repair | Reject readiness and restore only invalid resource | Corrupt model detected; package restored | PASS | browser-results.json |
| OI-09 | Failed update | Stage changed image revision; return HTTP 503 for it | Existing offline version remains usable | Old video still returned cached 206; old cache retained | PASS | recovery/results.json |
| OI-10 | Update activation | Repair staged version; close browser; reopen offline | Activate safely; validate before cleanup | New version ready offline; obsolete resource cache removed | PASS | recovery/results.json |
| OI-11 | Quota | Simulate insufficient quota in worker test | Stop without deleting existing installation | STORAGE_FULL; old and unrelated caches retained | PASS | ../offline-installation-worker-tests.log |
| OI-12 | Localized layout/toasts | Toggle English/Tagalog; change connectivity | Readable setup and temporary messages | Mobile/desktop screenshots; no persistent offline header; notices expire | PASS | ready-tagalog.png; offline-toast.png; online-toast.png |
| OI-13 | Static checks/build | Run TypeScript, ESLint, production export and generator --check | No errors | Passed | PASS | ../offline-installation-typecheck.log; ../offline-installation-lint.log; ../offline-installation-build.log |
| OI-14 | Focused automated tests | Run generator/worker/notification test suites | All tests pass | 10 Jest tests plus 6 worker behavior subtests pass | PASS | ../offline-installation-focused-tests.log; ../offline-installation-worker-tests.log |
| OI-15 | Full regression suite | Run all Jest tests in band | All tests pass | 82 suites pass; 9 fail. 1073 tests pass; 15 fail. Failures in writing, story/header navigation, character content/fixtures, matching, service validation, curriculum and swipe hint tests | FAIL | ../offline-installation-jest.log |
| OI-16 | Physical/mobile install | Check available Android devices and iOS infrastructure | Installed PWA on physical devices tested | adb devices returned no attached devices; iOS/Safari unavailable | NOT RUN | Host inspection |

Evidence paths are relative to `docs/verification/offline-installation/`. Full-suite failures are outside the offline files changed here, but a clean baseline suite was not run separately; they are not declared proven pre-existing. The full acceptance matrix is not entirely green while those failures and physical-device gaps remain.
