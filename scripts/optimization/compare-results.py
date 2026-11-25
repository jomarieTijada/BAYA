"""Generate reviewable reports from saved exports/measurements; no invented device results."""
import collections, csv, hashlib, json, statistics, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/optimization'
def read(name):return json.loads((DOC/name).read_text(encoding='utf-8'))
def save(name,text):(DOC/name).write_text(text.strip()+'\n',encoding='utf-8')
def csvfile(name,rows):
    with (DOC/name).open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=list(dict.fromkeys(k for r in rows for k in r)));w.writeheader();w.writerows(rows)
def table(headers,rows):return '| '+' | '.join(headers)+' |\n| '+' | '.join('---' for _ in headers)+' |\n'+'\n'.join('| '+' | '.join(str(v) for v in row)+' |' for row in rows)
def mb(n):return f'{n/1e6:.2f} MB'
def pct(a,b):return f'{100*(a-b)/a:.2f}%'

b=read('BAYA_ASSET_BASELINE.json');a=read('BAYA_ASSET_AFTER.json')
frames=json.loads((ROOT/'scripts/optimization/mascot-derivatives.json').read_text())['frames']
bb=read('browser/before/results.json');ab=read('browser/after/results.json');wasm=read('browser/after-wasm/results.json')[0]
assert all(not r['failures'] for r in [*bb,*ab,wasm])
assert read('export-validation.json')['passed']
categories={r['category'] for r in b['summary']}|{r['category'] for r in a['summary']}
metrics=[]
for category in sorted(categories):
    old=next((r for r in b['summary'] if r['category']==category),{'generated_bytes':0});new=next((r for r in a['summary'] if r['category']==category),{'generated_bytes':0})
    metrics.append((category,old['generated_bytes'],new['generated_bytes'],old['generated_bytes']-new['generated_bytes']))
breakdown=table(['Disjoint export category','Before bytes','After bytes','Saved bytes'],metrics)
rows=[dict(asset=r['source'],output=r['output'],original_bytes=r['original_bytes'],optimized_bytes=r['optimized_bytes'],saved_bytes=r['original_bytes']-r['optimized_bytes'],validation='Exact decoded RGBA and dimensions; browser offline decode; SHA-256 gate') for r in frames]
for old in b['deployment']:
    if old['category']=='font' and not Path(old['path']).name.startswith('Ionicons.'):
        rows.append(dict(asset=old['path'],output='not exported',original_bytes=old['raw_bytes'],optimized_bytes=0,saved_bytes=old['raw_bytes'],validation='Unreachable after direct Ionicons import; export validation + browser storybook'))
for category,old,new,saved in metrics:
    if category not in {'font','animation'}:rows.append(dict(asset='CATEGORY TOTAL: '+category,output='see AFTER inventory',original_bytes=old,optimized_bytes=new,saved_bytes=saved,validation='Disjoint category total; not an additional per-file saving'))
csvfile('BAYA_ASSET_OPTIMIZATION_RESULTS.csv',rows)

# Verify original indexed application assets against the initial snapshot.
originals=[r for r in b['inventory'] if r['path'].startswith(('apps/mobile/','sounds/'))]
assert all(hashlib.sha256((ROOT/r['path']).read_bytes()).hexdigest()==r['sha256'] for r in originals)
source_after=sum(p.stat().st_size for folder in ['apps/mobile/assets','apps/mobile/public'] for p in (ROOT/folder).rglob('*') if p.is_file())
source_before=source_after-sum(r['optimized_bytes'] for r in frames)
save('source-directory-measurement.json',json.dumps(dict(before_bytes=source_before,after_bytes=source_after,method='All files in assets/public, including README/config/JS. Before derived by subtracting only added derivatives; all baseline indexed originals verified unchanged.',verified_original_count=len(originals)),indent=2))

groups=b['exact_duplicate_groups']
duplicate_lines=['\n'.join('- `'+p+'`' for p in group) for group in groups]
hash_groups=collections.defaultdict(list)
for r in b['inventory']:
    if r.get('perceptual_dhash'):hash_groups[r['perceptual_dhash']].append(r['path'])
