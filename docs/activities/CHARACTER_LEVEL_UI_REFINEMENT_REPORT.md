# Character Level UI refinement report

Date: 2026-11-21 (Asia/Taipei)

## Outcome and scope

Refined the existing Character Level hub, activity/set cards, all four question types, correct/incorrect feedback, pending audio state, set results, activity completion, review/retry presentation, and English/Tagalog UI. This is a presentation pass over the existing 100-question implementation.

The source questions, ordering, options, answer keys, underlined targets, pronunciation mappings, traditional shared-character groups, scoring, SQLite service, and recognition pipeline were preserved. SHA-256 comparisons confirmed unchanged question JSON/index, assessment module, persistence service, pronunciation mapping, and writing recognition module. The two pending audio questions remain unscored; this pass does not validate or replace recordings.

## Topic design reuse

The audit compared CharacterTopicScreen, CharacterViewer/StorybookTopicLayout, the writing practice screen, WritingCanvas, and existing story/mascot components. The previous activity UI used a narrow stacked layout and standalone navigation with limited companion guidance.

- Reused LearnerAppShell and ActivityHeader, including the existing back control and title hierarchy.
- Adapted the topic visual/content spread into LearningSpread: a framed learning target beside answer cards or the writing canvas on wide screens; a vertical flow on smaller screens.
- Reused theme spacing, rounded cards, cream surfaces, orange actions, existing typography and AppButton.
- Kept the actual WritingCanvas, its pointer input and LiteRT integration. Added a themed frame, clearer underlined word target, and grouped clear/submit controls without adding a tracing guide or changing assessment behavior.
- Organized milestone results into score/practice metrics and separated review rows, with outlined retry/review actions and a primary next-set action.

## Baya and shared components

New `ActivityPresentation.tsx` contains BayaHelper, LearningSpread, ActivityGrid, ResultMetric, and shared presentation styles. BayaHelper uses the approved existing BayaMascot asset, with compact 64px placement on mobile/short screens, 88px on regular question screens, and 116px on desktop milestones. Autoplay is disabled. Decorative mascot images are hidden from assistive technology; guidance remains readable text.

Baya appears in the hub intro, set selection, every question type, feedback cards, set milestones, and activity completion. Browser captures verify loaded local mascot images. No external artwork or new pronunciation assets were introduced.

Audio controls now distinguish playing and replay presentation and show a listen/choose/check sequence. Pending recordings retain disabled playback and an explicit unscored continuation. Answers are not exposed before submission.

## Responsive and accessibility verification

Both quiz and writing layouts were exercised at 320×568, 360×800, 390×844, 430×932, 768×1024, 844×390, 1024×768, 1280×800, and 1440×900. Wide learning spreads require at least 900px width and 500px height. Activity cards use two columns at wide widths. Small screens retain vertical scrolling instead of compressing answer targets or the canvas; the smallest measured canvas was 255×220px. No horizontal page overflow was detected in these checks.

Preserved radio checked/disabled states, progress values, labels, focus styling, keyboard selection, live feedback, and disabled submit behavior. Browser tests verify keyboard Enter changes the selected radio state. An accessibility tree was captured. Baya does not require motion. Screenshots were visually reviewed for desktop quiz, writing, feedback/results, pending audio, Tagalog, and mobile hub, feedback, result, and writing layouts.

## Validation results

| Check | Result |
| --- | --- |
| TypeScript: `npx tsc --noEmit -p apps/mobile/tsconfig.json` | Passed |
| Mobile Expo lint | Passed |
| Relevant Jest suites: characterActivities, characterActivityService, QuestionScreen, pronunciationMapping | 4 suites / 119 tests passed |
| Production web export and service-worker generation | Passed; 237 assets in generated worker |
| Main browser verification | 42 checks passed, zero reported errors |
| Offline browser-process restart, keyboard and writing viewports | 13 checks passed, zero reported errors |
| Additional mobile hub/completion/results/feedback/writing captures | 6 checks passed, zero reported errors |

