# Five-page storybook audit — 16 November 2026

## Before implementation

Reviewed all 44 existing screenshot files together, typed bilingual copy, invitation, modal, transitions, asset registry, historical compliance report and project naming record. Existing cream layout, readable type, independently scrolling reading surface and fixed footer are retained. No unrelated tracked changes at start; the untracked thesis DOCX is preserved.

| Page | Original content and illustration | Finding / recommended change | Sources / rights |
|---|---|---|---|
| 1 | Friendly third-person introduction; canonical mascot | Keep voice and original image; replace developer-facing missing-author caption with simple companion caption | Existing project asset; illustrator unknown, no new ownership claim |
| 2 | General eagle inspiration; same mascot | Wrong visual emphasis; replace with official-photo viewing card pending permission; add verified birth, parents, grandmother and name connection | PEF Dakila’s Line, PIA, Philstar; photo permission pending |
| 3 | Lessons, handwriting, quizzes; mascot plus four disconnected glyphs | Replace mascot with a cohesive learning composition using existing glyphs; remove unmeasured confidence outcome claim | Current lesson/practice/quiz routes and bundled character registry |
| 4 | Historical scripts and kudlit; four unmodified glyphs | Demonstrate Ba / Be-Bi / Bo-Bu with existing Ba artwork and separately positioned kudlit; explain inherent a | Unicode 17 chapter 17; existing Gavino assets |
| 5 | Contributor thanks; repeated mascot | Keep acknowledgements, use original thank-you card composition without logos/portraits; link verified GINHAWA programs | Project acknowledgements and GINHAWA programs; no inferred endorsement |

All pages: complete English/Tagalog parity, keep 18px body text and scrolling, contextual image labels, keyboard-focusable source links, source attribution under visuals. Preserve cancellation, duplicate navigation lock, reduced motion, focus and announcements in useStorybookTurn. Existing narrow/landscape screenshots demonstrate scrolling rather than a need to shrink type. Permissions and missing authorship belong in this register, not children's captions.

## Research and source register

