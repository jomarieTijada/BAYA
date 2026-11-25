# BAYA recorded pronunciation integration

Implemented and verified locally on 2026-11-20 (Asia/Taipei). Researcher linguistic/listening approval and physical-device compatibility remain outstanding. No deployment or commit was performed.

## Result and mapping decisions

- Audited **87 originals**, **219.689 seconds**, **4,493,715 bytes**. Every source is 48 kHz stereo AAC in an M4A container. All decode; their original SHA-256 checksums remain unchanged.
- Integrated **69 recordings**: the 17 existing combined/base characters and 52 separate kudlit syllables. Filenames plus vowel folders consistently identify these against the approved character definitions and tracing guides. `VERIFIED` in the mapping report describes this traceable naming/context mapping, **not** linguistic certification.
- Withheld **18 recordings**: all 14 `KATINIG` files (letter-name versus vowel-cancelled pronunciation is unconfirmed) and `DeRe`, `DiRi`, `DoRo`, `DuRu` (combined D/R sequences versus the current D-only modified guide labels). No guessed virama mappings or inherent-A substitutions.
- `Vowel/EoI` and `Vowel/OoU` are whole combined-character references only. They are never used as isolated E, I, O, or U in a word. Separate Be/Bi, Bo/Bu and corresponding syllables remain separate recordings. `DaRa` matches the existing combined Da/Ra character. No supplied file is identifiable as a complete word, lesson narration, quiz prompt or feedback recording.

## Processing and measured compression

PyAV/libavformat supplies metadata and packet decoding, with independent FFmpeg full PCM decoding and loudness analysis. A local `imageio-ffmpeg` executable was already installed; no elevated installation or new app dependency was needed. NumPy performs signal checks. FFprobe was not on PATH; PyAV is the equivalent inspection implementation.

The channels are effectively identical. Explicit averaging (`0.5 L + 0.5 R`) avoids the gain increase that FFmpeg's default stereo-to-mono mix can introduce. Original timing and pitch are retained. There is **no trimming, denoising, pitch correction, speed change or dynamic compression**. A static per-file gain targets approximately -18 LUFS, capped at +6 dB and constrained by a -2.5 dB measured true-peak ceiling before encoding. Short-syllable LUFS measurements are treated conservatively. Decoded output peaks and duration are checked independently. All original boundaries, including long pauses, remain intact.

All five candidates were encoded and decoded for all 87 recordings (435 trials):

| Candidate | Total trial bytes | Reduction versus all originals |
|---|---:|---:|
| Opus VBR 24 kbps / WebM | 610,783 | 86.41% |
| Opus VBR 32 kbps / WebM | 785,774 | 82.51% |
| Opus VBR 40 kbps / WebM | 959,144 | 78.66% |
| AAC-LC 48 kbps / M4A | 1,500,605 | 66.61% |
| AAC-LC 64 kbps / M4A | 1,989,470 | 55.73% |

Selected **AAC-LC 64 kbps mono, 48 kHz**, retaining the source codec family and a conservative speech bitrate. Chrome and Edge actually decoded and played all 69 deployed files, plus 40 representative trial files spanning all five codec settings. Smaller Opus files are promising but have no human A/B approval, and Safari/native compatibility was not tested. Selection does not claim AAC sounds superior based on size or waveform alone. The listening worksheet supports reconsideration after content validation.

The deployed 69 files total **1,534,044 bytes**. Their corresponding originals total **3,458,330 bytes**, giving a like-for-like reduction of **55.64%**. The **65.86%** difference from the entire 87-file archive also includes the 18 withheld clips; it must not be reported as compression alone. No fallback format is bundled or cached (fallback storage cost: zero). Full trials are retained in ignored `.codex-tmp/audio/benchmark`, outside the app.

## Playback and UI

`modules/audio/manifest.ts` is the generated runtime source of truth: explicit educational IDs, labels, static Metro requires, duration, language, codec, source provenance, source/output checksums and a version hash. Browser paths are bundled relative assets; the developer's Windows archive path is not used at runtime.

`controller.ts` owns a single on-demand player. New selection or replay releases its predecessor; generation guards discard stale completion/error callbacks. It exposes loading, playing, ready and recoverable error states, with a 15-second load/buffering timeout. It releases resources on completion, error, unmount, character change, route change, app backgrounding, document hiding, or language change. Cleanup from one mounted button cannot stop another button's newer playback. No audio buffers are preloaded at startup.

Native builds use the already-installed Expo SDK 57 `expo-audio` player. Web uses an HTMLAudio adapter because this installed Expo web implementation discards the promise returned by `HTMLMediaElement.play()`, preventing reliable rejection handling. The adapter catches that promise and browser media errors. This is a platform adapter, not an additional audio package. Playback starts synchronously from user activation. There is no synthesized speech or remote replacement when a clip is missing.

Existing BAYA mascot pronunciation controls in Module 2 and writing reference controls in Module 3 now play the recordings. An optional expandable kudlit reference beside Module 2 examples exposes separate E/I and O/U buttons alongside the approved tracing images. The existing storybook Ba / Be-Bi / Bo-Bu examples also have separate recorded buttons. No word examples, lesson ordering, scoring, progress rules, recognition logic, validated images or database schema were changed.

Controls have English/Tagalog labels through the existing language provider, button semantics, focus feedback, loading/selected/disabled state and live error text. New small controls are at least 44 px; the writing button was brought to 44 px. There are no decorative playback animations. Text and images remain available. A new sound toggle was unnecessary: all added audio requires an explicit press and respects system volume.

## Offline preparation and range handling

