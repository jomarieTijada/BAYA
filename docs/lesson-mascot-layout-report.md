# Lesson mascot layout — 26 October 2026

## Follow-up: consistent desktop layout

Removed the sticky text-overflow feedback that could switch a spacious desktop
page into compact mode during intermediate text measurements. Layout mode now
depends only on the available page dimensions, with the existing viewport fallback
before measurement. Long desktop text remains in its ScrollView rather than
changing column proportions, typography, title visibility and mascot presentation.
The shared spread is centered and capped at 1440 pixels; desktop narrative content
is vertically centered in its available reading area. Desktop keeps the inline
speech bubble and half-body mascot. A regression test covers a 1920×900 viewport
with overflowing text. Browser review was unavailable because local browser use
remains disabled in Work settings; TypeScript, lint and production export passed.

## Follow-up: Next navigation layout flash

Each keyed topic session remounted the layout with a zero-sized measurement.
That selected the desktop arrangement for the first render, then switched to the
compact arrangement after `onLayout`. The shared layout now uses the viewport
classification before measurement and keeps that initial layout invisible and
non-interactive until its actual rectangle is available. This prevents the
intermediate arrangement from being painted without changing topic completion,
navigation destinations or lesson state resets. Regression coverage explicitly
checks a compact topic-to-topic rerender before and after layout measurement.
TypeScript, lint and production export passed. Browser inspection of this follow-up
was unavailable because local browser use was disabled in Work settings.

## Follow-up: larger half-body mascot and centered content

The latest requested styling supersedes the initial top-aligned layout below.
Compact BAYA now uses a 112–152 pixel image, clipped to 70% of its height, matching
the desktop half-body treatment. Its right-aligned touch target remains outside
the reading scroll. Media is vertically centered again, and constrained narrative
content centers within its available scroll area; longer content still scrolls.
The 53 story tests, TypeScript, lint and web export pass. Browser checks at
872×447 and 667×375 confirm the revised layout. See
`verification/mascot-layout/872-centered-half-body.png` for the current design.

## Root cause and correction

`StoryPage` supplied the compact mascot through `visualFooter`. The shared
`StorybookTopicLayout` attached that footer to the left media column whenever
the page was constrained. This explicitly caused the placement in the reference.

The slot is now `contentFooter`, rendered after the reading panel in the right
column. The reading panel has `minHeight: 0` instead of a full-height constraint,
so its existing ScrollView can share space with the mascot. Reading-layout media
aligns to the top rather than centering in the former mascot-free vertical gap.
Other layout consumers retain their existing alignment.

## Files changed

- `apps/mobile/components/learner/story/StorybookTopicLayout.tsx`: footer placement
  and scoped media alignment.
- `StoryPage.tsx` in the same directory: wires the content footer.
- `StoryContent.tsx`: shrinkable reading panel.
- `StoryMascotPopover.tsx`: right alignment, 56–96 pixel responsive mascot,
  removed visible instruction and question-mark badge, right-anchored bubble/tail.
- `StorySpeechBubble.tsx`: compact floating close button beside the message,
  preserving its 44-pixel touch target.
- `__tests__/StorybookTopicScreen.test.tsx`: viewport, hierarchy, interaction,
  reduced-motion and video-mount regression checks.

Reused `BayaMascot`, `StorySpeechBubble`, `SpeechBubbleTail`, `StoryGuide`,
the existing responsive hook, theme tokens, video component and navigation.
No lesson copy, media source, attribution, sequencing, recognition, SQLite or
Supabase implementation was changed. No commit, push or deployment was made.

## Behavior

On constrained screens the mascot occupies only its own 56–96 pixel footer row,
aligned right. The bubble starts hidden and is absolutely positioned above that
row, bounded to the explanation column and available page height. Its bottom
pointer aligns with the mascot. Tap toggles it, the close control dismisses it,
and Escape remains supported. Focus indication, accessible expanded state,
announcement and reduced-motion handling remain. Opening it does not reflow the
reading/media layout or remount the video. Larger layouts retain the existing
inline message and right-side mascot.

## Verification

- Jest: **53 tests passed in 2 story suites**. Coverage includes all five approved
  story topics, attribution, navigation handlers, right-column ownership, no
  visible hint, compact sizing, opening/dismissal, reduced motion, and unchanged
  video mount count/layout styles during toggling.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run export:web`: passed; regenerated the local production export/PWA.
- Actual in-app browser review at **667×375, 844×390, 872×447, 915×412,
  1024×768 and 1366×768**. Compact mascot and navigation bounds do not overlap;
  document width checks reported no horizontal overflow. Tablet/desktop retain
  the inline bubble. A compact bubble spacing issue found during review was fixed
  and rechecked at 667×375.
- Video position remained at 17 seconds across bubble toggles and viewport
  changes. Native controls and the GINHAWA attribution remained visible.
- Syllabary and 17-symbol lessons were also visually reviewed at 667×375. Their
  existing unavailable-image placeholders remain unchanged. No new illustrations
  were invented or substituted.

Screenshots: `verification/mascot-layout/`. `872-closed.png` shows the main result;
`667-open.png` shows the compact bubble; `1366-closed.png` shows desktop behavior;
`syllabary-667.png` and `symbols-667.png` show other lesson templates.

## Limits

The longer syllabary page needs its existing bounded reading scroll at 667×375;
text is retained and footer navigation stays outside that scroll. The on-demand
bubble is an overlay, so a long message can temporarily cover part of the reading
area until dismissed; it does not change layout or cover the navigation/media
column. All image-backed topics were not separately inspected in the browser;
the shared layout and existing automated topic tests cover their composition.
Physical-device safe-area variations and enlarged system text settings were not
separately exercised. Navigation handlers were tested without completing topics
in the live browser, to avoid altering learner progress.
