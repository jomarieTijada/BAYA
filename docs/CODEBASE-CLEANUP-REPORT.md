# BAYA codebase cleanup — 25 October 2026

## Scope and recovery

Implemented cleanup on feature/learning-pwa, starting at f056d32. The tree already contained extensive model, workspace approval, settings and lesson changes. Before cleanup, 343 changed/untracked paths were copied under C:/BAYA-cleanup-backups/20261025/files; tracked-before.patch and git-status-before.txt preserve the initial diff/state. No commit, push, deployment, database reset, migration deletion or credential change was performed.

This report describes cleanup changes, not all changes relative to Git HEAD. Original research files were separately copied to research-originals in the same backup folder before moving, with SHA-256 verification. Restoring an individual backup over its current path will discard that file's cleanup changes; compare before restoring. Ignored research remains local and needs an external backup when moving computers.

## Audit and decisions

The initial inventory covers 32,928 files outside dependency/tool directories. Categories are provisional path-based classifications, not proofs of nonuse. Dependency installations, Git internals, virtual environments and Gradle/C++ caches were deliberately pruned and retained. Detailed manifests:

- [Before inventory](cleanup/inventory-before.csv) and [after inventory](cleanup/inventory-after.csv).
- [Research moves with backup paths and hashes](cleanup/research-moves.json).
- [Public model moves](cleanup/model-moves.json) and [additional EfficientNet rollback moves](cleanup/efficientnet-rollback-moves.json).
- [Generated build moves](cleanup/generated-moves.json): exact original/archive paths for 961 files.
- [Deleted duplicate exports](cleanup/deleted-duplicates.json): exact paths, checksums, recovery files.
- [Notebook audit](cleanup/notebooks.json), [duplicate asset candidates](cleanup/duplicate-assets.json), [dependency references](cleanup/dependencies.json), [routes retained](cleanup/routes.json).

Main problems were research binaries inside public runtime assets, scattered root checkpoints/notebooks, multiple focus-loading implementations, stale active-model documentation and lint scanning generated bundles/vendor code. No unused dependency was proven safe to remove. Manifests and lockfiles were retained, with no package-manager change or mass upgrade. Source/config references were checked; packages without direct hits remain flagged for indirect tooling/autolink review. No reinstall was needed because dependencies did not change.

Routes remain in Expo Router's app directory. Debug and redirect routes were retained rather than inferred unused from missing imports. Supabase migrations, local SQLite repositories and service authorization boundaries remain intact. API/shared packages and planned collection infrastructure were retained. Duplicate asset candidates mostly include source-vs-runtime dataset copies, generated native resources and public-vs-bundled branding: these serve different consumers, so no dataset or dynamically loaded lesson asset was removed. Unique video backups, captures, thesis documents, original datasets and uncertain artifacts remain preserved.

## Implementation

- Removed private workspace focus-loading implementations in mentor WorkspaceScreens and learner LearnerWorkspaceScreens; both now reuse modules/progress/useCloudRead. Existing stale-response invalidation, retries, loading/error states and authorization boundaries are preserved. The delayed-request test now waits for the shared loader to start before resolving its request.
- Reused the already-established AppButton, BayaDialog, BayaActionMenu and notifications architecture; no speculative universal component or broad route redesign was introduced.
- Removed StoryVisualLearning's unused Colors import. Updated Jest factory imports and obsolete lint directives. Corrected two array-type warnings. Lint excludes generated exports/native build output and vendored ONNX runtime rather than disabling source rules. Jest setup globals are declared explicitly.
- StoryMascotPopover state handling was adjusted to avoid synchronous state changes in its animation effect. Updated existing layout tests for the already-present constrained mascot popover, title suppression and 480px reading layout threshold. Added a stable visual-column test identifier. No lesson text, approved topic order or progress behavior was removed.
- Moved historical model-version registry from apps/mobile/ml/bayaModelVersions.json to ml/rollback/model-versions.json; it had no runtime consumer. Active configuration remains singular.
- Updated Python checkpoint/notebook locations and browser comparison-tool model roots. Historical validators now select their own model contract instead of inheriting the active ResNet contract. They were syntax-checked, not rerun for historical parity.

