# Character Level slide UX correction

Date: 2026-11-21 (Asia/Taipei)

## Root cause and correction

The previous QuestionScreen lived inside the hub's ScrollView. Its instruction banner, prompt, options, submit button and appended feedback panel all contributed to the document's height. Although only one question existed in state, its presentation behaved like a long form. Activity 4 reused WritingCanvas and RecognitionMatchRow but composed a separate surrounding interface, rather than using the actual lesson screen.

Questions now leave the hub's scrolling container. Activities 1–3 render AssessmentSlide inside the bounded LearnerAppShell content area. A compact header, progress region, central question region and persistent action region form one stage. Submission replaces instruction guidance with compact feedback; it does not append another panel. Continue replaces the keyed question instance and moves keyboard focus to its accessible question context. The original submission lock, service calls and saved-response handling remain authoritative.

The central region supports internal scrolling for exceptional height/text conditions. At the nine requested ordinary viewports, the browser matrix explicitly checks zero internal scrolling, one question, all three options inside the content bounds, targets at least 44px high, and the CTA inside the viewport. Short landscape screens place guidance and the prompt beside choices. The 320×300 stress case deliberately permits internal overflow while retaining the action region.

## Actual canonical writing screen

Route: `/learner/activities/[topicId]`, with `topic-3-1` and `topic-3-2` dispatched directly to WritingPracticeScreen. The canonical screen is not ActivityRenderer's generic writing card.

WritingPracticeScreen's original presentation and styles were extracted into **WritingPracticeLayout**. Both the lesson adapter and WritingActivityPresentation render this one implementation. The old independent word-card/canvas composition and LearningSpread were removed from Character Level.

The shared implementation owns:

- CharacterReferenceCard, including the approved reference glyph and recorded-pronunciation control.
- getWritingLayout: three columns at desktop/landscape widths, two at tablet widths, one stacked column on narrow portrait screens.
- The original card sizes, padding, column proportions and measured available-height logic.
- WritingInstructions and WritingToolbar with the existing undo/clear controls.
- WritingCanvas with the original compact/dense/fillHeight sizing and getBaybayinTracingGuide reference assistance.
- ConfidenceCard, BayaWritingGuide and RecognitionMatchRow, including authentic prediction/confidence presentation.
- The existing WritingNavigation component in the original action region.

The lesson adapter retains its state, mastery, lesson persistence, safe drawing-version checks, retry, next-character navigation and topic completion callbacks. Its inference/persistence/progression callback block is unchanged in normalized source comparison. Before/after screenshots show the same reference, canvas and feedback layout; mascot animation frames can differ.

The activity adapter supplies the exact word and underlined syllable, expected target, question progress, existing assessment inference/service state and Continue callback. It does not invoke lesson completion or award lesson stars. Optional instruction/action labels and contextual help let the same components describe assessment behavior without changing lesson defaults. The reference label uses traditional combined-character mapping. Recorded pronunciation resolution remains unchanged.

The lesson's existing reference and tracing guide are now present in Activity 4, as explicitly requested in this correction. This is a visible assistance change from the rejected freehand-only activity composition, not a model, target or scoring change. The activity-type label was adjusted from “Freehand writing” to “Character writing” to describe that interface accurately.

## Results and other states

SetResultStage is a dedicated summary with score, practice count, saved status, deferred count where applicable, and persistent Next Set/Retry/Activity Results actions. Answer-by-answer details and attempt history are expandable. ActivityFinishStage replaces the set picker when all five sets have been reviewed; Review returns to the set picker. Pending listening prompts produce “Activity reviewed” with 23 scored and two unscored items, not a misleading full-completion claim. No mastery claim is introduced.

Baya is a static 40px companion on quiz slides. Feedback reuses the same region. Milestones retain the larger existing helper. Listening controls remain compact, preserve real playback/replay and errors, and reveal no pronunciation cue before submission. Missing approved audio remains explicitly unscored.

## Regression safety

All 100 source questions, IDs, order, options, keys, underlines and expected glyphs are unchanged. SHA-256 comparisons cover questions.json, its index, assessment rules, SQLite activity service, pronunciation mapping and writingRecognition. Evidence: `invariant-checks.json`.

No recordings, models, preprocessing, persistence schema, routes or learner progress were replaced or reset. Browser tests use isolated QA profiles. Assessment results continue to use the same local-only SQLite service. Original lesson callbacks still use the original localLearnerService and mastery policy.

## Verification

- Full Jest suite: 84 suites, 951 tests passed, including writing recognition/controller, canvas, persistence and Character Level tests. Two additional component tests cover canonical presentation reuse and checked slide/advance behavior.
- TypeScript, Expo lint and production web export passed.
- Main browser run traverses all 100 source questions, with 98 scored and two deferred; all 25 writing submissions use actual pointer strokes and the real LiteRT runtime. Synthetic strokes verify integration, not handwriting-model accuracy.
- English and Tagalog matrix covers all three quiz types in initial/correct/incorrect states plus DE/RE initial/feedback states at 320×568, 360×800, 390×844, 430×932, 768×1024, 844×390, 1024×768, 1280×800 and 1440×900.
- Browser regression covers exact next-question focus, checked ARIA state, retained responses, dedicated results, lesson navigation, reduced motion, language persistence and no duplicate score on reload.
- Offline verification uses Chromium network disconnection after service-worker preparation, with the HTTP cache disabled. It exercises audio, complete listening/writing sets, real inference and SQLite restoration.
- Original lesson browser regression verifies reference, tracing, undo, real prediction/confidence and retry. An initial harness timeout came from submitting before React had applied the final pointer event; waiting for the enabled control corrected the test. No application workaround was needed.

