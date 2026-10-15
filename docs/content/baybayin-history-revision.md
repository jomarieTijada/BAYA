# Baybayin introductory lesson: validator revision

Review date: 7 October 2026. Scope: Topic 1.1 invitation, historical wording, and source presentation.

## Latest presentation and navigation: GINHAWA credit

The user requested removal of the visible historical source block and its replacement with **Video Gawa ng: GINHAWA Inc**, linked to [GINHAWA's website](https://www.ginhawa.net/). The lesson now shows that accessible link after the historical paragraph. The older video preview uses the same centralized credit. NCCA research metadata remains in the content data for thesis traceability but is not displayed in this lesson; GINHAWA is explicitly credited for the video, not presented as the historical reference.

Fixed Topic 2 Back opening Topic 1's introduction again. Previous/next topic navigation now includes `lessonPage=content`; the activity route opens the target topic's content page, so returning to Topic 1 shows its video and history directly. A fresh lesson entry still starts with the separate introduction, and Back within Topic 1's video page can still return to that introduction. The content destination survives a page reload. Back and Next are both disabled while a completion save is pending; only Next saves topic completion.

Changed for this follow-up: `StorybookTopicScreen.tsx`, the learner activity route, `StoryNavigation.tsx`, `StoryContent.tsx`, new `VideoCreditLink.tsx`, `VideoActivityCard.tsx`, shared content/types/parser and Topic 1.1 preview data, relevant story/content tests, and this report.

Validation: **7 suites / 92 tests passed**; TypeScript, scoped ESLint, and web/PWA export passed. The tests cover previous/next topic ordering, module exit, no progress saves on Back, the intro gate, the exact GINHAWA link destination, credit serialization, and pending-save navigation guards. Production Chrome checks passed at the eight requested widths plus two short landscape widths. Actual route checks verified Topic 2 → Back → Topic 1 video/history → Next → Topic 2, content-page reload, and offline reload with the credit visible and no source block. The browser captured the URL passed to `window.open`; external-site rendering was not required for the link test. No browser runtime exceptions occurred.

Evidence: `sandbox/ginhawa-navigation-*.log` and `sandbox/ginhawa-navigation-browser-validation/`. Current PWA cache: `baya-pwa-b5f770ecbb0e937a`.

## Latest wording: Baybayin-focused history

At the user's request, the historical paragraph beside the video now focuses on Baybayin, its historical Tagalog association, and Philippine heritage. It contains no references to colonial groups, foreign arrivals, or colonial periods. The shared live/preview content reads:

> Ang Baybayin ay isa sa mga sinaunang paraan ng pagsulat sa Pilipinas. Sa mga tala ng kasaysayan, iniuugnay ito sa mga sinaunang Tagalog. Bahagi ito ng ating kultura at pamana bilang mga Pilipino.

The separate introductory slide, “Baybayin sa Kasaysayan” heading, historical source metadata, and existing BAYA takeaway remain. Earlier wording quoted in the original audit below is retained as revision history and is not current learner copy. The latest credit section above records the replacement of the visible source block.

## Follow-up: separate introductory slide

The user's clarification replaces the original same-page invitation presentation with a separate welcome slide. Opening Topic 1.1 now shows BAYA and the shared “Kilalanin natin ang Baybayin!” invitation. The video and historical paragraph appear only after “Panoorin ang Video.” Back on the video page returns to the introduction; reopening the topic starts with the introduction again. The same invitation slide is used in the older activity preview.

This is local presentation state. Continuing from the introductory slide does not save progress, complete the topic, or navigate to a different topic. Existing completion behavior still applies on the video/history page. Historical copy, source metadata, curriculum ordering, and recognition behavior are unchanged.

Follow-up files: `StorybookTopicScreen.tsx`, `StoryNavigation.tsx`, `LessonVideoIntroduction.tsx`, `VideoActivityCard.tsx`, their story/activity tests, and this report. A keyed topic session resets the introductory presentation on re-entry. The existing mascot and navigation button are reused.

Follow-up validation: **5 relevant suites / 63 tests passed**, TypeScript and scoped ESLint passed, and the web/PWA export succeeded. Production Chrome checks passed at 360, 390, 430, 768, 1024, 1366, 1440, and 1600 px, plus 844 × 390 and 726 × 360 landscape. Screenshots confirm a standalone welcome slide with no mounted video, a visible watch button, and the following video/history page. Back navigation and offline introduction → video/history → expanded source also passed with no runtime exceptions. Evidence: `sandbox/intro-slide-*.log` and `sandbox/intro-slide-browser-validation/`. Current exported cache: `baya-pwa-24ff1e919b754a70`.

The 16-point audit below records the original content revision; its same-page presentation and earlier validation measurements predate this follow-up.

## 1. Validator feedback addressed

Added a brief invitation explaining what to watch and encouraging learners to read and write Baybayin afterward. Replaced the origin heading and opening with historical context that associates Baybayin with early Tagalogs without assigning it a definitive birthplace or inventor. Added a retrievable cultural source while keeping the learner paragraph short.

## 2. Files inspected

The audit followed the learner activity route through `components/learner/story/StorybookTopicScreen.tsx`, `StoryPage.tsx`, `StorybookTopicLayout.tsx`, `StoryContent.tsx`, `StoryGuide.tsx`, `StoryNavigation.tsx`, and `components/learner/LearnerAppShell.tsx`. It checked `components/media/VideoPlayer.tsx`, `components/learner/activity/VideoActivityCard.tsx`, the activity data/slide renderers, and responsive layout handling.

Content inspection covered `content/approvedStorybook.ts`, `approvedCurriculum.ts`, `topics/topic-1-1.ts`, `types.ts`, `parseActivity.ts`, `database/seed.ts`, and `database/services/activityContentService.ts`. Existing story, activity, parser, media, and database tests were reviewed. Paths are relative to `apps/mobile/`.

## 3. Source of truth

The live storybook gets Topic 1.1 from `apps/mobile/content/approvedStorybook.ts`; that content takes precedence over stored previews. Shared invitation, historical copy, and bibliography now live in `apps/mobile/content/baybayinIntroduction.ts` and are imported by both the live storybook and the older five-step activity data in `content/topics/topic-1-1.ts`.

Existing database seed serialization consumes the approved storybook data. No database code, migrations, schema, or progress rules were changed for this revision. Existing installations receive the bundled approved content through the existing service override.

## 4. Files modified for this revision

- `apps/mobile/content/baybayinIntroduction.ts` — new shared copy and source metadata.
- `apps/mobile/content/approvedStorybook.ts` — live lesson consumes shared copy.
- `apps/mobile/content/topics/topic-1-1.ts` — preview consumes the same copy.
- `apps/mobile/content/types.ts` — optional invitation/reference metadata in existing content types.
- `apps/mobile/content/parseActivity.ts` — validates and retains optional step metadata.
- `apps/mobile/components/learner/story/LessonVideoIntroduction.tsx` — new reusable invitation presentation.
- `apps/mobile/components/learner/story/LessonSource.tsx` — new reusable expandable attribution.
- `apps/mobile/components/learner/story/StorybookTopicScreen.tsx` — invitation immediately before the existing video/story spread.
- `apps/mobile/components/learner/story/StoryContent.tsx` — optional attribution after historical text.
- `apps/mobile/components/learner/activity/VideoActivityCard.tsx` — invitation in the existing preview video renderer.
- `apps/mobile/components/learner/story/__tests__/StorybookTopicScreen.test.tsx` — revised copy, source interaction, linking, and responsive regression checks.
- `apps/mobile/content/__tests__/baybayinIntroduction.test.ts` — new shared-content and serialization checks.
- `apps/mobile/database/__tests__/database.test.ts` — seed assertions updated to the revised content and source.
- This report.

Local validation helpers and screenshots are in ignored `sandbox/` storage. The generated web export was rebuilt. Changes from earlier ML, mastery, media, and database work already present in the checkout were preserved; they are outside this revision's scope.

## 5. Old video introduction

The live storybook had no explanatory invitation before the video. Its existing video title was “Baybayin Song.” The older preview had a video heading/badge, without the requested motivational introduction.

## 6. New video introduction

**Kilalanin natin ang Baybayin!**

Panoorin ang maikling video at tuklasin ang Baybayin—isang sinaunang paraan ng pagsulat sa Pilipinas. Pagkatapos, sabay nating kilalanin, basahin, at isulat ang mga karakter nito!

This preserves the recommended wording verbatim.

## 7. Old heading

“Ang Pinagmulan ng Baybayin” in the live storybook and introductory history preview.

## 8. New heading

**Baybayin sa Kasaysayan**

## 9. Old historical copy

Tara at balikan natin kung saan nagmula ang Baybayin.

Bago pa man dumating ang mga Kastila, may sarili nang sistema ng pagsusulat ang mga Pilipino.

Dahil wala pang papel noon, sa mga puno, kawayan, at dahon sila umuukit gamit ang matutulis na bagay para magsulat ng mga tula at mensahe.

The preview split this material between opening narration and body copy. Its separate later lesson about writing materials remains outside this introductory/history revision.

## 10. New historical paragraph

Ang Baybayin ay isa sa mga sinaunang sistema ng pagsulat sa Pilipinas. Sa mga tala ng kasaysayan, iniuugnay ito sa mga sinaunang Tagalog at ginagamit na ito bago pa dumating ang mga Espanyol.

The paragraph uses historical association, without an exact-origin claim. “Malapit” was omitted from the suggested copy to keep the association cautious. No additional uncertainty paragraph was needed. The existing BAYA takeaway remains: “Ito ay mahalagang bahagi ng pagkatao natin.”

## 11. Source/reference

Primary learner reference: National Commission for Culture and the Arts (NCCA), [Early Philippine Literature](https://ncca.gov.ph/about-ncca-3/subcommissions/subcommission-on-the-arts-sca/literary-arts/early-philippine-literature/), Lilia Quindoza-Santiago. Its discussion of early inhabitants' writing and the Tagalog name Baybayin supports the historical association; it does not establish a definitive geographical origin.

Supplementary research check: NCCA, [Books and Bookmaking in the Philippines](https://ncca.gov.ph/about-ncca-3/subcommissions/subcommission-on-cultural-heritagesch/libraries-and-information-services/books-and-bookmaking-in-the-philippines/), for pre-Spanish writing and the distinction between competing origin theories and established historical use. Only the primary bibliography appears in the child lesson.

The primary page's indexed official-domain text was inspected; direct retrieval through the research browser returned an error. The exact official URL is retained for the validator. No long source passages were copied.

## 12. Learner source presentation

“Sanggunian: NCCA” appears after the paragraph. The accessible “Alamin ang Sanggunian” button expands organization, article title, author, and “Basahin sa NCCA.” It can be collapsed again. The source metadata comes from content data; the reusable component supplies only presentation labels. The external article requires connectivity, while the stored bibliography and lesson remain available offline.

## 13. Origin wording audit

Case-insensitive searches covered the mobile project and repository text for `Pinagmulan ng Baybayin`, `Saan nagmula ang Baybayin`, and `nagmula ang Baybayin`. No learner-facing matches remain. A broader content/component search for `pinagmulan`, `nagmula`, and `imbento ng mga Tagalog` also found no learner claim.

Remaining matches are intentional: `apps/mobile/content/__tests__/baybayinIntroduction.test.ts:14` contains a negative regression assertion, and this report records the old wording and search terms. No unrelated research/development text was rewritten automatically. This is an audit of repository learner text, not a transcription audit of the existing video.

## 14. Mobile/tablet/desktop/PWA review

The production web export was checked in headless Chrome with screenshots and element measurements:

| Viewport | Result | Visible video size |
| --- | --- | --- |
| 360 × 800 | Pass | 328 × 184.5 |
| 390 × 844 | Pass | 357.3 × 201.0 |
| 430 × 932 | Pass | 398 × 223.9 |
| 768 × 1024 | Pass | 314 × 176.6 |
| 1024 × 768 | Pass | 422 × 237.4 |
| 1366 × 768 | Pass | 557 × 313.3 |
| 1440 × 900 | Pass | 588 × 330.8 |
| 1600 × 900 | Pass | 655 × 368.4 |

Every viewport uses identical copy. The invitation precedes the video in reading order, followed by history. Phones retain the existing stacked video/history layout; wider views retain the existing side-by-side storybook layout. No horizontal document overflow occurred. History/source details scroll within the existing reading panel on smaller screens; navigation remains visible. Expanded source details were inspected at 360 px.

Video controls and accessible “Baybayin Song” label remain; the player is paused initially and has no autoplay. Existing media playback implementation was not changed by this revision. No new caption track was added; existing support was preserved.

The rebuilt PWA service worker controlled the lesson, and an offline reload retained the same invitation, heading, and source caption. Cache: `baya-pwa-41c0f8c9c684df69`, 99 assets. Native-device playback and an OS-installed PWA window were not separately exercised; they share this content implementation.

## 15. Tests and searches

- Story/activity/parser/shared-content tests: **6 suites, 71 tests passed**.
- Real in-memory SQLite database tests, including revised serialized content: **1 suite, 17 tests passed**.
- Combined relevant result: **7 suites, 88 tests passed**. Existing progression success/failure/navigation regression checks remained in the story suite.
- TypeScript `tsc --noEmit`: passed.
- ESLint on revision files: passed with no reported warnings/errors.
- Production Expo web export and PWA generation: passed.
- Chrome viewport/copy/source/accessibility checks: passed at all eight widths, with no runtime exceptions.
- Offline PWA reload: passed.
- Repository origin-wording searches and `git diff --check`: passed; intentional search/test/report matches described above.

Evidence: `sandbox/history-tests.log`, `history-database-tests.log`, `history-tsc.log`, `history-lint.log`, `history-export.log`, and `history-browser-validation/checks.json` plus screenshots. Existing React testing warnings/open-handle output is present; assertions passed.

## 16. Validator approval remaining

The requested copy and traceability revision is implemented. The validator should give final editorial approval to the short historical paragraph and attribution presentation. This implementation does not itself confer new external content validation. No definitive origin, birthplace, or inventor is asserted. Lesson ordering, progression logic, character forms, handwriting, ML/ONNX, 80% threshold, three-attempt mastery policy, and database behavior were not changed for this revision.