## Models, notebooks and storage

Active production model: BAYA_ResNet18_1.0.onnx, image-only float32 [1,96,96,1], 63 classes, ONNX Runtime Web 1.30.0. Public and production-export SHA-256 both equal fc41b21606b96b2a1fec6850259a8cbdc446d54f3d113ae8086e87310268f265. Source Keras SHA-256 remains 9a97b5d3933bef49b955b155369c58c32ccec3cf61bfbb4f213fad2d2ca1f7b8. [Integrity evidence](cleanup/model-integrity.json).

Production public/models/baya now contains only the ResNet ONNX, labels and contract. Twelve legacy public artifacts were relocated to ml/rollback/models/baya; three additional EfficientNet artifacts were recovered there from an older superseded-artifact directory. Original Keras checkpoints are in research/models. ml/rollback/README.md documents restoration and validation gates; no rollback was activated.

Deleted two exact generated ONNX duplicates: CustomCNN8 and ExternalFirst. Their checksummed canonical rollback copies remain available. This removes 21,656,285 bytes of redundant files. Active ResNet parity-export evidence and unique BiLSTM binaries remain retained.

Moved eight old dist-* verification builds outside the repository, retaining 961 files / 550,294,970 bytes under C:/BAYA-cleanup-backups/20261025/generated-exports. This reduces repository working-tree storage, not total disk usage. Current dist and dist-video-backup-20260929 remain. No broad ignored-directory purge was performed.

Four root notebooks were moved into research/notebooks. Two historical BiLSTM notebooks remain in ml/training. All six have distinct hashes and contain methodology/evaluation evidence. BAYA_ResNet18.ipynb is the active-model training reference; the dataset rescue, custom CNN, EfficientNet comparison and BiLSTM notebooks remain research evidence. No duplicate/empty notebook or disposable notebook checkpoint was established, so none was deleted. Outputs were preserved because unique results were not proven reproducible. No research notebook/checkpoint is deployed.

## Repository map

~~~text
apps/mobile/
  app/                       Expo routes
  components/learner/        profile, lessons, writing, settings
  components/mentor/         authentication, workspaces, approval
  components/ui/             shared buttons, dialogs, menus, notifications
  content/                   approved curriculum and media references
  database/                  SQLite/OPFS connections, repositories, services
  modules/cloud/             Supabase service adapter and auth/workspace domain
  modules/progress/          shared cloud loading and progress presentation
  ml/                        active manifest, preprocessing, recognition runtime
  public/models/baya/        active ResNet runtime files only
  public/ort/                required ONNX WASM runtime
research/models/             local original training checkpoints
research/notebooks/          local research notebooks
ml/training/                 historical training notebooks
ml/rollback/                 recoverable legacy models and metadata
ml/deployment/onnx/           model inspection/export tooling
supabase/migrations/         complete schema/RLS history
packages/                    shared types and collection DB package
scripts/                     build, diagnostics and integration tools
docs/                        architecture, historical evidence, cleanup manifests
~~~

Root README is the architecture entry point; ML READMEs now identify ResNet consistently. Historical docs/ml reports retain original filenames and dates; relocation manifests map old source paths to current ones.

## Verification

| Check | Result |
|---|---|
| Initial Jest baseline | 65/67 suites, 630/639 tests; stale layout/error assertions failed |
| Final Jest | 67/67 suites, 639/639 tests passed |
| TypeScript: npx tsc --noEmit | Passed |
| npm run lint | Passed, zero errors; one retained warning for debug inspector conditional require |
| npm run export:web | Passed; service worker generated with 163 assets |
| Model/export integrity | Passed; only three active model files in exported models directory |
| Python dataset tests | 7 passed |
| Isolated PostgreSQL/RLS tests | 36 passed via scripts/test-workspace-approval.mjs |
| Changed browser validation scripts | JavaScript syntax checks passed |
| Python conversion tooling | Compilation check completed |
| Hosted Supabase integration | Not run: isolated BAYA_TEST_URL/credentials unavailable |

