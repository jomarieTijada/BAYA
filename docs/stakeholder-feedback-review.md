# Larger right-edge swipe hand — 19 October 2026

The user requested a larger, more visible hand at the far-right edge. This supersedes the small inter-card placement below. `LessonJourney` now anchors a **48 px orange hand** 12 px inside the visible row's right edge, vertically centered within its measured visible height. The hand moves 32 px left, three times the previous short-phone icon size with four times its travel. Its transparent, temporary overlay reserves no space and passes all touches through to the lesson cards.

The landscape-only start, two brief gestures, session dismissal, reduced-motion preference and offline asset behavior remain intact. No bottom navigation, card styling, progression or persistence changes are included.

Validation: 3 focused suites / 13 tests passed; TypeScript passed; lint reported 0 errors and 14 existing warnings; production build passed (163 assets, `baya-pwa-c00445777e51e87a`). Production browser evidence is in `sandbox/right-hand/`, including `fixed-780.png` and `fixed-667.png`. Completed-card screenshots are labeled presentation fixtures, not changes to learner records. Browser checks passed at five viewport sizes, including 780×315 and 667×375, with animation frames, rotation, touch dismissal, session return, reduced motion and cached offline behavior verified; zero runtime exceptions. This export is ready for a separate Netlify upload.

# Phone swipe hint correction — 19 October 2026

The installed-phone report exposed two omissions: the cue required 36 px of unused vertical space below a card, so it was suppressed on short landscape viewports; its timeout could also finish behind the portrait rotation guard.

The full 28 px hand and 28 px sweep remain the preferred placement. When that cannot fit, a 16 px hand moves 8 px left within the existing 24 px gap between cards. Its entire sweep stays outside the card rectangles. The fallback adds no background, controls, padding, card resizing or scrolling region. Animation starts only in landscape. Existing session dismissal, reduced-motion handling, touch passthrough and offline assets remain unchanged.

The reported bottom gap was not visible in the supplied screenshot. The user asked to ignore it; no navigation or safe-area changes are included. Physical installed-PWA inset behavior is not claimed as verified.

Browser evidence is in `sandbox/phone-navigation/`: `fixed-780.png`, `fixed-667.png`, `portrait-then-landscape.png`, `offline.png`, and `browser-results.json`. Completed-card screenshots use explicitly labeled presentation fixtures in an isolated browser; no learner records were changed. Verification covers 780×315, 667×375, 844×390, 1024×768 and 1366×768, plus portrait-to-landscape rotation, session return, touch dismissal, reduced motion and cached offline reload. The hint is correctly absent when all cards fit.

Validation: **58 suites / 550 tests passed**; TypeScript passed; lint passed with 0 errors and 14 existing warnings; `npm run build` passed (163 cached assets, `baya-pwa-1cd6e6983fdb6b8d`). Browser checks reported zero runtime exceptions. The refreshed `apps/mobile/dist` is ready for a separate Netlify deployment.

# Current gesture-only lesson guidance — 18 October 2026

**SUCCESS — implemented and visually verified on web.** This correction supersedes the pill and edge-chevron UI below. Both navigation rails and their 88 px reserved width are removed. The lesson row again uses its full width. Only a transparent 28 px orange hand briefly moves left twice and fades away, with no visible text, pill, shadow or arrow. Placement uses measured card heights and available viewport space; the gesture is omitted if no safe area exists or reduced motion is enabled.

Keyboard Left/Right/Home/End and native accessibility scroll actions replace the removed buttons. Existing topic/card controls, progress and learner navigation remain intact. Session-local dismissal, touch passthrough, no card remount/layout shift and no new scrolling region were verified. Completed-module visual fixtures modify only isolated browser presentation state, not SQLite or user progress.

Final checks: **58 suites / 548 tests passed**, TypeScript passed, lint **0 errors / 14 existing warnings**, production export passed with 163 assets. Production screenshots were inspected at all four required sizes plus the supplied screenshot's 957×402 size; keyboard/touch scrolling, completed cards, resize, reduced motion and cached offline behavior passed with zero runtime exceptions. See [the gesture-only correction report](lesson-gesture-only.md) for exact files, root cause, evidence and native-device limitations.

# Current floating lesson-journey hint — 18 October 2026

**SUCCESS — implemented and verified on web.** The boxed journey toolbar documented below is superseded by a brief floating cream pill with a moving hand icon. Transparent 44 px chevrons at the row edges preserve functional and keyboard navigation. The pill sits in measured empty space below a visible card, changes no card layout, dismisses on interaction or after its introduction, and does not replay on a return visit in the same JavaScript session. Reduced motion receives a static hint. No persistent tracking was introduced.

Relevant checks: **4 suites / 13 tests passed**, TypeScript passed, lint **0 errors / 14 existing warnings**, production export passed. Actual browser checks at all four required sizes passed, including no card overlap/layout shift, motion/fade, touch and keyboard navigation, return visits, resize, reduced motion and offline behavior. See [the floating-hint report](floating-lesson-swipe-hint.md) for files and before/after screenshots. Handwriting and the character-selector cue are unchanged by this refinement.

# Current speech bubbles and swipe indicators — 18 October 2026

**SUCCESS — implemented and verified on web.** Pagsusuri now shares the Lesson 1/2 cream paper, 2 px apricot border, rounded corners, soft shadow and curved pointer. Its tail faces down toward the mascot; lesson tails keep their right-facing orientation. Feedback logic, green/amber status text, two-success mastery and recognition probabilities are unchanged. This replaces the older state-colored bubble surfaces described in historical reports below.

