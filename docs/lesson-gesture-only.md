# Phone swipe hint correction — 19 October 2026

The installed-phone report exposed two omissions: the cue required 36 px of unused vertical space below a card, so it was suppressed on short landscape viewports; its timeout could also finish behind the portrait rotation guard.

The full 28 px hand and 28 px sweep remain the preferred placement. When that cannot fit, a 16 px hand moves 8 px left within the existing 24 px gap between cards. Its entire sweep stays outside the card rectangles. The fallback adds no background, controls, padding, card resizing or scrolling region. Animation starts only in landscape. Existing session dismissal, reduced-motion handling, touch passthrough and offline assets remain unchanged.

The reported bottom gap was not visible in the supplied screenshot. The user asked to ignore it; no navigation or safe-area changes are included. Physical installed-PWA inset behavior is not claimed as verified.

Browser evidence is in `sandbox/phone-navigation/`: `fixed-780.png`, `fixed-667.png`, `portrait-then-landscape.png`, `offline.png`, and `browser-results.json`. Completed-card screenshots use explicitly labeled presentation fixtures in an isolated browser; no learner records were changed. Verification covers 780×315, 667×375, 844×390, 1024×768 and 1366×768, plus portrait-to-landscape rotation, session return, touch dismissal, reduced motion and cached offline reload. The hint is correctly absent when all cards fit.

Validation: **58 suites / 550 tests passed**; TypeScript passed; lint passed with 0 errors and 14 existing warnings; `npm run build` passed (163 cached assets, `baya-pwa-1cd6e6983fdb6b8d`). Browser checks reported zero runtime exceptions. The refreshed `apps/mobile/dist` is ready for a separate Netlify deployment.

# Transparent lesson swipe gesture — 18 October 2026

**SUCCESS — implemented and visually verified on web.**

## Correction and root cause

This request supersedes the pill and edge-chevron design in `floating-lesson-swipe-hint.md`.

The previous `LessonJourney` put two 44 px controls beside a flexing horizontal ScrollView. Those controls reserved 88 px from the row, so the third card was clipped at a narrower viewport while the surrounding page background looked like an opaque side rail. The left box in the supplied screenshot was the focused control's border. The separately painted cream pill was also contrary to the requested gesture-only design. There was no need for a new sidebar or a broad overflow-hiding rule.

Both side controls, their gutters, focused-arrow state, pill background, shadow, and visible instruction text are removed. The ScrollView now uses the full row width. The original card-width tokens, gap, card styling, topic buttons, progress indicators and order are preserved. Cards naturally peek beyond the actual scroll edge, and every card can be reached. Genuine vertical scrolling remains because Module 1's five topics and action can exceed a short landscape viewport; the hint does not create or enlarge that scrollbar.

## Gesture and placement

`FloatingSwipeHint` now renders only the existing **28 px orange Ionicons hand-left-outline** on a transparent background. There is no pill, text, arrow, border, shadow, toolbar, rail or focusable instructional control. The absolute-positioned hand has `pointerEvents="none"`; its 28 px box reserves no layout space.

The sequence waits 700 ms for layout, fades in over 180 ms, moves **28 px left over 750 ms**, fades out over 220 ms, waits 200 ms and repeats once. The reset to the right happens while invisible. After 3.6 seconds the component is dismissed. It never scrolls the actual cards. Animation setup failure leaves the natural partial-card affordance available.

Placement uses measured card heights, horizontal content/viewport widths, current offset and the actual available lesson viewport height. `LearnerScreenContainer` reports its height after existing vertical padding; `LessonScreen` passes this measurement to the journey. It adds no wrapper or layout styling. The entire gesture sweep must fit in empty space beneath a visible card, inside both the row height and the available viewport. If no such space exists, the hand is omitted. This avoids arbitrary screen coordinates and keeps it clear of titles, badges, actions and the bottom tabs. The prior card measurement wrappers are retained without changing card sizes; no new card wrapper was introduced in this correction.

## Visibility and interaction

Only a genuinely overflowing row at its initial position can show the hand. Touching, dragging, scrolling, using the keyboard or an accessibility scroll action, or opening a lesson dismisses it. After dismissal, returning to Lessons in the same JavaScript session does not replay it. Memory is presentation-only; there are no SQLite or persisted learner-state changes. Viewport changes recalculate the safe placement and suppress the hint when content fits. Ordinary rerenders do not restart the animation.

Reduced-motion users receive no moving or static overlay: the partial next card remains the cue. Keyboard and accessible scrolling remain available. Unknown motion preferences also default to no animation.

## Accessible alternatives to the removed arrows

On web the existing horizontal ScrollView is a labeled, keyboard-focusable region. With focus on the row:

- Left/Right scroll backward/forward by one card plus the existing gap.
- Home/End move to the first/final horizontal position.
- Scrolling is bounded and immediate, avoiding extra movement for reduced-motion users.
- Key events on child controls are not intercepted. Existing topic/card buttons remain focusable and clickable.