Full Jest includes preprocessing, class mapping, canvas/feedback/mastery, SQLite persistence, navigation, authentication, joining, approval and settings coverage. Existing asynchronous act warnings and force-exit/open-handle notice remain; passing tests do not prove hosted email delivery or real multi-connection race behavior.

## Resumed actual-browser verification — 2026-10-25

Browser access was restored. Checks below used the actual production application at http://127.0.0.1:5055 and development application at http://127.0.0.1:8088, not debug workspace fixtures. Earlier disabled-browser attempts are superseded by these observations.

| Browser check | Observed result |
|---|---|
| Learner navigation/settings | Saved Cleanup QA profile loaded; floating settings opened Join Workspace. Empty join submission displayed required-code validation. |
| Lessons and persistence | Module 1 introduction/history navigation and Next worked. Topic 1-2 remained selected after reload. Mascot popover opened and closed. |
| Production handwriting/ONNX | Actual canvas drag enabled Suriin; submission returned G 37.1%, O/U 21.0%, L 19.2% and retry feedback. Ulitin reset the canvas; Undo removed a new stroke and disabled submission. |
| Development handwriting/ONNX | Actual canvas drag and submission returned G 34.0%, L 27.4%, LO/LU 24.4%. Model initialization and ranked inference completed. |
| Mentor authentication | Successful login through the real Mentor Login form using the user-provided account. Authenticated management survived reload. No credentials are included in this report. |
| Hosted workspace creation | Created Cleanup Verification 2026-10-25, code BAYA-470A561B64D5. Dashboard and workspace list confirmed it alongside existing Room 1. Existing workspace preserved. |
| Mentor navigation/settings | Workspace options, management, workspace list and Settings navigation worked. Logout confirmation opened and Cancel retained the session; actual logout was not exercised so the requested mentor session remains signed in. |
| Learner joining | Submitting user-supplied BAYA-FD9E06CCD69C displayed: “Workspace joining needs to be enabled by the BAYA administrator. You can keep learning on this device.” No membership was created. |
| Pending join requests | Management displayed “Online workspace services are not available yet. Please try again later.” Active members remained zero. End-to-end approval/sync could not be verified. |
| Responsive production | Settled lesson screenshots captured and inspected at 667×375, 844×390, 1024×768 and 1366×768. Mentor dashboard/menu also captured at these sizes; compact menu fits and the short dashboard scrolls. |
| Responsive development | Settled handwriting/results screenshots captured and visually inspected at the same four sizes. Canvas, retry button and results remain accessible; compact results use an internal scroll region. |
| Cached origin-unavailable use | Production navigation, reload and inference succeeded while no server listened on 5055 (connection refusal independently observed). This verifies cached-origin resilience, not complete network-offline behavior. |

Evidence is in [cleanup/verification](cleanup/verification): resumed-production-*.png, resumed-join-disabled.png, development-*.png, mentor-*.png. The test workspace remains available for follow-up. Temporary viewport overrides were reset. No cleanup regression was established in these checks, so no application source change was made during this verification pass. Existing automated results above remain applicable; they were not rerun solely for this report update.

## Remaining acceptance limits

Hosted joining and pending requests remain blocked by the errors above. The join message corresponds to the application's learner-auth-disabled handling, but this pass did not capture the raw hosted response, so it does not establish the precise server configuration. No Supabase Auth setting or hosted migration was changed. Successful membership approval, learner synchronization and mentor progress display still need a working hosted join/approval setup. Email signup delivery/resend was not reverified by signing into an existing account.

Handwriting runs were smoke checks with arbitrary strokes, not model accuracy or Keras/ONNX parity tests. The writing route was opened directly; this does not prove lesson unlock progression. Full network-offline emulation was not performed. A lesson video displayed its retry fallback while the origin server was unavailable; online media playback remains unverified. Responsive evidence covers representative lesson, handwriting and mentor screens, not every route at every size.

Uncertain assets/dependencies and research experiments remain retained. No commit, push or deployment was performed.
