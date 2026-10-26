# BAYA implementation and verification report

Date: 2026-10-24. Workspace: `C:\BAYA`. No commit, push, or deployment was performed.

## Status

| Area | Status | Scope of verification |
| --- | --- | --- |
| Model conversion/replacement | IMPLEMENTED AND VERIFIED | Keras/ONNX parity, production browser adapter, writing smoke test, offline inference; accuracy/calibration limitations below |
| Settings | IMPLEMENTED AND VERIFIED | Service-backed sign-out, confirmation/cancellation tests, protected route boundary retained, browser layout |
| Header alignment | IMPLEMENTED AND VERIFIED | Shared layout and five viewport sizes |
| Performance | IMPLEMENTED AND VERIFIED | Measured warm inference and production PWA installation only |
| Workspace joining | PARTIALLY IMPLEMENTED | Code-only flow, verified identity and database authorization tested locally; hosted anonymous authentication configuration and end-to-end join remain unverified |
| Notification system | IMPLEMENTED AND VERIFIED | Shared components, unit tests and browser visual/keyboard checks; live email delivery and native assistive technology not tested |

The complete task is not declared fully verified: hosted cloud operations, physical-device accessibility, and the full repository test/lint checks have outstanding limitations.

## Repository audit and baseline

Baseline HEAD was `f056d32` (Implement Supabase mentor workspaces and learner progress sync). Existing uncommitted story changes in StoryContent, StoryNavigation, StoryPage, StorySpeechBubble, StorybookTopicLayout and StorybookTopicScreen, plus StoryMascotPopover, story documentation, existing verification assets and a thesis DOCX were preserved.

The repository already had shared AppButton, AppIcon, fields, theme tokens, Settings containers, FeatureScreen, ProgressPage and a reduced-motion hook. It had a specialized writing-help modal but no general reusable confirmation/toast provider. Authentication, membership, synchronization and SQLite profile services were real implementations; the debug workspace preview explicitly used a fixture adapter. Screenshots from that preview demonstrate presentation, not hosted backend success.

The original model was EfficientNet-B0 + BiLSTM v1.1, with image and stroke-sequence inputs plus exported normalization constants. Its class mapping, confidence gate and two-accepted-attempt mastery rule were already implemented. SQLite initialization and ONNX initialization already reused shared promises/sessions. Those mechanisms were preserved. Workspace joining used existing SQL RPCs and RLS; there is no configured pending-approval workflow in the current schema. No artificial pending membership or approval service was added.

## A. Model replacement

Source: `C:\BAYA\BAYA_ResNet18_1.0.keras`, 135,267,131 bytes. Source SHA-256: `9a97b5d3933bef49b955b155369c58c32ccec3cf61bfbb4f213fad2d2ca1f7b8`.

The initially supplied notebook's BatchNorm settings differed from the saved artifact. Provenance was resolved using `C:\Users\jomsa\Downloads\BAYA_ResNet18_63Class_4410_results`: its Keras artifact is byte-identical to the target and includes the original label mapping and preprocessing manifest. Conversion loads the saved model, not a reconstructed notebook architecture. The authoritative 63-label order matches the application's existing order. The source artifact remains intact.

Conversion uses Keras export through TensorFlow 2.18.0, Keras 3.13.2, tf2onnx 1.17.0, ONNX 1.18.0, opset 18 and ONNX Runtime 1.30.0. The graph checker passed. The ONNX file is 44,974,086 bytes; SHA-256: `fc41b21606b96b2a1fec6850259a8cbdc446d54f3d113ae8086e87310268f265`.

Input: `image_input`, float32 NHWC `[1,96,96,1]`. Output: `Identity:0`, float32 `[1,63]`, softmax class probabilities. Preprocessing composites transparency on white, uses Pillow-compatible grayscale, inverts to ink intensity, crops the bounding box above 0.08, pads 15% with minimum two pixels using Python-compatible rounding, centers in a zero-filled square, performs uint8 bilinear resize to 96×96, then divides by 255. Export metadata and the exact extracted preprocessing source are retained under `docs/ml/resnet18-1.0` with checksums in the contract.

Parity covered 80 inputs: zeros, ones, 15 existing image fixtures and 63 reference glyphs. CPU maximum absolute difference was `9.5367431640625e-7`, with 80/80 matching top classes. Browser WASM maximum difference was `8.046627044677734e-7`, with all top-one/top-three results matching. Browser preprocessing matched the Python reference exactly on 63 reference images. The production adapter reused a single session across repeated calls.

