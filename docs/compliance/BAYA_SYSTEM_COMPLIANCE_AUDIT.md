# BAYA System Compliance Matrix Implementation Audit

Audit concluded **9 November 2026 (Asia/Taipei)**; verification began 8 November. Basis: the updated October 30, 2026 matrix and the user's supplied audit criteria. This is an audit, not implementation. Application source, UI, models, thresholds, configuration and schemas were not changed.

## A. Executive Summary

| Measure | Result |
|---|---:|
| Recommendations audited | **9** |
| COMPLETED | **5** |
| PARTIALLY COMPLETED | **1** |
| NOT IMPLEMENTED | **2** |
| UNVERIFIED | **1** |
| Overall completion | **5 / 9 × 100 = 55.56%** |

**Nos. 3, 4 and 11 are excluded** from findings, recommendations and calculations. Introduction/history was inspected solely for included No. 12.

The active PWA demonstrates bilingual settings, a mascot introduction, learner-visible Top-1 recognition, local activity resume, and brief Baybayin history. The requested Baybayin YA glyph is absent from active branding; stars remain the handwriting scoring system. The mentor table has substantial active implementation and controlled tests, but its live hosted synchronization round-trip remains unverified. The incorrect-confidence investigation is complete, while invalid-wave mastery remains reproducible.

Current checks passed **29 Jest suites / 288 tests**, TypeScript, lint, a fresh Expo export, browser scenarios and isolated SQL tests. [Source preservation](evidence/source-preservation.json) confirms **1,391 checked source/configuration/SQL/model/image files unchanged**. Only this report and optional audit evidence under `docs/compliance/evidence/` were created or edited. Build/dependency caches are excluded from the hash comparison.

### Interpretation and evidence boundaries

- Current runtime means the fresh export served locally on port 5093 in isolated Chrome, not the user's browser/profile/database.
- Controlled browser fixtures exercise production UI but inject test services or outputs. They do not prove hosted authorization, real learner synchronization or model accuracy.
- PGlite tests execute repository SQL against inserted test records with simulated auth roles; they are not hosted Supabase tests.
- Historical reports are corroboration, not automatic completion. Earlier handwriting **No. 12 corresponds to current No. 10**; earlier mentor-table **No. 9 corresponds to current No. 8**.
- COMPLETED describes the specified functionality within the demonstrated web scope, not every-device, linguistic or educational certification. Broader acceptance conditions in older development briefs are not silently imported into this matrix.

## B. Compliance Status Matrix

| No. | Recommendation | Status | Evidence | Remaining Work |
|---|---|---|---|---|
| 1 | Tagalog and English language support | **COMPLETED** | Root localization provider, Settings selector, SQLite preference; current bilingual navigation/reload/restart checks | No demonstrated functional blocker; educational proofreading and broader platform coverage remain advisable |
| 2 | Introduce the mascot | **COMPLETED** | Welcome → `MascotOrigin`, explicit name/purpose; 84 bilingual/responsive captures | None for the narrow recommendation; documentary photo permission is a separate enhancement |
| 5 | Add Baybayin YA to logo | **NOT IMPLEMENTED** | `BayaLogo` renders Latin B/A/Y/A; active wordmark/mascot visually compared with YA reference | Add approved YA element and verify active variants |
| 6 | Reveal only Top-1 prediction | **COMPLETED** | Ranked inference → single presentation object → one prediction row; actual browser output | None for learner-visible Top-1 |
| 7 | Back navigation and resume | **COMPLETED** | Profile/topic checkpoints; actual back/forward/reload/offline/profile tests and full Chrome restart | No demonstrated blocker in tested Chromium flows; other devices/engines remain untested |
| 8 | Mentor results summary table | **UNVERIFIED** | Active table/RPC chain, controlled browser scenarios, 30 + 41 isolated SQL checks | Verify real authorized learner save→sync→mentor display/refresh on hosted Supabase |
| 9 | Replace stars with points | **NOT IMPLEMENTED** | Active two-star mastery and Next gating; home EXP uses demo defaults | Implement defined persistent, duplicate-safe point awards and replace scoring-star presentation |
| 10 | Investigate high-confidence incorrect handwriting | **PARTIALLY COMPLETED** | Operational dual models, completed investigation; actual wave still earns two HA stars | Independent validity validation and approved acceptance policy needed for prevention |
| 12 | BAYA introduction and Baybayin history | **COMPLETED** | Welcome explanation plus reachable bilingual history paragraph | No demonstrated content-availability/navigation blocker; classroom comprehension not assessed |

