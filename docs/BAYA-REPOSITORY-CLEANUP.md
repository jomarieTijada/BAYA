# BAYA repository cleanup — 26 October 2026

## Scope and recovery

Cleanup was performed in the existing `feature/learning-pwa` working tree, based
on `f056d32`. The tree already contained substantial uncommitted work. That work
was preserved; this report distinguishes this pass from the earlier cleanup in
`CODEBASE-CLEANUP-REPORT.md`.

Recovery archive: `C:/BAYA-cleanup-backups/20261026-master`. It contains the
original status, binary Git patch, hash-verified copies of modified/untracked
files, additional removed-source backups, and archived generated outputs.
Do not restore the whole snapshot over newer work; restore individual files.
No commit, push, deployment, hosted database mutation or RLS change was made.

## Before and after

The inventory covered 32,047 files / 10,468,233,131 bytes, excluding installed
dependencies, Git internals and selected tool caches. The post-cleanup inventory
contains 31,670 files / 10,190,503,353 bytes, excluding the new cleanup evidence
directory. These are working-tree inventory snapshots, not Git source counts;
the roughly 278 MB reduction largely reflects outputs archived outside the repo.
The recovery archive still occupies disk space.

Before: ten top-level app folders contained only future-planning READMEs;
recognition retained unused sequence-input and normalization branches; historical
sequence fixtures lived in the mobile tests; stale exports and coverage remained.
After: the app tree has `learner`, `mentor`, `debug` and root route files;
production recognition is image-only; research evidence is outside production;
one fresh web export remains in `apps/mobile/dist`.

Detailed evidence in `cleanup/20261026/`:

- `inventory-before.json`, `inventory-after.json`, `excluded.json`: complete
  inventoried paths, sizes, conservative classifications and exclusions.
- `source-actions.json`: exact source additions, edits, deletions and relocations
  compared with the starting snapshot, rather than all preexisting Git changes.
- `removed-paths.json`: exact original paths no longer present, including output
  files and fixtures moved elsewhere. This is not a claim of permanent deletion.
- `model-notebook-hashes.json`, `notebook-review.json`: binary hashes and notebook
  evidence; `asset-duplicates.json`: runtime-media duplicate audit.
- `routes-before.json`, `export-verification.json`: route and export verification.

Classifications are conservative: `UNCERTAIN` files were retained, not declared
dead from import counts. Installed dependencies and browser profile internals
were not individually audited for semantic reachability.

## Removed source and consolidated code

| Files | Reason / replacement |
|---|---|
| `apps/mobile/app/README.md` | Outdated planning text consolidated into `docs/architecture/routes.md` |
| `apps/mobile/app/{achievements,activities,authentication,handwriting,home,lessons,onboarding,profile,progress,settings}/README.md` | Ten documentation-only route placeholders; their empty folders removed |
| `apps/mobile/components/layout/AppHeader.tsx` | Unreferenced old dashboard-shell header; active feature headers retained |
| `apps/mobile/components/ui/StatusCard.tsx` | Unreferenced old dashboard-shell card; active cards retained |
| `apps/mobile/components/learner/cards/MediaCard.tsx` | Redundant wrapper; `VideoActivityCard` uses canonical `ActivityCard` with the same video type |
| `apps/mobile/ml/bilstmSequence.ts` | Removed from production; exact source retained under `ml/rollback/runtime/bilstmSequence.ts.txt` |
| `apps/mobile/ml/__tests__/bilstmSequence.test.ts` | Tests exclusively retired sequence preprocessing; recoverable in external source backup |
| `scripts/test-env-cdp.mjs`, `scripts/test-mem-cdp.mjs`, `scripts/test-interactive-cdp.mjs` | One-off machine/LAN diagnostics with hardcoded profiles/addresses; meaningful browser and SQL regression tools retained |

Removed the unused label-to-ID export, sequence construction/timestamps path,
optional sequence tensors, static-normalization tensor construction, and redundant
sequence allocations in warmup/smoke/benchmark inference. Canvas stroke capture,
geometry validation, probabilities, session reuse and tensor disposal remain.
Removed two unused destructured presentation parameters without changing callers.
Fixed the existing `Subukan mulin.` typo to `Subukan muli.`; the baseline's four
recognition feedback failures now pass without deleting their assertions.