Active model: `resnet18-1.0`. The adapter conditionally supplies sequence inputs only for models that require them. Canvas stroke capture, recognition interface, feedback, SQLite attempts and two-success mastery remain intact. The confidence threshold remains 0.80; it represents class confidence, not handwriting quality. No recalibration or improved accuracy is claimed. These parity/reference inputs are not an independent held-out handwriting evaluation. The exact final image-only held-out dataset was not located; other dataset archives cannot establish an independent evaluation without provenance.

The old ONNX artifact and configuration remain available as `bilstm-v1.1`. Both selector validations passed, and the old model still ran through the generalized browser adapter. Rollback command: `node apps/mobile/scripts/select-baya-model.mjs bilstm-v1.1`, followed by a fresh web export. No rollback was activated.

Evidence: [conversion](verification/baya-refresh/model-conversion.json), [browser parity and benchmark](verification/baya-refresh/model-browser.json), [rollback validation](verification/baya-refresh/rollback-browser.json), [offline PWA](verification/baya-refresh/pwa-final.json).

## B. Settings

Mentor Settings now contains the account/session section and Log Out. Workspace selection links to Settings instead of signing out directly. Confirmation invokes the actual authentication service, shows busy/error states, and navigates only after success. MentorBoundary continues protecting the route. Learner email-account logout also lives in learner Settings; the account screen links there. Anonymous device identities do not receive an unsafe destructive sign-out control. Neither logout path deletes SQLite learning progress.

## C. Header fixes

PageHeader aligns the back control, title and optional action in one centered flex row. The subtitle occupies its own row. Shrinking/wrapping titles and accessible button dimensions prevent overlap without absolute offsets. FeatureScreen and ProgressPage reuse it, covering mentor authentication, workspace selection/create/details, learner join and settings-related pages. Specialized lesson/story headers were preserved.

## D. Performance

Environment: local Windows Chrome, ONNX Runtime Web 1.30.0 WASM, loopback server, no network throttling. These are local observations, not production-network or low-end-device guarantees.

| Operation | Before | After | Method |
| --- | ---: | ---: | --- |
| Warm inference mean | 51.661 ms | 30.278 ms | Old hybrid vs new ResNet; five warmups, 40 timed calls each |
| Warm inference median | 50.967 ms | 29.755 ms | Same captured benchmark reports |
| PWA asset installation | 3802.63 ms | 2205.41 ms | One fresh-profile run per implementation; 163 assets, sequential vs four concurrent fetch workers |

PWA installation now uses four bounded workers, waits for all workers before failure cleanup, and retains checksum-based cache invalidation. A separate final offline validation is recorded in `pwa-final.json`; installation timing varies across runs. The model is larger than the old approximately 17 MB artifact, so cold transfer may be slower despite faster warm inference. Existing lazy model loading, shared sessions and shared SQLite initialization were retained. No speedup is claimed for authentication, hosted workspace queries, general startup, or rendering: those operations were not benchmarked before/after.

## E. Workspace joining

The join form asks only for a workspace code and uses the active SQLite learner profile. Existing server code-format rules are retained; the illustrative short code in the brief is not substituted for the real format.

For an unbound profile, the per-profile Supabase client establishes an anonymous auth session. Server `getUser` verification checks the authenticated identity, permits verified anonymous identities or confirmed email identities, verifies learner role, and binds the immutable auth user ID to the local learner transactionally. A missing session for an already bound profile fails rather than silently creating a different identity. Concurrent identity establishment is deduplicated.

The membership RPC derives identity from `auth.uid()` and enforces its existing role, workspace state, membership uniqueness and RLS rules. A local UUID or code alone never authorizes membership. Invalid, offline, unavailable, removed/inactive and already-joined states remain distinct. The joined dialog requires both active membership and active workspace, and does not claim synchronization has finished. Existing synchronization remains separately recoverable.

Local service and PostgreSQL checks passed. Hosted Supabase anonymous sign-in must be enabled for new device identities; that provider setting was not inspected or changed. No live learner accounts or memberships were created. Pending approval is not part of this backend's configured direct-join workflow, so there is no pending-request operation to validate.

## F. Modals and toasts

Reused AppButton, AppIcon, typography, colors, shadows, safe-area handling, RN Modal and the existing reduced-motion hook. Added BayaDialog for typed presentation/actions and BayaNotifications for one application-level toast provider. Neither component calls cloud, SQLite or model services.

