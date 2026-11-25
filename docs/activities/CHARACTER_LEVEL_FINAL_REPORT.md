# Character Level final implementation report

Date: 2026-11-21 (Asia/Taipei). Implemented directly in the existing repository. No commit or deployment.

## Result

Four working activity flows now exist at **Lessons → Character Level** (`/learner/character-activities`). All **100 source questions** are imported, ordered, and reachable across 20 sets. **98 questions can be scored**; the two source listening prompts DE and RE remain explicitly pending audio-content validation. This is not a claim that all 100 graded questions have met acceptance.

The implementation includes one-question screens, explicit answer selection/submission, supportive feedback, set results, aggregate activity results, review/repeat history, English/Tagalog UI, local SQLite persistence, and deterministic resume. All 25 writing questions use the existing canvas and actual ResNet18 LiteRT inference. Source underlines, options, combined labels, Unicode, and answer keys are preserved.

## Audio and traditional Baybayin

All 87 original recordings were freshly decoded and verified unchanged. All 69 optimized runtime assets passed checksum verification. DaRa, DeRe, DiRi, DoRo, and DuRu were found; no separate D/R pronunciation variants appeared in either inventory.

The already integrated DaRa clip is reused as a combined character recording. The other four clips have explicit candidate records in the centralized pronunciation mapping. Local speech transcription was inconclusive for DeRe and is not a substitute for content-validator listening. No artificial pronunciation was generated, no original was changed, and a combined clip is never mislabeled as an isolated syllable.

Traditional groups are centralized as DA/RA, DE/DI/RE/RI, and DO/DU/RO/RU. Lesson audio lookup, assessment glyph/audio mapping, and recognition explanations use these groups. The model's immutable class IDs, modern RA classes, preprocessing, confidence handling and mastery threshold remain unchanged. DE and RE use the document's shared glyph; no question asks learners to distinguish them by glyph alone.

Questions 6 and 10 of Sound Matching show unavailable-recording feedback and allow an explicitly unscored continuation. They are excluded from correct/incorrect totals and cannot produce false completion. The other three questions in that set remain usable. Validator listening and approval of a combined DE/RE prompt mapping are still required.

## Persistence and progression

The existing SQLite local_app_state table stores versioned, learner-owned attempts with stable activity/set/question IDs, answer or model result, correctness, timestamps, resume cursor, technical failures, and synchronization state. Transactional duplicate protection makes submission retries safe. Repeats create separate attempts. No raw handwriting is retained. Checked feedback survives navigation, reload, and offline restart; unsubmitted choices/drawings intentionally reset with a visible explanation.

These new assessments have a documented draft policy: one scored response per item, score out of available scored items, no new pass threshold, XP, penalty, arbitrary lock, or mastery award. Foundational lessons retain their progression and two-success writing requirements.

**Assessment records are local-only.** Existing workspace authorization, membership and foundational-topic Supabase synchronization are preserved. New assessment cloud synchronization needs a separate approved server contract; the app does not claim these scores have synced.

## Verification

- Full Jest suite: **84 suites, 949 tests passed**; `--runInBand --forceExit`. Existing act/open-handle warnings remain.
- Targeted content, assessment, SQLite, UI and pronunciation mapping checks: **119 passed**. Every source question is compared against extracted table data and exact underline runs.
- TypeScript, Expo lint and production export passed. A final ARIA adjustment also passed focused component tests (5/5), TypeScript and lint, followed by browser verification.
- Real browser traversal covers every question, the 23 available pronunciations, all 50 visual multiple-choice items, and all 25 writing prompts. Browser results preserve real predictions; synthetic pointer strokes test integration rather than handwriting accuracy.
- Correct/incorrect feedback, replay, duplicate protection, repeat history, English/Tagalog, all nine specified viewports, offline audio, real offline LiteRT and persisted results were exercised. See final browser/restart JSON for exact executed checks.
- Browser inspection found a missing web ARIA checked state despite working keyboard selection. Explicit checked/disabled and progress-value attributes corrected it.
- `adb devices -l` returned no attached device. Physical Android, hardware audible output, finger/stylus behavior and actual screen-reader speech remain unverified.
- Learner dashboard, Lessons entry and public mentor entry were checked. Authenticated mentor/workspace end-to-end regression was not run without authorized test credentials.

## Created implementation files

- `apps/mobile/app/learner/character-activities.tsx`
- `apps/mobile/content/characterActivities/{index.ts,questions.json}`
- `apps/mobile/content/traditionalCharacters.ts`
- `apps/mobile/modules/characterActivities/assessment.ts`
- `apps/mobile/modules/audio/pronunciationMapping.ts`
- `apps/mobile/database/services/characterActivityService.ts`
- `apps/mobile/components/learner/characterActivities/{CharacterActivityHub.tsx,QuestionScreen.tsx,QuestionParts.tsx,copy.ts}`
- Tests: content/characterActivities, database/characterActivityService, characterActivities/QuestionScreen, audio/pronunciationMapping.
- `scripts/activities/extract_character_content.py`
- `scripts/testing/character-activities.mjs`, `character-restart.mjs`

## Modified integration files

- `components/learner/lessons/LessonScreen.tsx`: Character Level entry.
- `components/learner/activity/ActivityRenderer.tsx`: functional quiz dispatch.
- `components/learner/writing/WritingCanvas.tsx`: optional tracing guide for unaided assessment; existing lessons retain hints.
- `components/learner/characters/useCharacterPronunciation.ts`: centralized lookup.
- `modules/audio/KudlitRecordings.tsx`: centralized variant lookup.
- `components/learner/writing/RecognitionMatchRow.tsx`: supplementary traditional readings while preserving raw prediction.
- `content/README.md`: current assessment architecture.

The pre-existing working-tree changes, including audio assets, offline fixes and cloud changes, were preserved. Model weights, source recordings, foundational curriculum, and service-worker implementation were not changed by this task.

## Deliverables and remaining work

The task checklist, full question inventory, source/formatting extraction, content validation, UI/UX report, 50-case testing report, and this report are in `docs/activities/`. Screenshots and machine-readable browser evidence are in `docs/verification/character-level/`.

Outstanding: approve combined D/R kudlit audio, especially DE/RE; confirm the draft assessment policy; perform human handwriting/accessibility/device validation; define assessment cloud sync if required. Activity 5 Reading Comprehension, Pantig Level and Word Level are explicitly deferred in CHARACTER_LEVEL_BACKLOG.md and are not presented as implemented.

Final browser evidence: **42 primary checks + 13 restart/layout/accessibility checks passed**, zero errors. All 100 distinct questions reached; 98 scored, two deferred. Full offline listening and writing sets, full browser-process restart, keyboard checked-state output, and nine writing viewports passed.