Shared headers, BackButton, AppButton, BayaDialog, BayaActionMenu and notifications
were already canonical in the active features. RoleButton has distinct landing
page geometry; mentor/learner logout have different credential-preservation rules.
Those differences were retained rather than forced into a larger generic API.

## Relocations and models

| Original | New location |
|---|---|
| `apps/mobile/ml/efficientNetPreprocessing.ts` | `apps/mobile/ml/inkImagePreprocessing.ts` |
| `apps/mobile/ml/efficientNetClassLabels.ts` | `apps/mobile/ml/bayaClassLabels.ts` |
| `apps/mobile/ml/__tests__/imagenetPreprocessing.test.ts` | `apps/mobile/ml/__tests__/inkImagePreprocessing.test.ts` |
| `apps/mobile/ml/__tests__/fixtures/bilstm-v1.1/**` | `ml/rollback/fixtures/bilstm-v1.1/**` |
| Pre-cleanup multi-input web loader | Research copy `ml/rollback/runtime/bayaModel.web.ts.txt` |

All live imports and executable script consumers of these paths were updated,
including conversion/parity scripts. Historical reports retain their original
paths as dated evidence. The image preprocessing algorithm was not rewritten.
The 109-sample Pillow golden-image regression remains; only its obsolete
EfficientNet-specific notebook-binding test was retired. Active ResNet contract,
hash, label order and provenance tests remain.

Production model: `apps/mobile/public/models/baya/BAYA_ResNet18_1.0.onnx`.
SHA-256: `fc41b21606b96b2a1fec6850259a8cbdc446d54f3d113ae8086e87310268f265`.
Input: float32 image `[1,96,96,1]`; output: 63 probabilities. Production metadata
and labels remain beside the model; the sole selection is `ml/bayaActiveModel.json`.

The earlier cleanup had already removed EfficientNet ONNX files from `public`.
This pass removed remaining legacy runtime branches and archived generated copies;
it does not claim those earlier binary removals as new work. Unique research
weights and comparison artifacts remain in `research/models`, `ml/rollback/models`
and `ml/deployment/onnx/artifacts`. Hash-identical copies required as conversion
outputs or deployed assets were not indiscriminately deleted.

## Notebooks retained

No notebook was deleted in this pass. All six have distinct hashes and substantive
methodology; five contain executed output. The refinement notebook is unexecuted
but contains 36 cells of distinct training methodology, not an empty checkpoint.

- `research/notebooks/BAYA_Dataset_Rescue.ipynb`
- `research/notebooks/BAYA_ResNet18.ipynb`
- `research/notebooks/Custom_CNN_Model_8.ipynb`
- `research/notebooks/EfficientNetB0_Augmented_Comparison.ipynb`
- `ml/training/BAYA_EfficientNetB0_BiLSTM_v1_1_Refinement.ipynb`
- `ml/training/EfficientNet_B0–BiLSTM.ipynb`

## Generated outputs and assets

Archived outside the repository under the recovery directory:

- Old `apps/mobile/dist` → `generated-dist`; a new export was generated afterward.
- `apps/mobile/dist-video-backup-20260929` → matching path under `generated`.
  Its unique media remains recoverable.
- `apps/mobile/.expo/preprocess-parity-build` → matching path under `generated`.
- Root and mobile `coverage` directories → matching paths under `generated`.
- `apps/mobile/modules/baya-native/android/build` → `generated/baya-native-build`.

Existing ignore rules already cover exports, coverage, native builds and caches.
A narrowly scoped rule excludes the large local ignored-file inventory. The
current `.expo` development state and SQLite/OPFS data were not deleted.

Runtime image/audio/video/font hashing found one exact duplicate pair:
`assets/branding/app/favicon.png` and `public/favicon.png`. Both are retained for
bundled configuration and static web serving. No active media was removed.

## Dependencies and authentication

No dependency or lockfile change was justified in this pass. Expo/Metro/native
integration dependencies cannot be removed merely because they lack an explicit
application import. ONNX Runtime Web remains necessary; PGlite and Jest support
the retained regression suite. Existing package versions and package manager stay.