BayaDialog provides centered rounded cards, orange confirmation/green success icons, web background blur/dimming, responsive internal scrolling, 280 ms entrance/180 ms exit, reduced-motion support, title announcement, web/native focus entry, and busy-state dismissal protection. RN Modal supplies web focus containment/restoration and background interaction isolation; browser keyboard checks verified that behavior.

The independent confirmation appears when continuing without a workspace; its secondary action opens code entry with the active local profile. Workspace Joined appears only for a newly confirmed active membership. Both mentor and learner logout use the same dialog.

Toasts coalesce duplicate messages, last six seconds (nine for errors), offer a 44 px dismiss button, announce politely, and fade in/out unless reduced motion is enabled. Provider-confirmed OTP initiation/resend/verification, privacy-preserving reset feedback, password updates, workspace creation and successful code copying use this provider. Important failures stay inline. Existing loading guards and resend cooldowns prevent repeated submission. API acceptance is described as a verification-code request, not proof of inbox delivery.

## G. Visual verification

Actual Chromium screenshots were captured for 11 screens at 667×375, 844×390, 915×412, 1024×768 and 1366×768 (55 combinations), with additional scrolled captures. Final dialog/settings checks reran 15 combinations after icon/text corrections. All checked widths avoided horizontal overflow; Tab containment, Escape dismissal and focus restoration passed. Screenshots were inspected against both supplied references, including desktop dialogs and small-landscape layouts. The implementation follows their hierarchy and colors using existing BAYA type/components, rather than scaling reference pixels.

- [Independent Learner](verification/baya-refresh/independent-1366x768.png)
- [Workspace Joined](verification/baya-refresh/joined-1366x768.png)
- [OTP request toast](verification/baya-refresh/otp-toast-1366x768.png)
- [Logout confirmation](verification/baya-refresh/logout-667x375.png)
- [Mentor Settings](verification/baya-refresh/mentor-settings-1366x768.png)
- [Header and workspace join form](verification/baya-refresh/join-1366x768.png)
- [Viewport results](verification/baya-refresh/results.json)

Preview screens use explicitly labeled fixture data. Production writing was separately exercised with the real exported app/model: drawing, Suriin, feedback, Ulitin and repeated inference passed without browser errors. Native screen readers and physical touch devices were not exercised.

## H. Files and responsibilities

Paths below are relative to the repository; pre-existing story files are excluded from this task's change inventory.

