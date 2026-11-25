# BAYA — Offline-first QA and fix

Date: 2026-11-20. Classification: **OFFLINE LEARNING VERIFIED WITH LIMITATIONS**.

## A. Executive summary

The corrected local production export opens supported lessons, runs local ResNet18 LiteRT recognition, and preserves learner data offline. A real approved workspace learner also continued offline and automatically synchronized a durable completion after reconnection without creating duplicates.

The public Netlify deployment has **not** been updated. Its current integrity audit still fails for the root HTML and 19 icon-font URLs. Do not treat the localhost results as a production release verification.

### Root cause and scope of reproduction

- The deployed worker applies exact SHA-256 integrity to `/`. Netlify adds an HTML comment, changing the digest. All-or-nothing installation fails and removes its partial cache. Nineteen font URLs containing exported node_modules/scoped-package paths also resolve to the SPA HTML instead of fonts. The fresh audit reproduced these 20 mismatches across 186 requests: [live integrity](verification/offline-first/live-integrity.json). Earlier real-browser worker-install errors and missing controller/cache are preserved in `docs/verification/baya-new-features/`.
- A second reliability defect was found in the source: navigation fetched the latest HTML and wrote it over the installed shell without verifying that the matching bundles were cached. Updates also used skipWaiting, deleted old caches and forced reloads in open sessions. That could mix versions or interrupt a drawing.
- The exact application string `You’re offline. Connect to the internet and try again.` is `modules/cloud/services.ts`'s cloud failure message, with English/Tagalog translations. It is used for cloud actions, not a global learner render gate. The old worker's missing-shell fallback said `BAYA is currently offline`. The tester's exact original route/screenshot was not supplied, so the quoted wording alone cannot conclusively identify that tester's screen. The reproducible installation failure explains why a fresh deployed installation cannot reliably reload lessons offline; it is not evidence of a Supabase requirement for lesson content.
- No global `navigator.onLine` gate was found around learner navigation, the curriculum repository or local database initialization. Existing valid local lesson sources were retained.

### Corrections

1. Keep exact SRI for executable/model/runtime/font/image resources. Validate HTML's expected entry-bundle references, allowing hosting-added comments.
2. Export fonts under stable `/assets/fonts/` URLs. Netlify static resource misses return 404 before the SPA fallback.
3. Serve navigation from the installed version's shell. Never overwrite it opportunistically with a newer online shell or borrow another cache's shell/assets. Missing static assets are fetched with their pinned integrity.
4. Let successful updates wait until existing clients close. Remove forced controller-change reloads. Failed installs delete only their new cache; activation cleans older BAYA caches after the old clients are gone.
5. Provide a worker status protocol that checks **every** required cache entry. Settings distinguishes downloaded learning materials from incomplete preparation. Registration alone is not readiness. Video remains explicitly online-only.
6. Add a small bilingual learner offline indicator without blocking navigation.
7. Skip cloud sync when the browser explicitly reports offline. On reconnection, a cloud-bound active learner retries the existing cumulative SQLite completion snapshot through the authorized RPC. Independent learners do not attempt this upload.

## B. Offline architecture

### Content and startup

`app/_layout.tsx` starts `getReadyDatabase()` without awaiting cloud initialization. `LocalizationProvider` reads SQLite preferences before mounting children. `CloudProvider` creates optional clients and renders children without waiting for an authenticated network response.

`database/connection.ts` owns Expo SQLite/OPFS with ownership locks and serialized transactions. `database/lifecycle.ts` shares connection/migration/seed initialization. Migrations and approved curriculum seeds are bundled. No Supabase fetch is required to initialize local learning.

`database/services/curriculumService.ts` builds the approved catalog, reads local lesson rows and completion state, and resolves approved content. `activityContentService.ts` prefers bundled reviewed storybook content and validates any SQLite activity payload. `content/approvedCurriculum.ts` currently lists **nine topics in Modules 1–3**. Character references and writing exercises use `baybayinCharactersData.ts`, `baybayinAssets.ts` and `writingLessonData.ts`.