## C. Detailed Findings

### No. 1 — Tagalog and English

1. **Expected:** Functional Settings selection, translated instructions/feedback and preference persistence.
2. **Implementation:** `app/_layout.tsx` mounts `LocalizationProvider`. Learner and mentor Settings include `LanguageSelector`. `createLanguageStorage` reads/writes `interface_language` in SQLite `local_app_state`. Writes are serialized; restoration precedes rendering. Context updates preserve activity state. `core.ts` handles typed keys, templates and source-text compatibility. Unrecognized phrases fall back unchanged.
3. **Sources:** [provider](../../apps/mobile/localization/LocalizationProvider.tsx), [storage](../../apps/mobile/localization/storage.ts), [core](../../apps/mobile/localization/core.ts), [learner Settings](../../apps/mobile/components/learner/settings/SettingsScreen.tsx), [mentor Settings](../../apps/mobile/app/mentor/settings.tsx), `en.ts`, `tl.ts`, `messages.ts`, `education.ts`.
4. **Evidence:** Localization tests passed. Current [Settings English](evidence/settings-en.png)/[Tagalog](evidence/settings-tl.png), [locale/history observations](evidence/locale-history.json), bilingual mascot/recognition checks and [full Chrome restart](evidence/restart.json) demonstrate translated text and persistence.
5. **Limitations:** Preference is device-wide, not account-synced. Educational translations carry `pending-subject-matter-review`; exhaustive linguistic approval and all authenticated error states were not verified. User data, character labels and external content intentionally remain unchanged. No functional localization defect was demonstrated in sampled flows. The older report's broader educational-approval condition does not negate demonstrated functional language support under this matrix.
6. **Decision:** **COMPLETED**.
7. **Minimum work:** No demonstrated correction required. Proofread educational text and extend coverage as quality assurance, without treating untested strings as proven defects.

### No. 2 — Mascot introduction

1. **Expected:** Welcome communicates the mascot's name and purpose, with readable child-oriented presentation and working artwork.
2. **Implementation:** `app/index.tsx` renders `LandingHero`, including a visible story teaser and MEET BAYANI action. `MascotOrigin` presents four steps, distinguishing the real eagle inspiration from the fictional BAYA companion. The final step explicitly introduces BAYA and explains discovering characters, writing and lessons.
3. **Sources:** [LandingHero](../../apps/mobile/components/landing/LandingHero.tsx), [MascotOrigin](../../apps/mobile/components/landing/MascotOrigin.tsx), [originStoryContent](../../apps/mobile/components/landing/originStoryContent.ts), localization resources, `branding/BayaMascot.tsx` and `branding/baya/animationAssets.ts`.
4. **Evidence:** Current [browser report](evidence/mascot/browser-report.json): **84 screenshots and 23 checks**, both languages and five viewport sizes, dismissal/Escape/focus return, offline story and local mascot. [Welcome](evidence/mascot/en-welcome-1366x768.png) and [compact final introduction](evidence/mascot/en-baya-844x390.png) were visually inspected. The compact dialog scrolls to remaining content/actions. Landing/mascot tests passed.
5. **Limitations:** The documentary Bayani photograph awaits authorization, and educational wording has no claimed expert certification. The fictional mascot artwork loads. A photograph is not required by the narrow recommendation to introduce the mascot.
6. **Decision:** **COMPLETED**.
7. **Minimum work:** None for this recommendation; do not confuse an optional documentary-photo enhancement with an absent introduction.

