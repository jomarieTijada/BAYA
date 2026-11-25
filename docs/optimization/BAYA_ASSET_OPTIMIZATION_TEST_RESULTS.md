# Verification results

Executed against this working tree; logs in `logs/` and browser JSON/screenshots in `browser/`.

| Check | Result |
| --- | --- |
| TypeScript `npx tsc --noEmit -p apps/mobile/tsconfig.json` | Passed |
| Expo lint `npm run lint --workspace mobile` | Passed |
| Full Jest `npm run test --workspace mobile -- --runInBand` | 80 suites / 830 tests passed; existing diagnostic console messages retained |
| New build-gate Node tests | 2 passed; valid registry, stale source/output, generated mapping and path-escape rejection |
| Pillow pair verification | All 50 lossless RGBA pairs and dimensions passed |
| Baseline indexed original app/recording hashes | 310 unchanged |
| Fresh before and after exports | Passed |
| Generated SW `--check` and export comparison | Passed; all precache digests, 69 audio clips, model/runtime retained |
| Three before + three after isolated browser runs | Passed; full cache counts/bytes verified |
| Offline image/audio decode | 154 raster images and 69 audio clips passed |
| Offline pronunciation playback | Ba, Be, Bi played to ended; not a human listening test |
| Offline inference after navigation/reload | Actual WebGPU and forced-WASM passed |
| Offline lessons, character page, writing page and home | Passed |
| SQLite topic completion/reload/reconnect | Passed using shipped service diagnostically; no user data |
| English/Tagalog and origin storybook | Switching and all five pages passed |
| Responsive screenshots | 1280×800, 844×390, 390×844 reviewed |
| `git diff --check` | Passed (existing LF/CRLF notices only) |

Limitations: no connected physical Android device (`adb devices` returned none), no Safari/Firefox/native app validation, no real cloud workspace synchronization run, no full held-out recognition accuracy evaluation, no human pronunciation listening sign-off, and no live deployment test. Existing synchronization/model/service-worker automated tests pass, but are not substitutes for those unexecuted tests. Quiz rendering is a pre-existing placeholder, so full quiz completion cannot be certified. Existing chapter illustration placeholders and publication/subject-matter approval notes are retained. These gaps mean the user's entire acceptance matrix cannot honestly be marked complete.
