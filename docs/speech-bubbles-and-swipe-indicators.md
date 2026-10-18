# Speech bubbles and lesson swipe indicators — 18 October 2026

**SUCCESS — implemented and verified on web.**

## Scope and audit

The current request is limited to visual consistency and discovery of existing horizontal scrolling. Learning content, ordering, video playback, recognition, preprocessing, class mapping, the two-success/0.80 policy, SQLite and backend code were not changed in this task. Earlier uncommitted work remains in the checkout.

Lessons 1 and 2 already use `StoryGuide` / `StorySpeechBubble`, including the Module 2 character example shown in the supplied reference. Their paper is #FFF9EE, border #F5C799 at 2 px, with the shared `Shadows.card` soft shadow. Regular corners are 24 px; tablet/compact/short-landscape variants are 20/16/14 px. Regular lesson padding is 32×22 px, desktop 34×24, tablet 24×16, compact 16×12, and short landscape 12×8. Typography uses the existing rounded family and #342214 text, with responsive sizes and existing highlighted words. The curved open-base pointer faces the mascot on the right; stacked portrait lessons already suppress it.

Pagsusuri previously used a 1 px border, 20 px corners, no shadow, two independent triangular pointer layers and state-specific green/amber border colors. It now shares the lesson paper, apricot border, corner treatment and shadow. Accepted/retry text remains green/amber and all feedback messages and raw probabilities remain unchanged. Its downward pointer uses the same curved geometry as the original lesson SVG, rotated to face the mascot. The open base overlaps the panel border by 3 px to avoid a detached triangle or seam. Short layouts retain compact result rows and wrapping error messages. Pagsusuri actions and stars stay outside the feedback scroller.

The lesson journey already had bounded 44 px previous/next controls and a static “Mag-swipe o pindutin ang arrow” label. The character selector was horizontally scrollable without a contextual cue. Storybook pages use existing Back/Next controls and vertical text scrolling, not horizontal paging gestures; no misleading swipe cue was added there. Unrelated cards were not restyled.

## Implementation

`speechBubbleStyles` is the shared visual source; `SpeechBubbleTail` shares the existing local curve across both orientations. Storybook-specific layout, text and responsive sizing remain in their existing component. No duplicate screen or general card refactor was introduced. The original SVG remains on disk, but is no longer imported; its geometry is rendered locally by the already-installed react-native-svg with shared colors.

`SwipeHint` replaces the journey's previous label and is reused immediately below the character row. Actual layout width, content width and scroll offset determine visibility and direction:

- No measured overflow: no cue (and no journey arrow row).
- Content remains to the right: “I-swipe pakaliwa” with the existing left arrow icon.
- Final horizontal position: “I-swipe pakanan” with the existing right arrow icon, indicating how to return.
- Resize and content changes recalculate the cue. Wider journey layouts hide it when all cards fit.

The icon describes finger movement, while the existing journey buttons navigate toward earlier/later modules. Character selection and the existing Back/Next controls are preserved. Overflowing desktop character chips remain left-aligned so their first item stays reachable; centering is retained only when they fit.

React Native Animated translates the cue icon 7 px in the indicated direction and back, twice (400 ms each leg, 160 ms between demonstrations), then rests. Ordinary rerenders, scrolling and boundary changes do not restart the demonstration during that mounted cue. Cleanup stops motion when hidden/unmounted or when the preference changes. The existing reduced-motion hook defaults to static until the preference is known; a visible static icon/label remains when motion is disabled. `pointerEvents="none"` prevents interception of gestures. The cue has an accessible Filipino label. All icons, SVG geometry and code are bundled locally; no packages or online runtime dependencies were added.

## Modified files in this task

