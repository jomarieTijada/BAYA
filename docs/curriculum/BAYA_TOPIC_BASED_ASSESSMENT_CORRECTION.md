# BAYA topic-based assessment correction

## Root cause

The former placement map assigned each entire interaction bank to one module. Since those banks mixed base consonants and kudlit, broad prerequisites placed all three recognition banks under Kudlit. Interaction type and instructional topic were incorrectly treated as the same dimension.

The replacement classifies the actual target glyph: the correct glyph option for listening/Latin prompts, the displayed glyph for Baybayin-to-Latin, or the expected glyph of the underlined writing target. One placement map references the immutable source objects, retaining source bank/set order.

## Corrected structure

| Module | Topic | Checkpoint | Questions |
|---|---|---|---:|
| Introduction to Baybayin | Existing five topics | None: no corresponding source questions | 0 |
| Baybayin Characters | The Vowels | Vowel Practice | 3 |
| Baybayin Characters | Meet the Consonants | Basic Consonant Practice | 22 |
| Kudlit | Upper Kudlit | Upper Kudlit Practice | 27 |
| Kudlit | Lower Kudlit | Lower Kudlit Practice | 23 |
| Writing Baybayin | Vowels | Existing guided lesson; no source vowel-writing quiz | 0 |
| Writing Baybayin | Consonants | Consonant Writing Practice | 25 |

There is no more specific writing destination in the existing curriculum. Writing placements record both the writing topic and the relevant character/kudlit prerequisite.

## Removal and architecture

`LessonScreen.tsx` removes the banner and starts modules beneath the normal header. `LessonCard.tsx` and `LessonJourney.tsx` render a compact checkpoint immediately after each applicable topic. `ModuleAssessments.tsx` replaces the whole-bank cards with topic-sized Start/Continue/Review rows, actual counts and specific missing instructions.

`content/characterActivities/checkpoints.ts` is the authoritative placement map. Stable `checkpoint-v1-<topicId>` identities reference original questions without changing four source banks, twenty source sets or their IDs. `curriculum.ts` supplies one eligibility resolver to the row, route and SQLite begin transaction. It requires the assigned instruction and existing preceding instructions, never later topics or a new score threshold. The obsolete whole-bank placement resolver was removed.

`CharacterActivityHub.tsx` retains its compatibility filename but now presents only one topic sequence, with no hub UI. Existing QuestionScreen, AssessmentSlide, WritingActivityPresentation, canonical writing canvas, LiteRT inference and SetResultStage are reused. The engine accepts the actual sequence length instead of assuming five.

## Persistence and progress

Existing transactional SQLite and per-profile `character_assessment:v1:` storage retain their ownership and format. New checkpoint IDs occupy the existing set/activity identity fields; responses retain original question IDs. The resolver accepts original source set IDs as well as new checkpoint IDs. No destructive migration, new table, achievement credit, passing threshold or cloud contract was added.

Instructional completion and lesson/module progress keep the existing policy. Finishing a checkpoint means visiting all assigned questions; it does not grant mastery or instructional completion. Scores include only scoreable responses. Two DE/RE listening items remain unscored in Upper Kudlit. Technical failures are recorded separately and do not become wrong answers. Completion stars remain decorative.

## Navigation

Start opens the assigned subset. Continue resumes its unfinished attempt, including persisted feedback. Back returns to the owning module and focuses the checkpoint. Completion Summary shows saved responses, Next returns to the owning lesson, and Retry creates a new attempt without deleting earlier results. Original source-set records remain accessible through Previous source-set results beside relevant topics, using the same completion/review UI. Legacy bank URLs redirect safely to Lessons.

## Integrity and validation

All 100 original questions are referenced exactly once. The accompanying inventory.json includes full prompts, options, answers, underlines, source IDs, concept prerequisites, model classes, actual bundled illustration URIs and audio manifest entries. invariants.json verifies unchanged hashes for source questions, audio manifest/mapping, model inference code and the canonical writing canvas.

