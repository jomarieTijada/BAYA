# BAYA System Compliance #2 — Mascot introduction

Date: 7 November 2026. Status: implemented with the explicitly requested photo-permission fallback. **Authentic photo integration remains blocked pending authorization; educational wording awaits subject-matter review.** No commit, push or deployment was performed.

## A. Panel recommendation

> “Introduce the mascot”

SYSTEM No. 2; Welcome Screen; Panel Member 2. No other compliance requirement is implemented by this change.

## B. Research sources and claim verification

Sources checked on 7 November 2026:

| Claim | Supporting reference |
| --- | --- |
| Bayani is Chick No. 32, captive-bred; mother Dakila, father Sinag; cooperative artificial insemination | [Philippine Eagle Foundation: Princess Maasim — From Near Tragedy to Conservation Legacy](https://www.philippineeaglefoundation.org/post/princess-maasim-from-near-tragedy-to-conservation-legacy), especially the Dakila’s Line section and caption explicitly identifying Bayani |
| Hatched December 5, 2025; National Bird Breeding Sanctuary, Barangay Eden, Toril, Davao City | [Philippine Information Agency, Rudolph Alama, May 11, 2026](https://pia.gov.ph/news/help-needed-to-complete-philippine-eagle-breeding-facility/) |
| Public introduction March 10, 2026; Bayani means hero; adopter Nico Herth of Procon Grumbach chose the name | [Philstar, Cristina Chi, March 10, 2026](https://www.philstar.com/headlines/2026/03/10/2513328/philippine-eagle-foundation-announces-new-chick-bayani) |
| Philippine eagles are critically endangered | [Philippine Eagle Foundation: The Philippine Eagle](https://www.philippineeaglefoundation.org/philippine-eagle) |
| BAYA is the shortened form of Bayani and the application’s fictional companion | Local manuscript and researcher brief, described separately below |

The child-facing story uses short original paraphrases. Cooperative artificial insemination is documented here as the verified breeding method, while the child-facing text explains breeding in human care. No sex, current location, release into the wild, institutional endorsement or partnership is asserted. The conservation message and the researchers’ creative inspiration are kept distinct. The supplied MindaNews link returned 403 during research and was not used as evidence. The sanctuary campaign page was accessible only partially/intermittently and is not needed to support the implemented claims.

## C. Authentic photograph and permission decision

- **Identified subject:** Bayani, Philippine Eagle Chick No. 32, in the PEF family-history article’s Bayani caption. The article also contains other eagles; the first/hero image is not the Bayani image and must not be substituted.
- **Original source:** [PEF article](https://www.philippineeaglefoundation.org/post/princess-maasim-from-near-tragedy-to-conservation-legacy), Bayani image under Dakila’s Line.
- **Publisher / likely rights contact:** Philippine Eagle Foundation. The site footer asserts © 2025 Philippine Eagle Foundation. This is a copyright notice, not a redistribution license, and does not independently establish the photographer’s ownership or all underlying rights.
- **Photographer:** not identified in the Bayani caption inspected; must be confirmed with the rights holder.
- **License/authorization:** none found for this photograph. The article, site navigation/footer and targeted PEF permission/license searches did not establish a reusable image license. Search results about licenses for unrelated scientific papers do not license this photograph.
- **Repository audit:** no identifiable Bayani photo accompanied by source and authorization was found in the asset inventory or project documentation. Existing branding assets are BAYA artwork, not a documentary Bayani photograph.
- **Bundled asset path:** none. No external eagle photograph was downloaded, transformed, hotlinked, cached or bundled for this feature.
- **Current UI:** an honest photograph-awaiting-permission notice, the required bilingual Bayani caption, “Photo source: Philippine Eagle Foundation” credit and an explicit online link to the official article. It never labels the fictional mascot as Bayani’s photograph.
- **Offline limitation:** the local story and official BAYA artwork work offline after caching. Viewing the external photograph requires internet access. A failed URL launch has localized feedback; a browser opening an offline external page can show its own network error.

### Exactly what is needed to unblock the photo

Obtain an authorized image file of this identified Bayani and written permission or a published license from the actual rights holder covering reproduction and redistribution inside BAYA, offline PWA/service-worker caching, intended web/mobile distribution, and reasonable resizing/compression. Confirm photographer credit, required wording, any watermark, restrictions and duration. PEF lists `info@philippineeaglefoundation.org` on its website; no request was sent by this task.

After authorization: record the grant and exact original image URL/file, add one local canonical asset, preserve aspect ratio with contain-fit, retain the eagle’s head and any required watermark, add meaningful bilingual alt text and the required caption, and verify offline rendering. Update `bayaniPhoto` in `originStoryContent.ts` and replace only the permission notice with the approved image and attribution. The photo acceptance criterion must remain unchecked until then.

## D. Documented naming origin

`CHAP_2_draft_2_101226 (LATEST) (1).docx`, “Operational Definition of Terms — BAYA,” defines BAYA as the shortened name of Bayani, a captive-bred Philippine eagle, adopted for the Baybayin Interactive Learning System. The researcher-supplied implementation brief additionally identifies the eagle as the mascot’s inspiration and requests the fictional learning-companion narrative. These are project-design sources, not a claim that PEF named, developed or endorsed BAYA. The story explicitly distinguishes the real eagle from the fictional character and identifies BAYA as an independent research project.

## E. Before and after

Before: Welcome displayed the established logo, animated official mascot, greeting and learner/mentor role selection, with no origin-story entry.

After: the same role selection and routes remain, with a compact “The Story Behind BAYA” teaser and “MEET BAYANI” action. Wide layouts include a short explanatory sentence; compact layouts keep the heading and action. No new onboarding route or automatic popup is introduced.

## F. Implementation

`MascotOrigin` owns only transient open/step/link-error state. Four ordered sections introduce Bayani (with the authorized fallback), conservation and name origin, the researchers’ naming connection, then BAYA’s learning role. Next, Back, Close and the final “LET’S START!” action use the shared `BayaDialog`; the final action dismisses the story to the existing role chooser rather than bypassing learner/mentor selection. Reopening starts at the first section. There are no database, progress, authentication, model or network-content dependencies.

The shared dialog receives one optional `contentKey` property to reset internal scrolling between sections. Existing dialogs retain their behavior. The existing dialog provides bounded viewport sizing, a single internal scroll area, focus management and reduced-motion-aware entrance/exit animation. The story does not add endless animation: its final mascot is the canonical resting frame via `BayaMascot` with autoplay disabled. All text is available without sound. Navigation remains within the dialog’s scroll area on short screens; lower-content captures show the actions and remaining paragraphs.

All new strings use typed `origin.*` entries in Compliance #1’s existing `en.ts` and `tl.ts` and the existing provider. No second locale system or preference is created. Changing the locale updates the currently open section without resetting its step. The existing saved language is reused.

## G. Reused assets

- `apps/mobile/components/branding/BayaMascot.tsx`
- `apps/mobile/components/branding/baya/BayaFrameRenderer.tsx`
- `apps/mobile/components/branding/baya/animationAssets.ts`
- `apps/mobile/assets/branding/baya/idle/frame-000.png` — canonical resting frame used for the final introduction.
- Existing Welcome ambient mascot animation continues to use the canonical idle/wave frames.

No mascot asset or appearance was changed. No new artwork, stock bird, AI photograph or cartoon eagle was created or downloaded.

## H. Task-modified files

| Exact repository-relative path | Purpose |
| --- | --- |
| `apps/mobile/components/landing/LandingHero.tsx` | Add the optional teaser in both existing responsive layouts |
| `apps/mobile/components/landing/MascotOrigin.tsx` | Four-part story, source-link fallback, canonical mascot and transient interaction |
| `apps/mobile/components/landing/originStoryContent.ts` | Ordered typed sections, source metadata and explicit pending photo rights |
| `apps/mobile/components/ui/BayaDialog.tsx` | Optional content key resets internal scroll between story sections |
| `apps/mobile/localization/en.ts` | English story/interface resources |
| `apps/mobile/localization/tl.ts` | Tagalog story/interface resources |
| `apps/mobile/components/landing/__tests__/MascotOrigin.test.tsx` | Content, ordering, interaction, locale and permission-fallback checks |
| `apps/mobile/hooks/__tests__/useReducedMotionPreference.test.tsx` | Move the existing hook call to the test component’s top level to satisfy fresh lint; behavior unchanged |
| `scripts/testing/compliance-02-accessibility.mjs` | Keyboard containment/activation, role routes and offline English checks |
| `scripts/testing/compliance-02-contact-sheets.py` | Generate paired review sheets |
| `scripts/testing/compliance-02-browser.mjs` | Reproducible paired viewport, dismissal and offline checks |
| `docs/COMPLIANCE-02-MASCOT-INTRODUCTION.md` | Research, rights decision, implementation and review evidence |
| `docs/verification/compliance-02/` | PNG screenshots, browser report and validation summary |

The checkout already contained unrelated modifications, including Compliance #1. They were preserved. No app route, local schema, curriculum, Supabase contract or recognition model was modified for this task.

## I. Testing

Focused Welcome/story suites: 13 tests passed. This covers optional opening, required sequence, facts and name connection, no substituted photo, Close/reopen, final dismissal, English/Tagalog resources, mid-story language change and source-link failure. Existing LandingHero tests verify learner/mentor callbacks are preserved. **Full suite: 669 tests passed across 70 suites, 0 failures.** A subsequent two-test reduced-motion check passed after the test-harness hook correction. Results are recorded in [validation-summary.json](verification/compliance-02/validation-summary.json). Jest used `--runInBand --forceExit --silent` because the existing suite retains asynchronous handles; passing assertions do not certify handle cleanup.

TypeScript passed. Fresh lint (`npm run lint --workspace apps/mobile -- --no-cache`) passed with zero errors/warnings. Production export passed, including the service worker with 163 cached assets. Browser evidence is in `verification/compliance-02/browser-report.json`. Browser checks passed for Tab containment, Enter navigation, Escape dismissal, focus restoration, learner/mentor entry and offline English/Tagalog story display. See [keyboard-navigation-report.json](verification/compliance-02/keyboard-navigation-report.json). Tests validate content consistency; they do not replace historical sourcing, a native-speaker review or photo permission.

To reproduce browser checks: export the mobile web app, run `node scripts/testing/compliance-01/browser-server.mjs` in a separate terminal (isolated headless Chrome and local production server), then run `node scripts/testing/compliance-02-browser.mjs` and `node scripts/testing/compliance-02-accessibility.mjs` from the repository root. No external photograph is loaded by the script. Stop the test server/browser afterward.

## J. Visual evidence

English and Tagalog captures cover 667×375, 844×390, 915×412, 1024×768 and 1366×768. Screenshot names use `{en|tl}-{screen}-{width}x{height}.png` in `docs/verification/compliance-02/`.

Screens: `welcome`, `bayani-permission-pending`, `bayani-story`, `name-origin`, `baya`, `dismissed`. Additional `part-N-scrolled` captures show the lower content and navigation on the three compact landscape sizes. The `bayani-permission-pending` images deliberately show the honest fallback; they are **not evidence of an integrated photograph**. The JSON report enumerates all 84 exact screenshot paths and observed text. No page-level horizontal overflow was detected. Visual inspection covered both languages across all five sizes and the compact scrolled states; text remains accessible through internal scrolling. Reviewed sheets: [Welcome](verification/compliance-02/review-welcome.jpg), [photo-permission fallback](verification/compliance-02/review-bayani-permission-pending.jpg), [Bayani story](verification/compliance-02/review-bayani-story.jpg), [name origin](verification/compliance-02/review-name-origin.jpg), [BAYA](verification/compliance-02/review-baya.jpg), [dismissed Welcome](verification/compliance-02/review-dismissed.jpg).

## K. Remaining limitations

1. Photo integration is blocked by unestablished rights. No documentary Bayani photo is bundled. The official source link is online-only.
2. All `origin.*` educational wording in both languages is draft content pending subject-matter/native-speaker review for accuracy, age suitability and terminology. The source research supports the factual claims but is not content approval.
3. No Android/iOS device or native screen-reader session was exercised. Browser focus/keyboard checks and component tests do not establish complete accessibility compliance.
4. Future authorized-photo aspect ratio, cropping, file optimization, attribution requirements and offline image display cannot be verified until that asset exists.
5. The final invitation returns to the existing role chooser; it intentionally does not auto-enter a learner account or modify progress.

## L. Compliance matrix remarks

Implemented an optional bilingual Welcome origin story that introduces the real Bayani before explaining the researchers’ naming decision and presenting the existing BAYA mascot. The story uses centralized localization and the shared responsive dialog, preserves role entry and works offline with bundled mascot artwork. Photo identification and source are documented, but reuse permission was not established; a credited online source and honest pending-permission notice are provided. Authentic photo integration and educational validation remain outstanding, so full compliance closure is not claimed.
