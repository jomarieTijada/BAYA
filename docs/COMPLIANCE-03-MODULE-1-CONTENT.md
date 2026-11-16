# BAYA System Compliance #3 — Module 1 content

Audit and implementation: 7 November 2026. **Technical corrections implemented; formal educational approval pending.** This report distinguishes existing researcher-selected content from independently evidenced approval. No new validator sign-off was received.

## A. Official recommendation

Panel Chair: **“Fix the contents in Module 1.”** No itemized panel error list was supplied. The findings below come from the application and references, not an inferred panel complaint. No commit, push or deployment is part of this work.

## B. Pre-change inventory and authoritative sources

Module `module-1`, **Pagkilala sa Baybayin**, has the following fixed order. No explicit objective field or separately signed objective list was found. Objectives below are **inferred review proposals**, not newly approved learning outcomes.

| Topic ID | Actual topic title | Proposed learning objective | Canonical content source | Language versions | Status |
| --- | --- | --- | --- | --- | --- |
| topic-1-1 | Kasaysayan at Kahalagahan ng Baybayin | Recognize Baybayin's historical Tagalog association and cultural importance | `content/baybayinIntroduction.ts`, composed by `content/approvedStorybook.ts` | TL source; EN/TL resources | Live history preserved; separate invitation and video; legacy tools correction |
| topic-1-2 | Baybayin: Isang Silabaryo (Pantigan) | Read Ba, Ka and Ta as syllables | `content/baybayinSyllabary.ts`, composed by `content/approvedStorybook.ts` | TL source; paragraph-level EN/TL | Researcher-selected wording preserved; terminology nuance pending |
| topic-1-3 | Ang 17 Simbolo ng Baybayin | Identify the basic set as three vowels and fourteen consonants | `content/topics/topic-1-3.ts` | TL source; EN/TL whole-message resources | English rendering fixed; takeaway narrowed |
| topic-1-4 | Magkaibang Letra, Iisang Simbolo? | Recognize shared E/I and O/U symbols | `content/topics/topic-1-3.ts` | TL source; EN/TL whole-message resources | English rendering fixed; universal sound-interchange claim pending |
| topic-1-5 | Paano naman ang Da at Ra? | Recognize shared Da/Ra in this course's convention | `content/topics/topic-1-3.ts` | TL source; EN/TL whole-message resources | English rendering fixed; historical/phonological scope pending |

Source paths above are relative to `apps/mobile/`. The titles and order come from `content/approvedCurriculum.ts`. The learner list is `app/learner/lessons.tsx`; legacy `app/learner/lessons/[id].tsx` redirects there; activity route `app/learner/activities/[topicId].tsx` loads `StorybookTopicScreen`. Live data use `getApprovedStorybookActivity`; bundled Module 1 storybooks also take precedence in `database/services/activityContentService.ts`. This is TypeScript curriculum data, not a separate CMS.

Each active topic retains one `${topicId}-story` step. Topic 1 has a separate invitation before the content page; `?lessonPage=content` opens video/history directly. Legacy `content/activities.ts` registry previews include Topic 1's video and four slides, and Topic 2's earlier metadata. They are not the canonical live journey. Their writing-tools slide was audited and corrected without promoting it into the live lesson.

`database/seed.ts` serializes the bundled activities into SQLite `activity_content`; its existing revision/provenance labels are application metadata, not proof of academic approval. Curriculum version `version-baya-modules-1-to-3-v1`, seed logic, lesson IDs and completion logic remain unchanged. There is no new content-hash progress invalidation. `localLearnerService.completeTopic` is still invoked on Next, not on language changes or Back; the screen retains its save-before-navigation guard.

Local references reviewed: `docs/content/baybayin-history-revision.md`, `baybayin-syllabary-revision.md`, `baybayin-modern-spelling-audit.md`, `lesson-two-validator-revision.md`, and `apps/mobile/content/README.md` / `content/topics/README.md`. The history note records prior requested changes. The syllabary note records a supplied Baybayin Buhayin 2.0 screenshot attributed to Bb. Rusell Irene L. Lagunsad, UP Diliman. These support preserving the selected wording, but do not establish new approval of this audit. Later-module references were used only to understand boundaries; their lessons were not revised.

## C. Audit findings

The pre-edit [correction register](COMPLIANCE-03-MODULE-1-CORRECTIONS.md) records M1-01–M1-13 with severity, evidence, actions and validation status.