### No. 5 — Baybayin YA in the logo

1. **Expected:** Baybayin YA **ᜌ**, explicitly confirmed by the user during this audit, appears in active branding.
2. **Implementation:** `BayaLogo` uses colored Latin letters B/A/Y/A. Both Welcome layout branches use this component. It contains no YA glyph node/image. The current mascot's circular hat emblem does not match the supplied YA teaching glyph. Latin YA in the word BAYA does not satisfy the clarified request.
3. **Sources/assets:** [BayaLogo](../../apps/mobile/components/branding/BayaLogo.tsx), `LandingHero.tsx`, `animationAssets.ts`, active `assets/branding/baya/idle/frame-000.png` and wave frames. Comparison: [YA reference](../../apps/mobile/assets/illustrations/baybayin/guides-1024/ya.png).
4. **Evidence:** Current [Welcome render](evidence/mascot/en-welcome-1366x768.png), caller searches and direct visual inspection of active mascot art and YA. The teaching glyph exists but is not incorporated into the logo. No alternative active YA-containing wordmark was found.
5. **Limitations:** External/unused design files are not proof of shipped behavior. The conclusion concerns active application branding.
6. **Decision:** **NOT IMPLEMENTED**.
7. **Minimum work:** Add an approved YA element to canonical branding and verify compact/desktop renders and any intended icon/mascot variants. No branding was changed in this audit.

### No. 6 — Top-1 only

1. **Expected:** Only the highest-scoring character and its associated confidence are learner-visible.
2. **Implementation:** The current character model outputs 63 probabilities. `recognizeWriting` ranks indices; `rankPredictions` and `assessRecognition` select Top-1. `presentTopPrediction` creates one display object. `WritingPracticeScreen` renders a single `RecognitionMatchRow` with the corresponding glyph and probability. Uncertain/error outcomes do not show alternative guesses. Both writing topic routes share this screen.
3. **Sources:** [writingRecognition](../../apps/mobile/ml/writingRecognition.ts), [recognitionReliability](../../apps/mobile/ml/recognitionReliability.ts), [recognitionPresentation](../../apps/mobile/components/learner/writing/recognitionPresentation.ts), [WritingPracticeScreen](../../apps/mobile/components/learner/writing/WritingPracticeScreen.tsx), `RecognitionMatchRow.tsx`.
4. **Evidence:** Model/presentation/UI tests passed. Current [controlled UI report](evidence/recognition/browser-report.json) checks at most one prediction row; [actual ONNX UI](evidence/recognition/real-ui.json) demonstrates real predictions. [Browser parity](evidence/parity/browser-parity.json) matches 16/16 reference Top-1 outputs. Internal top-three diagnostics are not competing learner UI predictions.
5. **Limitations:** Correctly showing Top-1 does not imply the prediction or handwriting is correct; No. 10 covers that distinction.
6. **Decision:** **COMPLETED**.
7. **Minimum work:** None for learner-visible Top-1.

### No. 7 — Back navigation and resume

1. **Expected:** Relevant state survives back/return/reload/restart without replaying recognition, duplicating progress or crossing profile boundaries.
2. **Implementation:** The activity route wraps screens in `ActivityResumeBoundary`. `activityResumeService` persists versioned profile/topic checkpoints, serializes saves/clears and checks ownership. Drafts retain strokes, target and submitted state. Mastery comes from saved valid attempts rather than editable checkpoint counts. Completion is idempotent. `useDialogBack` handles the topmost dialog before route traversal when cancellation is supported. Home Continue uses the checkpoint.
3. **Sources:** [ActivityResumeBoundary](../../apps/mobile/modules/resume/ActivityResumeBoundary.tsx), [activityResumeService](../../apps/mobile/database/services/activityResumeService.ts), [useDialogBack](../../apps/mobile/hooks/useDialogBack.ts), `modules/resume/checkpoint.ts`, `database/services/localLearnerService.ts`, learner Home and activity routes.
4. **Evidence:** Current [resume report](evidence/resume/browser.json): **32 checks / 24 screenshots**; exact geometry after reload/Settings back, browser Back/Forward, Continue context, dialog Back/Escape, profile isolation, clear/reload and offline restore. Draft restoration leaves attempt rows unchanged. [Full Chrome close/relaunch](evidence/restart.json) restores saved Tagalog and exact stroke paths. Resume/SQLite tests passed.
5. **Limitations:** Draft checkpoints intentionally remain device-local; cloud snapshots carry completed topics. OS-installed PWA launch and other engines were not tested. Older/non-cancellable browser traversal cannot universally be intercepted. Save failures have explicit feedback. Attempt counts were checked on reload/offline but not independently rechecked after full process restart.
6. **Decision:** **COMPLETED** in the documented/tested web scope.
7. **Minimum work:** No reproduced correction required. Additional engine/device QA remains appropriate.

