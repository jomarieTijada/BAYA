# Character Level module integration

## Summary and navigation

The four existing assessments are now checkpoints inside the existing lesson cards. The orange Character Level academic heading remains, but is no longer a standalone activity button. No new lesson page, question renderer, writing canvas, scoring policy, or database migration was introduced.

Before: Lessons â†’ standalone Character Level hub â†’ activity â†’ set.

Now: Lessons â†’ owning module â†’ unlocked assessment â†’ saved question or completed result. Back and activity completion return to Lessons with the owning module and assessment IDs; horizontal position and assessment focus are restored. Set Next, Summary, and Retry retain the shared completion modal. The next unfinished set opens automatically. Previously completed activities open their result; Retry preserves prior attempts.

## Architecture audit

- `approvedCurriculum.ts` defines three modules and nine instructional topics: five introduction topics, two character topics, and two writing topics.
- `localLearnerService.getCompletedTopicIds` reads distinct `activity_attempts` with `result_status = completed`, scoped to the active local learner. Opening or bookmarking a topic does not qualify.
- `completeTopic` preserves the existing ordered-topic and previous-module prerequisites and stores completion transactionally. Replays do not erase completion.
- `curriculumService.getCurriculumModules` combines the approved content manifest with those local completion records. Unavailable database/content state fails closed for checkpoints.
- Character instruction includes vowel groups, the traditional DA/RA character, and consonant kudlit recordings in `CharacterViewer`.
- The canonical writing controller retains its existing two successful trials per character and 0.80 recognition threshold. This change does not modify those policies or recognition processing.
- Existing module advancement is topic-based. There was no mandatory assessment/passing gate; none has been added. Making assessments mandatory for advancement requires separate curriculum approval.
- Character assessment attempts already use learner-scoped `local_app_state` keys and transactional persistence. The assessment service, question identities, answer keys, and historical records remain unchanged.
- Workspace synchronization continues to handle its existing approved foundational progress contract. Assessment attempts remain local-only; this change adds no cloud assessment upload.

## Curriculum and prerequisites

| Owning module | Assessment | Required own topics |
| --- | --- | --- |
| Introduction to Baybayin / module-1 | No new assessment | Existing five-topic progression unchanged |
| Baybayin Characters / module-2 | Sound Matching / character-1 | topic-2-1, topic-2-2 |
| Baybayin Characters / module-2 | Baybayin to Latin / character-2 | topic-2-1, topic-2-2 |
| Baybayin Characters / module-2 | Latin to Baybayin / character-3 | topic-2-1, topic-2-2 |
| Writing Baybayin / module-3 | Character Writing / character-4 | topic-3-1, topic-3-2 |

Every checkpoint also requires all instructional topics in preceding modules. The three recognition assessments unlock together; there are no assessment-to-assessment locks. Each activity retains five sets and 25 questions, for 100 unchanged questions total.

`modules/characterActivities/curriculum.ts` is the centralized typed placement, eligibility, and assessment-progress resolver. Its graph validation verifies unique assignments and valid instructional topic dependencies. Assessment edges only point to instructional topics; existing topic prerequisites never point back to assessments, preventing cycles.

## States and progress

Rows show Locked, Start, Continue, or Review using local records. They display topic completion separately from assessment sets reviewed. A set counts as reviewed only after its persisted cursor reaches five, not merely after opening it. Earlier completed sets remain counted during subsequent retries. This is completion/review progress, not a new mastery claim or passing grade.

Historical results from the old hub remain stored and counted even when newly required topics are incomplete. Such rows remain locked and show the retained reviewed-set count; accessing the player or starting another attempt requires the prerequisites. Once eligible, existing summaries and history are available again. No scores are recalculated.

The two DE/RE Sound Matching items remain unscored pending validation. They do not block eligibility or the rest of the module. Decorative completion stars remain decorative.

## Route and persistence safeguards

- `/learner/character-activities` without a valid activity redirects to Lessons.
- A valid `activityId` (or legacy `activity` parameter) resolves its owner and reads local prerequisites before rendering the player.
- Unknown activity IDs redirect safely; locked deep links show the requirement and a return action.
- Route focus refreshes eligibility; the reused player also rechecks before initial resume/start and before starting another set or retry.
- The other legacy quiz renderer now uses the same guarded entry rather than directly mounting an unrestricted hub.
- Returning to Lessons refreshes topic and attempt records without a document reload. During hydration, previous learner progress is cleared rather than displayed for another learner.
- Attempt storage remains learner-scoped. Existing transaction and ownership checks still protect writes. No SQLite reset or identifier migration occurs.

## Verification

Executed automated checks:

- Full Jest regression: **87 suites, 967 tests passed**.
- Focused final integration regression: **7 suites, 140 tests passed**.
- TypeScript: passed.
- Lint: passed; final log recorded under `.codex-tmp/module-lint.log`.
- Production web export and offline asset generation: passed.

New tests cover mapping, graph validity, partial prerequisites, all preceding modules, unknown IDs, completed results surviving retries, direct-route protection, and reuse of the player. Existing lesson, writing, audio, recognition, persistence, workspace, and completion tests remain in the full suite.

Browser verification and screenshots are in `docs/verification/character-level/module-integration`. The browser scripts use an isolated QA Chrome profile, real SQLite, real recorded audio, and real LiteRT inference. Initial prerequisite fixtures are created only in that QA profile; they do not represent manual completion of every foundational writing exercise. Separate restart checks exercise actual final consonant-topic completion and immediate offline unlocking.

Final browser verification: **100 checks passed, zero errors** (71 full-flow, 27 restart/offline/layout, and 2 focus/text-stress checks). These exercised all 20 sets, all four full activity completions, Summary/Next/Retry, two pending audio items, real LiteRT inference, persistence-error recovery, legacy and locked routes, local learner separation, unchanged historical attempts, and final consonant-topic completion unlocking assessments offline without a document reload.

All four checkpoint controls were individually scrolled into view and measured at all nine requested viewports in English and Tagalog. A separate 150% checkpoint-text stress test verified wrapping and reachable controls; this is browser text enlargement, not a claim of testing OS text scaling on a physical phone. Keyboard focus restoration was asserted. There are 93 browser captures plus the two supplied references.

[Visual comparison gallery](../verification/character-level/module-integration/comparison.html) includes the supplied screenshots, locked/unlocked/in-progress/completed rows, quiz and canonical writing launches, offline unlock, mobile layouts, and enlarged Tagalog text.

Final browser results are recorded in `browser-results.json`, `restart-results.json`, and `accessibility-results.json`; consult those artifacts for executed cases and errors. The scripts are `scripts/testing/character-module-integration.mjs` , `scripts/testing/character-module-restart.mjs`, and `scripts/testing/character-module-accessibility.mjs`.

## Limitations and approval items

- DE/RE recording validation remains pending; no pronunciation assets or validation flags were changed.
- A new introduction assessment requires approved questions; none were invented.
- Making assessment scores mandatory for advancement requires an approved curriculum policy.
- Browser viewport emulation is not physical-phone validation. The connected phone's personal learner data was not used for QA.
- Offline operation requires the existing PWA preparation and asset cache. Native recognition support was not expanded.
- No deployment or commit was performed.