- English Topics 1.3–1.5 split whole-message resources before translation. Rendered paragraphs contained Tagalog despite translated headings. This was a runtime error, not missing canonical text.
- ASCII word boundaries failed to reliably highlight Baybayin, accented words and counts with parentheses. One highlight phrase differed from its source.
- The 17-character takeaway overstated the basic set as everything learners need. It now introduces the basic set without contradicting later lessons about marks.
- A legacy Topic 1 tools slide asserted there was no paper and described a whistle as a writing tool. It now distinguishes bamboo engraving with sharp tools from pigment writing on leaves.
- Legacy preview metadata contradicted the active five-topic module. It now derives titles/counts from the existing manifest.
- Topics 1.2–1.5 displayed “Add Image Here.” This developer instruction is now an honest localized missing-illustration message. Artwork remains absent.

History: the live paragraph describes one ancient Philippine writing system, historical Tagalog association, and cultural heritage. It does not claim a unique inventor, certain birthplace, universal use by all Philippine languages, or that Alibata is the original name. It does not equate related Philippine scripts with Baybayin. No live correction was needed. Colonial changes and uncertain transmission routes are not taught here; no advanced material was added.

Writing system: Topic 1.2's syllabary shorthand and one-letter/one-sound alphabet comparison need validator nuance; the explicitly selected source was preserved. Ba/Ka/Ta demonstrate inherent A without teaching kudlit. No active Module 1 combining signs, final-consonant notation or modern RA examples occur. Topic 1.4's shared vowel representation is correct within the baseline; its universal historical interchange explanation is not established by Unicode. Topic 1.5's shared DA/RA is a course convention; its explanation should not imply every historical or modern convention is identical.

Readability and sequence: history → syllabic reading → basic set → shared vowels → Da/Ra is coherent and was preserved. Sentences are short enough for guided reading, but terms such as *patinig*, *katinig* and the abstract sound-change claims still need Grade 3 validator review. No reading-age score or learner comprehension study was performed. Proposed objectives require approval before being presented as formal curriculum outcomes.

### Character and media inventory

| Display | Code point(s) | Meaning checked | Result |
| --- | --- | --- | --- |
| ᜊ = Ba; ᜃ = Ka; ᜆ = Ta | U+170A, U+1703, U+1706 | Basic consonants with default A | Preserved in both languages |
| ᜁ; ᜂ | U+1701, U+1702 | Shared independent I/E and U/O vowels | Preserved; linguistic explanation separately pending |
| ᜇ | U+1707 | DA, used for course Da/Ra convention | Preserved; no modern RA substitution |

No combining marks occur in those live sequences; no normalization or recognition-label conversion was introduced. The number 17 describes the instructional base set, not the handwriting model's class count. The character data, writing data and model class-label files match their pre-edit hashes.

`StoryVisualLearning.tsx` contains dormant seventeen-symbol, allophone and Da/Ra diagrams. Current live data do not select those themes. Their full 17-character chart matches the base-set code points, but word pairs LALAKI/LALAKE, BABAE/BABAI, KAIN/KAEN and morphology examples ma+dapat→marapat, tawid+an→tawiran, ma+dunong→marunong require linguistic approval. They were not enabled or rewritten.

Topic 1 uses the existing bundled `assets/media/videos/baybayin-song.mp4` (`baybayin-song`) starting at 17 seconds. The visible GINHAWA credit and its website link remain intact. Historical NCCA metadata remains in the source without being confused with video authorship. No standalone narration/audio reference was added. BAYA guide assets were preserved; the other lesson illustration panels remain placeholders. This audit did not establish full song transcript accuracy or new media reuse rights. No image was downloaded or generated.

## D. Implemented corrections and bilingual review

The register contains exact before/after English and Tagalog wording for substantive changes, including the legacy tools passage and the revised 17-character takeaway. Machine-readable complete snapshots are [before-content.json](verification/compliance-03/before-content.json) and [after-content.json](verification/compliance-03/after-content.json). Snapshot language projections translate whole fields; Topic 1.2 intentionally uses paragraph-level resources, so its actual translated rendering is evidenced by the browser report rather than the whole-field projection.

`storyParagraphs` translates a whole message before separating its paragraphs and supports older paragraph-level resources. Topic 1.3–1.5 resource outputs now retain paragraph breaks. `storyTextSegments` matches complete Unicode terms, longest first, without altering source characters. Rendered fragments use the existing provider's verbatim boundary to prevent a second translation of fragments. English keyword resources were added for the affected Module 1 terms. No new localization architecture was introduced.