### No. 8 — Mentor summary table

1. **Expected:** Authorized mentors view meaningful saved results scoped to the correct workspace, with consistent sync/refresh and empty/loading/error states.
2. **Implementation:** The workspace route renders `MentorDashboard` inside `MentorBoundary`. `ResultsSummaryTable` contains learner/current topic, completed-topic fraction, percentage, last synchronization and details. `createProgressServices.dashboard` calls the workspace-scoped RPC and validates identity/counts/uniqueness. `readProgressSnapshot` groups completed local topic attempts. SQL checks ownership/active membership and duplicate-safe completion. `useCloudRead` clears stale cross-workspace/unauthorized data. This is active implementation, not an unused component.
3. **Sources:** [MentorDashboard](../../apps/mobile/components/progress/MentorDashboard.tsx), [ResultsSummaryTable](../../apps/mobile/components/progress/ResultsSummaryTable.tsx), [supabaseProgress](../../apps/mobile/modules/progress/supabaseProgress.ts), [localProgressSnapshot](../../apps/mobile/modules/progress/localProgressSnapshot.ts), `useCloudRead.ts`, `supabase/migrations/202610210002_learning_progress.sql`.
4. **Evidence:** Current [table report](evidence/mentor-table/browser.json): **26 checks / 17 screenshots**, both languages/five viewports, keyboard horizontal scroll, zero versus missing, authorization/network/loading/empty scenarios and workspace switching. [Inspected screenshot](evidence/mentor-table/table-en-1366x768.png) explicitly uses Fixture Workspace A. Isolated SQL passed **30 progress assertions + 41 approval/security checks** using saved test records; component/adapter tests passed.
5. **Limitations:** Browser auth/services are fixtures. PGlite simulates roles; no real learner-device save→hosted Supabase sync→authorized mentor display round-trip was executed. Deployed RLS/migrations, hosted session refresh and actual synchronized learner-data correspondence remain unverified. No implementation defect was demonstrated.
6. **Decision:** **UNVERIFIED** for full required end-to-end behavior; active implementation and local tests are confirmed. Mocks are not represented as live proof.
7. **Minimum work:** Verify known saved completions with authorized staging learner/mentor accounts, refresh/relogin and another workspace/unauthorized account. Change code only if that verification reproduces a defect.

### No. 9 — Points instead of stars