| Files | Purpose |
| --- | --- |
| `ml/deployment/onnx/inspect_export_resnet18.py` | Artifact provenance, conversion, graph check, numerical comparison and contract generation |
| `docs/ml/resnet18-1.0/label_to_id.json`, `preprocessing.json`, `preprocessing-source.py` | Portable original preprocessing/label evidence |
| `apps/mobile/public/models/baya/BAYA_ResNet18_1.0.onnx`, `_labels.json`, `_onnx_contract.json` | New runtime artifact and deployment metadata |
| `apps/mobile/public/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1_onnx_contract.json` | Record existing validated conversion parity for rollback selector |
| `apps/mobile/ml/bayaActiveModel.json`, `bayaModelVersions.json`, `bayaModelConfig.ts` | Active contract, rollback registry and typed optional normalization |
| `apps/mobile/ml/bayaModel.web.ts`, `writingRecognition.ts` | Image-only inference with shared hybrid-compatible API |
| `apps/mobile/ml/__tests__/activeModelContract.test.ts`, `bayaModel.test.ts`, `writingRecognitionPhases.test.ts` | Artifact/hash/input/recognition regressions |
| `apps/mobile/components/ui/BayaDialog.tsx`, `BayaNotifications.tsx`, `AppIcon.tsx` | Shared presentation and layered confirmation icon |
| `apps/mobile/components/ui/__tests__/BayaNotifications.test.tsx` | Duplicate suppression, manual dismissal and expiration |
| `apps/mobile/app/_layout.tsx` | Mount one persistent notification provider |
| `apps/mobile/components/layout/PageHeader.tsx`, `components/mentor/FeatureScreen.tsx`, `components/progress/ProgressPage.tsx` | Shared centered header row |
| `apps/mobile/app/mentor/settings.tsx`, `components/mentor/MentorSettingsScreen.tsx` | Protected mentor account/logout settings |
| `apps/mobile/components/learner/settings/SettingsScreen.tsx`, its `__tests__/SettingsScreen.test.tsx` | Learner account logout and regression coverage |
| `apps/mobile/components/learner/ProfileSetupForm.tsx`, its `__tests__/ProfileSetupForm.test.tsx` | Independent confirmation and code-entry navigation |
| `apps/mobile/components/learner/LearnerWorkspaceScreens.tsx` | Code-only form and truthful active-membership result |
| `apps/mobile/components/learner/LearnerCloudAccount.tsx` | Optional email recovery/account navigation, OTP feedback/cooldown |
| `apps/mobile/components/mentor/AuthScreen.tsx` | Auth/OTP/reset notifications and cooldown |
| `apps/mobile/components/mentor/WorkspaceScreens.tsx`, `WorkspaceCard.tsx`, `components/progress/WorkspaceCode.tsx` | Settings navigation, creation and copy feedback |
| `apps/mobile/components/mentor/__tests__/flows.test.tsx` | Updated service-backed flow assertions |
| `apps/mobile/modules/cloud/learnerIdentity.ts`, `learnerEmailAuth.ts`, `supabaseAdapter.ts`, `services.ts` | Verified per-profile identity, anonymous establishment, authorization-preserving joining and failure messages |
| `apps/mobile/modules/cloud/__tests__/learnerEmailAuth.test.ts`, `supabaseAdapter.test.ts` | Identity mismatch, lost session, anonymous sign-in and membership behavior |
| `apps/mobile/components/debug/workspaces/WorkspacePreview.tsx` | Explicit test-only preview cases |
| `apps/mobile/scripts/generate-pwa-service-worker.mjs` | Bounded concurrent precaching with safe cleanup |
| `scripts/verify-resnet18-browser.mjs`, `benchmark-baya-rollback.mjs` | Real browser model parity/session/benchmark evidence |
| `scripts/verify-baya-pwa-browser.mjs` | Fresh installation, stale-cache cleanup, preserved local marker, offline model/WASM/inference |
| `scripts/verify-baya-notifications.mjs` | Browser viewport screenshots and dialog keyboard checks |
| `docs/verification/baya-refresh/*`, this report | Screenshots and captured verification results |

## I. Test results

- Targeted model/domain/UI run: 15 suites, 177 tests passed. Final follow-up after metadata/UI refinements: seven suites, 61 tests passed. The final toast-animation test and TypeScript check were rerun separately.
- Full suite: 64 suites, 606 tests; 63 suites/598 tests passed and eight StorybookTopicScreen layout assertions failed. Those files contained pre-existing user changes and were not modified by this task. This is not a clean full-suite result.
- PostgreSQL/PGlite: 40 cloud DB, 30 progress and 21 management assertions passed (91 total), loading existing migrations.
- TypeScript `tsc --noEmit`: passed. Targeted ESLint on changed core files: passed. Full Expo lint retains one error in pre-existing `StoryMascotPopover.tsx` (setState-in-effect) and 14 warnings.
- Production web export: passed, including generated service worker. Browser offline test passed with correct ONNX checksum, cached WASM and three offline inferences. The test also checked removal of a superseded cache without deleting its learner-preservation marker; actual SQLite preservation follows unchanged logout/cache code and service tests, not that marker alone.
- Conversion, browser parity, rollback, production writing smoke, viewport screenshots and keyboard checks passed as scoped above.
- One combined Jest process reported outstanding asynchronous handles after passing assertions. Follow-up bounded runs used `--forceExit`; this does not prove all test handles are cleaned up.

## J. Remaining limitations

1. Enable/verify anonymous auth in the hosted Supabase project and perform an authorized live code-only join. Local tests cannot establish hosted provider configuration or network behavior.
2. Live OTP delivery, password reset delivery and real hosted logout/join were not exercised. Visual fixtures never serve as evidence of those operations.
3. Resolve the existing story-layout assertions and story lint error separately; this task preserved those user edits.
4. Obtain an authoritative independent held-out handwriting dataset before making accuracy or confidence-calibration claims. The unchanged 0.80 threshold may warrant later calibration using that dataset.
5. Verify native assistive technology, physical devices and constrained-network cold loads. The larger ResNet artifact increases transfer/cache cost; warm inference results do not eliminate that tradeoff.

No credentials, RLS policies, curriculum, two-success mastery count or learner progress were removed or weakened. No new production dependency was added.
