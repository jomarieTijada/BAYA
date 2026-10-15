# BAYA handwriting mastery audit

Date: 2026-10-06 (Asia/Taipei)

BAYA now requires **three separately drawn, saved model evaluations whose Top-1 class is the target and whose raw probability is at least 0.80** before its Next handler advances. Invalid submissions preserve earned progress. The ONNX model, preprocessing, output probabilities, class ordering, runtime, curriculum, and database schema were not changed by this task.

## 1. Files inspected

- `apps/mobile/AGENTS.md` and its required Expo SDK 57 documentation.
- Writing UI: `WritingPracticeScreen.tsx`, `WritingCanvas.tsx`, `WritingNavigation.tsx`, `WritingToolbar.tsx`, `BayaWritingGuide.tsx`, `ConfidenceCard.tsx`, `recognitionPresentation.ts`, and writing layout/recognition tests.
- Content: `writingEngine.ts`, `writingRecognitionService.ts`, `writingLessonData.ts`, and writing-engine tests.
- ML: `writingRecognition.ts`, `efficientNetClassLabels.ts`, `bayaModel.ts`, `bayaModel.web.ts`, and `bayaModelConfig.ts`.
- Persistence: `database/services/localLearnerService.ts`, writing schema/migration definitions, and `database/__tests__/database.test.ts`.
- Routing/PWA: `app/learner/activities/[topicId].tsx`, learner/root layouts, `registerBayaPwa.ts`, and `generate-pwa-service-worker.mjs`.
- Existing browser test script `scripts/test-writing-recognition-cdp.mjs`, package scripts, and TypeScript/Jest configuration.

The workspace already contained unrelated uncommitted database, PWA, media, and debugging changes. They were preserved. Existing changes in the writing files were retained while adding this assessment work.

## 2. Files modified or added by this task

| File under `apps/mobile/` | Change |
| --- | --- |
| `content/writingMastery.ts` | New shared mastery policy, canonical comparison, output validation, count cap, model-attempt type |
| `content/writingCanvasValidation.ts` | New conservative capture validator and shared input limits |
| `content/writingEngine.ts` | Reuses the shared existing point/travel limits; legacy similarity algorithm unchanged |
| `components/learner/writing/WritingPracticeScreen.tsx` | Mastery, redraw requirement, inference/save guards, navigation and completion |
| `components/learner/writing/WritingCanvas.tsx` | Disabled input, bounded stroke starts, outside/nonfinite point handling, gesture reset |
| `components/learner/writing/WritingNavigation.tsx` | Separates checking eligibility from retry/back eligibility |
| `components/learner/writing/WritingMasteryIndicator.tsx` | New compact accessible progress indicator |
| `components/learner/writing/BayaWritingGuide.tsx` | Uses the same strict policy for success feedback/mascot |
| `components/learner/writing/recognitionPresentation.ts` | Removes rounding epsilon so sub-threshold confidence cannot display 80.0% |
| `database/services/localLearnerService.ts` | Stores actual model assessments using existing columns; retains legacy sample support |
| `content/__tests__/writingMastery.test.ts` | New policy tests |
| `content/__tests__/writingCanvasValidation.test.ts` | New input validation tests |
| `components/learner/writing/__tests__/WritingCanvas.test.tsx` | New actual responder/capture tests |
| `components/learner/writing/__tests__/WritingPracticeScreen.recognition.test.tsx` | Expanded screen, race, navigation, completion and viewport tests |
| `database/__tests__/database.test.ts` | Actual SQLite model-assessment storage assertions |

This report is `docs/writing-mastery-audit.md`. Temporary build, browser harness, screenshots and machine-readable results are under `sandbox/` and are not production source changes.

## 3. Behavior before the change

A saved local shape-similarity attempt plus any successful model response enabled Next. Neither the target match nor confidence controlled navigation. There was no three-success counter. The bubble treated any matching Top-1 label as success, including low confidence. A similarity estimate was saved concurrently with model inference, before the real model result existed.

## 4. Central policy

`BAYA_WRITING_MASTERY_POLICY` is frozen and defines `minConfidence: 0.80` and `requiredValidAttempts: 3`. Assessment, progress capping, screen guards, indicator and storage validation consume it. Canvas validation is separate.

## 5. Exact confidence comparison

`ranked[0].probability >= BAYA_WRITING_MASTERY_POLICY.minConfidence`

