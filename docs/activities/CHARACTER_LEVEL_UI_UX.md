# Character Level UI/UX implementation

Implemented locally on 2026-11-21. Entry: Lessons → Character Level, route `/learner/character-activities`.

## Screens and interaction

- The hub presents four numbered activity cards with skill description, interaction type, five sets / 25 questions, progress, and Start / Continue / Review. No new locking rule is imposed.
- The activity view presents five set cards, resumable attempts, and an aggregate result when all 25 questions have scored responses. Completion is separate from mastery.
- Each question has a neutral instruction, set/question position, progress bar, and one learning task. Choices require explicit submission; selected options have a border and checkmark as well as color.
- Listening uses the existing single-owner pronunciation controller, explicit play/replay, a speaker icon, loading/playing/error states, and cleanup on navigation. The source cue never appears before submission, including accessible labels.
- Recognition questions use existing bundled 1024px reference assets with contain sizing, preserving upper/lower kudlit and avoiding dependence on platform Unicode fonts. Source glyphs remain unchanged in the content layer.
- Writing renders prefix + underlined run + suffix. The real WritingCanvas is reused without a tracing hint that would reveal the answer. Clear, input validation, locked inference, retries, predicted class, confidence, target comparison, and supportive feedback are present. Weights, rasterization, preprocessing, model decoding, and threshold are unchanged.
- Correct and corrective feedback are explicit, announced through a live region, and wait for Continue. Saving completes before feedback is presented. A technical failure never becomes an incorrect answer.
- Missing DE/RE recordings show Continue without scoring. They are recorded as pending, excluded from both correct and incorrect totals, and prevent full set/activity completion. Other validated items remain accessible in source order.
- Results include answered count, correct/incorrect counts, score, saved state, response review, repeat history, repeat action, next set, and overall results.

## Components

`CharacterActivityHub` owns navigation and loading. `QuestionScreen` owns transient selection, drawing, inference, and feedback. `QuestionParts` provides glyphs, progress, audio prompt, and selectable answer cards. `copy.ts` separates English/Tagalog interface text from immutable research content. Existing AppButton, LearnerAppShell, WritingCanvas, RecognitionMatchRow, audio controller, and language provider are reused.

`content/characterActivities` contains immutable source data, types, asset/class resolution, and integrity checks. `modules/characterActivities/assessment.ts` contains answer validation and persisted-state validation. `database/services/characterActivityService.ts` handles learner-scoped transactions, resume, repeat history, duplicate prevention, and separate technical failures. `traditionalCharacters.ts` and `pronunciationMapping.ts` centralize traditional D/R groups without merging model classes.

## Persistence and navigation

Attempts use the existing SQLite `local_app_state` store with a versioned, learner-scoped namespace. No database migration is needed. Each attempt includes profile, activity/set/question IDs, response, score basis, timestamps, resume cursor, failures, and explicit `local-only` synchronization status. Raw drawings/images are not retained. Checked answers resume at feedback; advancing persists the next position. Unsubmitted choices/drawings reset, as explained in the interface. Repeat attempts do not erase prior records.

The foundational curriculum, existing two-success writing policy, lesson completion percentages, workspace membership, and Supabase sync payloads are unchanged. Character assessment sync is not implemented because the current server contract accepts foundational topic completions only. The UI says Saved on this device, never cloud-synced.

## Layout and accessibility

The scrollable learning column has a 760px maximum width, 16px phone padding, existing BAYA cream/orange/brown tokens, existing typography and rounded cards. It never forces the entire task into one viewport. Mobile landscape can scroll; canvas touch handling continues to suppress competing scroll gestures. All nine requested viewports are covered by browser evidence.

Controls have accessible names, disabled/checked states, keyboard focus outlines, and targets above 44px. Question feedback uses live regions. No new animation is required, so reduced-motion operation is immediate. Glyph options intentionally expose neutral option identifiers rather than answer-revealing phonetic labels. Visual glyph discrimination and freehand input still require specialized alternative-assessment design for blind learners and learners unable to draw. Browser accessibility-tree inspection is not a screen-reader listening test or a claim of WCAG conformance.

English and Tagalog are selected through the existing language provider. Original Filipino words, romanizations, slash-combined choices, option positions, and answer keys are never translated. The traditional reading group is supplementary feedback, not a rewritten question.

## Visual evidence

See `../verification/character-level/`: hub, all four activity types, correct/incorrect feedback, set results, complete activity results, missing-recording state, Tagalog, offline inference, all nine question viewports, and writing viewports. Screenshots were inspected for clipping, readable choices, underline placement, canvas size, and scrolling behavior. Physical finger/stylus usability and real screen-reader output remain unverified.