Native `increment` and `decrement` accessibility actions perform the same bounded scrolling with Filipino labels. Normal platform scrolling is preserved. There are no invisible arrow buttons or hidden click targets. The hand has a non-live accessibility description and cannot take focus. Physical screen-reader behavior still requires a device check; native action handlers are unit-tested, while real keyboard navigation was browser-tested.

## Files changed for this correction

| File | Purpose |
| --- | --- |
| `apps/mobile/components/learner/lessons/LessonJourney.tsx` | Remove controls/rails; restore full-width row; measure safe placement; add keyboard/accessibility scrolling |
| `apps/mobile/components/learner/lessons/FloatingSwipeHint.tsx` | Replace pill with transparent hand-only sequence; reduced-motion omission |
| `apps/mobile/components/learner/lessons/LessonScreen.tsx` | Pass available viewport measurement |
| `apps/mobile/components/learner/LearnerScreenContainer.tsx` | Optional height-measurement callback; unchanged styles/layout |
| `apps/mobile/components/learner/lessons/__tests__/LessonJourney.test.tsx` | Keyboard and accessibility actions, bounded scrolling, safe omission, dismissal, resize, card sizing and session memory |
| `apps/mobile/components/learner/lessons/__tests__/FloatingSwipeHint.test.tsx` | Transparent 28 px gesture, two leftward motions, fade, no text, cleanup and reduced motion |
| `docs/lesson-gesture-only.md` | Current report |
| `docs/stakeholder-feedback-review.md` | Mark the prior controls/pill design as superseded |

No dependencies or image assets added, no files deleted, no curriculum/progress/SQLite/recognition/handwriting/mascot/tab/orientation changes. No commit, push or deployment.

## Verification

Relevant Jest: **3 suites / 11 tests passed** using `npm test --workspace=apps/mobile -- --runInBand --forceExit LessonJourney FloatingSwipeHint curriculumScreens`.

**Full Jest suite: 58 suites / 548 tests passed** with `npm test --workspace=apps/mobile -- --runInBand --forceExit`.

TypeScript passed with `node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json`. Lint passed with **0 errors / 14 existing warnings** using `npm run lint --workspace=apps/mobile`. Production web export passed using `npm run export:web --workspace=apps/mobile`: 163 cached assets, cache `baya-pwa-2b9bad83fa217bc5`.

Final browser result: **PASS**, zero runtime exceptions; 207/216 animation samples on the phone layouts.

Production Chrome checks cover 667×375, 844×390, 1024×768, 1366×768, and **957×402**, matching the supplied screenshot's dimensions. Assertions and inspected screenshots verify full-width row, no arrow controls, transparent 28 px hand, no card overlap, no page horizontal overflow, no layout shift or card remount, unchanged vertical scroll height after dismissal, actual movement/fading, complete keyboard access to Module 3, touch dismissal, returning without replay, resize, and reduced-motion omission. Cached offline scrolling also works.

The completed-module screenshots use a clearly labeled **UI FIXTURE · completed modules** in an isolated production-build browser. It dispatches only the existing LessonScreen presentation state through React's test inspection; it does not write SQLite or represent the user's learner progress. The real card components and navigation handlers are exercised, including opening the lesson through its existing action. At 957×402, all three unchanged-width cards fit after removing the gutters, so no hint or side controls appear.

Physical native devices and assistive-technology applications were not exercised. Existing non-failing test warnings remain. QA scripts, logs and JSON evidence are in ignored `sandbox/gesture-only/`.

## Screenshots

| View | Capture |
| --- | --- |
| Before this correction: pill and side controls | [Previous UI](../sandbox/floating-swipe/initial-667.png) |
| Before the hand appears | [667 before](../sandbox/gesture-only/before-667.png) |
| During animation: transparent hand only | [667 during](../sandbox/gesture-only/during-667.png) |
| After dismissal | [667 after](../sandbox/gesture-only/after-667.png) |
| Final scroll position via keyboard | [667 end](../sandbox/gesture-only/end-667.png) |
| Completed-card fixture | [667 completed](../sandbox/gesture-only/completed-fixture-667.png) |
| Module 3 reached in completed fixture | [667 completed end](../sandbox/gesture-only/completed-end-667.png) |
| Screenshot-sized completed layout | [957×402](../sandbox/gesture-only/completed-fixture-957.png) |
| Tablet without overflow | [1024](../sandbox/gesture-only/before-1024.png) |
| Desktop without overflow | [1366](../sandbox/gesture-only/before-1366.png) |
| Reduced motion | [No overlay](../sandbox/gesture-only/reduced-motion.png) |
| Cached offline navigation | [Offline end](../sandbox/gesture-only/offline-end.png) |

A browser focus outline around the scroll region can appear after keyboard navigation. It is the legitimate focus indication, not a side panel or arrow control.

Repository-required [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) was consulted. The installed Ionicons and React Native Animated are reused without new runtime dependencies.