CloudProvider already caches mentor and per-learner clients by separate storage
keys. Its ephemeral recovery client is intentionally separate. No duplicate
workspace service or obsolete join implementation was established as safe to
remove. Anonymous learner session retention, pending joins, approve/reject,
membership management, migrations and RLS were preserved.

## Verification

| Check | Result |
|---|---|
| Baseline Jest | 66/68 suites, 653/657 tests passed; four existing feedback-text failures |
| Final Jest | **67/67 suites, 641/641 tests passed** |
| ML subset after runtime cleanup | 7 suites / 70 tests passed |
| Debug/media/story targeted checks | 5 suites / 65 tests passed |
| `npx tsc --noEmit` | Passed |
| `npm run lint` | Passed, no lint diagnostics |
| Isolated workspace approval/security | 36 checks passed |
| Isolated cloud migration/identity/RLS | 40 assertions passed |
| Isolated cloud management | 21 assertions passed |
| Isolated progress/dashboard access | 30 assertions passed |
| `npm run export:web` | Passed; PWA generator completed |
| Export asset/hash inspection | Exactly one ONNX file, matching active ResNet hash; required metadata and WASM present |
| Route inventory | All 30 original TSX route files preserved |
| `git diff --check` | Passed; Git emitted line-ending notices only |

Final export: 169 files, 106,326,217 bytes. The service worker precaches 163 assets
and includes ResNet18, with no EfficientNet/BiLSTM precache entries. The export
remains available at `apps/mobile/dist`. Nothing was deployed.

The test-count reduction comes from retiring the legacy sequence suite and one
EfficientNet-only provenance assertion, with a new production inspector gate test.
Useful canvas, recognition, mastery, persistence, authentication, join-modal,
approval, membership, navigation and PWA coverage remains. Jest still emits
existing React act/preload warnings and uses `--forceExit`; those are not hidden.

Browser checks were not performed because browser access was disabled. This pass
does not claim fresh visual, real-browser inference, offline or hosted-auth
verification. Prior browser parity evidence is preserved; current automated
checks verify the same active model and preprocessing. PGlite does not replace
multi-connection race testing or hosted Supabase Auth integration.

## Repository map

```text
apps/mobile/
  app/                  Expo Router: learner, mentor, debug, root routes
  components/learner/   Learner screens, lesson/story/writing/workspace UI
  components/mentor/    Mentor auth, workspaces, pending requests and members
  components/progress/  Mentor dashboards and progress presentation
  components/ui/        Shared buttons, dialogs, menus, notifications and cards
  content/              Curriculum and writing/mastery rules
  database/             SQLite connection, repositories, local services
  modules/cloud/        Supabase auth, join requests, membership services
  modules/progress/     Progress mapping and synchronization
  ml/                   Image capture, preprocessing, labels and ONNX inference
  public/models/baya/   Active ResNet18 ONNX, labels and contract only
  public/ort/           Web inference runtime and WASM
  assets/               Bundled branding, curriculum and media
  scripts/              Export, SQLite patch, runtime copy and PWA helpers
  dist/                 Generated production export; reproducible
supabase/migrations/    Ordered cloud schema and authorization history
packages/               Shared packages and database tooling
scripts/                Repeatable SQL, UI, PWA and model verification
research/               Original checkpoints and canonical research notebooks
ml/training/            Historical training methodology
ml/deployment/onnx/     Conversion and parity tooling/evidence
ml/rollback/            Historical model weights, source and fixtures
docs/                   Architecture, dated verification and cleanup reports
```

## Deliberately retained uncertainty

`sandbox` contains historic diagnostic browser profiles and experimental output;
some may hold local storage, so it was not broadly deleted. Generated native
project directories outside the specifically archived module build remain because
their customization/state was not fully established. `services/api` contains a
planned backend scaffold and its own tooling; it is not the production Supabase
adapter and was not assumed disposable. Other academic datasets, guides, captures
and conversion intermediates remain where their provenance or regeneration cost
does not justify deletion. The inventories expose these limits instead of
claiming every retained file has been proven necessary.
