# BAYA offline installation architecture

Implemented and verified on 2026-11-26. Launch UX subsequently revised: browser install welcome, preparation on installed-app launch, automatic continuation, and silent returning verification (see UI/UX document). Native PWA installation remains browser controlled; the app prepares its learning package after launch.

## Build and inventory

`apps/mobile/scripts/generate-pwa-service-worker.mjs` inventories the current Expo production export. It includes all exported Metro assets, application bundles/styles, selected ResNet18 model and metadata, the four selected LiteRT 2.6.0 runtime files, shell, and install icons. Lessons, story definitions, assessment questions, activity logic, and character mappings are bundled into JavaScript. The current export has one required instructional video; unavailable lesson videos remain unavailable rather than being invented.

The generator checks actual bundle asset references against exported files, rejects missing/empty resources, requires the instructional MP4, and removes unselected model candidates only from the guarded export directory. Source maps and unrelated public/source/research artifacts are excluded. Logical IDs omit content hashes; URLs retain Metro content revisions. Each resource records bytes, SHA-256 revision, category, required flag, cache destination, and validation method. `offline-manifest.json` is reproducible; the same manifest is embedded in the worker so it remains available offline through messaging. `--check` rejects stale generated output.

## Bootstrap and preparation

The existing custom service worker is extended, not replaced by Workbox. The install event performs no resource caching or downloads. The web welcome loads normally in the browser; the opened standalone app requests the full package, including its shell. No download blocks worker installation.

On an installed-app first launch, `OfflinePackageProvider` displays a compact asset-loading screen before mounting normal navigation/storybook; ordinary browser tabs show an install welcome and do not start full preparation. It waits for a controlling worker, reads that worker's own manifest, and asks it to verify and prepare. Preparation is serialized inside the worker across tabs, with at most two resource transfers. Fetches have an inactivity timeout and up to three attempts with exponential backoff. Streams are written to Cache Storage, then complete stored responses are hashed. A file cannot be marked verified merely because a successful response exists. Incomplete transfers are retried as files; already verified files survive interruption and worker/browser restarts.

Verified bytes/files drive progress. The state also tracks received bytes, categories, missing/failed URLs, and version. Heartbeats prevent long downloads from appearing unresponsive and let the client detect a terminated worker. Reconnect events arriving during error completion are queued for automatic resume.

## Validation and readiness

All resources must be HTTP 200, expected size, and SHA-256 correct. HTML permits hosting annotations but must reference this build's exact entry scripts. Stored bytes are rechecked at launch and by Settings verification. After package verification, the application initializes the existing database, executes real ResNet18 inference, decodes a representative illustration and pronunciation clip, opens and seeks every required video, and waits for fonts. Only then does the controlling worker persist runtime verification metadata and report ready. A missing/corrupt file invalidates that metadata.

Runtime validation is representative; all 71 recordings, 154 raster images, video playback at three positions, real handwriting submissions, and matching completion were additionally tested in the disconnected browser. These tests do not establish model educational accuracy; synthetic drawing probes only exercise the existing inference/persistence pipeline.

## Routing and storage

The controlling worker serves its matching version's shell on SPA navigation and serves complete cached resource responses. Single video/audio ranges support explicit, suffix, and open-ended byte ranges, returning 206 with original MIME, length, and Content-Range; invalid/multipart requests return 416. Partial responses are never treated as complete files. Cloud/external requests are not added to resource caches.

Storage estimates are checked before downloads. Quota failures retain completed files and offer retry. Persistent storage is requested where available, with the actual grant shown in Settings. A refusal does not imply failure and a grant does not guarantee permanence. The worker never clears localStorage, IndexedDB databases, SQLite learner records, profiles, results, workspace metadata, or queued synchronization.

## Updates

Updates use a new versioned cache. Settings checks the registration, downloads an available waiting worker's package, and reuses checksum-matching old resources. No `skipWaiting`, forced reload, or mid-lesson activation occurs. The existing worker and cache remain usable during a failed staged download. After all windows close, the browser can activate the new worker; it validates runtime before deleting obsolete BAYA resource caches. Unrelated caches remain untouched.

A browser may activate an incompletely staged worker after all windows close. Its bootstrap remains usable, previous caches remain available for verified reuse, and setup offers repair/available lessons. This is not a guaranteed whole-application rollback when newly changed required files were never downloaded. Low storage may prevent holding both packages; old resources are not deleted to force an update.

## Onboarding and platforms

Setup completion mounts the existing navigator without changing onboarding preferences. Returning learners with a verified package check silently without repeating setup; failures can continue with available lessons without a false readiness claim. Cloud workspace functions retain their existing online requirements. Native builds and Expo development mode bypass web package preparation. Browser secure context, Service Workers, Cache Storage, WebCrypto, and supported LiteRT features are required.