| File | Purpose |
| --- | --- |
| `apps/mobile/components/ui/speechBubbleStyles.ts` (new) | Shared lesson paper, border, corners and shadow |
| `apps/mobile/components/ui/SpeechBubbleTail.tsx` (new) | One local curved pointer with right/bottom placement |
| `apps/mobile/components/ui/SwipeHint.tsx` (new) | Overflow direction policy, brief motion and accessible cue |
| `apps/mobile/components/ui/__tests__/SwipeHint.test.tsx` (new) | Boundaries, resize, one-time animation and reduced motion |
| `apps/mobile/components/learner/story/StorySpeechBubble.tsx` | Reuse shared tail, retain content and responsive layout |
| `apps/mobile/components/learner/story/storyGuideStyles.ts` | Reuse shared surface; remove duplicate tail styles |
| `apps/mobile/components/learner/writing/BayaWritingGuide.tsx` | Shared surface and downward pointer; retain feedback logic |
| `apps/mobile/components/learner/writing/__tests__/BayaWritingGuide.test.tsx` (new) | Shared style, tail orientation, feedback and wrapping |
| `apps/mobile/components/learner/writing/__tests__/WritingPracticeScreen.recognition.test.tsx` | Update four obsolete color expectations for the shared border |
| `apps/mobile/components/learner/lessons/LessonJourney.tsx` | Refine the existing hint; preserve arrow behavior |
| `apps/mobile/components/learner/lessons/__tests__/LessonJourney.test.tsx` | Assert directional hint and hide-on-fit behavior |
| `apps/mobile/components/learner/characters/CharacterViewer.tsx` | Measure selector overflow and place shared hint below chips |
| `apps/mobile/components/learner/characters/__tests__/CharacterViewer.test.tsx` | Selector overflow, end boundary and resize checks |
| `docs/speech-bubbles-and-swipe-indicators.md` (new) | This audit and verification report |
| `docs/stakeholder-feedback-review.md` | Link current visual refinement |

No files were deleted. Local QA scripts, logs and images are in ignored `sandbox/speech-swipe/`.

## Verification

- Focused Jest: 5 suites / 65 tests passed.
- Full Jest: **57 suites / 541 tests passed** using `npm test --workspace=apps/mobile -- --runInBand --forceExit`. The first run identified four existing tests expecting the intentionally replaced green/amber bubble border; these assertions were updated to the shared token without changing recognition assertions.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json` passed.
- Lint: `npm run lint --workspace=apps/mobile` passed, 0 errors / 14 existing warnings.
- Production: `npm run export:web --workspace=apps/mobile` passed; 163 locally cached assets, cache `baya-pwa-3ae3abd85c76ff80`.
- Production headless Chrome at **667×375, 844×390, 1024×768, 1366×768**: rendered writing, Lesson 1 and Lesson 2; action visibility, tails, gesture scrolling, both journey arrows, final boundary direction, disappearance on fit, resize, and no document horizontal overflow passed. Actual animation transforms were sampled; 172 reduced-motion frames remained static. No runtime exceptions.
- Cached offline Lesson 2 and real ONNX handwriting inference passed. Gesture hints and shared pointers require no network.
- Separate development fixture: 33 workflow states passed across the same four sizes, including empty/drawing/busy/accepted/rejected/completed/new-character, retry/clear, duplicate protection, guide open/close, rotation and reduced motion. These screenshots explicitly say **UI FIXTURE · simulated recognition**; they exercise real handlers and SQLite persistence with deterministic recognition results, not model accuracy.
- Physical Android/iOS devices and screen-reader interaction were not exercised. Shared native paths type-check and component tests pass. Existing lesson art placeholders/content were left untouched.

## Visual evidence

All images below are captured application views, not design mockups.

| Evidence | Local capture |
| --- | --- |
| Initial Pagsusuri, small landscape | [667 initial](../sandbox/speech-swipe/writing-initial-667.png) |
| Accepted feedback, labeled fixture | [667 accepted](../sandbox/speech-swipe/667x375-first-accepted.png) |
| Unsuccessful feedback, labeled fixture | [1366 retry](../sandbox/speech-swipe/1366x768-failed.png) |
| Two accepted writings, labeled fixture | [1366 completed](../sandbox/speech-swipe/1366x768-second-accepted.png) |
| Lesson 1 established speech style | [1366 lesson](../sandbox/speech-swipe/lesson-1-1366.png) |
| Lesson 2 established speech style and selector hint | [1366 characters](../sandbox/speech-swipe/lesson-2-consonants-1366.png) |
| Small landscape character example | [667 characters](../sandbox/speech-swipe/lesson-2-consonants-667.png) |
| Journey before swipe | [667 start](../sandbox/speech-swipe/journey-start-667.png) |
| Journey after touch swipe | [667 swiped](../sandbox/speech-swipe/journey-swiped-667.png) |
| Journey final position and reversed cue | [667 end](../sandbox/speech-swipe/journey-end-667.png) |
| Wider viewport removes unnecessary cue | [resized fit](../sandbox/speech-swipe/journey-resized-fit.png) |
| Offline character lesson | [offline](../sandbox/speech-swipe/offline-lesson.png) |

Machine-readable evidence: `sandbox/speech-swipe/browser-results.json` and `fixture-results.json`; commands and helpers are alongside those files. Native validation remains a separate manual check, not a claimed browser result.

References: the local `AGENTS.md` requirement was followed by consulting the [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/). Existing [Ionicons](https://ionic.io/ionicons) via the installed Expo icon setup supply arrow icons; no new licensed assets were introduced.
