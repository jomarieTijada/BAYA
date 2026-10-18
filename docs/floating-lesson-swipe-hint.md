# Floating lesson swipe hint — 18 October 2026

**SUCCESS — implemented and verified on web.** This request supersedes the permanent journey cue/control row in the previous speech-bubble and swipe-indicator report. It does not change handwriting or story navigation.

## Audit and root cause

`LessonJourney` combined two real scroll buttons with a decorative directional arrow and text in a document-flow row. Each button had a white surface, border and 44 px target; the entire row plus bottom margin reserved 52 px above the cards whenever they overflowed. The instructional cue stayed visible indefinitely. The arrows were not disposable illustrations: they supplied mouse, keyboard and assistive-technology alternatives to swiping.

The horizontal ScrollView already exposed content width, viewport width and offset. The cards have centralized responsive widths. The current implementation uses the full frame width and those actual card-width/gap tokens to decide whether the cards fit before allocating edge controls; scroll boundaries still use measured content minus measured viewport. This avoids creating artificial overflow just to display controls.

## Final presentation

- Removed the boxed toolbar and its in-flow instruction. Cards keep their existing dimensions and content.
- Functional previous/next chevrons now sit in narrow gutters at the row's left/right edges. They have transparent surfaces, no visible border at rest, 44×44 px targets, Filipino accessible labels, disabled boundary states, pressed feedback and a blue keyboard-focus border.
- A single **192×36 px** floating cream pill contains an orange **Ionicons hand-left-outline** and “I-swipe pakaliwa”. It has rounded corners, a subtle shadow, no border and no separate icon container.
- Its absolute position is calculated from measured card heights and visible card spans. It uses blank space below a visible card, favoring a short card toward the right, and stays within a conservative visible-height budget. It is omitted if no unobstructed position is available. No title, action, final visible card, or navigation control is covered. The existing page shell continues to handle safe-area insets.
- The hint has `pointerEvents="none"`, no button role, no focus target and no live announcements. It cannot block taps or gestures or trap focus.
- No edge fade was added: the partial card and functional edge chevrons already indicate more content.

At 667×375 the pill occupies x=369, y=256, width=192, height=36, beneath the second card. At 844×390 it occupies the same open area. The cards fit at 1024×768 and 1366×768, so neither the pill nor edge controls are shown. Unlike the former toolbar, mounting, fading or removing the pill never changes the cards' positions or dimensions.

## Motion and visibility

React Native Animated fades in over 220 ms, moves the hand 16 px left over 650 ms and returns over 250 ms. It demonstrates the gesture twice with a short pause, then fades out over 350 ms. A 4.2-second timeout removes the hint and records dismissal. Reduced-motion users get a static, readable pill for that interval. Animation setup failure falls back to static presentation. Cleanup stops animations and cancels timers.

The hint appears only when the row overflows, the learner is at the initial position with later content available, a safe position exists, and this journey has not been dismissed in the current JavaScript session. Dragging, changing the horizontal offset, pressing an edge control or opening a lesson dismisses it. Navigation to Home and back does not replay a dismissed hint. Dismissal is a module-level in-memory set keyed by the journey's lesson IDs; there are no SQLite, storage, progress or backend writes. Reloading the application starts a new session. Resize recomputes overflow and placement; fitted content hides the cue. Once the learner navigates, no reversed onboarding message appears at the end.

The existing character-selector `SwipeHint` is unchanged: this task targets the boxed lesson-journey presentation shown in the supplied screenshot. Story Back/Next, curriculum, learner records, PWA configuration and handwriting code are unchanged.

## Files changed in this task