visual=[v for v in hash_groups.values() if len(v)>1]
save('perceptual-candidates.json',json.dumps(visual,indent=2))
save('BAYA_DUPLICATE_ASSETS.md',f'''# Duplicate asset audit

SHA-256 identified {len(groups)} duplicate groups across source, public, recording and archival roots. The baseline deployment contains **zero byte-identical duplicate files**. No source artwork was deleted, and no unsupported deduplication savings are claimed.

Most groups cross the archived Gavino/tracing collections and the app's approved copies. Keeping those source archives does not add export bytes. Brand/app icons may share pixels but have distinct manifest/native roles. Exact hash identity alone does not establish that an archive may be removed.

`perceptual-candidates.json` records {len(visual)} equal dHash candidate groups. dHash is a coarse grayscale similarity signal, not a character-identity test. Distinct characters, kudlit positions, colors, validated forms and attribution contexts are retained. No perceptual candidate was merged.

The storybook's Ba, Be/Bi and Bo/Bu references now call the existing tracing-guide registry. Their logical labels and exact underlying images remain unchanged. The mascot frame order has one canonical source (`frameSources.ts`); its `.web.ts` file is generated and checked, not an independently edited registry. Existing glyph and audio registries remain authoritative. Existing BayaMascot/BayaFrameRenderer, LocalPicture, PronunciationButton and learning card components already provide composition; adding another generic card layer would not compress media.

No file is declared unused merely because a literal string was absent. Source assets not found by export SHA-256 remain reachability-review candidates (native app icons, archival sources and format alternatives included). Unused count remains unknown. Only the 18 font families proved unreachable by the narrowed import were excluded by Metro.

## Exact duplicate groups (retained)

'''+ '\n\n'.join(f'### Group {i+1}\n\n{g}' for i,g in enumerate(duplicate_lines)))

bench=read('image-format-benchmarks.json')
format_table=table(['Source','Format/settings','Original bytes','Candidate bytes','Exact RGBA'],[(r['source'],r['format']+' '+str(r['settings']),r['original_bytes'],r['bytes'],r['pixel_identical']) for r in bench if 'source' in r])
save('BAYA_MEDIA_QUALITY_REPORT.md',f'''# Media quality

All 50 mascot frames retain 1024×1024 dimensions and identical decoded RGBA bytes, including fully transparent pixel colors (`exact=True`). No redraw, crop, resize, palette reduction, motion timing change or lossy encoding was deployed. PNG originals remain authoritative and native builds retain them. New web frames total {sum(r['optimized_bytes'] for r in frames):,} bytes, versus {sum(r['original_bytes'] for r in frames):,}; savings {pct(sum(r['original_bytes'] for r in frames),sum(r['optimized_bytes'] for r in frames))}.

The existing 60 ms frame cadence, rests, one-shot greeting, phase controls, reduced-motion hook, full/upper-body layout and image preload behavior are unchanged. Both sequences have 25 frames. A sequence is 1,500 ms; ambient is 9,600 ms including rests; idle is 8,100 ms; greeting is 1,801 ms including its final rest step. There are still 50 frame requests in complete offline installation. Full decoded RGBA for all frames is nominally 200 MiB; this storage optimization does not reduce that memory requirement or prove smoother animation.

Lossless sprite trials: wave {bench[-4]['bytes']:,} bytes, blink {bench[-2]['bytes']:,}; each 5120×5120 canvas is 100 MiB decoded and their combined compressed size exceeds the adopted sequences. Animated WebP trials: wave {bench[-3]['bytes']:,}, blink {bench[-1]['bytes']:,}; smaller, but would need a different player to preserve rests, phase control and reduced-motion behavior. Not adopted without that validation. Existing motion is not equivalent to a single transform, so no transform substitution was made.

Seven representative illustrations/photos/frames were benchmarked as optimized PNG, lossless WebP, lossy WebP and AVIF (32 total candidates including animation containers). See the table and JSON. No lossy candidate was deployed, and no Baybayin reference was changed. Lossy metric similarity is not educational validation. Original image dimensions remain intact for high-density/zoom use. Photographs/artwork keep existing attribution and permission metadata.

Visual inspection covered the optimized resting mascot, Be/Bi guide (including its upper kudlit), and before/after 1280×800 story screens plus optimized 844×390 and 390×844 screens. Appearance/layout is consistent; screenshots can capture different animation phases. The lesson's 'Wala pang larawang magagamit' illustration placeholder is present in both builds and is not introduced by this change. Screenshots are in `browser/`. All {len(ab[0]['images'])} cached raster images decoded successfully offline in Chromium; both original and optimized mascot bytes were independently compared by Pillow. Physical native/Safari/Firefox visual validation remains unperformed.

Audio was already optimized before this work: 69 integrated AAC/M4A files, 1,534,044 bytes. All deployed bytes and mappings are unchanged. The existing `scripts/audio/process_audio.py` and `docs/audio/` contain 87-source benchmarks for Opus 24/32/40 kbps and AAC 48/64 kbps; those earlier savings are not credited here. All 69 clips decoded offline; Ba, Be and Bi also played to the ended event offline in the forced-WASM test. This verifies browser playback, not human listening or linguistic accuracy. Existing human listening sign-off remains pending; no further transcoding was accepted without it. Original recordings remain unchanged and outside deployment.

## Format trials (experimental; not deployed)

{format_table}
''')