The existing export pipeline includes all statically required M4A assets in its integrity-pinned precache. Existing partial-install failure cleanup, readiness checks, content-version hashing and obsolete-cache cleanup remain in place. Audio changes therefore invalidate the cache version with the rest of the exported app.

An actual browser test exposed that the previous worker bypassed all media requests, including cached audio. A narrowly scoped pronunciation handler now serves full responses and valid HTTP byte ranges from the verified **full cached file**, returns 416 for invalid ranges, and never caches partial 206 responses. Missing audio may be recovered online using its expected checksum; offline failures return an audio error response, never the HTML shell. Unrelated video handling stays unchanged.

The tested export has **255 required cache entries**, **98,390,699 bytes of file payloads**, including **1,534,044 audio bytes** (about 1.56% of payload). CacheStorage/browser bookkeeping is additional and was not measured. The baseline payload excluding the selected audio is 96,856,655 bytes; JS changes also contribute a small unisolated overhead. Audio is required before offline readiness is reported. Quota-exhaustion hardware testing was not available; existing simulated installation-failure tests pass.

Chrome and Edge verification disabled the browser HTTP cache, emulated an offline page and made the local server reject all requests. All 69 recordings still decoded and advanced their playback timelines offline. Real lesson buttons, replay, rapid switching, keyboard activation, navigation, reload, missing/corrupt media errors, recovery and Tagalog labels were exercised. Only worker update requests reached the blocked server during valid offline playback; no pronunciation asset request required network. The test used a real isolated local learner profile created through the shipped local service. Workspace-linked learner setup was not repeated; playback itself has no authentication, Supabase, sync or cloud dependency.

## Verification and limits

- `npx tsc --noEmit -p apps/mobile/tsconfig.json`: passed.
- `npm run lint --workspace mobile`: passed.
- `npm run export:web --workspace mobile`: passed; worker generated with all 69 recordings.
- `npm test --workspace mobile -- --runInBand --forceExit`: **80 suites, 830 tests passed**, including audio ownership/race/mapping tests and range-serving tests. Jest's pre-existing open-handle behavior required `--forceExit`; console act warnings remain. This is not claimed as a clean open-handle audit.
- Python verification: all 87 source checksums unchanged; all 69 selected outputs decode, match checksums/codec/channel expectations, preserve decoded duration within 80 ms, and pass silence/clipping checks.
- Desktop Chrome and Edge: real media decoding and advancing playback online/offline; detailed versions, per-file timing observations and screenshots in `docs/audio/browser/`.
- Android Chrome, installed Android PWA, Safari/iOS, native Android/iOS, hardware sound output and screen-reader announcement behavior: **unverified**. `adb devices` reported no connected device. Responsive desktop emulation is not physical Android verification.
- Human pronunciation, consonant intelligibility, subtle hiss/clicks, distortion, phoneme truncation and codec A/B listening: **pending**. Automated signal checks do not establish acoustic or linguistic correctness.
- Timing evidence measures full fetch/decode plus media timeline startup, **not tap-to-audible hardware latency**. Rapid selection leaves one active player; a long-run heap profile was not performed.
- Offline reload was tested; complete operating-system/browser-process cold restart and workspace-linked learner audio were not separately tested.

The implementation is ready for researcher review; the complete requested acceptance criteria cannot be certified until these human/device checks are done.

## Reproduction and deliverables

From the repository root, using existing Python packages `av`, `numpy`, `imageio-ffmpeg`:

```powershell
python scripts/audio/process_audio.py audit
python scripts/audio/process_audio.py benchmark
python scripts/audio/process_audio.py build
python scripts/audio/process_audio.py verify
python scripts/audio/report_audio.py
npm run export:web --workspace mobile
node scripts/audio/browser_verify.mjs chrome
node scripts/audio/browser_verify.mjs edge
python scripts/audio/report_audio.py
```

Use `--source "path with spaces"` to override the archive. `FFMPEG` can specify a local executable; otherwise PATH and the existing imageio installation are tried. Subprocess arguments are arrays with no shell interpolation. Deterministic filenames and source/settings/output hashes avoid needless re-encoding. Conversion uses temporary files and validates before atomic replacement. Source files are never written. Unsupported files are explicitly reported. Unknown naming conventions are withheld as UNMAPPED. Reports are regenerated from measured values; reviewer exports should be saved separately to preserve human decisions.

- [Original inventory](audio/BAYA_AUDIO_INVENTORY.csv)
- [Educational mappings](audio/BAYA_AUDIO_MAPPING.csv)
- [Compression measurements](audio/BAYA_AUDIO_COMPRESSION_REPORT.csv) and [all codec trials](audio/BAYA_AUDIO_BENCHMARK.csv)
- [Output validation](audio/BAYA_AUDIO_OUTPUT_VERIFICATION.csv) and [machine-readable summary](audio/summary.json)
- [Quality review and withheld items](audio/BAYA_AUDIO_QUALITY_REVIEW.md)
- [87-file listening manifest](audio/BAYA_AUDIO_LISTENING_REVIEW.csv) and [offline A/B review page](audio/listening-review.html)
- [Chapter III functional cases](audio/BAYA_AUDIO_TEST_CASES.csv)
- [Changed/generated file inventory](audio/BAYA_AUDIO_FILES.csv)
- SDK reference consulted as required by `apps/mobile/AGENTS.md`: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) and [Expo Audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/). Native code follows the installed implementation and declarations; documentation availability is not evidence of hardware playback.

Existing unrelated uncommitted offline, cloud, localization, testing and configuration work was preserved. No source recording was removed. No model, recognition or database files were changed for audio.