The same local content sources operate online and offline; no duplicate fallback curriculum was introduced. Existing prerequisites and unavailable-content behavior are preserved. Some lesson illustration slots already say “Illustration not yet available”; this patch neither supplies unapproved artwork nor claims those slots are complete.

### Offline-readiness contract

Prepare online until Settings reports downloaded learning materials. The controlling worker must contain all **186** manifest resources: shell, entry/worker JavaScript, styles where emitted, fonts, images/references/storybook assets, active ResNet18 model metadata and model, and LiteRT runtime JS/WASM. The verified final cache is `baya-pwa-eebd8fc4e617e240`.

The Settings check verifies resource presence and successful responses; it does not assert that a model invocation or database operation has succeeded. Those capabilities are independently exercised by the browser tests. Model correctness is not inferred from confidence. Browser storage eviction or user-cleared data can invalidate readiness later; Settings rechecks cache availability while mounted.

Videos/streaming media and external reference links require internet. The video exclusion is the existing media policy, not a new removal of teaching text. A never-prepared browser cannot bootstrap this website offline. The missing-shell message now asks the learner to complete the initial download instead of implying that all learning requires connectivity.

### Local records and cloud synchronization

`localLearnerService.ts` saves profiles, attempts, completions and progress in SQLite transactions. Writing drafts and interface preferences remain local. `modules/progress/localProgressSnapshot.ts` reads approved completed topics from durable attempts, independently of cloud availability.

The existing synchronization design is a **cumulative snapshot**, not a destructive FIFO. `sync_outbox` exists as a future generic queue but is not needed to replay this small idempotent completion set. Pending information remains in SQLite until and after upload; the patch does not delete or falsely acknowledge it. Reconnection retries the active profile only; other profiles can sync after selection using the existing manual Sync action. There is no aggressive periodic retry loop, and independent profiles receive no promise of cloud synchronization.

`supabaseProgress.ts` verifies the stored cloud identity matches the session. `supabase/migrations/202610210002_learning_progress.sql` verifies current active membership and workspace status on the server, uses unique completion identity, and merges cumulative progress. Stale/empty uploads do not erase newer completion. Authorization failure, revocation or expired sessions never authorizes an upload; local learning remains independent. Quiz scores and raw handwriting attempts are **not** uploaded by this completion-only RPC.

Cloud-required actions remain mentor authentication, workspace creation/join/approval, remote dashboards and progress upload. Cloud reachability, authentication and local readiness are distinct; an online browser can still encounter a cloud outage. Such failures retain the local retry source.

## C. Files modified

No source files were removed. No schema or model changes were made.

| File(s) | Purpose |
| --- | --- |
| `apps/mobile/scripts/generate-pwa-service-worker.mjs` | Version-consistent shell/static cache; guarded HTML; readiness message; safe waiting updates and recovery text |
| `apps/mobile/scripts/export-font-path.cjs` (new), `apps/mobile/metro.config.js` | Stable exported font URLs; retained earlier local repair |
| `apps/mobile/public/404.html` (new), `netlify.toml` | Real static-resource 404s; retained earlier local repair |
| `apps/mobile/ml/registerBayaPwa.ts` | Remove automatic reload of open lessons |
| `apps/mobile/components/learner/OfflineLearningStatus.tsx` (new), `app/learner/_layout.tsx` | Nonblocking learner connectivity indicator |
| `apps/mobile/components/learner/settings/OfflinePreparation.tsx` (new), `SettingsScreen.tsx` | Check actual worker cache from Settings |
| `apps/mobile/localization/en.ts`, `tl.ts` | Bilingual offline/preparation messages |
| `apps/mobile/modules/cloud/CloudProvider.tsx` | Reconnect-triggered upload for a bound learner |
| `apps/mobile/modules/progress/supabaseProgress.ts` | Explicit offline deferral before cloud access |
| `apps/mobile/scripts/__tests__/pwaCache.test.ts`, `database/__tests__/pwaServiceWorker.test.ts`, `modules/progress/__tests__/supabaseProgress.test.ts` | Cache/readiness/update/offline-sync regression checks |
| `scripts/testing/device-browser.mjs` | Reuse isolated test profile for process restart, discard stale debugging-port marker, await browser exit |
| `scripts/testing/baya-fix-server.mjs` | Optional isolated test port |
| `scripts/testing/baya-offline-*.mjs` (new) | Asset, learner, inference, restart/update, account/workspace and report harnesses |
| `docs/verification/offline-first/` (new), this report | Evidence and updated functional tests |