save('BAYA_OFFLINE_ASSET_MANIFEST.md',f'''# Offline asset contract

The generated `sw.js` PRECACHE_URLS/ASSET_INTEGRITY is the executable source of truth. Exact paths, hashes, categories and cache contribution are in the BASELINE/AFTER JSON deployment arrays. `export-validation.json` verifies every integrity entry and permits only reviewed substitutions/removals. Browser CacheStorage contains {a['precache_count']} responses and {a['precache_bytes']:,} decoded body bytes; storage-engine overhead is not included.

Tier 1: application shell, all exported application JS/SQLite initialization resources, approved content and character/tracing illustrations, all 50 mascot frames, 69 recordings, Ionicons, active ResNet18 plus labels/preprocessing metadata, both selected LiteRT loader/WASM pairs. All remain precached; even decorative frames were retained to avoid weakening existing readiness. No essential feature was lazily moved behind a network request.

Tier 2: the existing Baybayin Song MP4 (23,095,890 bytes) is shipped but excluded from required precache by the pre-existing contract; no new offline-video guarantee is claimed. The favicon.png and hosting/export metadata are also outside required cache. No resource was newly reclassified as optional to manufacture savings.

Tier 3: remote workspace/account operations and Supabase synchronization. No cloud schema, authorization, membership, conflict/retry handling or queued local progress code was changed. No cloud records were written by these tests.

The existing readiness message scans actual cached responses, not just service-worker registration. Existing integrity validation, bounded downloads, partial-install cleanup, waiting updates and BAYA-specific cache lifecycle remain intact. Learner SQLite/OPFS and user browser data are separate and were not cleared. Browser tests use fresh isolated profiles; local test learners never enter user or cloud accounts.

Verified after disconnect: home/lesson list, story lessons, character references, writing page, all cached raster images and recordings, WebGPU/forced-WASM inference, offline reload, SQLite completion persistence, English/Tagalog switching, all five origin-storybook pages, and reconnect persistence. Existing Jest service-worker tests also pass. Physical-device behavior and a live hosting deployment were not tested; no deployment was requested or performed.

The generic activity renderer currently renders quiz steps as an unavailable placeholder. No playable quiz route was found in this checkout. Automated content/assessment-related tests pass, but an end-to-end quiz-completion claim would be false. This existing functional gap is outside an asset-only change.
''')

attribution=read('bundle-attribution.json')
save('BAYA_BUNDLE_ANALYSIS.md',f'''# Production bundle analysis

{breakdown}

The storybook imported Ionicons from the `@expo/vector-icons` barrel. The fresh baseline shipped 19 fonts (4,076,840 bytes). Direct `@expo/vector-icons/Ionicons` imports leave the same icon family and 389,724 font bytes: 18 families/3,687,116 bytes removed through the bundler. This removes unreachable loaders/glyph maps too. The complete JS category (entry, worker, service worker; LiteRT loaders classified separately) falls from 3,063,201 to 2,634,431 bytes. No dependency package or lockfile entry was removed: native icons still need the package. No font glyphs were subsetted, and Baybayin text rendering is unchanged. CSS is inlined/runtime generated; no separate CSS asset is exported.

The isolated analysis export was made with Expo `--source-maps`; its maps remain under `.codex-tmp/optimization/analysis` and are never deployed/cached. `analyze-bundle.py` attributes generated character spans to source packages. These are approximate minified character contributions, not compressed transfer bytes; original source sizes are separately recorded in `bundle-attribution.json`.

{table(['Package','Mapped generated characters','Source files'],[(r['package'],r['generated_characters'],r['sources']) for r in attribution[:15]])}

Router, React DOM/Web, SQLite, Supabase and LiteRT have real route/render/persistence/sync/inference roles. No deletion was justified by import count. Recognition already initializes asynchronously; independent learning already uses local content. Further splitting would require proving that every essential chunk remains available after preparation. No speculative code splitting, dependency upgrade, global cache policy change or rendering abstraction was introduced.
''')