The journey's existing static hint is now a brief animated directional cue, reused beneath overflowing character selectors. It uses real overflow/scroll measurements, reverses at the end, hides when content fits, and respects reduced motion. Existing navigation controls and lesson content are preserved.

Verification: **57 suites / 541 tests passed**, TypeScript passed, lint **0 errors / 14 existing warnings**, production export passed (163 cached assets). Production browser checks passed at all four requested sizes, including actual motion, touch gestures, boundaries, resize, 172 static reduced-motion samples, and cached offline lessons/real inference. A separately labeled deterministic fixture passed 33 handwriting workflow states. See [the speech-bubble and swipe report](speech-bubbles-and-swipe-indicators.md) for the audit, file list, screenshots and native-device limitations.

# Current Pagsusuri actions and guided help — 18 October 2026

**SUCCESS — implemented and verified on web.** The latest attached request supersedes the footer and inline-help designs documented below. Pagsusuri now owns the fixed primary action, stars, feedback and help. The full-width footer and duplicate Back are removed; the top-left header uses the existing guarded previous-character/topic/lessons navigation. Undo/erase remain beside the canvas.

Help now opens a five-step modal with real reference/canvas/action/star spotlights, safe placement, optional technical explanation, close/Escape and stable illustrative fallbacks for unavailable actions. It preserves the mounted canvas and all lesson state. The question mark gives a brief fading halo. The next unearned outlined star breathes gently once; newly earned stars pop/glow distinctly, with a slightly stronger final reward. All motion respects reduced motion. Visible progress fractions are removed while internal counts and Filipino screen-reader announcements remain. Two saved accepted drawings and the 0.80 correct-top-class rule are unchanged.

Final checks: **55 suites / 535 tests passed**, TypeScript passed, lint **0 errors / 14 existing warnings**, production export passed with 164 assets. Production browser checks covered all four sizes, every guide, resize tracking, no canvas/stroke changes, Escape, real online/offline inference and 152 static reduced-motion samples. The separate labeled fixture passed 41 workflow states. See [the complete current report](handwriting-final-ui.md) for files, screenshots, exact behavior and physical-device limitations.

# Previous Pagsusuri help relocation — 18 October 2026

The later attached help-relocation request supersedes earlier canvas-help placement descriptions below. Help is now a **44 px circular question-mark control beside Pagsusuri**, owned by `ConfidenceCard`. The center column contains only the short task instruction, toolbar and canvas. An inline explanation opens within the right panel; its header remains accessible while content scrolls internally on short screens. The friendly primary instructions appear first, with **Dagdag na paliwanag** revealing the accurate confidence/save/duplicate explanation. Count and threshold still come from the centralized mastery policy.

The icon gives one brief, reduced-motion-aware scale pulse and remains static afterward. Production Chrome checks at all four requested sizes confirmed unchanged canvas node, position, dimensions, strokes, result and progress when opening/closing help. Keyboard activation and cached offline help also passed. See [the help relocation report](handwriting-help-relocation.md) for exact wording, hierarchy, screenshots, files and verification results.

Final help-relocation verification: **54 suites / 533 tests passed**, TypeScript passed, lint **0 errors / 14 existing warnings**, and production export passed with 164 assets. Browser checks recorded zero runtime exceptions and 100 static reduced-motion samples. Physical native-device/screen-reader behavior remains unverified.

# Previous handwriting UI correction — 18 October 2026

**SUCCESS — implemented and verified on web.** The later attached UI-correction request supersedes the stamp tracker, instructions and footer descriptions in the 17 October record below. See [the full correction report](handwriting-ui-correction.md) for exact action states, files, screenshots and remaining manual checks.

The current screen has two icon-only Ionicons stars (outlined pending, filled with a subtle check when earned), an external 0/2–2/2 count, and a brief reduced-motion-aware pop. Numbered pencil tiles, the connector and duplicated progress explanation are removed. The centered footer has equal-width Bumalik and one primary action: disabled Suriin on an empty canvas, enabled Suriin for a fresh drawing, disabled Sinusuri during inference/save, Ulitin after an incomplete result, and Susunod only at 2/2. A stale retry cannot empty the completed locked canvas. The compact right panel retains all three predictions and the mascot. The short instruction stays directly above the canvas controls; optional 80% help remains available.

The central two-attempt rule, 0.80 threshold, correct top-class requirement and save-before-count behavior are unchanged. All approved educational wording below remains current, including HALAMAN and the confirmed Silabaryo (Pantigan) title.

Final verification: **53 suites / 529 tests passed**, TypeScript passed, lint **0 errors / 14 existing warnings**, production export passed with **164 cached assets**. Chrome passed **41 deterministic state/layout checks** at the four requested viewports plus 1536×864, with static reduced-motion samples and no runtime exceptions. A separate production check exercised the real model online and after offline reload. The PWA harness verified three additional offline inference runs and the unchanged model hash. Fixture screenshots are explicitly labeled simulated recognition; they are not model-prediction evidence.

# Historical implementation record — 17 October 2026

The UI descriptions and test counts in this dated section describe the earlier implementation, superseded above. Its approved content decisions and documented video-caching limitation remain relevant.

**Current implementation:** the approvals below supersede the deferred decisions in the historical review later in this file. The user explicitly selected **HALAMAN** and confirmed the exact title **Baybayin: Isang Silabaryo (Pantigan)** in this chat. The subsequent attached instruction-redesign request is also implemented. No content selection remains unresolved.

## Approved educational changes

