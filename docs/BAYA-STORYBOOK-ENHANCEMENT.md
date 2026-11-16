# Final storybook enhancement — 16 November 2026

## Implementation

Page 1 now says **Meet BAYA!** / **Kilalanin ang BAYA!**, with parallel opening copy distinguishing the application from companion Bayani. A new greeting timeline reuses all 25 existing right-wing wave frames at 60ms each, preceded by 300ms at rest and followed by the exact canonical idle/frame-000.png. Total greeting: 1.8 seconds, no looping. Existing decoded-frame preload and renderer are reused; no artwork, anatomy, body transforms or global ambient behavior changed. The storybook supplies reduced-motion and turn-state controls. Reduced motion is static; turning pauses the greeting. Unmount clears timers.

Page 2 displays the supplied photographic collage, preserving its complete 1024:614 aspect ratio. No camera card remains. Historical narrative is retained in English and Tagalog. Caption: Bayani — Philippine Eagle Chick No. 32. Credit: Historical source: Philippine Eagle Foundation. Link: Read Bayani’s Story. The alt text explicitly describes a collage and does not identify the two background birds.

Page 5 displays both supplied artworks with contain-fit, full edges, embedded markings and captions. Cards sit side by side where space permits and stack on phones. They are described as artwork, not verified official logos. All contributor acknowledgements, Ma’am Mini Gavino, closing message and Finish Reading remain. Pages 3 and 4 retain their learning and kudlit imagery unchanged. Existing modal, turn hook, navigation and learner/mentor routes remain.

## Assets and publication status

The two attached briefs are byte-identical. Their section 1.2 expressly authorizes local integration, previews and tests; it does not establish public reproduction rights. **This checkout and export are local review artifacts. Public publication remains blocked until rights are documented.** No deployment was performed. Do not publish the generated dist directory without resolving these asset permissions.

| Supplied original | Repository path under apps/mobile/assets/storybook/ | Size and treatment |
|---|---|---|
| bayani_pic.avif | bayani-real/bayani_pic.avif | 1024×614, 55,163 bytes; original preserved, not imported into runtime |
| same image, compatibility derivative | bayani-real/bayani_pic.jpg | 1024×614, 133,361 bytes; JPEG quality 92, no crop or visual alteration; runtime uses this file |
| baybayin_buhayin_logo.jpg | acknowledgements/baybayin_buhayin_logo.jpg | 960×948, 81,951 bytes; unchanged |
| baybayin_creativity_workshops_classes_logo.jpg | acknowledgements/baybayin_creativity_workshops_classes_logo.jpg | 2048×2048, 781,459 bytes; unchanged to preserve texture |

Original hashes and dimensions are recorded in asset-register.json. All three are owner-supplied local-preview assets, **public/offline redistribution permission pending**. No photographer, compositor, illustrator, copyright transfer or license is invented. Buhayin artwork contains existing edge markings (including SENADO 2024); the supplied image already has partially cut edge text, which has not been altered or further cropped. Official logo status and exact artwork attribution remain unconfirmed for both acknowledgement images. The GINHAWA program link establishes program context, not the artwork license.

## Historical and image-source review