The comparison uses the unmodified numeric probability. 0.80 and 0.800001 pass; 0.799999 and 0.7996 fail. No display string participates. Display truncates to one decimal: 0.7996 shows 79.9%, never 80.0%. NaN, infinities, null/undefined, nonnumeric values, negative values and values above one fail output validation.

## 6. Exact Top-1 comparison

`ranked[0].classIndex === writingClassId(target)`

The ranked result must be descending, valid and nonempty. Every prediction's label must agree with its class index. Unknown or duplicate class IDs are rejected. Rank 2/3 cannot earn credit, even above 80%. Existing stable descending ranking is retained, including tie ordering; no target promotion or probability adjustment occurs.

## 7. Three-valid-attempt state

The current character has rendered count state plus a synchronous authoritative ref for handlers. A successful saved evaluation applies `min(requiredValidAttempts, count + (valid ? 1 : 0))`. Failures do not reset or increment it. Ordinary rerenders preserve the count; it never exceeds three. Session mastery history records completed characters so the topic-completion handler can require every character to have been mastered.

## 8. Next gating and boundaries

The actual handler checks authoritative mastery, current target, mounted state, inference/save locks, and completion state. Changing the disabled DOM/UI property does not bypass this check. Before moving to a non-final character it synchronously resets mastery, preventing two fast calls from skipping a character.

The final character uses the existing `completeTopic` path only when every character in that topic has been mastered in this activity session. An in-flight lock and completed flag prevent repeat completion calls. The existing database transaction/idempotency and prerequisite checks remain intact. No automatic navigation occurs on the third valid evaluation. A clear/resize during completion saving cannot strand the learner or redirect a different target.

## 9. Canvas validity found and added

Existing constraints were three points, normalized travel of 0.07, append spacing 0.002, normalized coordinates, and a 4,000-point cap. Capture uses a 256-square image and a pen width of 13/1000.

The new pre-inference validator requires a measured finite canvas, well-formed nonempty strokes, at most 4,000 total points, finite coordinates in [0,1], at least three meaningful points, and at least 0.07 travel. Extent must be at least the existing capture pen width (13/1000), preventing a repeated tiny dot from accumulating artificial travel. Provided timestamps must be finite, nonnegative, nondecreasing and span positive duration. Historical samples with no timestamps remain valid.

No speed cutoff or handwriting-shape heuristic was invented. Fast taps/short marks fail the geometry checks; meaningful fast strokes are not rejected just because they were drawn quickly. No image or sequence preprocessing was edited.

The canvas now rejects outside/nonfinite starts and stops a gesture when it leaves the region, instead of clamping outside movement into false edge ink. Stroke starts honor the point cap too. Duplicate moves do not create changes. Clearing resets the active gesture. Clearly invalid captures show the existing writing prompt, do not infer, do not save, and do not affect mastery.

## 10. Same-canvas protection

A submission consumes its canvas revision and locks the evaluated drawing until explicit Ulitin/clear. Adding a tiny stroke after a result cannot earn another point. Ulitin clears capture/result but preserves earned count. Old captured callbacks are rejected when their stroke or size snapshot no longer matches the current capture. The final result stays visible at 3/3.

Undo works normally before evaluation. After an evaluated drawing, undo clears the consumed capture rather than enabling reuse of part of an already-counted drawing.

## 11. Double-inference protection

A synchronous `checking` ref is set before the first asynchronous operation. Suriin is disabled during work and its handler also checks the lock. One accepted Suriin action invokes `recognizeWriting` once. Further checking is blocked at 3/3. Drawing events are ignored during inference and while the result needs a redraw.

## 12. Stale-result protection

Each request captures canvas generation and target identity. Before saving and before applying a result it verifies both and mounted state. Clear, undo, resize, target navigation or unmount invalidate the old capture. Route-topic changes remount transient activity state. A late result cannot replace Top-3, earn credit, or unlock another target.

If a valid model response was already handed to the database before a clear/navigation, its genuine original-target record may finish saving; it still cannot update current mastery or UI. In-flight SQLite transactions are not fabricated away or cancelled midway.

## 13. Canonical IDs

The existing `EFFICIENTNET_CLASS_LABELS` array remains authoritative. `writingClassId` normalizes case and slash display separators, then resolves the model output index. E/I, O/U, DA/RA, DE/DI and DO/DU map through this same lookup. Distinct actual model classes, such as `ra` and `da_ra`, are not collapsed. All current writing curriculum targets are tested against this mapping.

## 14. Persistence