save('BAYA_LITERT_SIZE_ANALYSIS.md',f'''# LiteRT/model size investigation

The active model is 44,928,344 bytes (42.85 MiB), SHA-256 `7d96d8461ce35ad91505b05f8ed381d480749ad3277b7eff83bcea41216a8e65`. It remains unchanged, along with all labels, preprocessing, five-head output handling, confidence/mastery rules and metadata. The four pinned 2.6.0 runtime files total 22,638,204 bytes; both default and compatibility JS/WASM pairs remain. Threaded/JSPI variants were already excluded by `copy-litert-wasm.mjs` before this work. No new runtime savings are claimed. A stale README statement about copying the entire directory was corrected.

Real offline inference passed in the shipped optimized JS using WebGPU and a separate run with `navigator.gpu` unavailable forcing WASM. Synthetic strokes verify execution, not held-out recognition accuracy or coordinate validity. `export-validation.json` confirms identical model/runtime bytes before/after. Existing model, preprocessing, output and recovery tests pass in Jest. Native model support was already unavailable according to the repository contract; Android-browser physical testing remains pending.

Potential experiments: float16 weights, dynamic-range weight quantization, full-integer quantization with representative calibration, or mixed precision where supported. Each needs a separate nondeployment output directory and pinned conversion tooling. The current [official float16 guide](https://developers.google.com/edge/litert/conversion/tensorflow/quantization/post_training_float16_quant) and [dynamic-range guide](https://developers.google.com/edge/litert/conversion/tensorflow/quantization/post_training_quant) now direct users toward LiteRT Quantizer rather than deprecated conversion-time quantization. Their example size ratios are not measurements of BAYA, nor proof of browser LiteRT 2.6.0 compatibility.

No quantized candidate was generated or deployed. Before any replacement, measure actual size, five-head tensor names/shapes/types and all 63 labels; agreement/confidence changes; held-out labeled class/base/modifier accuracy; independently labeled coordinate error where labels exist; WebGPU and both WASM selection paths; offline initialization, memory, latency and recovery. Pseudo-labeled spatial outputs cannot establish independently validated coordinate accuracy. A representative held-out evaluation and explicit replacement authorization remain prerequisites. No numerical parity smoke test can substitute for that gate.
''')

perf=table(['Measure','Before','After'],[
 ('Raw full export',f"{b['production_bytes']:,}",f"{a['production_bytes']:,}"),('Required cached response bodies',f"{b['precache_bytes']:,}",f"{a['precache_bytes']:,}"),('Required cache entries',b['precache_count'],a['precache_count']),('All export files',len(b['deployment']),len(a['deployment'])),('Median observed page transfer at usable interface (bytes)',statistics.median(r['pageTransferAtUsableBytes'] for r in bb),statistics.median(r['pageTransferAtUsableBytes'] for r in ab)),('Usable-interface times (ms)',[r['usableInterfaceMs'] for r in bb],[r['usableInterfaceMs'] for r in ab]),('Offline-ready times (ms)',[r['offlineReadyMs'] for r in bb],[r['offlineReadyMs'] for r in ab]),('Median usable-interface time (ms)',statistics.median(r['usableInterfaceMs'] for r in bb),statistics.median(r['usableInterfaceMs'] for r in ab)),('Median offline-ready time (ms)',statistics.median(r['offlineReadyMs'] for r in bb),statistics.median(r['offlineReadyMs'] for r in ab)),('Local gzip-9 estimate of all export bodies',sum(r['gzip_estimate_bytes'] for r in b['deployment']),sum(r['gzip_estimate_bytes'] for r in a['deployment']))])
