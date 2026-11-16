# BAYA storybook — final UI/UX audit and verification

Date: November 15, 2026. Local changes only; not committed or deployed.

## A. Executive summary

The existing five-page storybook was refined, not rebuilt. The Topics-inspired illustration-left/text-right spread, cream palette, original artwork, bilingual story, acknowledgements and offline behavior remain intact. Confirmed visual, contrast, scroll-lifecycle and animation-recovery defects were corrected. The web experience is suitable for staging review subject to the limitations below; this is not production approval or subject-matter certification.

All 44 original screenshots were reviewed in six labelled contact sheets. Final review covers both languages at eight actual CSS viewport sizes, reading-area scroll endpoints, motion, enlarged text and offline states. Original evidence was preserved. The final evidence lives in [baya-storybook-final](verification/baya-storybook-final/).

No physical Android device was connected. Native builds, actual TalkBack speech, installed-device PWA behavior, and physical touch/rotation performance remain unverified.

## B. Findings, root causes and fixes

| Issue / severity | Affected state | Root cause | Targeted correction / evidence |
| --- | --- | --- | --- |
| Undersized character illustration — medium | Page 4, desktop/tablet | Percentage-width tiles inside an intrinsically sized parent | Explicit full-width glyph composition, capped at 380px. [Before](verification/baya-storybook/desktop-page-4.png), [after](verification/baya-storybook-final/en-1440x900-page-4.png). |
| Awkward 3+1 glyph row — medium | Page 3, 320px phone | Four fixed-width tiles plus gaps exceeded the available width | Proportional 21% tiles retain one balanced row. [Before](verification/baya-storybook/320x568-page-3.png), [after](verification/baya-storybook-final/en-320x568-page-3.png). |
| Initial landscape artwork mostly below fold — medium | Pages 1–5, 844×390 | Visual column centered against the full height of long reading text | Top-align artwork on short screens; size mascot and headings for available space. [Before](verification/baya-storybook/844x390-page-2.png), [after](verification/baya-storybook-final/en-844x390-page-2.png). Credits and long text remain reachable by scrolling. |
| Crowded intermediate columns — medium | Portrait tablet, 768px | Desktop split began at 760px, leaving a narrow text column | Portrait widths below 900px stack; short landscape retains its useful spread. [After](verification/baya-storybook-final/en-768x1024-page-2.png). |
| Weak normal-text contrast — high | Previous/Next/Finish across pages | Existing bright orange gave white text only 2.93:1 contrast | Scoped darker orange-brown navigation; main action 5.91:1, secondary text 5.85:1. Close control uses the existing muted icon tone with a matching dark border. [Measurements](verification/baya-storybook-final/contrast.json). Other application buttons are unchanged. |
| Inconsistent/small attribution — low | All image regions | Credit text was 12px and left-aligned within centered illustrations | 13px/19px credits, centered below artwork. No invented authorship. |
| Scroll jumps when a turn starts — medium | Scrolled pages, especially phones | One effect reset scroll on `busy`, page and language changes | Scroll reset now depends only on page index. Browser checks retain outgoing scroll during the first phase and reset the incoming page to top. |
| Turn expands/clips and disappears too early — medium | Forward/backward mid-turn | Rotation sign projected the free edge toward the viewer; early opacity easing hid the motion | Recede the free edge, use opposite incoming pivot, retain opacity through an intermediate keyframe, keep two 240ms phases. [Before](verification/baya-storybook/forward-turn.png), [after](verification/baya-storybook-final/forward-turn.png), [reverse](verification/baya-storybook-final/backward-turn.png). |
| Failed effect could leave invisible content — high, failure path | Rejected Web Animation | Catch released the lock but did not restore presentation | Commit the intended destination and restore opacity/cancel residue on live failures. Unit test injects a rejected animation. |
| Credit used as mascot alternative — medium | Accessibility tree, all mascot pages | Renderer reused the attribution string | Dedicated English/Tagalog description identifies the eagle, glasses and woven hat; credit remains separate. [AX tree](verification/baya-storybook-final/accessibility-tree.json). |
| Potential duplicate page announcements — low | Page changes | Explicit announcement plus a live progress region | Keep one explicit page announcement; retain the visible and accessible page label. Actual reader speech still requires device QA. |
| No hover feedback on invitation — low | Pointer welcome interaction | Only pressed/focus state existed | Subtle hover background reuses the existing pressed treatment; primary role actions retain dominance. |

No confirmed critical failures were found. Text outside the currently visible scroll window is not clipped from the document: endpoint captures and scroll-height checks establish reachability. Header/footer stay outside the scroller.

