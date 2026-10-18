# Pagsusuri help relocation — 18 October 2026

**Status: SUCCESS — implemented and verified on web.** Native hardware and physical screen-reader checks remain unverified.

## Change and component ownership

The previous `WritingInstructions` component owned the help toggle, expanded state and an absolutely positioned explanation. Its placement below the canvas toolbar covered the upper drawing area. Although the overlay did not participate in normal layout, it obstructed the drawing and mixed technical feedback with writing instructions.

The help state now belongs entirely to `ConfidenceCard`, the existing owner of the **Pagsusuri** heading. `WritingInstructions` renders only the short dynamic task instruction and undo/clear controls. No help link, explanation or help overlay remains in the canvas column.

```text
Before
  Canvas column: WritingInstructions → help toggle + overlay + toolbar; WritingCanvas
  Feedback column: ConfidenceCard heading; stars; recognition results and mascot

Now
  Canvas column: WritingInstructions → task instruction + toolbar; WritingCanvas
  Feedback column: ConfidenceCard
    Fixed header: Pagsusuri + circular question-mark help control
    Internally scrolling content: optional help; stars; recognition results and mascot
```

The header button sits immediately to the right of Pagsusuri. Its touch target is **44 × 44 px**, with a dark 28 px question-mark icon, a theme-colored circular surface and visible focus styling. The accessible name is **Tulong sa pagsusuri**. Activating it again closes help. Expanded state is exposed through both native accessibility state and web `aria-expanded`; the technical disclosure does the same.

## Help interaction and exact wording

Help starts closed. Opening it reveals an inline section immediately below the header. The heading/control remain reachable while the right panel's content scrolls on short screens. The card's height is capped to the available column height, so help cannot increase the three-column row's height or move/resize the neighboring canvas. Nothing is positioned over the canvas. Feedback, stars and mascot remain mounted and reachable by scrolling within the right panel. Closing help resets its scroll position and collapses the optional technical detail.

The primary child-facing help is:

> **Paano makakuha ng tsek?**
>
> Isulat ang tamang simbolo at pindutin ang Suriin. Kapag natanggap ni BAYA ang iyong sulat, makakakuha ka ng isang tsek!
>
> Makakuha ng 2 tsek upang makapunta sa susunod na simbolo.

**Dagdag na paliwanag** reveals:

> Tinitingnan ni BAYA kung ang unang nakilalang simbolo ay ang ipinapasulat at kung may hindi bababa sa 80% kumpiyansa ito.
>
> Ang 80% ay kumpiyansa ni BAYA sa pagkilala, hindi grado ng iyong sulat.
>
> Binibilang lamang ang bagong sulat kapag naitala ito. Hindi nadaragdagan ang tsek sa muling pagsusuri sa parehong guhit.

The open technical disclosure is labeled **Isara ang dagdag na paliwanag**. The displayed 2 and 80% come from `BAYA_WRITING_MASTERY_POLICY`, not independent constants. The existing short canvas instructions and primary-action workflow are unchanged.

This is an inline disclosure, not a modal/popover: there is no focus trap, overlay or Escape requirement. Enter and Space activate the header button. Screen-reader semantics are exposed; physical screen-reader/device testing has not been performed.

## Icon and attention motion