| Item | Before | Current wording / behavior | Context |
|---|---|---|---|
| Topic 1-1 | Ang Kasaysayan at Kahalagahan | Kasaysayan at Kahalagahan ng Baybayin | Manifest, live storybook-derived headings, cards, navigation and persistence/title tests. Other uses of Ang retained. |
| Topic 1-2 | Ano Ba ang Silabaryo? | Baybayin: Isang Silabaryo (Pantigan) | Exact teacher-approved title. Existing syllable explanation unchanged; Silabaryo remains correctly spelled. |
| Filipino/Pilipino | pamana bilang mga Pilipino | Retained | Live history refers to people/identity. Preview phrases pagiging Pilipino, bilang mga Pilipino, and Pamanang Kultural ng Pilipino are likewise contextual people/culture references. No incorrect language/subject usage found. FilipinoLabels is an internal identifier. No global replacement. |
| HA example | HAri; ha-ri; ᜑᜇᜒ | HAlaman; ha-la-man; ᜑᜎᜋᜈ᜔ | User selected HALAMAN. HA emphasis and target glyph ᜑ preserved. Encoded units ha-la-ma-n; final N has U+1714 virama. No word-specific audio/illustration exists; recognition targets the HA character, not whole words. |
| Introductory video | Paused at 0 | Initial position 00:17, still paused until learner plays | One initial seek per source/retry. Normal controls, pause/resume and manual rewind preserved. Metadata/can-play/source-load/play events retry only until the initial seek succeeds. Other videos default to zero. |
| Mastery | Three accepted drawings | Two accepted drawings | Single source: writingMastery.ts. Top-1 target match, raw confidence ≥0.80, fresh drawing and successful SQLite save remain mandatory. |