[PEF family article](https://www.philippineeaglefoundation.org/post/princess-maasim-from-near-tragedy-to-conservation-legacy), Dakila’s Line, supports Chick 32, Dakila/Sinag parentage and LDI grandmother lineage. [PIA](https://pia.gov.ph/news/help-needed-to-complete-philippine-eagle-breeding-facility/) supports December 5, 2025 at the Davao sanctuary; [Philstar](https://www.philstar.com/headlines/2026/03/10/2513328/philippine-eagle-foundation-announces-new-chick-bayani) supports the meaning hero and public introduction. Project thesis establishes the separate BAYA naming decision.

The additional [PEF international-partnership article](https://www.philippineeaglefoundation.org/post/from-czech-zoos-to-safer-power-lines-denr-and-pef-strengthen-international-partnerships-to-save-the) was inspected. It identifies Sinag, Dakila and Bayani in a separate three-image gallery; this does not independently establish the identities of the birds in the supplied collage. Its opening text refers broadly to breeding in 2026, whereas the gallery caption says hatching in 2025. The specific PIA birth date is retained. The exact collage source/compositor remains unverified. It is not substituted for the previously identified PEF documentary photograph and is not credited wholesale to PEF.

[GINHAWA programs](https://ginhawa.net/programs.html) supports the workshop context. No verified official Buhayin domain was established. Acknowledgements are project-supplied, with no implied sponsorship or certification. No new external language/content review occurred.

## Files changed

- branding/baya/animationAssets.ts: adds greeting timeline without altering existing timelines.
- landing/StorybookVisual.tsx: greeting, supplied collage and two artwork cards, bilingual descriptions.
- landing/OriginStorybook.tsx: passes transition-busy state to visual renderer.
- landing/storybookContent.ts: opening narrative and bilingual asset/source labels.
- landing/originStoryContent.ts: local-preview asset configuration and publication-block status.
- landing/__tests__/MascotOrigin.test.tsx: updated content/asset expectations and both-artwork regression.
- landing/__tests__/storybookGreeting.test.tsx: timing, original frames, exact return, one-shot playback, cleanup and reduced-motion tests.
- scripts/testing/baya-storybook*.mjs: updated local-image assertions, fresh output folders and greeting captures.
- assets/storybook/: three supplied originals, one JPEG derivative and asset register.
- docs/verification/baya-storybook-enhancement/: fresh evidence; prior audit evidence preserved.

Component paths above are under apps/mobile/components/. No database, recognition, model or lesson changes. Existing working-tree work and thesis preserved. No commit or deployment.

## Checks and evidence

TypeScript and lint passed. Production Expo web export passed, with existing expo-sqlite export-resolution and terminal color warnings. Service-worker verification passed: **185 precached assets**, cache baya-pwa-0210cfaf470f0be1. The three runtime images are locally cached for this authorized development test; this does not grant public offline redistribution rights. No model-cache strategy change.

Full Jest run: **76 suites, 785 tests passed**. Subsequent greeting suite: **3 tests passed**. Jest uses the existing force-exit approach for retained asynchronous handles.

Comprehensive browser: **206 checks passed, 188 screenshots**. All five pages and both languages at 320×568, 390×844, 430×932, 844×390, 768×1024, 1024×768, 1280×800 and 1440×900. Verified source/image integrity, dialog semantics, keyboard focus, reduced motion, rapid clicks, turn cancellation, resizing, enlarged text, offline reload in both languages and learner/mentor destinations. Actual contact sheets at all eight sizes were inspected. No clipped image content, horizontal overflow or inaccessible footer observed; small screens intentionally scroll.

Evidence directory: [all captures and reports](verification/baya-storybook-enhancement/).

- [Page 1 mid-wave](verification/baya-storybook-enhancement/greeting-mid-wave.png)
- [Page 1 returned to rest](verification/baya-storybook-enhancement/greeting-returned.png)
- [Page 2 collage](verification/baya-storybook-enhancement/en-1280x800-page-2.png)
- [Page 5 artwork](verification/baya-storybook-enhancement/en-1280x800-page-5.png)
- [All pages desktop, English/Tagalog](verification/baya-storybook-enhancement/review-1280x800.jpg)
- [All pages mobile, English/Tagalog](verification/baya-storybook-enhancement/review-390x844.jpg)
- [Landscape](verification/baya-storybook-enhancement/review-844x390.jpg)

Remaining limitations: public asset permissions and exact attribution unresolved; no native Android/iOS or installed-PWA validation, no TalkBack/VoiceOver audit, no external educational or Tagalog certification. User-supplied collage subjects beyond the narrative’s verified Bayani history are not individually identified.

## Physical-device result

Samsung SM-S911B, Chrome 157.0.8103.51: comprehensive rerun **47 checks passed, 29 screenshots**, including greeting rest/wave/return, both languages and offline reload. Short measured turn interval 553ms, no observed long tasks in that sample. The first attempt stopped after an unexpected page reload with an empty root; its failure report is retained under android/. Cause was not conclusively established. A fresh retry passed without an application change; successful evidence is under android-retry/.

No human-finger study or native build is claimed. Existing-frame greeting includes the original small head/pose movement; no additional body-rotation animation is applied.

Physical Chrome portrait/landscape touch run: **13 checks passed, 22 screenshots**, including swipes on all five pages, reachable navigation and opening the PEF source. Evidence: [touch report](verification/baya-storybook-enhancement/android-touch/browser-report.json). Landscape uses a scrollable content area; images remain proportional and fully available by scrolling. Device rotation is restored by the test cleanup. Offline checks use browser network emulation, not an installed PWA or native build.

