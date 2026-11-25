# Base consonants and separate Kudlit instruction

## Correction and root cause

`CharacterViewer` previously mounted `KudlitRecordings` under every selected base character. The consonant inventory itself was already the correct fourteen traditional groups; the shared presentation mixed the two instructional stages.

The base lesson now renders only its original illustration, base label, original example word and target emphasis, selector, Baya guide, and verified base pronunciation. The variation component is absent from its rendering and accessibility trees. Existing layout alignment naturally centers the remaining example/mascot region; no replacement illustrations or filler prose were introduced.

Original example words and full Baybayin spellings remain unchanged. Some words contain vowel signs or cancellation marks outside the highlighted target. These remain contextual spellings, not separate variation controls or new instructional targets.

## Inventory

BA ᜊ, KA ᜃ, DA/RA ᜇ, GA ᜄ, HA ᜑ, LA ᜎ, MA ᜋ, NA ᜈ, NGA ᜅ, PA ᜉ, SA ᜐ, TA ᜆ, WA ᜏ, YA ᜌ.

The original base illustration assets and examples remain intact. Traditional DA/RA continues to use one group; no modern RA class was substituted.

## Curriculum and content reused

The local curriculum is now:

1. Introduction to Baybayin — existing five topics.
2. Baybayin Characters — existing vowels and base consonants.
3. Kudlit (`module-kudlit`) — Upper Kudlit (`topic-kudlit-upper`) and Lower Kudlit (`topic-kudlit-lower`).
4. Writing Baybayin — existing `module-3`, `topic-3-1`, and `topic-3-2` identities retained.

Each Kudlit topic reuses the fourteen-character selector, original tracing illustrations, the existing pronunciation mapping and buttons, lesson header, progress, Baya, and Back/Next controls. The selected base-to-variant relationship is shown alongside its verified recordings. Upper and lower forms have separate topics and completion records. The shared `kudlitVariant` resolver preserves traditional DE/DI/RE/RI and DO/DU/RO/RU labels. Unverified combined recordings remain unavailable and explicitly awaiting validation.

No approved standalone Kudlit lesson or introductory prose was found. Consequently, no invented Introduction to Kudlit topic was inserted. The two topics relocate the existing visual/audio resources and use the owner-specified upper/lower titles. A fuller explanation of what a kudlit is and its effect on the inherent vowel remains a content-validator deliverable; this report does not claim that newly authored prose was approved.

## Assessment audit

All 100 original questions were classified by their target glyph. The full per-question audit is [question-audit.json](../verification/kudlit-separation/question-audit.json).

| Activity | Standalone vowels | Base consonants | Upper kudlit | Lower kudlit |
| --- | ---: | ---: | ---: | ---: |
| Sound Matching | 0 | 5 | 10 | 10 |
| Baybayin to Latin | 3 | 9 | 8 | 5 |
| Latin to Baybayin | 0 | 8 | 9 | 8 |
| Character Writing | 0 | 10 | 10 | 5 |

The three complete recognition activities now belong to Kudlit and require both its topics plus preceding instructional modules. Character Writing retains its Writing Baybayin assignment and requires its writing topics plus the new preceding Kudlit module. No questions, sets, answer keys, scoring rules, or activity IDs were changed. The two pending DE/RE listening items retain their unscored behavior. No base-only graded quiz was invented.

## Progress, compatibility, and offline behavior

The existing local SQLite topic-completion service, curriculum seeding, and resume records are reused. Seeding adds the new module/topics and updates display order without deleting existing rows. Existing content-version and topic IDs remain unchanged so old bookmarks and resumes remain readable. No new Kudlit completions are inferred from old consonant or writing completions.

The existing ordered prerequisite checks enforce base instruction before Kudlit and upper before lower. Kudlit direct routes check eligibility before rendering. Assessment rows and routes use the same centralized checkpoint resolver. Completed historical writing/assessment work remains stored; a new mixed assessment attempt requires the new prerequisites.

The unchanged cloud contract still contains the original nine topics. The local snapshot explicitly excludes new Kudlit records, and the workspace preview fixture follows that same contract. No Supabase schema, endpoint, authorization policy, or synchronization protocol was changed. Kudlit progress remains local-only pending an approved cloud contract.

Model weights, preprocessing, class labels, confidence rules, writing canvas, source audio, and pronunciation mappings were not altered. The production export retains 237 cached assets. The invariant artifact verifies unchanged question JSON, audio manifest/mapping, writing recognition implementation, and writing canvas.

## Changed areas

- Curriculum: `content/approvedCurriculum.ts`, character topic configuration, centralized traditional variant resolver.
- Lesson UI: `CharacterViewer`, shared `CharacterTopicScreen`, `KudlitRecordings`, topic route and resume boundary.
- Assessment placement: `modules/characterActivities/curriculum.ts`, owning-module return destinations.
- Bilingual upper/lower labels, local progress snapshot exclusion, workspace preview fixture.
- Tests: base-only rendering, relocated controls, historical eligibility, cloud exclusion, and updated exact curriculum/seed counts.

## Verification evidence

[Before-and-after gallery](../verification/kudlit-separation/comparison.html) includes both supplied references, corrected base lessons, separate upper/lower lessons, module progression, and portrait/landscape captures.

Browser scripts use isolated QA profiles, actual SQLite, recorded audio, and disconnected network conditions after PWA preparation. The base lesson was exercised across all fourteen characters. Both new topics were exercised across all fourteen variants, with DA/RA recording limitations preserved. All nine requested viewport sizes were captured for the base, upper, and lower lessons. Historical attempts were compared without score changes, mixed assessment routes were tested before/after prerequisites, and writing remained locked until its own lessons.

The separate restart script checks persistent topic/attempt records, a base-only lesson after restart, and unfinished Kudlit selection after reload. See `browser-results.json` and `restart-results.json` in the evidence directory for exact checks and errors. This is browser verification, not physical-phone certification.

Automated check results are recorded in `.codex-tmp/kudlit-regression.log`, `.codex-tmp/kudlit-focused.log`, `.codex-tmp/kudlit-types.log`, `.codex-tmp/kudlit-lint.log`, and `.codex-tmp/kudlit-export-final.log`.

Final results: **87 suites / 972 tests passed**, plus **28 focused tests passed** after the shared variant resolver cleanup. TypeScript, lint, production export, and diff checks passed. Browser evidence records **60 full-flow checks and 3 restart checks, zero errors**, with 35 captured screenshots plus the two supplied references. All 100 questions remain byte-for-byte unchanged.

## Remaining validation

- Approve introductory Kudlit explanatory prose before expanding the two relocated resource lessons.
- Validate the pending traditional combined recordings; no artificial replacement pronunciations were generated.
- Approve a cloud contract before synchronizing the new local topic IDs.
- Physical-device testing remains separate from the browser viewport checks.

No deployment or commit was performed.