| File | Change |
| --- | --- |
| `apps/mobile/components/learner/lessons/LessonJourney.tsx` | Remove toolbar, integrate functional edge controls, measure safe placement and manage dismissal |
| `apps/mobile/components/learner/lessons/FloatingSwipeHint.tsx` (new) | Floating pill, bounded animation, static fallback and session memory |
| `apps/mobile/components/learner/lessons/__tests__/LessonJourney.test.tsx` | Overflow, navigation, resize, dismissal and remount coverage |
| `apps/mobile/components/learner/lessons/__tests__/FloatingSwipeHint.test.tsx` (new) | Motion, timeout, cleanup, pointer behavior and reduced motion |
| `apps/mobile/components/ui/AppIcon.tsx` | Add a hand icon through the existing Ionicons system |
| `apps/mobile/components/ui/ioniconPaths.web.ts` | Regenerate the local web glyph paths to include that hand |
| `docs/floating-lesson-swipe-hint.md` (new) | This report |
| `docs/stakeholder-feedback-review.md` | Current refinement summary |

No packages or runtime network dependencies were introduced. No files deleted. No commit, push or deployment. Other pre-existing changes remain in the working tree.

## Verification

- `npm test --workspace=apps/mobile -- --runInBand --forceExit LessonJourney FloatingSwipeHint curriculumScreens SwipeHint`: **4 suites / 13 tests passed**. Covers bounded arrow behavior, overflow, no-fit/resize, actual scroll/drag/timeout dismissal, remount memory, no card-width changes, two gestures, fade, cleanup, pointer passthrough and static reduced-motion handling.
- `node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json`: passed.
- `npm run lint --workspace=apps/mobile`: passed, **0 errors / 14 existing warnings**.
- `npm run export:web --workspace=apps/mobile`: passed, **163 cached assets**, cache `baya-pwa-e1ffaf4b04d37465`.
- Actual production Chrome at **667×375, 844×390, 1024×768, 1366×768**: passed. Checked no page overflow, pill entirely outside every card rectangle, touch targets, no layout shift at dismissal, real hand movement and fading (237/255 sampled frames), keyboard Enter activation, mouse/button navigation, end boundaries, Home→Lessons return without replay, touch-swipe dismissal, resize and fit-only visibility. Zero runtime exceptions.
- Reduced-motion browser check: **77 frames** with static transform and opacity before dismissal.
- Cached offline journey: hint/icon render and functional navigation passed.
- Full repository Jest suite was not rerun for this scoped UI change; the relevant suites above were run. Physical native devices and screen readers were not exercised.

Local QA script, logs and machine-readable results are in ignored `sandbox/floating-swipe/`.

## Before and after evidence

| View | Screenshot |
| --- | --- |
| Before: boxed toolbar from the previous implementation | [Before, 667](../sandbox/speech-swipe/journey-start-667.png) |
| New initial floating hint | [After, 667](../sandbox/floating-swipe/initial-667.png) |
| During the gesture demonstration | [Motion, 667](../sandbox/floating-swipe/motion-667.png) |
| After timed dismissal | [Dismissed, 667](../sandbox/floating-swipe/dismissed-667.png) |
| After navigating horizontally | [Scrolled, 667](../sandbox/floating-swipe/scrolled-667.png) |
| Final horizontal position | [End, 667](../sandbox/floating-swipe/end-667.png) |
| Wider phone landscape | [After, 844](../sandbox/floating-swipe/initial-844.png) |
| All cards fit | [1024](../sandbox/floating-swipe/fits-1024.png), [1366](../sandbox/floating-swipe/fits-1366.png) |
| Touch dismissal | [Touch](../sandbox/floating-swipe/touch-dismissed.png) |
| Reduced motion | [Static hint](../sandbox/floating-swipe/reduced-motion.png) |
| Cached offline | [Offline](../sandbox/floating-swipe/offline.png) |

The border visible on the focused end-state arrow is the accessibility focus indicator, not a restored boxed toolbar. All images are captured application views. The existing Lesson 1 card still uses the page's vertical scrolling on short screens; no lesson content or card size was changed.

The [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) was consulted as required by the repository instructions. The hand comes from the already-installed Ionicons package and is bundled as a local SVG path on web and the existing icon font on native.