1. **Expected:** Defined, persisted, duplicate-safe points replace scoring stars and survive restart/sync.
2. **Implementation:** `REQUIRED_SUCCESSFUL_TRIALS = 2`, `nextValidCount`, `WritingMasteryIndicator` and `WritingMilestoneBadge` still award/display stars and gate Next. These are scoring indicators, not decorative stars. Home `XpProgress` displays EXP, but `buildLearnerHomeModel` inherits XP defaults from `learnerHomeDemo` while updating the name/curriculum presentation. No active point-award ledger/rule was found in the inspected persistence/sync path. Achievements remains a placeholder.
3. **Sources:** [writingMastery](../../apps/mobile/content/writingMastery.ts), [WritingMasteryIndicator](../../apps/mobile/components/learner/writing/WritingMasteryIndicator.tsx), `WritingMilestoneBadge.tsx`, [learnerHomeModel](../../apps/mobile/components/learner/home/learnerHomeModel.ts), `learnerHomeDemo.ts`, `XpProgress.tsx`, [achievements route](../../apps/mobile/app/learner/achievements.tsx).
4. **Evidence:** Current [two-star result](evidence/recognition/real-wave-ha-unresolved-second.png) enables Next; tests assert star progression. Existing saved attempts restore star counts. No actual reward-point persistence was demonstrated. Coordinate `points` fields are unrelated to rewards.
5. **Limitations:** Existing star persistence or an EXP label does not establish the requested replacement point system.
6. **Decision:** **NOT IMPLEMENTED**.
7. **Minimum work:** Agree points/eligibility, implement idempotent persisted awards, update reward UI, define existing-progress compatibility and verify restart/sync. No policy or schema was changed here.

### No. 10 — High-confidence incorrect handwriting

1. **Expected:** Investigate confidence and operational safeguards, and distinguish completed investigation from eliminated invalid-input mastery.
2. **Implementation:** `bayaModel.web.ts` uses cached WASM sessions and validated tensor/output contracts for character softmax and validity sigmoid models. Sufficiency checks reject malformed/insufficient capture. `assessRecognition`/`canAwardWritingMastery` separate recognized, uncertain, rejected and failed decisions from target matching. The historical 0.80 rule is not calibrated input validity. The research validity gate is default-off and production-disabled; development review/reject becomes uncertainty before recording/mastery.
3. **Sources:** [bayaModel.web](../../apps/mobile/ml/bayaModel.web.ts), [validityDetector](../../apps/mobile/ml/validityDetector.ts), [recognitionReliability](../../apps/mobile/ml/recognitionReliability.ts), [writingCanvasValidation](../../apps/mobile/content/writingCanvasValidation.ts), `WritingPracticeScreen.tsx`; [previous investigation](../COMPLIANCE-12-FINAL-VERIFICATION.md), numbered 12 in the older matrix.
4. **Evidence:** Current two-model browser parity passes for 16 inputs, with session reuse and production lockout. Actual exported UI again gives **two HA stars and Next** for two wave drawings, about **98.8%** confidence; direct capture gives **0.987332046** HA. Prior diagnostic validity on unchanged model hashes is **0.000163257**, a research reject. Current rejected/uncertain/error UI fixtures add no mastery or attempt; high-confidence wrong-target input records an unsuccessful attempt without a star. See [current real UI](evidence/recognition/real-ui.json), [parity](evidence/parity/browser-parity.json), [qualified prior diagnostics](../verification/compliance-12/validation/diagnostic/results.json).
5. **Limitations:** Detecting this wave experimentally is not reliable production validation. Earlier reference-art diagnostics withheld 9/63 glyphs, and a supplied CSV records an unreviewed synthetic scribble passing validity at 0.9959747. Independent reviewed real calibration/holdout data are absent. Real-world false-rejection/false-mastery rates cannot be certified.
6. **Decision:** **PARTIALLY COMPLETED** overall: **investigation completed; false-mastery prevention not completed**.
7. **Minimum work:** Obtain representative independently labeled data, agree error criteria, evaluate/calibrate separately from untouched holdout, and approve gating only on evidence. Retraining is conditional, not automatically required. Do not invent a higher cutoff.

### No. 12 — BAYA introduction and Baybayin history