The mapping confidence below concerns explicit target classification, not new linguistic approval. DE/RE recording approval remains pending. Traditional shared DA/RA forms, distinct spoken pronunciations, distractors and word context remain unchanged. No introductory or standalone vowel-writing quiz questions were invented. Any future wording/distractor or recording approval belongs to the content validator.

## Verification method

Tests use an isolated Chrome profile and the production PWA export. Actual offline vowel lesson completion is exercised through the UI. Later prerequisite fixtures are seeded only in that isolated profile to reach every question. Writing uses real strokes and LiteRT rather than mocked predictions. Viewport testing does not claim physical-device validation. Execution results and screenshot links follow the inventory.

## All 100 question placements

Target-specific prerequisites are listed below; the central resolver also requires their existing preceding instructional topics. Full illustration URI and audio metadata are in [inventory.json](../verification/topic-checkpoints/inventory.json).

| Question ID | Source activity / set | Interaction | Prompt / underlined target | Correct answer / target glyph | Concept | Assigned topic | Prerequisites | Audio source | Illustration class | Scoreable | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| character-1-q-01 | character-1 / character-1-set-1 | Sound Matching | BA | B — ᜊ / ᜊ | base-consonant | topic-2-2 | topic-2-2 | a/Ba.m4a | ba | Yes | High |
| character-1-q-02 | character-1 / character-1-set-1 | Sound Matching | HA | A — ᜑ / ᜑ | base-consonant | topic-2-2 | topic-2-2 | a/Ha.m4a | ha | Yes | High |
| character-1-q-03 | character-1 / character-1-set-1 | Sound Matching | LA | C — ᜎ / ᜎ | base-consonant | topic-2-2 | topic-2-2 | a/La.m4a | la | Yes | High |
| character-1-q-04 | character-1 / character-1-set-1 | Sound Matching | NA | B — ᜈ / ᜈ | base-consonant | topic-2-2 | topic-2-2 | a/Na.m4a | na | Yes | High |
| character-1-q-05 | character-1 / character-1-set-1 | Sound Matching | SA | A — ᜐ / ᜐ | base-consonant | topic-2-2 | topic-2-2 | a/Sa.m4a | sa | Yes | High |
| character-1-q-06 | character-1 / character-1-set-2 | Sound Matching | DE | B — ᜇᜒ / ᜇᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | Pending DE/RE validation | de_di | Unscored | High; audio pending |
| character-1-q-07 | character-1 / character-1-set-2 | Sound Matching | KE | A — ᜃᜒ / ᜃᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | e/Ke.m4a | ke_ki | Yes | High |
| character-1-q-08 | character-1 / character-1-set-2 | Sound Matching | ME | C — ᜋᜒ / ᜋᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | e/Me.m4a | me_mi | Yes | High |
| character-1-q-09 | character-1 / character-1-set-2 | Sound Matching | PE | B — ᜉᜒ / ᜉᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | e/Pe.m4a | pe_pi | Yes | High |
| character-1-q-10 | character-1 / character-1-set-2 | Sound Matching | RE | A — ᜇᜒ / ᜇᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | Pending DE/RE validation | de_di | Unscored | High; audio pending |
| character-1-q-11 | character-1 / character-1-set-3 | Sound Matching | NGI | B — ᜅᜒ / ᜅᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | i/Ngi.m4a | nge_ngi | Yes | High |
| character-1-q-12 | character-1 / character-1-set-3 | Sound Matching | WI | A — ᜏᜒ / ᜏᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | i/Wi.m4a | we_wi | Yes | High |
| character-1-q-13 | character-1 / character-1-set-3 | Sound Matching | HI | C — ᜑᜒ / ᜑᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | i/Hi.m4a | he_hi | Yes | High |
| character-1-q-14 | character-1 / character-1-set-3 | Sound Matching | TI | B — ᜆᜒ / ᜆᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | i/Ti.m4a | te_ti | Yes | High |
| character-1-q-15 | character-1 / character-1-set-3 | Sound Matching | BI | A — ᜊᜒ / ᜊᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | i/Bi.m4a | be_bi | Yes | High |
| character-1-q-16 | character-1 / character-1-set-4 | Sound Matching | PO | A — ᜉᜓ / ᜉᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | o/Po.m4a | po_pu | Yes | High |
| character-1-q-17 | character-1 / character-1-set-4 | Sound Matching | KO | C — ᜃᜓ / ᜃᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | o/Ko.m4a | ko_ku | Yes | High |
| character-1-q-18 | character-1 / character-1-set-4 | Sound Matching | LO | B — ᜎᜓ / ᜎᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | o/Lo.m4a | lo_lu | Yes | High |
| character-1-q-19 | character-1 / character-1-set-4 | Sound Matching | WO | A — ᜏᜓ / ᜏᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | o/Wo.m4a | wo_wu | Yes | High |
| character-1-q-20 | character-1 / character-1-set-4 | Sound Matching | TO | C — ᜆᜓ / ᜆᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | o/To.m4a | to_tu | Yes | High |
| character-1-q-21 | character-1 / character-1-set-5 | Sound Matching | GU | B — ᜄᜓ / ᜄᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | u/Gu.m4a | go_gu | Yes | High |
| character-1-q-22 | character-1 / character-1-set-5 | Sound Matching | TU | A — ᜆᜓ / ᜆᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | u/Tu.m4a | to_tu | Yes | High |
| character-1-q-23 | character-1 / character-1-set-5 | Sound Matching | MU | C — ᜋᜓ / ᜋᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | u/Mu.m4a | mo_mu | Yes | High |
| character-1-q-24 | character-1 / character-1-set-5 | Sound Matching | YU | B — ᜌᜓ / ᜌᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | u/Yu.m4a | yo_yu | Yes | High |
| character-1-q-25 | character-1 / character-1-set-5 | Sound Matching | BU | A — ᜊᜓ / ᜊᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | u/Bu.m4a | bo_bu | Yes | High |
| character-2-q-01 | character-2 / character-2-set-1 | Baybayin to Latin | ᜀ | B — A / ᜀ | vowel | topic-2-1 | topic-2-1 | None required | a | Yes | High |
| character-2-q-02 | character-2 / character-2-set-1 | Baybayin to Latin | ᜁ | A — I/E / ᜁ | vowel | topic-2-1 | topic-2-1 | None required | e_i | Yes | High |
| character-2-q-03 | character-2 / character-2-set-1 | Baybayin to Latin | ᜂ | C — O/U / ᜂ | vowel | topic-2-1 | topic-2-1 | None required | o_u | Yes | High |
| character-2-q-04 | character-2 / character-2-set-1 | Baybayin to Latin | ᜃ | B — KA / ᜃ | base-consonant | topic-2-2 | topic-2-2 | None required | ka | Yes | High |
| character-2-q-05 | character-2 / character-2-set-1 | Baybayin to Latin | ᜄ | A — GA / ᜄ | base-consonant | topic-2-2 | topic-2-2 | None required | ga | Yes | High |
| character-2-q-06 | character-2 / character-2-set-2 | Baybayin to Latin | ᜅ | B — NGA / ᜅ | base-consonant | topic-2-2 | topic-2-2 | None required | nga | Yes | High |
| character-2-q-07 | character-2 / character-2-set-2 | Baybayin to Latin | ᜆ | A — TA / ᜆ | base-consonant | topic-2-2 | topic-2-2 | None required | ta | Yes | High |
| character-2-q-08 | character-2 / character-2-set-2 | Baybayin to Latin | ᜉ | C — PA / ᜉ | base-consonant | topic-2-2 | topic-2-2 | None required | pa | Yes | High |
| character-2-q-09 | character-2 / character-2-set-2 | Baybayin to Latin | ᜋ | B — MA / ᜋ | base-consonant | topic-2-2 | topic-2-2 | None required | ma | Yes | High |
| character-2-q-10 | character-2 / character-2-set-2 | Baybayin to Latin | ᜌ | A — YA / ᜌ | base-consonant | topic-2-2 | topic-2-2 | None required | ya | Yes | High |
| character-2-q-11 | character-2 / character-2-set-3 | Baybayin to Latin | ᜄᜒ | B — GI / ᜄᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | ge_gi | Yes | High |
| character-2-q-12 | character-2 / character-2-set-3 | Baybayin to Latin | ᜎᜒ | A — LI / ᜎᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | le_li | Yes | High |
| character-2-q-13 | character-2 / character-2-set-3 | Baybayin to Latin | ᜈᜒ | C — NI / ᜈᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | ne_ni | Yes | High |
| character-2-q-14 | character-2 / character-2-set-3 | Baybayin to Latin | ᜐᜒ | B — SI / ᜐᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | se_si | Yes | High |
| character-2-q-15 | character-2 / character-2-set-3 | Baybayin to Latin | ᜌᜒ | A — YI / ᜌᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | ye_yi | Yes | High |
| character-2-q-16 | character-2 / character-2-set-4 | Baybayin to Latin | ᜅᜓ | B — NGO/NGU / ᜅᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | ngo_ngu | Yes | High |
| character-2-q-17 | character-2 / character-2-set-4 | Baybayin to Latin | ᜇᜓ | A — DO/DU / ᜇᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | do_du | Yes | High |
| character-2-q-18 | character-2 / character-2-set-4 | Baybayin to Latin | ᜈᜓ | C — NO/NU / ᜈᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | no_nu | Yes | High |
| character-2-q-19 | character-2 / character-2-set-4 | Baybayin to Latin | ᜐᜓ | B — SO/SU / ᜐᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | so_su | Yes | High |
| character-2-q-20 | character-2 / character-2-set-4 | Baybayin to Latin | ᜑᜓ | A — HO/HU / ᜑᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | ho_hu | Yes | High |
| character-2-q-21 | character-2 / character-2-set-5 | Baybayin to Latin | ᜇ | B — DA/RA / ᜇ | base-consonant | topic-2-2 | topic-2-2 | None required | da_ra | Yes | High |
| character-2-q-22 | character-2 / character-2-set-5 | Baybayin to Latin | ᜏ | A — WA / ᜏ | base-consonant | topic-2-2 | topic-2-2 | None required | wa | Yes | High |
| character-2-q-23 | character-2 / character-2-set-5 | Baybayin to Latin | ᜉᜒ | C — PI/PE / ᜉᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | pe_pi | Yes | High |
| character-2-q-24 | character-2 / character-2-set-5 | Baybayin to Latin | ᜃᜒ | B — KI/KE / ᜃᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | ke_ki | Yes | High |
| character-2-q-25 | character-2 / character-2-set-5 | Baybayin to Latin | ᜇᜒ | A — DI/DE/RI/RE / ᜇᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | de_di | Yes | High |
| character-3-q-01 | character-3 / character-3-set-1 | Latin to Baybayin | DA | B — ᜇ / ᜇ | base-consonant | topic-2-2 | topic-2-2 | None required | da_ra | Yes | High |
| character-3-q-02 | character-3 / character-3-set-1 | Latin to Baybayin | WA | A — ᜏ / ᜏ | base-consonant | topic-2-2 | topic-2-2 | None required | wa | Yes | High |
| character-3-q-03 | character-3 / character-3-set-1 | Latin to Baybayin | HA | C — ᜑ / ᜑ | base-consonant | topic-2-2 | topic-2-2 | None required | ha | Yes | High |
| character-3-q-04 | character-3 / character-3-set-1 | Latin to Baybayin | SA | B — ᜐ / ᜐ | base-consonant | topic-2-2 | topic-2-2 | None required | sa | Yes | High |
| character-3-q-05 | character-3 / character-3-set-1 | Latin to Baybayin | LA | A — ᜎ / ᜎ | base-consonant | topic-2-2 | topic-2-2 | None required | la | Yes | High |
| character-3-q-06 | character-3 / character-3-set-2 | Latin to Baybayin | BE | B — ᜊᜒ / ᜊᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | be_bi | Yes | High |
| character-3-q-07 | character-3 / character-3-set-2 | Latin to Baybayin | TE | A — ᜆᜒ / ᜆᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | te_ti | Yes | High |
| character-3-q-08 | character-3 / character-3-set-2 | Latin to Baybayin | NGI | C — ᜅᜒ / ᜅᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | nge_ngi | Yes | High |
| character-3-q-09 | character-3 / character-3-set-2 | Latin to Baybayin | WE | B — ᜏᜒ / ᜏᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | we_wi | Yes | High |
| character-3-q-10 | character-3 / character-3-set-2 | Latin to Baybayin | DE | A — ᜇᜒ / ᜇᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | de_di | Yes | High |
| character-3-q-11 | character-3 / character-3-set-3 | Latin to Baybayin | BO | B — ᜊᜓ / ᜊᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | bo_bu | Yes | High |
| character-3-q-12 | character-3 / character-3-set-3 | Latin to Baybayin | KU | A — ᜃᜓ / ᜃᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | ko_ku | Yes | High |
| character-3-q-13 | character-3 / character-3-set-3 | Latin to Baybayin | PO | C — ᜉᜓ / ᜉᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | po_pu | Yes | High |
| character-3-q-14 | character-3 / character-3-set-3 | Latin to Baybayin | MO | B — ᜋᜓ / ᜋᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | mo_mu | Yes | High |
| character-3-q-15 | character-3 / character-3-set-3 | Latin to Baybayin | YU | A — ᜌᜓ / ᜌᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | yo_yu | Yes | High |
| character-3-q-16 | character-3 / character-3-set-4 | Latin to Baybayin | TA | B — ᜆ / ᜆ | base-consonant | topic-2-2 | topic-2-2 | None required | ta | Yes | High |
| character-3-q-17 | character-3 / character-3-set-4 | Latin to Baybayin | TI | A — ᜆᜒ / ᜆᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | te_ti | Yes | High |
| character-3-q-18 | character-3 / character-3-set-4 | Latin to Baybayin | TU | C — ᜆᜓ / ᜆᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | to_tu | Yes | High |
| character-3-q-19 | character-3 / character-3-set-4 | Latin to Baybayin | PA | B — ᜉ / ᜉ | base-consonant | topic-2-2 | topic-2-2 | None required | pa | Yes | High |
| character-3-q-20 | character-3 / character-3-set-4 | Latin to Baybayin | PE | A — ᜉᜒ / ᜉᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | pe_pi | Yes | High |
| character-3-q-21 | character-3 / character-3-set-5 | Latin to Baybayin | YA | B — ᜌ / ᜌ | base-consonant | topic-2-2 | topic-2-2 | None required | ya | Yes | High |
| character-3-q-22 | character-3 / character-3-set-5 | Latin to Baybayin | GO | A — ᜄᜓ / ᜄᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | go_gu | Yes | High |
| character-3-q-23 | character-3 / character-3-set-5 | Latin to Baybayin | NE | C — ᜈᜒ / ᜈᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | ne_ni | Yes | High |
| character-3-q-24 | character-3 / character-3-set-5 | Latin to Baybayin | KI | B — ᜃᜒ / ᜃᜒ | upper-kudlit | topic-kudlit-upper | topic-kudlit-upper | None required | ke_ki | Yes | High |
| character-3-q-25 | character-3 / character-3-set-5 | Latin to Baybayin | SU | A — ᜐᜓ / ᜐᜓ | lower-kudlit | topic-kudlit-lower | topic-kudlit-lower | None required | so_su | Yes | High |
| character-4-q-01 | character-4 / character-4-set-1 | Writing | <u>GA</u>BI | ᜄ / ᜄ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | ga | Yes | High |
| character-4-q-02 | character-4 / character-4-set-1 | Writing | <u>DA</u>LAW | ᜇ / ᜇ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | da_ra | Yes | High |
| character-4-q-03 | character-4 / character-4-set-1 | Writing | <u>YA</u>KAP | ᜌ / ᜌ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | ya | Yes | High |
| character-4-q-04 | character-4 / character-4-set-1 | Writing | <u>PA</u>LAY | ᜉ / ᜉ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | pa | Yes | High |
| character-4-q-05 | character-4 / character-4-set-1 | Writing | <u>NGA</u>YON | ᜅ / ᜅ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | nga | Yes | High |
| character-4-q-06 | character-4 / character-4-set-2 | Writing | LA<u>BA</u> | ᜊ / ᜊ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | ba | Yes | High |
| character-4-q-07 | character-4 / character-4-set-2 | Writing | PU<u>SA</u> | ᜐ / ᜐ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | sa | Yes | High |
| character-4-q-08 | character-4 / character-4-set-2 | Writing | A<u>MA</u> | ᜋ / ᜋ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | ma | Yes | High |
| character-4-q-09 | character-4 / character-4-set-2 | Writing | BA<u>TA</u> | ᜆ / ᜆ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | ta | Yes | High |
| character-4-q-10 | character-4 / character-4-set-2 | Writing | PA<u>NA</u> | ᜈ / ᜈ | base-consonant | topic-3-2 | topic-3-2, topic-2-2 | None required | na | Yes | High |
| character-4-q-11 | character-4 / character-4-set-3 | Writing | <u>KI</u>LAY | ᜃᜒ / ᜃᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | ke_ki | Yes | High |
| character-4-q-12 | character-4 / character-4-set-3 | Writing | <u>HI</u>GA | ᜑᜒ / ᜑᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | he_hi | Yes | High |
| character-4-q-13 | character-4 / character-4-set-3 | Writing | <u>WI</u>KA | ᜏᜒ / ᜏᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | we_wi | Yes | High |
| character-4-q-14 | character-4 / character-4-set-3 | Writing | <u>MI</u>SA | ᜋᜒ / ᜋᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | me_mi | Yes | High |
| character-4-q-15 | character-4 / character-4-set-3 | Writing | <u>NGI</u>TI | ᜅᜒ / ᜅᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | nge_ngi | Yes | High |
| character-4-q-16 | character-4 / character-4-set-4 | Writing | SU<u>SI</u> | ᜐᜒ / ᜐᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | se_si | Yes | High |
| character-4-q-17 | character-4 / character-4-set-4 | Writing | PU<u>TI</u> | ᜆᜒ / ᜆᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | te_ti | Yes | High |
| character-4-q-18 | character-4 / character-4-set-4 | Writing | KA<u>PE</u> | ᜉᜒ / ᜉᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | pe_pi | Yes | High |
| character-4-q-19 | character-4 / character-4-set-4 | Writing | TA<u>BI</u> | ᜊᜒ / ᜊᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | be_bi | Yes | High |
| character-4-q-20 | character-4 / character-4-set-4 | Writing | LA<u>GI</u> | ᜄᜒ / ᜄᜒ | upper-kudlit | topic-3-2 | topic-3-2, topic-kudlit-upper | None required | ge_gi | Yes | High |
| character-4-q-21 | character-4 / character-4-set-5 | Writing | TU<u>LO</u> | ᜎᜓ / ᜎᜓ | lower-kudlit | topic-3-2 | topic-3-2, topic-kudlit-lower | None required | lo_lu | Yes | High |
| character-4-q-22 | character-4 / character-4-set-5 | Writing | BU<u>KO</u> | ᜃᜓ / ᜃᜓ | lower-kudlit | topic-3-2 | topic-3-2, topic-kudlit-lower | None required | ko_ku | Yes | High |
| character-4-q-23 | character-4 / character-4-set-5 | Writing | PI<u>TO</u> | ᜆᜓ / ᜆᜓ | lower-kudlit | topic-3-2 | topic-3-2, topic-kudlit-lower | None required | to_tu | Yes | High |
| character-4-q-24 | character-4 / character-4-set-5 | Writing | LO<u>BO</u> | ᜊᜓ / ᜊᜓ | lower-kudlit | topic-3-2 | topic-3-2, topic-kudlit-lower | None required | bo_bu | Yes | High |
| character-4-q-25 | character-4 / character-4-set-5 | Writing | PU<u>SO</u> | ᜐᜓ / ᜐᜓ | lower-kudlit | topic-3-2 | topic-3-2, topic-kudlit-lower | None required | so_su | Yes | High |