The replacement placeholder is EN “Illustration not yet available.” / TL “Wala pang larawang magagamit.” Titles, body meaning, examples and takeaways were compared in both languages. This restores technical language consistency; it does not independently certify the retained disputed claims or every draft translation.

## E. Validator review queue

1. Approve/revise the new bilingual basic-set takeaway and legacy writing-tools wording (M1-03/04).
2. Decide the Grade 3 scope of *silabaryo*, inherent A, and the alphabet comparison while respecting the selected source (M1-08).
3. Resolve universal E/I–O/U interchange/meaning and the causal takeaway; approve contextual wording and any dormant word examples (M1-09).
4. Scope Da/Ra to the course convention and validate its historical/phonological explanation and dormant morphology (M1-10).
5. Approve measurable objectives, illustrations and the full song/transcript/media rights evidence (M1-12/13).

Proposed bilingual alternatives are in the register. They are not silently substituted into lessons. Formal academic compliance remains open until the researchers' validators decide these items.

## F. External references

- [National Museum Baybayin exhibition](https://www.nationalmuseum.gov.ph/exhibitions/anthropology/baybayin/): accessible exhibit text supports distinguishing pigment writing on leaves from engraving bamboo with sharp implements. This is the direct basis for M1-04.
- [Unicode 16, chapter 17, §17.1](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-17/): accessible technical reference for basic characters, inherent vowels, shared vowel signs and historical/modern distinctions. It does not itself prove universal Filipino lexical interchange or all word morphology.
- [Tagalog code chart](https://www.unicode.org/charts/PDF/U1700.pdf): basic code-point labels cross-checked. The current URL served a Unicode 18 chart; it is not mislabeled here as version 16.
- [NMP library record 815](https://library.nationalmuseum.gov.ph/cgi-bin/koha/opac-detail.pl?biblionumber=815) and [record 135](https://library.nationalmuseum.gov.ph/cgi-bin/koha/opac-detail.pl?biblionumber=135): publication discovery/catalog metadata only. No unexamined book pages are cited as evidence.

## G. Source files changed for this compliance item

All paths below are repository-relative; extensive pre-existing working-tree changes belong to earlier work and are not claimed as Compliance #3 edits.

| Path | Purpose |
| --- | --- |
| `apps/mobile/content/topics/topic-1-1.ts` | Correct legacy tools wording; derive preview metadata |
| `apps/mobile/content/topics/topic-1-2.ts` | Align preview title/module/count with manifest |
| `apps/mobile/content/topics/topic-1-3.ts` | Narrow takeaway; align highlight phrase |
| `apps/mobile/localization/education.ts` | Synchronize changed educational text, paragraphs and keywords |
| `apps/mobile/localization/en.ts`, `tl.ts` | Localized illustration fallback |
| `apps/mobile/components/learner/story/StoryContent.tsx` | Translate before splitting; verbatim examples and text |
| `apps/mobile/components/learner/story/storyText.ts` | Shared paragraph and Unicode highlight helpers |
| `apps/mobile/components/learner/story/StorySpeechBubble.tsx` | Unicode highlight and verbatim fragments |
| `apps/mobile/components/learner/story/StoryImagePlaceholder.tsx` | Replace developer instruction |
| `apps/mobile/content/__tests__/moduleOneCompliance.test.ts` | Stable content, glyphs, bilingual paragraphs and highlighting regressions |
| `apps/mobile/components/learner/activity/__tests__/Topic12StorybookScreen.test.tsx` | Updated metadata/fallback expectations |
| `apps/mobile/components/learner/story/__tests__/StorybookTopicScreen.test.tsx` | Fallback expectation and language-switch/no-progress-write check |
| `scripts/testing/compliance-03-browser.mjs`, `compliance-03-interaction.mjs` | Reproducible bilingual viewport and takeaway captures |
| `docs/COMPLIANCE-03-MODULE-1-CORRECTIONS.md`, this report, `docs/verification/compliance-03/` | Register, reviewer snapshots and evidence |

## H. Automated and browser verification

Results on the final implementation:

| Check | Actual result / evidence |
| --- | --- |
| Focused Jest | `npm test --workspace apps/mobile -- --runInBand --forceExit --silent Storybook moduleOneCompliance baybayinIntroduction curriculumScreens`: **6 suites, 86 tests passed**; [log](verification/compliance-03/final-focused.log) |
| Broader regression run | **70 suites / 677 tests passed; one newly added test failed because its test helper attempted to JSON-serialize a circular React element.** The helper was corrected to extract text, then its suite and the other relevant suites passed in the focused rerun above. A second full-suite run was not performed. [Original log](verification/compliance-03/jest.log) |
| TypeScript | `npx tsc --noEmit -p apps/mobile/tsconfig.json`: exit 0, no diagnostics |
| Lint | `npm run lint --workspace apps/mobile -- --no-cache`: exit 0, no warnings/errors |
| Production export | `npm run export:web --workspace apps/mobile`: passed including PWA generation; cache `baya-pwa-2904fb50ee50f8c0`, 163 assets; [log](verification/compliance-03/export.log) |
| Viewport matrix | 70 route/language/size checks; 120 after PNGs including 50 takeaway views; no script failures or horizontal page overflow |

Browser interaction checks also passed: all five topics reloaded with the network offline and an active service worker; sequential completion of Topics 1–3 advanced to Topic 1.4; Back returned to Topic 1.3; the compact takeaway opened and dismissed. These checks used an isolated temporary browser profile, not a user learner database. The existing prerequisite guard correctly blocked an initial attempt to complete Topic 1.3 before its predecessors; the harness was corrected to follow the lesson sequence. Video metadata loaded (231.488 seconds) and credit text remained visible; this is not a full audiovisual review. See [interaction-report.json](verification/compliance-03/interaction-report.json).

Jest used `--forceExit` because the existing suite retains open handles; that does not establish open-handle cleanup. Focused coverage includes load/order/IDs, basic glyphs, source corrections, whole-message localization, Unicode highlighting, language switching without completion writes, existing Back/Next persistence guards and credit behavior. Scope hashes are in [scope-hashes.json](verification/compliance-03/scope-hashes.json): curriculum manifest, character data, writing data, model class labels and seed match the pre-edit baseline; education resources changed intentionally. No Module 2/3 source, schema, scoring, membership or recognition change was made for this task.

## I. Visual evidence

Before: 28 captures at 667×375 and 1366×768, both languages, topic list, invitation and all five lessons. See [before-browser-report.json](verification/compliance-03/before-browser-report.json). Actual screenshots expose mixed Tagalog/English paragraphs in English mode; a translated data snapshot alone would have missed that defect.

The [bilingual rendered review packet](verification/compliance-03/bilingual-review.md) provides per-topic actual before/after paragraphs and current takeaways.

After: five required sizes (667×375, 844×390, 915×412, 1024×768, 1366×768), both languages, list/invitation/all five lessons, plus scrolled takeaway captures. Filenames follow `after-{en|tl}-{topics|introduction|topic-1-N}-{width}x{height}.png`; each lesson also has `-takeaway.png`. The browser report records rendered paragraphs, glyph text, scroll extents and takeaways.

Visual review covered all ten contact sheets (`review-{en|tl}-{size}.jpg`) and selected full-size screenshots. Corrected paragraphs and glyphs render without corruption. Topic 1.2 requires vertical scrolling at short heights; its full examples are reachable (667px English scroll 47px, Tagalog 69px). The mascot itself does not obscure the reading panel. Its intentionally opened compact popover overlays some text and has a working close control; dismissing it restores reading access. Topic-list card titles remain ellipsized in the existing layout, with full titles on lesson headers. These are disclosed existing presentation behaviors, not a claim of zero overlap or full titles in every card.

## J. Remaining limitations and compliance-matrix remark

The correction register and reviewer evidence separate completed implementation from approval-dependent decisions. Browser verification covers the web/PWA build, not native Android/iOS devices. Full audiovisual validation, new authorized illustrations, formal objectives and subject-matter acceptance remain outstanding.

**Suggested matrix remark:** Audited all five Module 1 topics against live content, prior researcher-selected references and institutional sources. Implemented bilingual rendering/highlight corrections, a clearer basic-character takeaway, evidence-supported legacy writing-tools text and consistent preview metadata. Preserved stable IDs, character/model mappings and progress behavior. Submitted remaining syllabary, vowel-interchange, Da/Ra, objective and media decisions for content-validator confirmation; formal educational approval pending.