The main browser run traversed all 100 questions, preserving 98 scoreable and two deferred items, exercised all 25 writing submissions through the real canvas and LiteRT model, and tested available listening clips. It also checked saved feedback after reload, Tagalog persistence, lesson entry navigation, learner dashboard, and public mentor entry. Complete five-question listening and writing sets passed offline. A separate browser-process restart restored the prior offline writing result. Synthetic pointer strokes test the real pipeline; they are not an assessment of model accuracy on children's handwriting.

## Visual evidence

43 PNG screenshots and machine-readable reports are in `docs/verification/character-level/refinement/`. The original verification evidence remains separate.

| Screen | Screenshot |
| --- | --- |
| Hub | [hub.png](../verification/character-level/refinement/hub.png) |
| Sound Matching | [sound-matching.png](../verification/character-level/refinement/sound-matching.png) |
| Baybayin to Latin | [baybayin-to-latin.png](../verification/character-level/refinement/baybayin-to-latin.png) |
| Latin to Baybayin | [latin-to-baybayin.png](../verification/character-level/refinement/latin-to-baybayin.png) |
| Writing prompt and real inference | [writing-question.png](../verification/character-level/refinement/writing-question.png), [writing-real-inference.png](../verification/character-level/refinement/writing-real-inference.png) |
| Correct / incorrect feedback | [correct-feedback.png](../verification/character-level/refinement/correct-feedback.png), [incorrect-feedback.png](../verification/character-level/refinement/incorrect-feedback.png) |
| Pending recording | [missing-approved-recording.png](../verification/character-level/refinement/missing-approved-recording.png) |
| Set / activity completion | [activity-2-set-result.png](../verification/character-level/refinement/activity-2-set-result.png), [activity-2-complete.png](../verification/character-level/refinement/activity-2-complete.png) |
| Tagalog | [tagalog-hub.png](../verification/character-level/refinement/tagalog-hub.png) |
| Mobile hub / feedback / results | [mobile-hub.png](../verification/character-level/refinement/mobile-hub.png), [mobile-feedback.png](../verification/character-level/refinement/mobile-feedback.png), [mobile-set-result.png](../verification/character-level/refinement/mobile-set-result.png) |
| Mobile writing | [mobile-writing-intro.png](../verification/character-level/refinement/mobile-writing-intro.png), [writing-320x568.png](../verification/character-level/refinement/writing-320x568.png) |

The folder also contains `viewport-WIDTHxHEIGHT.png` and `writing-WIDTHxHEIGHT.png` for all nine viewport sizes, offline screenshots, `browser-results.json`, `restart-results.json`, `mobile-results.json`, and `accessibility-tree.json`.

## Files added or refined in this pass

- `apps/mobile/components/learner/characterActivities/ActivityPresentation.tsx` — reusable companion, layouts and milestone metrics.
- `apps/mobile/components/learner/characterActivities/CharacterActivityHub.tsx` — shared header, card hierarchy, results and completion presentation.
- `apps/mobile/components/learner/characterActivities/QuestionScreen.tsx` — topic-style question/writing composition and companion feedback.
- `apps/mobile/components/learner/characterActivities/QuestionParts.tsx` — audio/replay presentation, option states and shared styles.
- `apps/mobile/components/learner/characterActivities/copy.ts` — English/Tagalog replay and listening sequence text.
- `scripts/testing/character-refinement.mjs`, `character-refinement-restart.mjs`, `character-refinement-mobile.mjs` — browser verification and screenshots. Run in that order against the local production server on port 5080; restart/mobile checks reuse the isolated profile from the first run.
- This report and `docs/verification/character-level/refinement/` evidence.

Existing unrelated workspace changes were preserved. No commit or deployment was performed.

## Remaining limitations

- DE/RE recording validation remains outstanding from the functional implementation. No content approval is implied by this UI pass.
- Responsive verification used desktop Chromium viewport emulation, not physical phones/tablets or native Android/iOS builds.
- Keyboard/ARIA checks and an accessibility-tree capture do not replace listening tests with a screen reader or a formal accessibility audit.
- Short screens intentionally require scrolling for answers, writing controls, and result reviews. Screenshot captures can show only part of the scrollable page.
- Offline tests used a previously prepared local production cache; a first-ever visit without any network access cannot download the application.