Reused the installed **Ionicons help-circle-outline** through `AppIcon`. The web SVG path was generated from the installed font using the existing `generate-web-ionicons.py` script. Only one generated glyph was added. Source: [Ionicons](https://ionic.io/ionicons), [MIT license](https://github.com/ionic-team/ionicons/blob/main/LICENSE), copyright 2015–present Ionic. No new packages or online runtime dependencies.

Existing React Native Animated provides one gentle **1 → 1.08 → 1** pulse, 220 ms per leg. It starts once when the platform reports that reduced motion is off. It does not loop, repeat on ordinary renders, replay after disclosure changes or restart when the preference changes later. Opening help interrupts the pulse. Reduced-motion/unknown-preference states stay static, and animation setup failure retains usable help. The transform changes only the icon, not layout or touch-target size.

## Integrity and browser evidence

Help owns no recognition, stroke, mastery or persistence state. Its toggles never invoke inference or database calls. Recognition children remain mounted, and the canvas is outside the disclosure subtree. No changes were made to the model, inference, preprocessing, class mappings, SQLite schema/services, sync/backend or two-success/0.80 acceptance policy.

The production Chrome harness compared **exact canvas DOM-node identity, x/y, width/height, SVG stroke paths, progress text, result text and route** before opening help, after opening, after technical disclosure, and after closing. It repeated preservation checks with actual model results. Every comparison passed at all four sizes:

| Viewport | Canvas width × height (CSS px) | Help-only layout change |
|---|---|---|
| 667 × 375 | 293.625 × 148 | None |
| 844 × 390 | 385.40625 × 163 | None |
| 1024 × 768 | 429.546875 × 467 | None |
| 1366 × 768 | 606.890625 × 467 | None |

Additional checks verified a 44 px target, help containment within the right panel, a pinned header while content scrolls, no document horizontal overflow or extra outer scrolling, no footer overlap, Enter/Space activation, a sampled non-static attention pulse, and **100 static reduced-motion frames**. No runtime exceptions occurred. Offline reload still displayed the question-mark SVG and opened the explanation. Production tests used actual ONNX recognition, not simulated scores.

Unit/integration coverage verifies initial collapse, both disclosures, accurate policy-derived wording, keeping feedback mounted, no help in the canvas instructions, one-time motion, reduced motion, animation fallback and preservation of strokes/progress/results during a deferred SQLite attempt save. Opening help causes no additional inference or save.

## Verification results

- Focused Jest run: **3 suites / 55 tests passed**.
- Full final suite: `npm test --workspace=apps/mobile -- --runInBand --forceExit` — **54 suites / 533 tests passed**. Some existing asynchronous React test warnings remain in the full-suite log; no test failures.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json` — passed.
- Lint: `npm run lint --workspace=apps/mobile` — **0 errors, 14 existing warnings**.
- Production export: `npm run export:web --workspace=apps/mobile` — passed, **164 assets**, cache `baya-pwa-3a491bba412fd4f4`.
- Production browser: **all four requested sizes passed**, actual recognition result preservation, keyboard activation, 100 static reduced-motion samples, offline help and **zero runtime exceptions**.

## Visual evidence

The supplied screenshot is the before reference: [original help over the canvas](C:/Users/jomsa/AppData/Local/Temp/codex-clipboard-8308a79f-d7d9-48aa-b6c8-11391219eea8.png).

| Viewport | Closed | Open |
|---|---|---|
| 667 × 375 | [Closed](../sandbox/handwriting-help-relocation/help-closed-667.png) | [Open](../sandbox/handwriting-help-relocation/help-open-667.png) |
| 844 × 390 | [Closed](../sandbox/handwriting-help-relocation/help-closed-844.png) | [Open](../sandbox/handwriting-help-relocation/help-open-844.png) |
| 1024 × 768 | [Closed](../sandbox/handwriting-help-relocation/help-closed-1024.png) | [Open](../sandbox/handwriting-help-relocation/help-open-1024.png) |
| 1366 × 768 | [Closed](../sandbox/handwriting-help-relocation/help-closed-1366.png) | [Open](../sandbox/handwriting-help-relocation/help-open-1366.png) |

Also inspected: [small-screen optional technical detail](../sandbox/handwriting-help-relocation/help-technical-667.png), [real recognition result](../sandbox/handwriting-help-relocation/help-result-closed-667.png), and [result/mascot reached through internal scrolling](../sandbox/handwriting-help-relocation/help-result-scrolled-667.png). Small phones intentionally scroll the right panel internally; the help control, canvas and footer stay fixed.

The ignored `sandbox/handwriting-help-relocation/` folder contains the browser harness, `browser-results.json`, screenshots and verification logs.

## Files

Modified:

- `apps/mobile/components/learner/writing/WritingInstructions.tsx`
- `apps/mobile/components/learner/writing/ConfidenceCard.tsx`
- `apps/mobile/components/learner/writing/WritingPracticeScreen.tsx`
- `apps/mobile/components/ui/AppIcon.tsx`
- `apps/mobile/components/ui/ioniconPaths.web.ts`
- `apps/mobile/components/learner/writing/__tests__/WritingInstructions.test.tsx`
- `apps/mobile/components/learner/writing/__tests__/WritingPracticeScreen.recognition.test.tsx`
- `docs/stakeholder-feedback-review.md`

Created:

- `apps/mobile/components/learner/writing/__tests__/ConfidenceCard.test.tsx`
- `docs/handwriting-help-relocation.md`

No files deleted. Existing unrelated working-tree changes were preserved. No commit, push or deployment was performed.