## C. Storytelling, illustrations and bilingual content

The five-page sequence remains coherent: companion → eagle inspiration → BAYA's purpose → Baybayin → gratitude. Existing short paragraphs and transitions were retained. **No storytelling paragraphs, titles, historical claims, or acknowledgements were rewritten.** The only new copy is descriptive mascot alternative text in both languages.

The original mascot frame and A/Ba/Ka/Ma assets remain unchanged and locally bundled. Glasses, hat, proportions, colors and accessories were preserved. Raster glyph assets avoid font substitution. Character-art credits remain distinct from mascot credits. The undocumented illustrator is still identified as undocumented, and the uncleared eagle photograph remains excluded.

English and Tagalog each have the same five ordered pages, navigation and acknowledgement block. Longer Tagalog headings wrap naturally. Buhayin Baybayin, Ginhawa Baybayin Creativity Workshops and Ma'am Mini Gavino remain named; the educational-content guidance wording does not imply ownership or endorsement. The copy was reviewed for equivalence and presentation, but native-speaker/subject-matter approval has not occurred.

## D. Motion and lifecycle

The existing Web Animations implementation and native fade fallback were retained. Forward/backward directions, rapid repeated and alternating clicks, close during a turn, immediate reopening, resizing during a turn, reduced-motion navigation, and animation-error recovery were checked. A component test changes the language during an active native-fallback transition and verifies the translated destination remains page 2.

The turn remains two 240ms phases plus a paint boundary; it does not rotate to a mirrored back face. Only one story page is in the DOM/accessibility tree at a time. Cancellation increments a generation token, so an unmounted session cannot commit into a reopened book. Scrolling now resets only when the destination page is installed.

A Chrome DevTools timeline trace and a Long Tasks observer were captured during stress interactions: [trace](verification/baya-storybook-final/animation-trace.json). See the machine-readable browser report for measured end-to-end turn duration and observed tasks. That duration includes screenshot/protocol polling overhead, so it is not a precise compositor animation duration or FPS measurement. No physical-device smoothness or GPU-compositing certification is claimed. The short fade handoff is intentional, not a photorealistic paper simulation.

## E. Responsive results

Both languages and all five pages were exercised at **320×568, 390×844, 430×932, 844×390, 768×1024, 1024×768, 1280×800 and 1440×900**. Each page has an initial and scrolled reading capture. Buttons remain in bounds, illustrations load, and the reading area has no sideways overflow.

Desktop and landscape tablets retain the spread. Narrow phones and portrait tablets stack. Short landscape screens show the artwork from its top and permit vertical reading without hiding Close or navigation. Long acknowledgement pages intentionally scroll. Browser resizing preserves the active page.

125%, 150% and 200% **zoom-equivalent CSS viewport/DPR reflow** was tested, plus injected 150% text sizing: [200% reflow](verification/baya-storybook-final/zoom-equivalent-2.png), [larger text](verification/baya-storybook-final/150-percent-text.png). These are explicit approximations, not a claim that Chrome toolbar zoom or a physical Android font-size setting was exercised. Actual toolbar/default-font/device text preferences remain a manual check.

## F. Accessibility and interaction

Verified Enter/Space activation, forward/reverse Tab containment, Escape dismissal, focus restoration, disabled Previous on page 1, named dialog, meaningful mascot alternative, headings and completion controls. The Chrome AX snapshot verifies structure; it does not prove NVDA/TalkBack speech behavior. Screen content is announced once per completed page change through the existing accessibility API.

Keyboard-driver investigation found that CDP required native virtual key codes/text for native button activation. The harness was corrected; no unnecessary product keyboard handler was added. Role-navigation tests use the actual accessible labels, “Continue as learner” and “Continue as mentor.” Both destinations remain correct.

Text contrast: body 15.93:1, credits/close icon 6.30:1, subtitle/secondary navigation 5.85:1, primary navigation 5.91:1. Disabled controls are visibly subdued and semantically disabled. Close is 44×44 CSS px; navigation is at least 48px high. Pointer activation and geometric touch targets were tested. Real finger scrolling, touch precision and screen-reader gestures await hardware.

## G. Physical Android status

`adb devices -l` returned an empty device list during this audit. **Physical testing was not performed.** No device model, Android version, memory measurement, hardware FPS or browser-touch pass is asserted.

Prepared [device instructions](verification/baya-storybook-final/PHYSICAL-ANDROID.md) and `scripts/testing/baya-storybook-android.ps1`. The wrapper rejects emulators, records device identity/version/display/RAM, and invokes the existing device-browser helper. The final browser script preserves actual hardware metrics when BAYA_ANDROID_SERIAL is set. Manual touch, rotation, installed-PWA and TalkBack checks are explicitly separated from injected browser input.