save('BAYA_PERFORMANCE_BEFORE_AFTER.md',f'''# Before/after measurements

Both builds came from revision `{b['revision']}` plus the existing uncommitted workspace recorded in `working-tree-before.txt`. This task compares fresh local production exports, not historical deployments. Build logs record the existing environment variable names; no credentials are included. Browser evidence uses isolated desktop Chromium profiles at localhost, gzip level 6, 1280×800, no bandwidth throttling, three fresh profiles per build. The first run includes cold server compression; subsequent runs reuse the server's compression buffer. Background verification was active, so this is not a controlled device/network performance study.

{perf}

Storage saving: {b['production_bytes']-a['production_bytes']:,} export bytes ({pct(b['production_bytes'],a['production_bytes'])}); {b['precache_bytes']-a['precache_bytes']:,} required-cache bytes ({pct(b['precache_bytes'],a['precache_bytes'])}). The full cache was actually read and counted in Chromium, agreeing with manifest totals. Browser database/cache engine overhead, HTTP cache duplication and installed APK size are not included. Gzip estimates are not hosted transfer measurements. Page CDP transfer at the usable-interface checkpoint excludes service-worker-owned downloads, so it must not be advertised as the entire offline installation download.

Startup/offline-ready medians increased in these noisy local samples; **no speed or animation-smoothness improvement is claimed**. The observed page transfer at usable interface decreased, but field-network and physical-device tests remain necessary. No heap/decoded-memory reduction is claimed. Standalone image decode timings in browser JSON include fetching from cache and are not pure decoder benchmarks.

Baseline physical repository logical size was {b['repository_bytes']:,} bytes ({b['repository_bytes']/1024**3:.2f} GiB), including .git, dependencies, Android builds, research and scratch exports. Its top-level breakdown is in BASELINE.json. New derivatives deliberately add {sum(r['optimized_bytes'] for r in frames):,} source bytes while preserving originals; full assets/public directory bytes are {source_before:,} before and {source_after:,} after. Baseline/after source-asset inventory totals count selected media extensions, while `source-directory-measurement.json` includes every file. Scratch exports/evidence also increase local repository size. This is a delivered-web/offline-cache reduction, not a claim that local checkout disk usage shrank.
''')

save('BAYA_ASSET_OPTIMIZATION_TEST_RESULTS.md',f'''# Verification results

Executed against this working tree; logs in `logs/` and browser JSON/screenshots in `browser/`.

| Check | Result |
| --- | --- |
| TypeScript `npx tsc --noEmit -p apps/mobile/tsconfig.json` | Passed |
| Expo lint `npm run lint --workspace mobile` | Passed |
| Full Jest `npm run test --workspace mobile -- --runInBand` | 80 suites / 830 tests passed; existing diagnostic console messages retained |
| New build-gate Node tests | 2 passed; valid registry, stale source/output, generated mapping and path-escape rejection |
| Pillow pair verification | All 50 lossless RGBA pairs and dimensions passed |
| Baseline indexed original app/recording hashes | {len(originals)} unchanged |
| Fresh before and after exports | Passed |
| Generated SW `--check` and export comparison | Passed; all precache digests, 69 audio clips, model/runtime retained |
| Three before + three after isolated browser runs | Passed; full cache counts/bytes verified |
| Offline image/audio decode | {len(ab[0]['images'])} raster images and {len(ab[0]['audio'])} audio clips passed |
| Offline pronunciation playback | Ba, Be, Bi played to ended; not a human listening test |
| Offline inference after navigation/reload | Actual WebGPU and forced-WASM passed |
| Offline lessons, character page, writing page and home | Passed |
| SQLite topic completion/reload/reconnect | Passed using shipped service diagnostically; no user data |
| English/Tagalog and origin storybook | Switching and all five pages passed |
| Responsive screenshots | 1280×800, 844×390, 390×844 reviewed |
| `git diff --check` | Passed (existing LF/CRLF notices only) |

Limitations: no connected physical Android device (`adb devices` returned none), no Safari/Firefox/native app validation, no real cloud workspace synchronization run, no full held-out recognition accuracy evaluation, no human pronunciation listening sign-off, and no live deployment test. Existing synchronization/model/service-worker automated tests pass, but are not substitutes for those unexecuted tests. Quiz rendering is a pre-existing placeholder, so full quiz completion cannot be certified. Existing chapter illustration placeholders and publication/subject-matter approval notes are retained. These gaps mean the user's entire acceptance matrix cannot honestly be marked complete.
''')