## Executed verification results — 23 November 2026

- Full Jest suite: **88 suites, 977 tests passed**.
- TypeScript, ESLint and production web export: **passed**.
- Final PWA: `baya-pwa-5355cddc88f2c01e`, 237 precached assets.
- All 100 questions executed offline through the actual UI: 3 vowel, 22 base-consonant, 27 upper-kudlit, 23 lower-kudlit and 25 writing questions. The writing test repeatedly supplied a known stroke to exercise real recognition and genuine correct/incorrect results; it is not a handwriting accuracy study.
- Zero-correct results, retry preservation, actual denominators, two unscored DE/RE responses, Summary, Next, owning-topic return and historical source-set access passed.
- Actual offline vowel lesson completion unlocked its checkpoint without document reload. Upper Kudlit practice unlocked before Lower Kudlit was completed. Fresh direct links failed closed for all five checkpoints.
- Final-build summary displays responses from earlier and current checkpoint attempts. Updating the PWA retained all SQLite records; the prepared update waits for old clients to close, as designed.
- Full offline browser close/reopen preserved attempts and instruction records, resumed the exact second question of an unfinished retry, and retained profile isolation. Browser Back/Forward and restored URLs could not bypass locks after switching profiles. Legacy URLs redirected safely offline.
- English/Tagalog lesson and completion presentation and modal keyboard focus containment passed.
- All five checkpoint controls were scrolled into view and measured within each of the ten requested viewports, including 2048×921 from the supplied screenshot dimensions. Final screenshots were visually inspected. Modules begin below the header, the banner is absent, and Kudlit contains only its two compact topic checkpoints. The existing horizontal module carousel and vertical scrolling on short screens remain; adjacent offscreen cards can be reached by scrolling.