1. **Expected:** Reachable BAYA explanation and brief understandable Baybayin history, not only an Introduction title.
2. **Implementation:** Welcome's story explains BAYA's name and learning role. The first history activity uses `StorybookTopicScreen`, `getApprovedStorybookActivity` and `baybayinHistoryContent`. The actual paragraph explains ancient Philippine writing, early Tagalog association and cultural heritage. Normal continuation from the invitation reaches content; saved state can resume directly there.
3. **Sources:** `LandingHero.tsx`, `MascotOrigin.tsx`, [baybayinIntroduction](../../apps/mobile/content/baybayinIntroduction.ts), `approvedStorybook.ts`, [StorybookTopicScreen](../../apps/mobile/components/learner/story/StorybookTopicScreen.tsx), activity route.
4. **Evidence:** Current [bilingual history observations](evidence/locale-history.json), [English compact](evidence/history-en-844.png) and [Tagalog desktop](evidence/history-tl-1366.png) screenshots; four observations at 844×390/1366×768 with no page overflow. Welcome explanation is verified under No. 2. Introductory-data tests passed. No verdict was made about other module-content recommendations.
5. **Limitations:** No Grade-3 comprehension study or independent educational approval was performed. The short readable paragraph is a presentation observation, not educational certification. An initial audit probe incorrectly required visible NCCA attribution; the history paragraph itself was present. The probe was corrected without changing content.
6. **Decision:** **COMPLETED** for the included availability/reachability/brief-content requirement.
7. **Minimum work:** No demonstrated functional correction required.

## D. Testing Summary

Commands ran from repository root unless noted. Audit browser scripts are copies of existing verifiers with isolated ports/output paths; instrumentation is not application code. Fresh tests do not mutate real hosted accounts.

### Passed

| Command/check | Actual result |
|---|---|
| Scoped `npm test --workspace apps/mobile -- --runInBand --forceExit --silent ...` | **29 suites / 288 tests**, 0 failed; exact arguments in [Jest log](evidence/jest.log) |
| `npx tsc --noEmit --project apps/mobile/tsconfig.json` | Exit 0; [log](evidence/typescript.log) |
| `npm run lint --workspace apps/mobile -- --no-cache` | Exit 0; [log](evidence/lint.log) |
| From `apps/mobile`: `npx expo export --platform web --output-dir ../../docs/compliance/evidence/web-export` | Fresh export passed; [log](evidence/export.log) |
| `node apps/mobile/scripts/generate-pwa-service-worker.mjs`, with `BAYA_WEB_OUTPUT_DIR` set to the audit export directory | 167 cached assets; [log](evidence/pwa.log) |
| `node scripts/test-cloud-progress.mjs` | **30** isolated SQL assertions; [log](evidence/sql-progress.log) |
| `node scripts/test-workspace-approval.mjs` | **41** database/security checks; [log](evidence/sql-approval.log) |
| `node docs/compliance/evidence/mascot.mjs` | 84 captures, 23 checks, no reported errors |
| `node docs/compliance/evidence/resume.mjs` — English-baseline rerun | 32 checks, 24 captures, including local ownership and offline restore |
| `node docs/compliance/evidence/locale-history.mjs` — corrected content assertion | Bilingual selection/navigation/reload and four history layout observations |
| `node docs/compliance/evidence/recognition-fixtures.mjs` | Seven captures, single prediction and expected persistence barriers |
| `node docs/compliance/evidence/recognition-real.mjs` | Seven captures; wave false mastery reproduced, dot/retry/offline/reload checks |
| `node docs/compliance/evidence/restart-final.mjs` | Full Chrome close/relaunch restores selected Tagalog and exact drawing geometry |
| `node docs/compliance/evidence/mentor-table.mjs` | 26 checks, 17 captures; services explicitly fixtures |
| `node docs/compliance/evidence/parity.mjs` | Both actual models run; 16/16 Top-1 parity, exact preprocessing, output differences below 1e-5, session reuse |
| Source/asset hash comparison | **1,391 unchanged files**; [record](evidence/source-preservation.json) |

Jest's existing forced-exit/open-handle advisory remains; passing assertions are not whole-app leak certification. The scoped test run avoids a blanket verdict on excluded recommendations.

### Failed or corrected audit probes