created=[p.relative_to(ROOT).as_posix() for folder in [ROOT/'scripts/optimization',ROOT/'apps/mobile/assets/branding/baya-web',DOC] for p in folder.rglob('*') if p.is_file() and '__pycache__' not in p.parts]
created+=['apps/mobile/components/branding/baya/frameSources.ts','apps/mobile/components/branding/baya/frameSources.web.ts','apps/mobile/scripts/verify-optimized-assets.mjs']
modified=['apps/mobile/components/branding/baya/animationAssets.ts','apps/mobile/components/landing/StorybookVisual.tsx (preserved earlier audio changes)','apps/mobile/package.json','apps/mobile/ml/README.md']
save('implementation-files.json',json.dumps(dict(created=sorted(set(created)),modified=modified,deleted_source_files=[],generated_output='apps/mobile/dist refreshed by production export'),indent=2))
save('BAYA_ASSET_OPTIMIZATION_FINAL_REPORT.md',f'''# BAYA asset optimization implementation

Implemented a measured web delivery reduction while retaining original media, native PNG references and the existing offline contract. The full production export falls from **{mb(b['production_bytes'])} to {mb(a['production_bytes'])}** ({pct(b['production_bytes'],a['production_bytes'])}); required cached bodies fall from **{mb(b['precache_bytes'])} to {mb(a['precache_bytes'])}** ({pct(b['precache_bytes'],a['precache_bytes'])}). No commit or deployment was made, and existing work was preserved.

## Changes and causes

- Bayani's 50 PNG frames accounted for 16,931,436 export bytes. Lossless WebP derivatives use 10,949,292 bytes, saving 5,982,144 bytes with exact RGBA, alpha and dimensions. Native sources and original artwork remain intact. Frame order is canonical; generated web references are checked before every export. Animation controls/timing remain shared.
- A barrel icon import pulled in all 19 font families. A direct Ionicons import removes 18 unused families (3,687,116 bytes) and associated JS overhead while keeping the same icons. No glyph subsetting or typography redesign.
- Storybook syllables reuse the existing tracing-guide registry. Existing card, picture, mascot and audio components already compose shared behavior; no unnecessary inheritance layer was introduced.
- Reproducible inventory, SHA/dHash audit, format benchmarks, lossless generation/verification, stale-asset build gate, bundle attribution, export-integrity comparison, isolated offline browser tests and report generation were added.
- Audio, LiteRT runtime filtering, model selection and offline-readiness behavior had prior optimizations. Their savings are not credited to this task. The model, labels, preprocessing, recordings, educational content and persistent/sync code remain unchanged.

## Measurements

{breakdown}

The inventory contains {len(b['inventory'])} baseline source/archival resources and all {len(b['deployment'])} exported files, with hashes, image dimensions, media durations where applicable, reference hints, exact build/cache matches and candidates. Asset/cache/source totals overlap and are never added together. Full assets/public source directories grow by 10,949,292 bytes because originals are retained. No local repository-size reduction is claimed.

## Quality and verification

All 830 Jest tests, TypeScript, lint, production exports and new build-gate tests passed. All 50 transformed frames are pixel identical. Actual offline Chromium runs verified cache readiness, image/audio decoding, lesson/character/writing screens, WebGPU and forced-WASM inference, SQLite persistence across reload/reconnect, language switching and origin-storybook pages. Ba/Be/Bi clips played to completion offline. Visual samples retain layout and character appearance. See [test evidence](BAYA_ASSET_OPTIMIZATION_TEST_RESULTS.md) and [media review](BAYA_MEDIA_QUALITY_REPORT.md).

Storage and observed initial page-transfer savings are demonstrated. No faster startup, smaller decoded memory, smoother animation or improved recognition accuracy is claimed: local timing medians did not improve. See [performance](BAYA_PERFORMANCE_BEFORE_AFTER.md).

## Remaining acceptance gaps

Physical Android, Safari/Firefox/native validation, live cloud synchronization, human pronunciation listening and held-out model accuracy were not performed. No connected device was available. The repository's generic quiz activity remains a pre-existing unavailable placeholder, so full quiz completion cannot be certified. No optional quantized model was deployed. Existing source publication/educational review notes remain in force. These are explicit limits, not passing results; the entire requested acceptance matrix remains partly unverified.

## Reproduction and files

Follow [the pipeline README](../../scripts/optimization/README.md). `implementation-files.json` lists created/modified files; no source file was deleted. `working-tree-before.txt` records unrelated existing changes. `BAYA_ASSET_OPTIMIZATION_RESULTS.csv` lists each adopted frame and excluded font with validation; detailed before/after inventories and all nine supporting reports are in this directory.

Priorities for further work: run the same isolated tests on a physical Android browser; complete listening review using the existing audio worksheet; validate actual supported-browser/device performance; separately evaluate animated containers or model quantization only with the required compatibility and quality gates. Avoid broad source archive cleanup or removing fallback runtime files merely to shrink local disk usage.
''')
print('Wrote optimization comparison and nine technical reports')