Pre-existing research documents, `sounds/`, original manuscript, earlier reports and unrelated working-tree changes were preserved. Earlier production reports were not rewritten as passing.

## D. Data integrity

No migrations, database resets, cache-based user-record storage or destructive recovery were introduced. Only fresh isolated Chrome profiles were used for browser testing. Local tests invoked the real shipped local completion/binding services for setup and persistence verification; those invocations are identified in evidence and are not claimed as UI quiz completion.

At the user's request a new email-verified mentor, new learner and dedicated QA workspace were created using normal Supabase authentication, join-request and mentor-approval APIs. Only that test learner's progress was uploaded. Test records were retained. Credentials/session tokens are stored outside the repository in a local temporary account file and are not included in this report or the evidence JSON. Registration evidence records the initial pending-verification state; `workspace-setup.json` records successful verification and approval.

Real server observations were **0 completions before reconnect → 1 after reconnect → 1 after a second reconnect**, with unchanged local records. Server authorization and conflict rules were also checked against the repository migrations in PGlite; these database tests do not substitute for real authentication tests.

## E. Test results

The updated [35 functional cases](verification/offline-first/test-cases.md), with [machine-readable results](verification/offline-first/test-cases.json), include preconditions, steps, expected/actual results, status, environment and evidence.

**27 Passed; 0 Failed; 8 Blocked; 0 Not Executed.** Seven blocked cases require a quiz implementation and approved content that do not exist; one requires an installed PWA test context. These counts apply to the new matrix, not the previous production audit.

| Execution | Result / evidence |
| --- | --- |
| TypeScript | Passed; `typescript.log` |
| Expo lint | Passed; `lint.log` |
| Production export and worker `--check` | Passed; `export.log`; final 186-resource version checked |
| Full Jest | **79 suites, 818 tests passed**; `jest-final.log` |
| Static assets | **185/185 SHA-256 checks matched**; missing font 404; `asset-audit.json` |
| Offline readiness | 186 required entries, none missing; `browser/preparation.json` |
| Independent lessons / mobile landscape | Real rendered content and screenshots; `browser/results.json`, `browser/screenshots/` |
| Local browser restart | Profile/completion and lesson retained after browser process restart with server stopped and HTTP cache disabled; `restart/results.json` |
| Writing drafts/language | Five resume cases passed; `resume/resume-results.json` |
| ResNet18 WebGPU and forced WASM | Actual local inference, offline reload, UI feedback and repeated submissions; `litert/production-browser.json`, `litert-wasm/production-browser.json` |
| Workspace reconnect | Real approved membership, offline local completion, automatic upload, no duplicate retry; `workspace-browser/results.json` |
| Progress SQL rules | 30 assertions passed; `cloud-progress.log` |
| Approval/security SQL rules | 41 assertions passed; `workspace-approval.log` |
| Failed/successful worker update | Actual exported app with controlled worker-version fixture; failed update preserved v1, valid v3 waited, then offline lesson loaded after browser restart; `update/results.json` |
| Public Netlify | Still **20 integrity mismatches**; `live-integrity.json`; one model transfer terminated without a digest result; no deployment performed |