Machine-readable results: [question execution](../verification/topic-checkpoints/browser-results.json), [final build](../verification/topic-checkpoints/final-results.json), [offline restart](../verification/topic-checkpoints/restart-results.json), [verification summary](../verification/topic-checkpoints/verification.json).

## Screenshot evidence

[Before/after gallery](../verification/topic-checkpoints/comparison.html)

- [Supplied original banner](../verification/topic-checkpoints/before-1.png)
- [Supplied original assessment cluster](../verification/topic-checkpoints/before-2.png)
- [Corrected Android landscape viewport](../verification/topic-checkpoints/final-lessons-844x390.png)
- [Corrected portrait viewport](../verification/topic-checkpoints/final-lessons-390x844.png)
- [Supplied screenshot dimensions reproduced](../verification/topic-checkpoints/final-lessons-2048x921.png)
- [Actual upper-kudlit results with pending audio](../verification/topic-checkpoints/complete-topic-kudlit-upper.png)
- [Historical checkpoint responses](../verification/topic-checkpoints/final-history-summary.png)
- [Offline restart at saved question](../verification/topic-checkpoints/restart-resumed-question.png)

## Remaining validation and limits

DE/RE recordings still need the content validator's approval and remain unscored. No replacement recordings, invented questions or new grading thresholds were introduced. Native Android and physical-device testing were not performed in this pass; responsive browser/PWA checks are recorded separately. No new prerequisite or mastery policy is proposed: instructional progress retains the existing policy, while topic practice has its own completion state.

## Follow-up: sequential Next navigation

Lesson Next now saves completion and automatically opens that topic's checkpoint. The checkpoint completion Next button opens the next available instructional topic in curriculum order, including across module boundaries. The final consonant-writing lesson opens its writing activity after the existing mastery checks; after the last activity, Next returns to Lessons. Back still returns to the topic cards. Existing attempts resume or show their saved completion; no results are erased.

Validation: 188 targeted tests in 8 suites passed, including writing mastery/navigation regressions. TypeScript and production export passed. An offline browser completed all 75 recognition questions while advancing directly from the vowel lesson through both kudlit quizzes into the writing-vowel lesson, with eight automatic-navigation assertions passing. See `docs/verification/sequential-checkpoints/browser-results.json`. The phone preview remains on port 8084.