In-progress mastery remains session-only, matching the existing reset-on-revisit behavior. Next and Back reset the selected character to 0/3; ordinary rerenders and Ulitin retain current earned count. Cross-topic Back preserves the existing previous-topic/last-character selection. Route remounts and PWA restarts do not restore partial counters. Existing persisted topic completions remain in SQLite. No global temporary-progress storage was added.

## 15. Database behavior

Only validated model responses are submitted to storage. The existing transaction stores target and strokes in `writing_attempts`, and Top-1 canonical label, exact confidence, `valid`/`invalid`, timestamp and feedback code in `activity_attempts`. Scoring method is `baya_model_v1`; legacy `visual_similarity_v1` callers still work. No schema migration was needed.

Invalid canvas, failed inference and malformed model output create no fake recognition record. Credit is applied only after the save succeeds. A save failure earns no progress, preserves earlier successes, and requires a fresh redraw. Recognition attempts are distinct from topic `completed` records; the existing completion deduplication remains unchanged. No XP award path was introduced.

## 16. Mobile/tablet/desktop verification

Browser screenshots and DOM measurements were taken at widths 360, 390, 430, 768, 1024, 1366 and 1440. The compact progress row, unchanged Top-3 layout and disabled Next fit at each width with no document horizontal overflow. Screenshots were visually inspected at phone, tablet and desktop sizes. The indicator combines filled/empty circles, a numeric count, and the accessible label `N of 3 valid attempts completed`.

Real ONNX inference on a mouse-drawn sample returned PA as Top-1 and A at rank 2 while A was required. The UI displayed Malapit na!, 0/3 and disabled Next. The temporary test server initially lacked the `.mjs` MIME type; fixing the test server resolved that failure without application/model changes.

A generated PWA cache was then tested with network disabled and a page reload. The application loaded and performed fresh inference offline, returning PA 36.5%, A 21.7%, GA 13.7% (display values), preserving 0/3 and disabled Next. These are real sample results, not injected probabilities. Timestamp variation between redraws can change probabilities because the existing sequence input includes time.

## 17. Tests added/updated

Coverage includes inclusive threshold boundaries; malformed output; wrong Top-1 and high-confidence rank 2/3; canonical aliases; honest stable ranking; capped accumulation; failure preservation; handler rejection at 0/1/2; unlock at 3; repeated captured handlers; fresh redraw; empty/tap/tiny input; normalized/outside/nonfinite coordinates; duplicate points; point caps; timestamp validity; disabled gestures; double checks; clear/undo/target/unmount races; invalidation during database save; cross-topic Back; all-character completion; last-topic completion once; responsive rendering; and real SQLite fields.

## 18. Test results and artifacts

- Full mobile suite: **38 suites passed, 362 tests passed, zero failed**. JSON: `sandbox/writing-mastery-tests.json`.
- TypeScript: `npx tsc --noEmit -p apps/mobile/tsconfig.json` passed.
- Targeted ESLint on changed production assessment files passed.
- Production Expo web export and temporary PWA manifest generation passed.
- `git diff --check` for task changes passed.
- Browser online inference, seven-width layout checks and offline reload/inference passed. Artifacts: `sandbox/writing-mastery-ui/checks.json`, `offline.json`, and `width-*.png`; harness: `sandbox/check-writing-mastery-ui.mjs`.
- Final screen suite: **41 tests passed** after the completion-save race guard adjustment; its result is recorded in `sandbox/writing-mastery-final-screen-tests.json`.

Jest reports existing asynchronous React act warnings and retained handles; full-suite runs used `--forceExit` after tests completed. The export reports the existing Expo SQLite subpath fallback warning. These were not test failures. Windows sandbox realpath restrictions required authorized test execution outside the sandbox.

## 19. Limits and unresolved edge cases

No known failing assessment-control case remains from the tested scenarios. Confidence guarantees concern the actual raw model result, not recognition accuracy. The live browser check exercised a failing real drawing; successful three-check progression is proven by deterministic component tests, not by manufacturing confident model output.

Physical touch devices and audible audio playback were not manually tested. Existing media/reference tests passed. Native ONNX recognition remains unsupported by the existing native adapter; this work verifies the supported web/PWA runtime.

This is a local offline application. Handler guards protect against disabled-button bypass and ordinary UI-state manipulation, but arbitrary JavaScript execution or direct database tampering cannot be made tamper-proof with client-only state. No server attestation or persistence architecture was invented.