Early verification found a 23px landscape overflow; moving guidance beside choices resolved it. An old test's removed Clear/Retry selector was updated to the canonical clear control. Final machine-readable run results are stored with the evidence; physical devices and screen-reader listening tests were not executed.

### Final run status

| Status | Result |
| --- | --- |
| Passed | 84 Jest suites / 951 tests; TypeScript; lint; production export |
| Passed | 44 main browser checks; 13 offline restart/writing viewport checks |
| Passed | 237 layout/lesson checks, including 234 language/state/viewport combinations; 2 standalone lesson checks |
| Failed | None in final runs |
| Blocked | No implementation checks; two listening items retain their separate content-validation hold |
| Not executed | Physical-device/native builds, real stylus hardware, screen-reader listening audit |

Machine-readable results: `browser-results.json`, `restart-results.json`, `layout-results.json`, `lesson-results.json`, and `invariant-checks.json`. The final full suite was rerun after the landscape and compact pending-audio adjustments.

## Visual evidence and comparison

All evidence for this correction is in `docs/verification/character-level/slide-correction/`. The `before-*` captures were taken before this correction; new captures are not reused from the prior refinement report.

[Open the side-by-side visual comparison](../verification/character-level/slide-correction/comparison.html).

| Evidence | File |
| --- | --- |
| Original scrolling quiz | [before-Latin-to-Baybayin.png](../verification/character-level/slide-correction/before-Latin-to-Baybayin.png) |
| Desktop assessment slide | [en-activity-2-initial-1280x800.png](../verification/character-level/slide-correction/en-activity-2-initial-1280x800.png) |
| Mobile listening slide | [en-activity-1-initial-320x568.png](../verification/character-level/slide-correction/en-activity-1-initial-320x568.png) |
| Landscape correct feedback | [en-activity-1-correct-844x390.png](../verification/character-level/slide-correction/en-activity-1-correct-844x390.png) |
| Tagalog incorrect feedback | [tl-activity-3-incorrect-390x844.png](../verification/character-level/slide-correction/tl-activity-3-incorrect-390x844.png) |
| Pending audio feedback | [tl-pending-RE-feedback-320x568.png](../verification/character-level/slide-correction/tl-pending-RE-feedback-320x568.png) |
| Original canonical lesson | [before-lesson-writing.png](../verification/character-level/slide-correction/before-lesson-writing.png) |
| Same lesson after extraction | [after-lesson-writing.png](../verification/character-level/slide-correction/after-lesson-writing.png) |
| Activity using canonical layout | [writing-question.png](../verification/character-level/slide-correction/writing-question.png) |
| Real activity recognition | [writing-real-inference.png](../verification/character-level/slide-correction/writing-real-inference.png) |
| Real lesson recognition | [lesson-real-inference.png](../verification/character-level/slide-correction/lesson-real-inference.png) |
| Dedicated set result | [activity-2-set-result.png](../verification/character-level/slide-correction/activity-2-set-result.png) |
| Dedicated activity finish | [activity-2-complete.png](../verification/character-level/slide-correction/activity-2-complete.png) |
| Listening reviewed with pending items | [listening-reviewed.png](../verification/character-level/slide-correction/listening-reviewed.png) |

## Files and reproducibility

New shared components: `AssessmentSlide.tsx`, `AssessmentResults.tsx`, `WritingActivityPresentation.tsx` under characterActivities, and `WritingPracticeLayout.tsx` under writing.

Updated adapters/components: CharacterActivityHub, QuestionScreen, QuestionParts, ActivityPresentation, copy, WritingPracticeScreen, WritingInstructions, WritingNavigation, ConfidenceCard and WritingHelpGuide. WritingCanvas, CharacterReferenceCard, BayaWritingGuide and RecognitionMatchRow are reused without correction-pass edits.

Browser scripts in `scripts/testing/`: `character-slide-baseline.mjs` (pre-edit reference only), `character-slides.mjs` (main functional/offline run), `character-slide-layouts.mjs` (language/viewport matrix), `character-slide-lesson.mjs` (standalone lesson regression), and `character-slide-restart.mjs` (same-profile offline restart). Serve the production export at port 5080. Run the main script before restart; layouts uses a separate profile.

## Remaining limits

- The canonical writing screen intentionally preserves its existing portrait stacking and scrolling. Quiz no-scroll requirements do not replace the lesson's responsive writing behavior.
- Extremely short windows or accessibility reflow may scroll internally; essential content is not clipped to force a screenshot.
- Browser viewport emulation is not physical touch/stylus or native Android/iOS testing. Accessibility-tree/keyboard checks are not a full assistive-technology audit.
- Two DE/RE listening recordings remain pending the existing content validation decision. No approval or replacement recording is implied.
- The reused reference card resolves pronunciation through the existing character-level registry. Some kudlit model classes (for example KE/KI) have no character-level recording entry and show the existing “Recording unavailable” state; this pass does not invent a combined recording or change the registry.
- Offline operation requires initial PWA preparation. A first-ever disconnected visit cannot download application assets.

No commit or deployment was performed. Existing unrelated workspace changes were preserved.
