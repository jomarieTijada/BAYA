# BAYA illustrated origin storybook

Implemented locally on November 15, 2026. Existing unrelated working-tree changes were retained; no publication, commits, or database changes were made.

## Implementation

The welcome invitation is now one compact, keyboard-accessible card. Learner and Mentor callbacks and destinations are unchanged. Opening it starts a five-page illustrated book; Finish Reading and Close return to the same welcome screen.

The reading surface follows the Topics design: a consistent left illustration and right reading column, warm cream surface, shared typography/colors/buttons, and bottom navigation. It deliberately avoids importing curriculum state or changing lesson layouts. The illustration occupies 46% of the desktop content width. Below 760px it stacks above the text. The reading area scrolls independently of the header and footer, including on short landscape screens and with larger text.

Web page turns use browser-native Web Animations with perspective, a small directional rotation, opacity, and a moving shadow. Two 240ms phases plus a paint boundary keep text from changing while visible. Rotation never reaches the mirrored back face. A synchronous lock prevents rapid clicks and reversal during a turn; unmount cancels in-flight effects and prevents stale state commits. Reduced motion changes pages instantly. Native platforms use a lightweight fade fallback.

The modal has a dialog label, headings, image descriptions, touch-sized controls, keyboard focus containment, Escape dismissal, heading focus and page announcements. Focus returns to the invitation after closing. The reading session is mounted independently of the welcome screen's responsive branches, preserving the page on rotation. A narrowly scoped portrait exception permits the welcome route to display on mobile browsers; learning routes retain their existing landscape guard.

## Content and images

| Page | Content | Existing local imagery |
| --- | --- | --- |
| Meet Bayani! | Friendly opening and learning invitation | Unchanged mascot resting frame |
| The Story Behind Bayani | Philippine eagle inspiration; distinguishes the documented real eagle from the illustrated companion | Same original mascot |
| The Story of BAYA | Guided lessons, handwriting practice, quizzes and activities | Mascot plus A/Ba/Ka/Ma images |
| Discovering Baybayin | Traditional script, syllables, and correct upper/lower kudlit sounds | A/Ba/Ka/Ma images |
| A Journey Made Possible Together | Educational-content acknowledgements and closing message | Same original mascot |

Both English and Tagalog use the existing saved language provider. The new content configuration supplies parallel pages without adding preferences or persistence.

Mascot source: `apps/mobile/assets/branding/baya/idle/frame-000.png`, through the unchanged public BayaMascot component. No authoritative illustrator identity was found; the displayed credit states this instead of inventing one.

Character sources: `apps/mobile/assets/illustrations/baybayin/gavino/{a,ba,ka,ma}.png`, through the existing `baybayinAssets` registry. Their caption identifies the bundled Gavino learning assets; it does not invent a license or transfer authorship to the mascot. Images avoid font fallback/missing-glyph problems.

The existing `originStoryContent.ts` and `docs/COMPLIANCE-02-MASCOT-INTRODUCTION.md` document the real eagle naming connection. The new story preserves that connection without adding a biography or implying Philippine Eagle Foundation endorsement. The uncleared photograph remains unbundled; no remote imagery is fetched.

The final acknowledgement block names **Buhayin Baybayin** and **Ginhawa Baybayin Creativity Workshops** under Educational Content and Cultural Guidance, then **Ma'am Mini Gavino** under Special Thanks, with: “For guidance and support in the development and review of BAYA’s educational content.” These are educational acknowledgements, not claims of sponsorship, ownership, certification, or illustration authorship. The final message is “Our Baybayin journey is just beginning!”

## File inventory for this task

Created:
- `apps/mobile/components/landing/OriginStorybook.tsx` — responsive modal and reusable page renderer.
- `apps/mobile/components/landing/storybookContent.ts` — typed bilingual five-page content and UI copy.
- `apps/mobile/components/landing/useStorybookTurn.ts` — cancellable, directional turn transaction.
- `scripts/testing/baya-storybook.mjs` — isolated Chrome production/offline/viewport checks and screenshots.
- `docs/BAYA-STORYBOOK.md` — this report.
- `docs/verification/baya-storybook/` — visual evidence and machine-readable browser results.