Browser test setup captures runtime exceptions and failed network requests for learning/workspace runs in their `events.json` files; both final runs recorded empty lists. Screenshots and SQLite before/after values accompany the results. Initial restart/update harness failures were debugging-port/promise-wait synchronization errors, fixed and retained as diagnostic evidence; they are not silently counted as app passes. No sustained heap/memory soak was performed.

The model, preprocessing, five-output decoding, confidence/feedback policies and mastery thresholds are unchanged. Synthetic strokes were used to exercise submission/persistence, not to establish educational handwriting accuracy.

## F. Physical testing

`adb devices -l` returned no attached device: [ADB evidence](verification/offline-first/adb.txt). No Android model/version, storage measurement, airplane-mode run or installed-PWA launch can be reported. Desktop Chrome CDP disconnection is emulation. The stopped-server process-restart test establishes offline origin availability independently of a running server, but is not physical radio disconnection.

For an authorized Android device: record model/OS/browser/free storage; prepare online and verify Settings plus manifest; close/reopen; disable **both** Wi-Fi and mobile data; open home, lessons, references and handwriting; submit twice; retain progress; close/reopen offline; reconnect and verify the approved workspace sync. Use a new test learner and preserve personal storage. Run `scripts/testing/device-browser.mjs` callers with `BAYA_ANDROID_SERIAL` only after selecting the authorized device. Existing quizzes/values material remain blocked until approved implementations exist.

## G. Performance

Final cache response bytes: **96,852,068 bytes**, about **92.37 MiB / 96.85 MB**, excluding browser storage overhead and online-only video. The 186 entries contain one active model; unselected model artifacts are excluded from export. A prepared update temporarily holds two versions until activation.

Browser route measurements in `browser/results.json` include intentional harness waits, startup and rendering; they are **not isolated database-query or rendering benchmarks**. Read those recorded millisecond values rather than inferring a performance improvement. Local inference measurements include cold runtime/model setup after reload; final WebGPU and WASM values are recorded in their corresponding JSON. Headless software/driver behavior can differ greatly from physical hardware.

Measured final offline reload/inference: WebGPU **5165.1 ms**; forced WASM **937.7 ms**. Each backend retained attempt counts 1 → 2 → 3 across reload and repeated offline UI submission. These single-run measurements include initialization and are not an accuracy or speed comparison study.

Quiz persistence timing is unavailable because quizzes are unimplemented. No memory stability or cross-device performance claim is made.

## H. Remaining limitations

- Public deployment still needs the corrected build; its current offline installation defect remains observable.
- No physical Android/airplane-mode test or installed-PWA launch was possible.
- Current approved manifest includes only Modules 1–3. No supported values-integrated catalog was found. The generic quiz branch is an unavailable placeholder, without approved answer keys. This task did not fabricate those materials.
- Videos and external reference links are online-only. Some pre-existing illustration placeholders remain.
- Server-stopped restart and controlled update fixtures are localhost tests, not a Netlify update rollout.
- Offline storage is subject to browser quota/eviction/private-mode restrictions. The patch never clears a learner database to recover.
- Cloud sync covers cumulative completions, not raw writing history or quiz scores. Only the active cloud-bound learner is retried on reconnect; manual Sync remains available after a server outage with no connectivity transition. Expired credentials require the normal login flow. Server revocation blocks upload even while local lessons remain usable.
- No long-duration memory soak, simultaneous multi-device cloud race test, or physical GPU performance test was performed.

## I. Final readiness classification

**OFFLINE LEARNING VERIFIED WITH LIMITATIONS** for the corrected local production export and the current supported curriculum. Actual offline lesson rendering, browser-process restart, persistent local records, WebGPU/WASM recognition and real authorized workspace recovery were executed. This is not a claim that every research-planned module exists or that the public site has been fixed by deployment.