- Resume initially expected English Settings after a Tagalog run. Drawing reload had passed; its selector failed. English-baseline rerun passed. [Initial log](evidence/resume-initial-language-mismatch.log).
- History initially waited for a visible NCCA label, while the requested paragraph was already present. The content-based bilingual rerun passed. [Initial log](evidence/history-source-label-assumption.log). This is not a passing source-attribution assertion.
- Early restart probes failed to discover the private database module after relaunch; another assumed a previous locale after intervening tests. The final probe explicitly selected/saved Tagalog and captured current paths before closing Chrome, then successfully compared a fresh process. Earlier logs are retained. Post-process-restart database counts remain unverified; reload/offline counts were verified.
- The semantic requirement that the invalid wave cannot earn mastery **fails** in current production behavior. A successful reproduction script is not successful invalid-input prevention.

### Skipped / unable to verify

- Hosted Supabase learner/mentor save→sync→table correspondence, deployed authorization and hosted session refresh: no authorized live test accounts used (No. 8).
- Independent real-handwriting validation and population error rates: required labeled data unavailable (No. 10).
- Physical mobile devices, other engines, OS-installed PWA launch and native assistive technology were not tested. Desktop Chrome process restart was tested.
- Educational/linguistic expert approval and Grade-3 comprehension were not established.
- Nos. 3, 4 and 11 were excluded, not failed, and contribute nothing to counts.

## E. Outstanding Compliance Items

Only included recommendations that are not COMPLETED appear below.

| No. | Exact issue / affected files | Minimum correction or next verification | Complexity | Can proceed without retraining, external services or additional research data? |
|---|---|---|---|---|
| 5 | YA absent; `BayaLogo.tsx`, `LandingHero.tsx`, canonical branding assets | Add approved YA element once to canonical branding; inspect compact/desktop variants | **Low** | Yes; design placement approval needed, no model/service/data dependency |
| 8 | Hosted end-to-end behavior unverified; `MentorDashboard`, `ResultsSummaryTable`, `supabaseProgress`, deployed progress SQL | Verify known learner completions through real authorized staging sync, refresh and workspace isolation; change code only if a defect is reproduced | **Medium** | No model/research-data dependency; needs hosted service and authorized test accounts |
| 9 | Active star scoring, no persisted replacement points; writing mastery/UI, home EXP/model, persistence/sync contracts | Define awards, persist idempotently, replace scoring-star presentation, preserve existing progress and test restart/sync | **Medium** | Local implementation needs no model/research data or service; hosted synchronization verification needs test access |
| 10 | Invalid wave earns production mastery; validity safety unestablished; detector/policy/UI/evaluation artifacts | Collect reviewed writer-disjoint calibration/holdout captures, evaluate error tradeoffs and approve a policy before enabling rejection | **High** | Additional research data required. Retraining only if existing model/calibration cannot meet agreed criteria |

## F. Recommended Implementation Order

1. **No. 5 — YA branding:** smallest scoped change, visible compliance gain, low regression risk. Confirm placement and inspect all intended active variants.
2. **No. 8 — Hosted verification:** implementation/local evidence already exist. An authorized staging test may close the item without rewriting the table. If accounts/service access are unavailable, move to No. 9 rather than blocking progress.
3. **No. 9 — Actual point system:** define the rule before coding, then address UI and idempotent persistence coherently. Do not substitute an icon change or silently change handwriting acceptance policy.
4. **No. 10 — Evidence-driven acceptance:** start data collection in parallel, but retain production rejection lockout until validation supports it. This cannot honestly be closed by a shape exception or another unvalidated threshold.

## G. Final Summary

- Fully implemented within tested scope: **1, 2, 6, 7, 12**.
- Partially implemented: **10** — investigation complete, false mastery unresolved.
- Absent requested behavior: **5, 9**.
- Requires further end-to-end verification: **8**, despite substantial active implementation and controlled/local passes.
- Fastest remaining actions: YA branding, hosted verification of the existing table, then a defined persisted point system.

**Completion: 55.56% (5/9).** Partial credit and excluded recommendations are not included in the numerator. Application functionality and existing research artifacts were preserved; implementation, demonstrated effectiveness and unverified integration are reported separately.