Modified existing working-tree files:
- `apps/mobile/components/landing/MascotOrigin.tsx` — compact interactive invitation and standalone modal fallback.
- `apps/mobile/components/landing/LandingHero.tsx` — stable modal ownership across responsive layout changes.
- `apps/mobile/components/landing/__tests__/MascotOrigin.test.tsx` — tests updated for the requested five-page flow, bilingual state, and retained image-permission safeguards.
- `apps/mobile/components/layout/LandscapeGuard.tsx` — opt-in portrait support.
- `apps/mobile/components/layout/__tests__/LandscapeGuard.test.tsx` — portrait exception and regression coverage.
- `apps/mobile/app/_layout.tsx` — enable portrait only on the welcome route.

No source files or assets deleted. Some modified files were already untracked/modified before this task; this list describes task edits, not all differences from Git HEAD. Production output regenerated in `apps/mobile/dist`.

## Verification

- Full existing Jest run: **75 suites, 778 tests passed**. Existing act-related warnings were emitted; no test failures were hidden.
- Follow-up relevant tests after the final rotation fix: **6 suites, 30 tests passed**, including the new portrait guard regression.
- TypeScript: `npx tsc --noEmit -p apps/mobile/tsconfig.json` — passed.
- Lint: `npm run lint --workspace mobile` — passed without errors or warnings.
- Production: `npm run export:web --workspace mobile` — passed, including the service-worker postexport step.
- Offline manifest: `node apps/mobile/scripts/generate-pwa-service-worker.mjs --check` — passed, 164 precached assets. Existing caching automatically includes the unchanged local mascot and glyph assets; no cache configuration changes were necessary.
- Browser evidence: `verification/baya-storybook/browser-report.json`, including actual tested viewports, screenshots, and assertions.

## Visual evidence

Desktop: [welcome](verification/baya-storybook/desktop-welcome.png), [page 1](verification/baya-storybook/desktop-page-1.png), [page 2](verification/baya-storybook/desktop-page-2.png), [page 3](verification/baya-storybook/desktop-page-3.png), [page 4](verification/baya-storybook/desktop-page-4.png), [page 5](verification/baya-storybook/desktop-page-5.png).

Phone: [opening illustration](verification/baya-storybook/390x844-page-1.png), [reading](verification/baya-storybook/390x844-page-1-reading.png), [Baybayin](verification/baya-storybook/390x844-page-4-reading.png), [small-phone acknowledgements](verification/baya-storybook/320x568-page-5-reading.png). The evidence folder also contains every page at 320×568, 390×844, 844×390, and 1024×768, with scrolled reading captures on compact screens.

Motion: [forward turn](verification/baya-storybook/forward-turn.png), [backward turn](verification/baya-storybook/backward-turn.png). These are mid-animation evidence, not static reading states.

## Remaining limitations

- No physical Android device was connected (`adb devices` returned an empty device list). Chrome viewport/Android-user-agent emulation is not physical Android performance or TalkBack testing.
- Native Android/iOS builds were not run. The existing native app configuration still declares landscape orientation; native transitions use the fade fallback. Web/PWA portrait support was implemented and tested.
- The mascot illustrator is undocumented. The real-eagle photograph remains excluded because reuse authorization has not been established.
- Educational copy and Tagalog translations should receive the project's usual subject-matter/native-speaker review; no new external content certification is claimed.
- Short landscape screens and the longer acknowledgement page intentionally scroll; controls remain pinned and content is not shrunk to fit.

## Final browser result

**56 assertions passed; 44 screenshots captured.** Verified all five pages at five viewport sizes, forward/backward animation, repeated clicks, closing mid-turn, fresh reopening, Escape, focus restoration/containment, reduced motion, rotation preservation, and all five pages with loaded images after an offline reload. The final production service-worker cache is `baya-pwa-2804fb61da44f890`.