## H. Automated verification and count reconciliation

- TypeScript: passed (`npx tsc --noEmit -p apps/mobile/tsconfig.json`).
- Lint: passed (`npm run lint --workspace mobile`).
- Full Jest suite: **76 suites / 782 tests passed**, no skipped tests. [Inventory](verification/baya-storybook-final/test-inventory.json).
- Relevant final component/layout/shared-control tests: **10 suites / 43 tests passed**.
- Production Expo web export: passed, including the existing PWA postexport hook.
- Service-worker manifest check: passed; **164 precached assets**. No model/runtime/cache configuration was changed. A changed application bundle naturally changes the versioned cache identifier; no special model invalidation was introduced.
- Existing storybook browser script: **56 assertions passed**, 44 screenshots, in [legacy-checks](verification/baya-storybook-final/legacy-checks/browser-report.json), preserving original evidence.
- Expanded bilingual browser run: **187 assertions passed / 185 screenshots**; see [final report](verification/baya-storybook-final/browser-report.json). It includes layout, navigation, keyboard, AX, animation stress, zoom-equivalent reflow, larger text, and both languages after offline reload. Offline language switching uses the real settings screen and saved provider.

**779 versus 778:** The November 14 device-QA log (`.codex-tmp/device-qa-final-tests.log`) contains 75 suites/779 tests. The former MascotOrigin suite had six generated cases, including the explicit online photo-source-link failure case. The five-page story removed that external-link UI, and its rewritten suite had five cases: the obsolete link-error case was removed, producing 778. The later welcome-portrait guard regression added one case, restoring 779; the earlier report quoted the full run before that follow-up. There was no suite-discovery change or skipped test. This audit adds two animation transaction tests in one new suite and one in-flight language test: **779 + 3 = 782**, **75 + 1 = 76 suites**. Tests were not added merely to match totals.

Existing act/log warnings in the full suite were not hidden. The pre-existing repository-wide diff-check finding is an extra EOF blank line in unrelated `writingRecognitionPhases.test.ts`; it was not altered.

## I. File inventory

Modified in this audit:
- `OriginStorybook.tsx`: responsive presentation, scroll/focus separation, scoped contrast, captions and alternative text.
- `storybookContent.ts`: two localized mascot descriptions only.
- `useStorybookTurn.ts`: perspective/opacity tuning and recovery from a rejected effect.
- `MascotOrigin.tsx`: hover feedback.
- `components/ui/AppButton.tsx`: optional `labelStyle` prop; unused callers retain existing appearance and behavior.
- `landing/__tests__/MascotOrigin.test.tsx`: in-flight locale regression test.
- `scripts/testing/baya-storybook.mjs`: optional evidence-output directory, without changing existing assertions.

Created:
- `landing/__tests__/useStorybookTurn.test.ts`: failure recovery and synchronous lock/unmount cancellation tests.
- `scripts/testing/baya-storybook-final.mjs`: bilingual viewport matrix, keyboard, accessibility, stress, trace, scaling, offline and role-entry checks.
- `scripts/testing/baya-storybook-android.ps1`: physical-device follow-up wrapper.
- This report and `docs/verification/baya-storybook-final/` evidence, baseline source snapshot, contact sheets, test inventory and device instructions.

No source files/assets deleted. Generated production output was refreshed. Earlier uncommitted changes, including LandingHero, orientation handling, localization, model work and database work, were preserved. No authentication, learner progress, lesson, handwriting, model, database schema or synchronization logic changed.

## J. Remaining limitations and staging review

No known critical/high storybook defect remains in the exercised web flows. Remaining work is physical Android/TalkBack verification, actual installed-PWA/device font/toolbar zoom checks, native-platform validation, and normal content/translation review. Mascot illustrator attribution remains unresolved. These limitations must accompany staging review; they do not authorize production deployment.

The browser harness records failures rather than suppressing them. Earlier diagnostic stops were caused by keyboard event construction, an accessible-label mismatch in the test, and a preview server interruption; final results are from the corrected harness against the exported application.

Final trace summary: Chrome/157.0.8103.52; measured turn wall-clock including capture/polling 571ms; 0 observed >50ms Long Tasks in the sampled interaction window. Layout max 1.566ms, paint max 0.957ms across captured trace events. This is a bounded desktop observation, not a physical-device frame-rate guarantee. [Performance summary](verification/baya-storybook-final/performance-summary.json).
