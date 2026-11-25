# BAYA mascot v1.1 replacement

Implementation date: 2026-11-24 (Asia/Taipei). This is a local implementation and production export, not a deployment to the hosted site.

## Sources and visual review

Both authoritative input folders remain untouched: `C:\BAYA\baya_blink_new` and `C:\BAYA\baya_wave_new`. Each contains 25 PNG files numbered 000–024, with no gaps, corrupt images, extra metadata, or ambiguous ordering. Every image is 1024×1024 RGBA with alpha spanning 0–255. The CSV records each original name, zero-based target name, SHA-256, visible alpha bounding box, dimensions, format, mode, size, and duplicates.

Blink PNG sizes range from 244,730 to 254,097 bytes; wave PNG sizes range from 242,524 to 254,543 bytes. Blink frames 020–024 are pixel duplicates of 019. They remain in the timeline as supplied holds. No wave frames are duplicates. No frames were synthesized, cropped, resized, flipped, or redrawn. Every canonical PNG has the input's exact file hash.

Both complete contact sheets were visually inspected. Blink closes and reopens the eyes while retaining glasses and hat details. Wave lifts the wing on the viewer's left, tilts the head/hat, includes an eye closure, and returns toward the resting pose. The embedded emblem follows the hat in the reviewed frames. There is no independent logo overlay. The ending wave pose is similar to its starting pose but is not pixel-identical; existing caller-controlled looping and the one-shot greeting are preserved. No source artwork alignment defect was identified in this review.

## Architecture and integration

Previously, `frameSources.ts` mapped 25 wave frames from `branding/baya/expressions/wave` and 25 blink frames from `branding/baya/idle`. The latter directory was the actual old blink sequence, not an unrelated idle animation. Its generated web counterpart used `baya-web`.

The canonical sources are now `apps/mobile/assets/branding/baya/animations/v1.1/{blink,wave}/frame-000.png` through `frame-024.png`, with `manifest.json` alongside both sequences. Native imports remain literal Metro-compatible PNG requires. The existing optimizer generates matching lossless WebP files under `assets/branding/baya-web/animations/v1.1/` and the platform-specific `frameSources.web.ts` registry. This uses the established bundled-asset pipeline rather than duplicating assets under public.

`BAYA_ANIMATIONS` identifies version, state, ordered frames, actual frame count, cadence, caller-controlled loop policy, and static reference. Existing 60 ms frames, 2400/4200 ms ambient rests, and the one-shot greeting are unchanged. No timing metadata was supplied with the new PNGs. The static/reduced-motion reference is the new blink frame 000.

All existing consumers flow through `BayaMascot` and the shared registry: LandingHero, StorybookVisual, ContinueLessonHero, StoryMascot, StoryMascotPopover, LessonVideoIntroduction, BayaWritingGuide, ActivityPresentation, and AssessmentSlide. No additional animation instances were introduced. No active runtime references to old blink/wave paths remain. A test-only readiness shortcut in `useBayaAnimation` was corrected so changing states in tests does not leave assets permanently unready; production asset preloading behavior is unchanged. Browser QA exposed transient unready images during direct `src` swaps. `BayaWebFrame` now retains the last valid image, awaits the next image's decode, and atomically replaces the DOM child. Pending swaps are cancelled on source changes/unmount; crop, size, artwork, timing, and native ExpoImage rendering are preserved.

## Optimization, cleanup, and offline delivery

The optimizer decodes and compares every PNG/WebP RGBA byte, preserves dimensions and alpha, checks hashes, and verifies each derivative is smaller. The build gate now validates frame counts and numeric ordering against the v1.1 manifest instead of requiring an arbitrary 50-frame total. Its fixtures also verify a non-50 frame inventory and rejection of stale source/output bytes and mappings.

After source-copy and derivative verification, 50 obsolete PNGs and 50 obsolete WebPs were removed from the four exact old sequence directories. `removed-assets.txt` lists every removed file. A recovery ZIP is at `C:\BAYA\.codex-tmp\mascot-pre-v1.1.zip`, outside application and public delivery paths. The unrelated `speaking/.gitkeep` remains. Input folders and unrelated working-tree changes were preserved.

The production export was regenerated. Its 50 v1.1 WebP paths match the derivative hashes; five duplicate blink holds account for 45 unique byte hashes. No old source or derivative hash appears in the exported assets. The existing service-worker generator discovers the new bundled paths and derives cache identity from resource paths/content. No manual cache-name bump or learner-storage deletion was needed. The generated cache is `baya-pwa-d443f2463a8096d6`, with 237 precache entries including all 50 v1.1 frames. The existing activation flow removes only obsolete `baya-pwa-*` caches after successful installation. Existing devices are not updated until this build is deployed and safely activated.

| Measure | Previous | v1.1 | Change |
| --- | ---: | ---: | ---: |
| Blink frame count | 25 | 25 | 0 |
| Wave frame count | 25 | 25 | 0 |
| Native PNG bytes | 16,931,436 | 12,561,538 | −4,369,898 |
| Web/exported animation bytes | 10,949,292 | 8,644,842 | −2,304,450 |
| Animation offline-cache payload bytes | 10,949,292 | 8,644,842 | −2,304,450 |

Cache figures exclude browser metadata/overhead. New lossless derivatives save 3,916,696 bytes against the new PNGs. There is no additional old/new native duplication in active source paths.

## Reproduction and evidence

Run from `C:\BAYA`:

```powershell
python scripts/optimization/install-mascot-v1.1.py
python scripts/optimization/optimize-images.py build
python scripts/optimization/optimize-images.py verify
node --test scripts/optimization/verify-optimized-assets.test.mjs
npx tsc --noEmit -p apps/mobile/tsconfig.json
npm run lint --workspace mobile
npm test --workspace mobile -- --runInBand --silent
npm run export:web --workspace mobile
python scripts/optimization/verify-mascot-v1.1.py
node apps/mobile/scripts/generate-pwa-service-worker.mjs --check
```

For isolated browser QA, start `node scripts/testing/mascot-v1.1-server.mjs`, then run `node scripts/testing/mascot-v1.1.mjs` and `node scripts/testing/mascot-v1.1-activity.mjs`. The activity test creates an isolated QA profile and seeds prerequisites through the app's learner service; it does not alter a user's browser profile or production learner records.

`created-modified-files.txt` and `removed-assets.txt` enumerate scoped files; the derivative manifest enumerates all outputs. See the test report and JSON evidence for executed results and limitations. Expo v57 reference documentation was consulted as required by `apps/mobile/AGENTS.md`: https://docs.expo.dev/versions/v57.0.0/.