- [PEF: Princess Maasim: From Near Tragedy to Conservation Legacy](https://www.philippineeaglefoundation.org/post/princess-maasim-from-near-tragedy-to-conservation-legacy), specifically **Dakila’s Line**: identifies Bayani as Chick 32, offspring of Dakila and Sinag through cooperative artificial insemination; LDI (formerly Princess Maasim) is the maternal grandmother, rescued in 1993. The opening portrait is LDI; the separate preceding portrait is Dakila. Neither was selected.
- [PEF: BayaniCam and sanctuary](https://www.philippineeaglefoundation.org/transfer-breeding-eagles-now): official conservation context and sanctuary location, Brgy. Eden, Toril.
- [PIA, 11 May 2026](https://pia.gov.ph/news/help-needed-to-complete-philippine-eagle-breeding-facility/): December 5, 2025 hatching at National Bird Breeding Sanctuary in Davao City. Cross-checked in [MindaNews, 12 March 2026](https://mindanews.com/top-stories/2026/03/pef-announces-new-philippine-eagle-chick-bayani/). MindaNews direct fetch returned 403; indexed article text was available. Its description of both parents as rescued conflicts with PEF’s Dakila lineage; the official family history takes precedence.
- [Philstar, 10 March 2026](https://www.philstar.com/headlines/2026/03/10/2513328/philippine-eagle-foundation-announces-new-chick-bayani): announcement occurred that day, rather than on MindaNews’s publication date. Adopter Nico Herth of Procon Grumbach selected the name, meaning hero. These supplementary naming details stay in research notes to keep the child-facing story concise. Birth is a conservation milestone, not proof the species is safe.
- Project thesis, `CHAP_2_draft_2_101226 (LATEST) (1).docx`, Operational Definition of Terms, explicitly defines BAYA as the shortened name of captive-bred eagle Bayani. Existing compliance record and researcher brief establish the app naming story. This is not attributed to PEF; no endorsement is implied.
- [Unicode 17, chapter 17](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-17/), sections 17.1.1–17.1.2: Baybayin is among several Philippine scripts; consonants contain inherent a, upper vowel mark gives i/e and lower gives u/o. Vowel cancellation is a separate historical development (Lopez cross-shaped virama; contemporary pamudpod use), not an upper/lower vowel change. This short introduction does not attempt to prescribe one universal historical orthography.
- [GINHAWA programs](https://ginhawa.net/programs.html) and [activities](https://ginhawa.net/paid-events.html): Baybayin creativity programs and Mini Gavino’s work are documented. The courses URL returned bot verification; no bypass attempted. Specific BAYA content-review roles remain the project’s requested acknowledgements, not independent certification. No official Buhayin Baybayin domain established, so no invented link.
- Read [Expo SDK 57 versioned documentation](https://docs.expo.dev/versions/v57.0.0/) before code changes, as required by AGENTS.md. No framework upgrade or new dependency.

## Selected photograph and rights

Exact original: https://static.wixstatic.com/media/d08c94_6805e4f859d4440980f10dfd24e6a623~mv2.png

Article rendition: https://static.wixstatic.com/media/d08c94_6805e4f859d4440980f10dfd24e6a623~mv2.png/v1/fill/w_980%2Ch_735%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/d08c94_6805e4f859d4440980f10dfd24e6a623~mv2.png

Original PNG: **4032 × 3024**, measured by browser image naturalWidth/naturalHeight. Visually inspected in an isolated browser: downy, partly feathered chick resting among leafy branches, with newspaper lining behind it. The article caption explicitly names “Philippine Eagle Bayani, our Chick 32” and describes the Dakila/Sinag parentage. Caption identification, not appearance alone, establishes identity.

Status: **PERMISSION PENDING / NOT APPROVED FOR BUNDLING**. PEF is the publisher and rights contact; the site copyright footer is not proof of photographer identity or a redistribution license. Photographer and photograph-specific rights holder are unconfirmed. No grant covering BAYA was found in the project records. No remote photograph is requested, cached or shipped by the app. A temporary browser inspection screenshot is outside app/public and is not included in deliverable assets.

Visible English credit: “Bayani — Philippine Eagle Chick No. 32”; “Source: Philippine Eagle Foundation”; “View the Real Bayani”; “Opens an external website • Internet needed”. Tagalog supplies equivalent labels. There is no invented photograph credit or claim of an embedded photo.

To unblock: obtain written authorization from the actual rights holder through info@philippineeaglefoundation.org covering public educational web/mobile display, redistribution, resizing/compression, and offline PWA/service-worker storage. Confirm required credit, photographer, duration and restrictions. No message was sent. Add a static local require in the authorized branch of `bayaniPhoto`, record the grant in `permissionRecord`, license and exact credit; the shared renderer already provides contain-fit, a reserved 4:3 slot, localized alt text and load-error feedback. Verify the approved file and offline cache before release.

## Complete visual asset register

| Pages | Asset / subject | Origin and creator | Status and offline use | Visible credit |
|---|---|---|---|---|
| 1 | branding/baya/idle/frame-000.png; illustrated Bayani | Existing BAYA project mascot; illustrator and copyright holder not documented | SOURCE UNKNOWN for authorship; existing project use retained as explicitly requested. No new license inferred; already bundled/offline | Bayani — BAYA’s illustrated learning companion |
| 2 | Selected Bayani PNG above | PEF article; photographer/owner unconfirmed | PERMISSION PENDING; NOT APPROVED FOR BUNDLING; online source link only | Source: Philippine Eagle Foundation |
| 3 | illustrations/baybayin/gavino/{a,ba,ka,ma}.png | Existing Gavino learning asset registry; project-supplied educational artwork | PROJECT-DOCUMENTED existing use; original grant/individual authorship not independently established. Reused, already local/offline | Character artwork: BAYA’s bundled Gavino learning assets |
| 4 | illustrations/baybayin/guides-1024/{ba,be_bi,bo_bu}.png | Existing project-supplied guides; README and selected_sources.json retain source attempts | PROJECT-DOCUMENTED existing use, no independent license claim; unchanged and already bundled/offline | Character examples: BAYA’s learning guides |
| 3, 5 | Learning tiles and thank-you card | New code composition; existing Ionicons search/sound/pencil/leaf/heart/book icons from installed package | PROJECT-OWNED composition; Ionicons MIT package license; local/offline | No external contributor portrait or logo used |

No raster asset added or deleted. Page 4 uses the complete existing guide images after inspection, rather than drawing new forms or adding marks to the Gavino images. The comparison matrix’s tentative separate-mark approach was superseded by this stronger existing-asset option.

## Implementation and file inventory

Created `apps/mobile/components/landing/StorybookVisual.tsx` (shared visual renderer, source links, image-error fallback and authorized-photo slot), `scripts/testing/baya-storybook-touch.mjs` (physical touch/rotation checks), this report, and `docs/verification/baya-storybook-audit/` (screenshots, review sheets, JSON reports, accessibility trees and timing traces).

Modified `OriginStorybook.tsx` to use the shared renderer; `storybookContent.ts` for bilingual copy/visual/source metadata; `originStoryContent.ts` for exact image provenance and typed authorization metadata; `__tests__/MascotOrigin.test.tsx` for two new error/fallback regressions; both `scripts/testing/baya-storybook.mjs` and `baya-storybook-final.mjs` for expanded viewport/source verification; and `docs/BAYA-STORYBOOK.md` to point to this audit. All component paths are under `apps/mobile/components/landing/`.

No raster asset additions or deletions, dependencies, model-cache configuration changes, migrations, commits or deployment. Original mascot and turn hook unchanged. Unrelated thesis preserved. Expo regenerated ignored production output in `apps/mobile/dist`.

## Verification

| Check | Result |
|---|---|
| TypeScript | Passed `npx tsc --noEmit -p apps/mobile/tsconfig.json`, including after test additions |
| ESLint | Passed `npm run lint --workspace mobile`, including final check |
| Full Jest | 76 suites / 782 tests passed using `--runInBand --forceExit --silent`; existing asynchronous handles require force-exit |
| Added tests | Follow-up storybook suite: 8 tests passed, including two newly added regressions; 784 distinct tests covered across full and follow-up runs |
| Production Expo export | Passed; existing expo-sqlite subpath fallback and terminal color warnings, no build error |
| PWA manifest | Passed; 182 precached assets; `baya-pwa-b60463d9f694e29f`; cache strategy/model configuration unchanged |
| Comprehensive browser | 203 checks, 185 screenshots, eight requested viewports in both languages |
| Basic browser script | 82 checks, 69 screenshots |
| Physical Android | 44 checks, 26 screenshots; Samsung SM-S911B, Chrome 157.0.8103.51, portrait viewport 360×691 CSS pixels, DPR 3 |
| Physical touch/rotation | 13 checks, 22 screenshots; touch events/swipes on real device, portrait/landscape, official PEF link opened; original rotation setting restored |

Total: **342 browser/device checks and 302 screenshots**, independently enumerated by four browser-report.json files. Device automation measured 659ms around a page turn and no observed long tasks during the short sampled interval; this is not a frame-rate certification.

All five pages passed bilingual layout and image checks at 320×568, 390×844, 430×932, 844×390, 768×1024, 1024×768, 1280×800 and 1440×900. Visually inspected eight viewport contact sheets, individual desktop/mobile captures, welcome/motion/offline sheet and both device sheets. No horizontal overflow or unreachable controls observed. Credits remain within the scrollable reading region. Small/short screens intentionally scroll; text is not shrunk.

Verified Enter/Space opening, Escape/focus restoration, reverse-Tab containment, named dialog/image alternative, forward/backward turns, rapid-click locking, cancellation/reopening, resize during turns, reduced motion, enlarged text/reflow, local images, offline reload/reading in both languages and learner/mentor destinations. Source opening and touch scrolling also passed on the connected device. Unit tests cover failed URL launch and failed character image load. Future approved-photo loading cannot be verified until the authorized file exists.

### Screenshot evidence

Original captures remain in [the previous evidence folder](verification/baya-storybook/). Compare [old Page 2](verification/baya-storybook/desktop-page-2.png) and [new Page 2](verification/baya-storybook-audit/en-1280x800-page-2.png); the equivalent original/new page-3, page-4 and page-5 files show the other visual changes.

Every review sheet below includes all five pages, both languages, top and scrolled reading states:

- [320×568](verification/baya-storybook-audit/review-320x568.jpg)
- [390×844](verification/baya-storybook-audit/review-390x844.jpg)
- [430×932](verification/baya-storybook-audit/review-430x932.jpg)
- [844×390 landscape](verification/baya-storybook-audit/review-844x390.jpg)
- [768×1024 tablet](verification/baya-storybook-audit/review-768x1024.jpg)
- [1024×768 tablet](verification/baya-storybook-audit/review-1024x768.jpg)
- [1280×800 desktop](verification/baya-storybook-audit/review-1280x800.jpg)
- [1440×900 desktop](verification/baya-storybook-audit/review-1440x900.jpg)
- [Welcome, motion and offline](verification/baya-storybook-audit/review-states.jpg)
- [Samsung bilingual/offline](verification/baya-storybook-audit/review-android.jpg)
- [Samsung touch, source link and rotation](verification/baya-storybook-audit/review-android-touch.jpg)

### Remaining limitations

1. Authentic photograph embedding remains blocked pending documented reproduction/offline permission. The tested fallback is an official-source link; no actual photograph is integrated.
2. Mascot illustrator and complete original grants for legacy supplied educational assets remain undocumented. Existing explicitly requested project use is retained without inventing ownership or licenses.
3. No external Filipino-language or educational-validator review occurred. Contributor roles remain the project's acknowledgements, without certification or partnership claims.
4. Physical tests used the production export in Chrome through localhost forwarding, with service-worker offline reload and browser network emulation. No new installed-PWA session, native Android/iOS build, human-finger usability study or TalkBack/VoiceOver session was performed.
5. Very short handset landscape layouts may stack below the existing width breakpoint and require scrolling. Navigation and source links remain reachable. No unresolved overflow/control defect was found in the tested matrix.

## Complete before / after bilingual content

The following snapshot comes directly from HEAD and the implemented typed configuration. Sources, rights and per-page findings are above. Page 1 and 5 narratives are deliberately retained; their captions and visual treatment change.

### Page 1

**Original — en**

Meet Bayani!

*Your Friendly Learning Companion*

Mabuhay! Meet Bayani, your friendly learning companion!

With a curious mind and a cheerful spirit, Bayani loves discovering new things and helping young learners explore Filipino culture.

Together, you will discover Baybayin characters, practice writing, and learn something exciting with every step!

Caption: Bayani — BAYA’s Philippine eagle-inspired learning companion.

**Original — tl**

Kilalanin si Bayani!

*Ang Iyong Kaibigan sa Pagkatuto*

Mabuhay! Kilalanin si Bayani, ang iyong kaibigan sa pagkatuto!

Mausisa at masayahin si Bayani. Mahilig siyang tumuklas ng mga bagong bagay at tumulong sa mga batang matuto tungkol sa kulturang Pilipino.

Sama-sama nating tuklasin ang mga titik ng Baybayin, magsanay sa pagsulat, at matuto sa bawat hakbang!

Caption: Bayani — ang kaibigan sa pagkatuto ng BAYA na hango sa agilang Pilipino.

**Final — en**

Meet Bayani!

*Your Friendly Learning Companion*

Mabuhay! Meet Bayani, your friendly learning companion!

With a curious mind and a cheerful spirit, Bayani loves discovering new things and helping young learners explore Filipino culture.

Together, you will discover Baybayin characters, practice writing, and learn something exciting with every step!

Caption: Bayani — BAYA’s illustrated learning companion.

**Final — tl**

Kilalanin si Bayani!

*Ang Iyong Kaibigan sa Pagkatuto*

Mabuhay! Kilalanin si Bayani, ang iyong kaibigan sa pagkatuto!

Mausisa at masayahin si Bayani. Mahilig siyang tumuklas ng mga bagong bagay at tumulong sa mga batang matuto tungkol sa kulturang Pilipino.

Sama-sama nating tuklasin ang mga titik ng Baybayin, magsanay sa pagsulat, at matuto sa bawat hakbang!

Caption: Bayani — ang kaibigan sa pagkatuto ng BAYA na hango sa agilang Pilipino.

### Page 2

**Original — en**

The Story Behind Bayani

*Inspired by the Philippine Eagle*

Have you ever seen a Philippine eagle? With its magnificent appearance and powerful wings, this special bird reminds us of the beauty of our natural heritage.

The project’s naming story begins with a real Philippine eagle named Bayani. Inspired by this eagle, the researchers shortened the name to BAYA for the learning application.

The real eagle and our illustrated companion are different. Here, Bayani has a special mission: to help young learners discover the beauty of Baybayin!

Caption: Bayani — BAYA’s Philippine eagle-inspired learning companion.

**Original — tl**

Ang Kuwento ni Bayani

*Hango sa Agilang Pilipino*

Nakakita ka na ba ng agilang Pilipino? Ang maringal nitong anyo at malalakas na pakpak ay nagpapaalala sa ganda ng ating likas na pamana.

Nagsimula ang pangalan ng proyekto sa isang tunay na agilang Pilipino na nagngangalang Bayani. Ginawang BAYA ng mga mananaliksik ang pinaikling pangalan para sa application.

Magkaiba ang tunay na agila at ang ating iginuhit na kaibigan. Dito, may mahalagang misyon si Bayani: samahan ang mga bata sa pagtuklas ng ganda ng Baybayin!

Caption: Ang ating maskot ay hango sa agilang Pilipino.

**Final — en**

The Story Behind Bayani

*Meet the Real Philippine Eagle Who Inspired BAYA*

Our illustrated companion was inspired by a real Philippine eagle named Bayani. This chick hatched on December 5, 2025, at the National Bird Breeding Sanctuary in Davao City. Bayani means “hero” in Filipino.

His mother is Dakila and his father is Sinag. His grandmother, LDI, was rescued years ago. Bayani’s birth is a hopeful step in the Philippine Eagle Foundation’s work to protect these critically endangered birds—birds at great risk of disappearing.

Inspired by his story, the researchers shortened Bayani to BAYA for this learning app. Our illustrated Bayani now joins you on a different adventure: discovering Baybayin!

Caption: Bayani — Philippine Eagle Chick No. 32

**Final — tl**

Ang Kuwento ni Bayani

*Kilalanin ang Tunay na Agilang Pilipino na Nagbigay-Inspirasyon sa BAYA*

Isang tunay na agilang Pilipino na si Bayani ang inspirasyon ng ating iginuhit na kaibigan. Napisa siya noong Disyembre 5, 2025, sa National Bird Breeding Sanctuary sa Davao City. Ang kaniyang pangalan ay nangangahulugang “bayani.”

Si Dakila ang kaniyang ina at si Sinag ang kaniyang ama. Ang lola niyang si LDI ay nasagip maraming taon na ang nakalipas. Ang pagsilang ni Bayani ay nagbibigay ng pag-asa sa Philippine Eagle Foundation sa pangangalaga sa mga agilang nanganganib nang tuluyang mawala.

Dahil sa kaniyang kuwento, pinaikli ng mga mananaliksik ang Bayani bilang BAYA para sa app na ito. Kasama mo naman ang ating iginuhit na Bayani sa pagtuklas ng Baybayin!

Caption: Bayani — Philippine Eagle Chick No. 32

### Page 3

**Original — en**

The Story of BAYA

*Learning Baybayin, One Character at a Time*

Every great learning journey begins with a little curiosity. BAYA was created to help young learners discover Baybayin in a fun, interactive, and meaningful way.

Through guided lessons, handwriting practice, quizzes, and engaging activities, learners explore traditional characters and build confidence.

And throughout this journey, Bayani is here to encourage you to keep discovering, practicing, and growing!

Caption: Discover. Practice. Grow with Bayani.

**Original — tl**

Ang Kuwento ng BAYA

*Pag-aaral ng Baybayin, Paisa-isang Titik*

Nagsisimula sa pagkamausisa ang bawat paglalakbay sa pagkatuto. Nilikha ang BAYA upang maging masaya, interaktibo, at makabuluhan ang pagtuklas ng Baybayin.

Sa mga aralin, pagsasanay sa pagsulat, pagsusulit, at gawain, natutuklasan ng mga bata ang mga tradisyonal na titik at lumalakas ang kanilang tiwala sa sarili.

Kasama mo si Bayani upang hikayatin kang patuloy na tumuklas, magsanay, at matuto!

Caption: Tumuklas. Magsanay. Matuto kasama si Bayani.

**Final — en**

The Story of BAYA

*Learning Baybayin, One Character at a Time*

Every great learning journey begins with a little curiosity. BAYA was created to help young learners discover Baybayin in a fun, interactive, and meaningful way.

Through guided lessons, handwriting practice, quizzes, and engaging activities, learners explore characters and try what they have learned.

And throughout this journey, Bayani is here to encourage you to keep discovering, practicing, and growing!

Caption: Discover. Practice. Grow with Bayani.

**Final — tl**

Ang Kuwento ng BAYA

*Pag-aaral ng Baybayin, Paisa-isang Titik*

Nagsisimula sa pagkamausisa ang bawat paglalakbay sa pagkatuto. Nilikha ang BAYA upang maging masaya, interaktibo, at makabuluhan ang pagtuklas ng Baybayin.

Sa mga aralin, pagsasanay sa pagsulat, pagsusulit, at gawain, natutuklasan ng mga bata ang mga titik at nasusubukan ang kanilang natutuhan.

Kasama mo si Bayani upang hikayatin kang patuloy na tumuklas, magsanay, at matuto!

Caption: Tumuklas. Magsanay. Matuto kasama si Bayani.

### Page 4

**Original — en**

Discovering Baybayin

*A Beautiful Part of Our Filipino Heritage*

Long before the writing system we commonly use today, people in parts of the Philippines used traditional scripts such as Baybayin.

Baybayin has characters that represent syllables. A mark called a kudlit above a consonant changes its vowel to e or i; below, it changes the vowel to o or u.

By learning Baybayin, we can discover another way our ancestors expressed language. Every character has something new to teach us. Are you ready to discover them with Bayani?

Caption: A · Ba · Ka · Ma — four characters to discover.

**Original — tl**

Tuklasin ang Baybayin

*Magandang Bahagi ng Ating Pamanang Pilipino*

Bago pa ang pagsulat na karaniwan nating gamit ngayon, gumamit ang mga tao sa ilang bahagi ng Pilipinas ng mga tradisyonal na sistema tulad ng Baybayin.

Kumakatawan sa mga pantig ang mga titik nito. Ang kudlit sa itaas ng katinig ay nagpapalit ng patinig sa e o i; sa ibaba naman, sa o o u.

Sa pag-aaral ng Baybayin, nakikilala natin ang isang paraan ng pagpapahayag ng ating mga ninuno. Handa ka na bang tumuklas kasama si Bayani?

Caption: A · Ba · Ka · Ma — apat na titik na matutuklasan.

**Final — en**

Discovering Baybayin

*A Beautiful Part of Our Filipino Heritage*

Now let’s meet the writing system at the heart of our journey. Baybayin is one of the traditional scripts used in parts of the Philippines.

Many characters represent syllables. Ba has an a sound. A mark called a kudlit above a consonant changes its vowel to e or i; below, it changes the vowel to o or u.

By learning Baybayin, we can discover another way our ancestors expressed language. Every character has something new to teach us. Are you ready to discover them with Bayani?

Caption: Ba · Be / Bi · Bo / Bu — a little mark changes the sound.

**Final — tl**

Tuklasin ang Baybayin

*Magandang Bahagi ng Ating Pamanang Pilipino*

Kilalanin naman natin ang Baybayin, ang paksa ng ating paglalakbay. Isa ito sa mga tradisyonal na paraan ng pagsulat sa ilang bahagi ng Pilipinas.

Maraming titik nito ang kumakatawan sa pantig. May tunog na a ang Ba. Ang kudlit sa itaas ng katinig ay nagpapalit ng patinig sa e o i; sa ibaba naman, sa o o u.

Sa pag-aaral ng Baybayin, nakikilala natin ang isang paraan ng pagpapahayag ng ating mga ninuno. Handa ka na bang tumuklas kasama si Bayani?

Caption: Ba · Be / Bi · Bo / Bu — nagbabago ang tunog sa isang kudlit.

### Page 5

**Original — en**

A Journey Made Possible Together

*With Gratitude and Appreciation*

Every meaningful learning journey is made more special by people who share their knowledge and inspire others.

The BAYA team thanks Buhayin Baybayin and Ginhawa Baybayin Creativity Workshops for their contribution to the appreciation and promotion of Baybayin.

We extend our special thanks to Ma’am Mini Gavino for her valuable guidance, knowledge, and support in developing and reviewing BAYA’s educational content. Maraming salamat po!

Caption: Bayani — BAYA’s Philippine eagle-inspired learning companion.

**Original — tl**

Isang Paglalakbay na Binuo Nang Sama-sama

*May Pasasalamat at Pagpapahalaga*

Mas nagiging makabuluhan ang pagkatuto dahil sa mga taong nagbabahagi ng kaalaman at inspirasyon.

Nagpapasalamat ang pangkat ng BAYA sa Buhayin Baybayin at Ginhawa Baybayin Creativity Workshops para sa kanilang ambag sa pagpapahalaga at pagtataguyod ng Baybayin.

Natatanging pasasalamat kay Ma’am Mini Gavino sa kaniyang paggabay, kaalaman, at suporta sa pagbuo at pagsusuri ng nilalamang pang-edukasyon ng BAYA. Maraming salamat po!

Caption: Bayani — ang ating kaibigan sa pagkatuto.

**Final — en**

A Journey Made Possible Together

*With Gratitude and Appreciation*

Every meaningful learning journey is made more special by people who share their knowledge and inspire others.

The BAYA team thanks Buhayin Baybayin and Ginhawa Baybayin Creativity Workshops for their contribution to the appreciation and promotion of Baybayin.

We extend our special thanks to Ma’am Mini Gavino for her valuable guidance, knowledge, and support in developing and reviewing BAYA’s educational content. Maraming salamat po!

Caption: For everyone who shares the gift of learning.

**Final — tl**

Isang Paglalakbay na Binuo Nang Sama-sama

*May Pasasalamat at Pagpapahalaga*

Mas nagiging makabuluhan ang pagkatuto dahil sa mga taong nagbabahagi ng kaalaman at inspirasyon.

Nagpapasalamat ang pangkat ng BAYA sa Buhayin Baybayin at Ginhawa Baybayin Creativity Workshops para sa kanilang ambag sa pagpapahalaga at pagtataguyod ng Baybayin.

Natatanging pasasalamat kay Ma’am Mini Gavino sa kaniyang paggabay, kaalaman, at suporta sa pagbuo at pagsusuri ng nilalamang pang-edukasyon ng BAYA. Maraming salamat po!

Caption: Para sa lahat ng nagbabahagi ng kaalaman.