HALAMAN uses the existing modern spelling convention, based on the [Unicode Tagalog chart](https://www.unicode.org/charts/PDF/U1700.pdf), not a new recognition or class mapping. The updated 17-word spelling table is in `content/baybayin-modern-spelling-audit.md`.

## Instruction redesign: previous and current placement

Previously a two-line technical paragraph stretched across the screen above all three columns. The new bold, state-aware instruction is **inside the canvas card immediately above the drawing controls**, adjacent to the achievement tracker. The tracker explains how a check is earned. The 80% explanation is behind the 44 px touch/keyboard button **Paano ito gumagana?**, alongside undo/Burahin.

The optional help is a compact scrollable disclosure over the canvas, opened only on request. It does not change canvas dimensions, strokes, count, recognition state or pending saves. The same button closes it; its accessible expanded state tracks visibility. It needs no network access. The initial screen has no technical percentage paragraph. The current recognition result may still display its model probabilities after submission.

| State | Exact primary instruction |
|---|---|
| Initial | Isulat ang simbolo at kumpletuhin ang 2 tsek! |
| First saved success | Magaling! Isa pang tsek para magpatuloy! |
| Second saved success | Mahusay! Maaari ka nang magpatuloy! |
| Unsuccessful result/error | Subukan muli! Isulat ulit ang simbolo. |

The count in the initial instruction is interpolated from `BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts`; there is no separate hardcoded requirement. The tracker supporting text is **Bawat natanggap na sulat ay isang tsek.** Its heading is **Ang Aking Pagsulat** and counter is **0/1/2 sa 2 natanggap**.

Exact secondary help (the percentage is interpolated from the same policy):

> Para makakuha ng tsek, kailangang ang unang nakilalang simbolo ni BAYA ay ang ipinapasulat, na may hindi bababa sa 80% kumpiyansa. Kailangang maitala ang bagong pagsulat bago ito bilangin.
>
> Ang 80% ay kumpiyansa ni BAYA sa pagkilala, hindi grado ng iyong sulat. Hindi binibilang ang hindi natanggap o ang pag-ulit ng pagsusuri sa parehong guhit.

## Tracker, icons and motion

Two rounded rectangular stamp tiles replace the plain circles. Pending stamps use a pencil outline, dashed border and Sulat 1/Sulat 2 labels. Earned stamps use a checkmark, solid border and green tint. The connecting trail fills halfway, then completely. Icons and labels, rather than color alone, communicate state. No interaction can award progress through the tracker itself.

Researched [Lucide Pencil Line](https://lucide.dev/icons/pencil-line), [Check](https://lucide.dev/icons/check) and the [Lucide license](https://lucide.dev/license). Those semantics fit the task, but the project already uses Ionicons on native and locally bundled Ionicon SVG paths on web. Reused **pencil-outline** and **checkmark** through AppIcon to preserve visual consistency and avoid a second icon dependency. Source: [Ionicons](https://ionic.io/ionicons); [MIT license, copyright 2015–present Ionic](https://github.com/ionic-team/ionicons/blob/main/LICENSE). No new icon asset or package was downloaded.

Reviewed [Expo animation guidance](https://docs.expo.dev/develop/user-interface/animation/), [Reanimated withSpring](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/) and [React Native Animated](https://reactnative.dev/docs/animated). Reanimated/Lottie were not installed and are unnecessary here. Existing React Native Animated performs a 120 ms scale-up to 1.08 followed by a damped spring to 1; the trail fills over 320 ms. Only a newly accepted milestone animates. Second success rewards the second stamp and fills the whole trail. There are no loops, flashes, confetti, sound effects, persistence delays or automatic navigation.

The indicator receives the authoritative saved count. Ordinary rerenders, failed recognition, retry and restored complete state do not replay the celebration. Character-keyed remounts reset presentation. Reduced-motion preferences are read through AccessibilityInfo and updated by its change event; the default is static until known. Rejected preference queries and animation setup failures retain correct static states. Counts use progressbar values/live regions; badges have explicit accepted/pending labels; primary instructions announce changes politely. Physical screen-reader behavior still warrants device QA.

## Layout and integrity

One shared responsive implementation serves all viewports. The canvas remains at least 145 px high on the smallest tested landscape. At heights below 800 px, the three-column layout keeps actions in a fixed footer. On short phones, the mascot moves to that footer and the duplicate Pagsusuri heading is omitted. At larger sizes the mascot stays in the feedback column, sized to leave space for the tracker and result. The full top-three result remains visible. Help overlays only its own canvas area when requested and does not alter its geometry.

No change to inference, model weights, preprocessing, class order, SQLite schema/services, backend, or orientation handling. Count updates remain after `recordWritingAttempt` resolves. Errors, below-threshold/cross-class predictions, duplicate checks, clear and undo do not earn progress. Failed results do not reset earlier accepted attempts. Susunod unlocks at two saved successes and waits for the learner to press it. Topic completion and stored history remain intact.

Partial mastery remains session-local: another character, lesson remount/re-entry, or application restart resets that session's partial count. Rotation/resizing preserves the mounted session. Completed topics and saved attempts remain persistent. The original welcome, landscape guard, lesson navigation, attribution and visible canvas controls are preserved. The earlier AppIcon web accessibility fix is retained.

## Verification and evidence

- Focused instruction/tracker/writing/story/reduced-motion/content suite: **6 suites, 113 tests passed**.
- Complete applicable Jest suite: **52 suites, 522 tests passed**. Includes ONNX/preprocessing/class mapping, database/persistence, save rejection/deferred-save guards, duplicate taps, failure preservation, character/session transitions, controls, media and orientation tests.
- Final writing-flow rerun after compiler-compatible callback dependencies: **48 tests passed**.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json` passed.
- Lint: `npm run lint --workspace=apps/mobile` passed with **0 errors and 14 pre-existing warnings**.
- Production web export: `npm run export:web --workspace=apps/mobile` passed; generated PWA precache contains **164 local assets**.
- Chrome deterministic UI fixture: **20 state checks** across **667×375, 844×390, 1024×768 and 1366×768**, covering 0/2, 1/2, preserved 1/2 after a rejected .79 result, 2/2, correct next-button enablement and new-character reset. No runtime exceptions or native accessibility props leaked into SVG DOM.
- Browser checks verify a brief earned scale animation and static reduced-motion frames. Optional help preserves exact canvas geometry and stroke paths. Tracker, top-three result, canvas, footer and controls fit with no horizontal overflow at the four sizes.
- UI screenshots use a **clearly labelled deterministic recognition fixture** in an isolated development browser. The runtime recognition export is replaced only inside that test browser; actual screen interactions and isolated SQLite saves still run. Fixture probabilities are **not real ONNX results**, and no production fixture route/backdoor exists.
- Separate production/PWA verification uses the real model. Three offline inference runs passed; the model remains 17,175,276 bytes with SHA-256 `32b63d2f36802e5792006c07f18bcc1aead2f9d20ed1181edc1feebf59ab70b1`.
- Final production Chrome pass: **PASS, zero runtime exceptions** for layout, navigation, real recognition, help and the documented media policy. Online video starts paused at 17 seconds at all four sizes; manual rewind and resume remain below 5 seconds when rewound to 3. Landscape rotation preserves strokes; clearing, retry, navigation and canvas touch gestures work. Offline handwriting and help passed, including an actual model result (MA 82.7% for target A), correctly rejected despite confidence above 80% because Top-1 did not match. The online real drawing was also rejected (NGA 63.4%). These are distinct from the labelled success-state fixture.
- **Existing offline-video limitation:** `generate-pwa-service-worker.mjs` deliberately excludes MP4/video assets from precaching and bypasses video/audio/Range fetches. An offline reload therefore shows the existing video fallback instead of playable video. This policy was not introduced or changed here. No claim is made that the video is reliably available offline. The bundled native asset path and online 17-second seek remain intact.
- Native seek/listener handling has automated tests. No physical Android/iOS device, screen reader or manual native build was used; those checks are not claimed.

Evidence is in `sandbox/stakeholder-review/` (ignored local QA output): `tracker-{667,844,1024,1366}-{0,1,2}-of-2-fixture.png`, `writing-help-{width}.png`, `achievement-fixture-results.json`, `approved-browser-results.json`, `pwa-approved.json`, and the matching test/build/lint logs. The local fixture script is `check-achievement-fixture.mjs`; the production browser script is `check-approved-browser.mjs`. These are review artifacts, not shipped runtime dependencies.

## Files affected by this approved-content/instruction update

Paths below are relative to the repository root. Earlier welcome/orientation/navigation/credit changes remain documented in the historical section. No source file was deleted. No package or lockfile change was needed. The unrelated `.env.example` edit was left untouched.

**Created:**

- `apps/mobile/components/learner/writing/WritingMilestoneBadge.tsx`
- `apps/mobile/components/learner/writing/__tests__/WritingMasteryIndicator.test.tsx`
- `apps/mobile/components/learner/writing/__tests__/WritingInstructions.test.tsx`
- `apps/mobile/components/media/initialVideoSeek.ts`
- `apps/mobile/components/media/__tests__/initialVideoSeek.test.ts`
- `apps/mobile/hooks/useReducedMotionPreference.ts`
- `apps/mobile/hooks/__tests__/useReducedMotionPreference.test.tsx`

**Modified or extended from the earlier implementation:**

- `apps/mobile/components/learner/writing/WritingInstructions.tsx` (created in the earlier stakeholder pass, now redesigned)
- `apps/mobile/components/learner/writing/WritingMasteryIndicator.tsx`
- `apps/mobile/components/learner/writing/WritingPracticeScreen.tsx`
- `apps/mobile/components/learner/writing/BayaWritingGuide.tsx`
- `apps/mobile/components/learner/writing/__tests__/WritingPracticeScreen.recognition.test.tsx`
- `apps/mobile/components/media/MediaSource.ts`
- `apps/mobile/components/media/VideoPlayer.tsx`
- `apps/mobile/components/media/__tests__/media.test.tsx`
- `apps/mobile/components/learner/story/StorybookTopicScreen.tsx`
- `apps/mobile/components/learner/story/__tests__/StorybookTopicScreen.test.tsx`
- `apps/mobile/content/approvedCurriculum.ts`
- `apps/mobile/content/approvedStorybook.ts`
- `apps/mobile/content/baybayinIntroduction.ts`
- `apps/mobile/content/baybayinCharactersData.ts`
- `apps/mobile/content/writingMastery.ts`
- `apps/mobile/content/__tests__/baybayinIntroduction.test.ts`
- `apps/mobile/content/__tests__/baybayinCharactersData.test.ts`
- `apps/mobile/content/__tests__/writingMastery.test.ts`
- `apps/mobile/components/learner/lessons/__tests__/curriculumScreens.test.tsx`
- `apps/mobile/components/learner/lessons/__tests__/lessonData.test.ts`
- `apps/mobile/database/__tests__/activityContentService.test.ts`
- `apps/mobile/database/__tests__/curriculumService.test.ts`
- `apps/mobile/database/__tests__/database.test.ts`
- `docs/stakeholder-feedback-review.md`
- `docs/writing-mastery-audit.md`
- `docs/content/baybayin-modern-spelling-audit.md`

**Final status: PARTIAL for the combined request** because the existing PWA video caching policy prevents guaranteed offline video playback. The handwriting instruction/tracker work is implemented and verified for web and ready for manual deployment review. Native physical-device QA was unavailable. No content ambiguity remains.

No push, deployment or destructive record migration was performed.

---

# Historical stakeholder review before the subsequent approvals

The following is retained as an audit trail. Its deferred choices, three-attempt policy and zero-second video behavior are superseded by the current implementation above; its earlier test counts describe the earlier snapshot.


# Stakeholder feedback review — 17 October 2026

## Audit and implementation plan (recorded before implementation)

Audited the landing/learner flows, approved curriculum and storybook, character data, video player/link/parser, root layout and unused orientation guard, lesson journey, writing screen/canvas/navigation/mastery, SQLite attempt service, and existing tests. Inspected the production web screens in headless Chromium at 844 × 390; baseline screenshots are in `sandbox/stakeholder-review/`. The working tree was clean at the start.

| Feedback | Actual implementation / previous behavior | Classification and planned action | Files / validation impact |
|---|---|---|---|
| 1. Welcome | Landing says “Learn to write Baybayin.”; ambient eagle includes waving. | IMPLEMENT preferred short greeting; preserve mascot and role buttons. | `LandingHero.tsx`; presentation only |
| 2. Landscape | App orientation default; PWA any; unused LandscapeGuard replaces children in portrait. | REFINE guard to overlay mounted screens on mobile/tablets, allow narrow desktop, request supported installed/fullscreen web lock once; configure native/PWA landscape. | `LandscapeGuard.tsx`, root layout, app/manifest config |
| 3. Navigation | Story/character screens already have Back/Next and progress; overflowing module row relies on scrolling. | REFINE overflowing LessonJourney with visible previous/next controls and swipe cue; preserve existing story controls. | `LessonJourney.tsx` |
| 4. “Ang” | Topic 1-1 is “Ang Kasaysayan at Kahalagahan”; other approved titles also start with Ang. “Number 1” is ambiguous. | REQUIRES VALIDATION: identify the exact target before editorial changes. | `approvedCurriculum.ts`, approved storybook; unchanged |
| 5. Pantigan/Silabaryo | Topic 1-2 “Ano Ba ang Silabaryo?” and approved screenshot-based explanation use SILABARYO. No “Silbaryo” or screen 5.1 mapping exists. | REQUIRES VALIDATION: retain approved title; propose “Baybayin: Isang Silabaryo (Pantigan)” after teacher confirms terms and target. | Curriculum, `baybayinSyllabary.ts`, `docs/content/baybayin-syllabary-revision.md`; unchanged |
| 6. Filipino/Pilipino | Live history uses “pamana bilang mga Pilipino” for people/identity. Preview topic-1-1 likewise uses Pilipino culturally; FilipinoLabels is a code identifier. | REQUIRES VALIDATION: contextual teacher review; no global replacement. | `baybayinIntroduction.ts`, `content/topics/topic-1-1.ts`; wording unchanged |
| 7. Mascot visibility | Landscape story spread already shows content, mascot and footer. Character screen has scrollable content and visible navigation. | ALREADY IMPLEMENTED: verify landscape sizes; retain readable text and necessary scrolling. Portrait redesign NOT APPLICABLE. | StorybookTopicLayout, StoryContent, CharacterViewer |
| 8. Timestamp | Native/web video uses playback controls; no auto seek/autoplay. Actual browser starts paused at 0, duration 231.488 s. | REQUIRES VALIDATION: meaningful content at 17 s is unverified; do not claim playback starts at 00:17 or skip approved introduction. | `VideoPlayer.tsx`; unchanged |
| 9. Attribution | Shared credit is “Video Gawa ng: GINHAWA Inc” → ginhawa.net; link opens externally and catches failures. Parser only allows old origin. | IMPLEMENT explicitly requested Facebook credit; narrow parser addition while retaining old stored credits. | Introduction data, parser, link/tests |
| 10. HA word | HAri, ha-ri, ᜑᜇᜒ uses approved modern spelling/shared DA/RA glyph; no word-specific audio or illustration. | REQUIRES VALIDATION: retain HARI. HANGIN (ha-ngin) introduces ng/final n; HALAMAN (ha-la-man) adds a syllable/final n. All illustrate HA, but alternatives require spelling/content validation and assets review. | `baybayinCharactersData.ts`, modern-spelling audit; unchanged |
| 11. Threshold | Correct top-ranked class AND raw model probability ≥ 0.80; not handwriting quality. UI lacks explanation. | IMPLEMENT accurate, short confidence explanation derived from policy constant. | Writing presentation; no ML/scoring changes |
| 12. Two vs three | Named policy requires three saved successful fresh drawings; documented assessment rule. Failures neither count nor reset; not consecutive. | REQUIRES VALIDATION: retain three; teacher/research owner must approve changing policy to two. | `writingMastery.ts`, `docs/writing-mastery-audit.md`; unchanged |
| 13. Count instruction | Indicator exists, labelled generic “Pagsubok”; no initial instruction. | REFINE successful-count/remaining instruction using shared policy. Preserve guards and persistence. | WritingMasteryIndicator, writing instructions |
| 14. Erase | Icon-only trash and Ulitin both reset drawing; toolbar remains usable during inference. | REFINE visible Burahin with ≥44 px targets; editing before submission, Ulitin after result; synchronous busy guards. Earned counts and saved attempts stay intact. | WritingToolbar, WritingNavigation, WritingPracticeScreen |
| 15. Gestures | No route-swipe handler in story/characters. Chip selector scrolls horizontally; content vertically; canvas owns responder and web touch-action:none. | ALREADY IMPLEMENTED pending verification: exercise landscape scroll, DA/RA chips and canvas; no gesture rewrite without reproduced fault. | LessonJourney, CharacterViewer, WritingCanvas |

### Scope and sequence

Apply the presentation/orientation/navigation/credit/erase changes above, then focused regression tests, TypeScript, lint, full test suite, production web export, and browser checks. No model, preprocessing, class mapping, schema, sync, or backend changes. No automatic deployment.

### Content decisions for the teacher/research owner

- **Ang:** confirm which “number 1”; if topic 1-1, consider “Kasaysayan at Kahalagahan ng Baybayin”, only after title approval.
- **Pantigan/Silabaryo:** the approved passage explains symbols representing syllables; [Diksiyonaryo.ph, syllabary](https://diksiyonaryo.ph/list/S?page=315) lists pantigan/palapantigan. This supports discussing the relationship, not silently renaming the approved lesson. “Silbaryo” is absent from the repository; retain “Silabaryo”. Supply the stakeholder’s screen 5.1 mapping before applying any change there.
- **Filipino/Pilipino:** review the live history sentence and preview topic-1-1 people/culture references. Keep approved wording until the teacher confirms their contextual preference; language/subject wording is a separate question.
- **HARI/HANGIN/HALAMAN:** HARI remains the shortest existing approved example. HALAMAN is a concrete candidate if the teacher prefers it, but increases syllable/final-consonant complexity. Confirm the word, Baybayin spelling, emphasis, and any illustration/audio together.
- **Two/three successes:** three is established in the repository, although no empirical rationale or signed teacher approval was found in the implementation. Changing it affects progression and assessment comparability; obtain the research owner’s decision. The UI must follow the same constant as enforcement.
- **00:17:** confirm the intended editorial start after reviewing the actual video with the validator. Current playback begins at 0 on user action; no timestamp claim added.

### Persistence boundary

Successful-count state is already session-local: moving to another character, leaving/remounting the lesson, or restarting resets partial counters. Saved attempts and completed topics persist in SQLite. Rotation must preserve the mounted session, strokes and count; this task does not redesign restoration of partial mastery.

### Platform references

Read the required [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) before implementation. Native orientation uses app configuration and requires a rebuilt binary. Browser locking follows [ScreenOrientation.lock restrictions](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock); unsupported/rejected locks fall back to the rotation overlay without requesting fullscreen.

## Implementation and validation results

### Resulting behavior

The landing screen now says **“Mabuhay! Let's learn Baybayin together!”** with the existing animated eagle and learner/mentor buttons. Landscape story spreads, readable text, mascots, and existing Back/Next controls remain in place.

The root now mounts the shared LandscapeGuard. On portrait mobile/tablet browsers, a safe-area rotation overlay hides interaction/accessibility with the still-mounted lesson. Rotating back restores it automatically, including the drawing. Narrow desktop windows remain usable. Native app configuration and the PWA manifest request landscape. The optional browser lock is attempted only on a mobile device in installed/fullscreen contexts; no fullscreen request or dependency was added. Lock failures are caught and the overlay remains the fallback.

Overflowing module rows show 44 px previous/next arrow controls and a short swipe cue **above** the cards. Controls disappear when the row fits. Touch scrolling is preserved; arrows do not change lesson order or unlock content.

The live and preview video/history pages share the exact requested credit, **“Video gawa ng GINHAWA Baybayin Creativity Workshop”**, linking to `https://www.facebook.com/baybayincreativityworkshop`. The established Linking mechanism opens a separate browser tab (`_blank`, `noopener` observed). The parser accepts that exact new URL and retains the old GINHAWA origin for saved-content compatibility. The local lesson works offline; the external website still needs internet, and rejected link openings show the existing retry alert. Video playback still starts from 0 when the learner presses Play.

Writing now explains the actual shared policy: **three accepted drawings**, where the first recognized class must match the requested symbol and raw model confidence must be **at least 80%**. The text explicitly says this percentage is BAYA's confidence, not a handwriting grade. “Natanggap” labels the successful-count indicator; failed attempts do not count or erase earlier successes.

**Burahin** visibly labels the existing trash button and clears only an unsubmitted drawing. Undo/clear targets are at least 44 px. **Ulitin** is offered after evaluation to prepare a new drawing, preserving earned successes and saved records. Clear/undo/retry handlers synchronously reject edits during inference/save, including callbacks captured before the disabled UI renders. Repeated submissions retain the existing safeguards. **Suriin/Susunod/Ulitin/Back** use a fixed footer on short landscape writing screens, keeping primary actions reachable while longer content can scroll.

### Final compliance matrix

Paths below are relative to `C:\BAYA\apps\mobile` unless prefixed with `docs/` (repository root). “Pending validation” means the identified content/policy was deliberately retained, not silently changed.

| Stakeholder suggestion | Previous behavior | Action taken | Status | Affected files |
|---|---|---|---|---|
| Welcome message | Generic instruction | Preferred greeting; existing mascot/buttons retained | COMPLETED | `components/landing/LandingHero.tsx` |
| Landscape orientation | Default/any; unused replacing guard | Mounted overlay, device detection, optional eligible web lock, native/PWA configuration | COMPLETED | `app.json`, `public/manifest.json`, `app/_layout.tsx`, `components/layout/LandscapeGuard.tsx`, `orientationPolicy.ts` |
| Swipe/navigation indicator | Overflow module row had no explicit controls | Overflow-only arrows and swipe cue; story Back/Next retained | REFINED | `components/learner/lessons/LessonJourney.tsx` |
| “Ang” wording | Several approved titles; ambiguous target | Documented likely target and conditional proposal; no content edit | PENDING VALIDATION | `docs/stakeholder-feedback-review.md`; reviewed `content/approvedCurriculum.ts` |
| Pantigan/Silabaryo | Approved Silabaryo title; no screen 5.1 | Proposed teacher-reviewed title; preserve approved text and request screen mapping | PENDING VALIDATION | Review document; reviewed `content/baybayinSyllabary.ts`, `approvedCurriculum.ts` |
| Mascot visibility | Existing landscape spread with mascot and readable content | Verified landing/story/character/writing layouts; allow useful scrolling on short screens | ALREADY SATISFIED | No mascot/story layout changes; writing navigation adjusted in `WritingPracticeScreen.tsx` |
| Filipino/Pilipino | People/identity uses Pilipino | Contexts and teacher decision documented; no blanket replacement | PENDING VALIDATION | Review document; reviewed `content/baybayinIntroduction.ts`, `content/topics/topic-1-1.ts` |
| Video timestamp | Paused at 0; no automatic 17-second seek | Verified current playback; no misleading label or skip | PENDING VALIDATION | Review document; reviewed `components/media/VideoPlayer.tsx` |
| Video attribution | GINHAWA Inc → ginhawa.net | Exact requested credit and Facebook destination; old saved credits still parse | COMPLETED | `content/baybayinIntroduction.ts`, `parseActivity.ts`, `components/learner/story/VideoCreditLink.tsx` |
| HA example word | Validated HAri, ha-ri | Compared alternatives and retained approved example | PENDING VALIDATION | Review document; reviewed `content/baybayinCharactersData.ts` |
| 80% threshold instruction | Enforcement existed; explanation absent | Explain correct first prediction plus confidence; distinguish from writing grade | COMPLETED | `components/learner/writing/WritingInstructions.tsx`, `WritingPracticeScreen.tsx` |
| Three vs two attempts | Established three-success policy | Retained shared policy; two requires teacher/research-owner decision | PENDING VALIDATION | Review document; reviewed `content/writingMastery.ts` |
| Tracing count instruction | Generic “Pagsubok” indicator | Shared-policy instruction and “Natanggap” successful-count display | REFINED | `WritingInstructions.tsx`, `WritingMasteryIndicator.tsx` |
| Clear canvas control | Icon-only trash; active during inference; duplicate initial retry | Visible Burahin, phase-specific retry, busy guards, comfortable targets and fixed short-screen actions | REFINED | `WritingToolbar.tsx`, `WritingNavigation.tsx`, `WritingPracticeScreen.tsx` |
| Scrolling conflict | Separate chip/content scrolling and canvas responder | Actual Chromium touch gestures preserve DA/RA selection and canvas route; module swipe/arrows work | ALREADY SATISFIED | No gesture-system rewrite; existing `CharacterViewer.tsx`, `WritingCanvas.tsx`; journey controls refined |

### Modified files and purpose

- `apps/mobile/app.json` — native landscape setting.
- `apps/mobile/public/manifest.json` — installed PWA landscape preference.
- `apps/mobile/app/_layout.tsx` — mount the shared orientation guard around the router.
- `apps/mobile/components/layout/LandscapeGuard.tsx` — safe-area overlay without lesson unmounting; suppress hidden interaction/accessibility.
- `apps/mobile/components/layout/orientationPolicy.ts` — phone/tablet/iPadOS detection and restricted, failure-tolerant web locking.
- `apps/mobile/components/landing/LandingHero.tsx` — welcoming copy.
- `apps/mobile/components/learner/lessons/LessonJourney.tsx` — visible overflow navigation.
- `apps/mobile/content/baybayinIntroduction.ts` — shared video attribution only; approved historical paragraph unchanged.
- `apps/mobile/content/parseActivity.ts` — narrow new credit URL acceptance with legacy compatibility.
- `apps/mobile/components/learner/story/VideoCreditLink.tsx` — external-link accessibility hint.
- `apps/mobile/components/learner/writing/WritingInstructions.tsx` — policy-derived explanation of successes and confidence.
- `apps/mobile/components/learner/writing/WritingMasteryIndicator.tsx` — successful-count label.
- `apps/mobile/components/learner/writing/WritingToolbar.tsx` — visible clear label and 44 px targets.
- `apps/mobile/components/learner/writing/WritingNavigation.tsx` — remove duplicate initial retry; 44 px dense actions; shared inline layout.
- `apps/mobile/components/learner/writing/WritingPracticeScreen.tsx` — busy guards, instructions, toolbar phase state and short-screen footer.
- `apps/mobile/components/landing/__tests__/LandingHero.test.tsx` — greeting assertion alongside mascot coverage.
- `apps/mobile/components/layout/__tests__/LandscapeGuard.test.tsx` — state survives portrait/landscape without remount.
- `apps/mobile/components/layout/__tests__/orientationPolicy.test.ts` — desktop/tablet detection, eligible lock, rejected/unavailable API and cleanup.
- `apps/mobile/components/learner/lessons/__tests__/LessonJourney.test.tsx` — overflow-only controls and bounded navigation.
- `apps/mobile/components/learner/story/__tests__/StorybookTopicScreen.test.tsx` — requested credit destination.
- `apps/mobile/components/learner/story/__tests__/VideoCreditLink.test.tsx` — rejected external opening and retained lesson UI.
- `apps/mobile/content/__tests__/baybayinIntroduction.test.ts` — new/legacy credits and unapproved URL rejection.
- `apps/mobile/components/learner/writing/__tests__/WritingPracticeScreen.recognition.test.tsx` — busy editing/save races, phase controls, count/stroke preservation on viewport changes, existing reopen semantics and corrected empty-result assertion.
- `docs/stakeholder-feedback-review.md` — audit, classifications, content decisions and verification record.

Ignored local evidence is in `sandbox/stakeholder-review/` (before/after screenshots, browser script/report, export log and PWA report). An unrelated `.env.example` edit appeared during the session; it was left intact and is not part of this task's changes.

### Verification

| Check | Result / practical limits |
|---|---|
| Full Jest suite | **48 suites, 505 tests passed** with `npm test --workspace=apps/mobile -- --runInBand --forceExit --silent`. After the final footer/arrow placement adjustment, the affected writing/journey suites were rerun: **2 suites, 48 tests passed**. `--forceExit` was used for existing lingering test handles; natural process shutdown was not established. |
| Writing coverage | Empty/partial drawings; inference errors; correct/incorrect class; raw probability immediately below and at 0.80; first/final success; failures preserve earlier successes; clear/undo/retry; saved-attempt failures; repeated/captured callbacks; next-character/topic completion; rotation-state and exit/reopen behavior. Model output is mocked in these unit tests; browser evidence below separately exercises real inference. |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json` passed after final application edits. |
| Lint | `npm run lint --workspace=apps/mobile` passed: **0 errors, 14 existing warnings** (require-style test/debug imports and an unused existing StoryVisualLearning import). |
| Production export | `npm run export:web --workspace=apps/mobile` passed after final application edits; generated **164 precached assets**, cache `baya-pwa-c259be56564250c5`. Existing Expo SQLite package-export fallback warning remains nonfatal. |
| Browser rendering | Actual headless Chromium production build at **667×375, 844×390, 1024×768 and 1366×768**; screenshots inspected. Greeting, role actions, video/history/credit and writing layout render without document-level horizontal overflow. Writing actions remain within viewport, including result/retry actions. Content may scroll vertically on short screens. |
| Orientation | Chromium mobile-UA/touch emulation: phone portrait **390×844**, tablet portrait **768×1024**, then landscape; same canvas DOM node and normalized stroke paths survive rotation. Portrait content is inert. Narrow desktop **390×844** is not blocked. Successful-count retention is additionally unit-tested. |
| Gestures/navigation | Actual CDP touch strokes do not navigate the lesson; clear/retry remove strokes. Horizontal character-selector touch scroll moves chips while DA/RA stays selected; vertical gesture preserves DA/RA. Module arrows and horizontal touch scrolling work. Story Next and Back work. No uncaught JavaScript exceptions observed. |
| Real recognition | A browser-drawn sample ran through the unchanged ONNX model and produced a real incorrect-class result with no mastery credit. Successful/final progression is covered by deterministic unit tests, not fabricated browser scores. |
| Video/external credit | Browser starts paused at 0. Credit calls `window.open` through Linking with exact Facebook URL, `_blank`, `noopener`; lesson remains. This verifies opening behavior, not Facebook availability or ownership. External rejection/offline alert is unit-tested. |
| Offline PWA/model | Production service worker installed, offline lesson reload succeeded. Existing `scripts/verify-baya-pwa-browser.mjs` passed: model and WASM fetched offline, **3 offline inference runs**, 63 finite output probabilities per run, exported/model SHA-256 matched **32b63d2f36802e5792006c07f18bcc1aead2f9d20ed1181edc1feebf59ab70b1**. Model bytes/version unchanged. |
| Device limitations | No physical Android/iOS/tablet or native binary was available. Actual iOS Safari, installed Android/iOS orientation behavior, hardware safe-area/notch handling and native orientation lock need device acceptance checks. Supported/rejected browser-lock branches and iPadOS detection were unit-tested; Chromium emulation is not Safari/device certification. |

### Build/deployment status

The production web output at `C:\BAYA\apps\mobile\dist` is ready for **manual web deployment**, subject to the physical-device checks above. Nothing was deployed or committed. Native configuration takes effect only after regenerating/rebuilding the native app; no native build is claimed. Educational/policy items marked pending remain unchanged and are independent of deploying the safe UI improvements.
