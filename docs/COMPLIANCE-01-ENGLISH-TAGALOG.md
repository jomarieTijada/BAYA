# BAYA System Compliance #1 — English and Tagalog

Implementation and verification: 7 November 2026. Status: technically implemented for review; educational translation approval remains pending.

## A. Compliance requirement

> “Add Tagalog and English language in the app”

Compliance Matrix — SYSTEM, No. 1. Location/module: Settings. Recommended by: Panel Chair. This work addresses only that recommendation. Nothing was committed, pushed or deployed.

## B. Existing implementation

The repository had mixed English and Tagalog presentation strings, but no shared locale provider, translation resources or saved interface-language preference. `constants/filipinoLabels.ts` was not a localization system. Speech pronunciation used `fil-PH`. Learner Settings existed; the mentor Settings route redirected to workspaces. Existing SQLite `local_app_state` already provided device-local preference storage. The detailed pre-change audit and raw string inventory are in [COMPLIANCE-01-AUDIT.md](COMPLIANCE-01-AUDIT.md) and [COMPLIANCE-01-STRING-INVENTORY.json](COMPLIANCE-01-STRING-INVENTORY.json). The inventory includes technical extraction candidates, not only translatable UI.

## C. Implementation details

- Central `apps/mobile/localization/` resources bundle English (`en`, default) and Tagalog (`tl`). Typed `t()` serves new UI; native presentation adapters resolve existing application-owned source phrases. Dynamic full-sentence templates preserve inserted names and codes. Unknown source phrases remain readable source text; invalid runtime keys return a localized unavailable message. This compatibility approach avoids rewriting the curriculum or business-layer payloads.
- `LocalizationProvider` wraps the existing root providers. It restores the preference before initially mounting the app, then updates context without changing activity/session keys. Controlled input values, glyphs, names and codes are preserved. Native alerts, notifications, accessible labels and announcements use the same resources. Web `document.lang` follows the language. Dates use `en-PH`/`fil-PH`; learner counts support singular/plural.
- A shared accessible radio selector appears in learner Settings and the existing mentor Settings route. The mentor action menu opens that route. Options always read English and Tagalog, with selected state, labels, web arrow/Home/End keyboard controls and 48-pixel minimum target height. Learner Settings Back returns to the previous mounted route, with Home fallback for direct entry.
- The device-wide preference is stored under `interface_language` in existing SQLite `local_app_state`. It applies to guests and all accounts on the device; it is not account-specific or synchronized to Supabase. No schema migration was added. Writes are serialized. Read/write failures have localized feedback; a failed save keeps the session language but cannot promise restart persistence.
- Dictionaries ship in the JavaScript bundle; no translation API/network fetch is required. Offline reload was tested after the production PWA had been cached. First-time installation still needs the app assets.
- `education.ts` is a separate draft presentation layer derived from the existing curriculum. Source records, stable IDs, glyph mappings, answers, scoring and recognition model labels are unchanged by this task. Language is not an activity-reset dependency. Existing audio/video content and pronunciation are retained.

## D. Coverage matrix

| Area | Implemented coverage | Evidence / boundary |
| --- | --- | --- |
| Welcome and shared shell | Role selection, navigation, buttons, inputs, accessible names, dialogs, notices, errors, toast presentation | Both languages captured; native screen readers not exercised |
| Learner setup and account | Profile labels, account forms, validation and statuses | Component tests; user input remains verbatim |
| Learner home and lesson journey | Cards, headings, progress, lesson/topic titles and navigation | Home and lesson captures; curriculum IDs unchanged |
| Story lessons and characters | Explanatory paragraphs, highlights, takeaways, character controls, media fallback/controls | Lesson capture and video mount-preservation integration test; educational drafts pending review |
| Writing and recognition | Instructions, toolbar, help, feedback, stars, confidence labels, mastery announcements | Writing capture and state-preservation integration test; model/scoring unchanged |
| Learner workspaces | Lists, Join modal, pending status, sync/account notices | Real modal captures and existing mocked-service tests |
| Learner Settings | Language, sync/account notices, persistence feedback | Browser persistence, keyboard and offline checks |
| Mentor | Auth, workspace list/create/manage, member/request actions, dashboard/progress, menu and Settings | Auth captures, test-data dashboard captures, mocked-service tests; no live account mutation |
| Rewards/profile/adventure | Existing labels and placeholder presentation | No new feature implemented |
| Quiz/assessment | Existing activity/recognition feedback only | No active quiz route found; quiz screenshots and quiz-state checks are not applicable |

## E. Modified files

See [COMPLIANCE-01-FILES.md](COMPLIANCE-01-FILES.md) for the exact path inventory and purposes. The checkout already contained substantial unrelated work; this task did not revert it. A full Git diff therefore includes changes outside this task. No database schema, curriculum source, recognition model, authentication contract or cloud migration was changed for localization.

## F. Testing

- Full mobile Jest suite: **663 tests passed, 0 failed**. This includes new resource parity, interpolation, fallback, formatting, glyph-preservation, persistence, rapid-save ordering, storage-failure and controlled-input tests. Writing integration verifies strokes/stars survive a switch without extra inference/progress writes. Story integration verifies the open video does not remount. Settings verifies Back returns to the prior route.
- After the accessible-image adapter change: **79 tests passed** across five related suites. Final video/canvas accessibility follow-ups passed **15 media tests** and **50 writing tests**.
- TypeScript: `npx tsc --noEmit -p apps/mobile/tsconfig.json` passed.
- Lint: `npm run lint --workspace apps/mobile` passed without warnings/errors.
- Production export: `npm run export:web --workspace apps/mobile` passed, including generation of the PWA service worker and 163 cached assets.
- Jest was run with `--runInBand --forceExit --silent`; the suite retains asynchronous handles after completion. Passing assertions do not establish that all handles are cleaned up.
- A real-browser writing check drew a stroke, opened Settings, chose Tagalog and used Back; the route and exact SVG stroke path were preserved. See [writing-navigation-report.json](verification/compliance-01/writing-navigation-report.json).
- Production headless Chrome checks cover navigation persistence, reload, selector keyboard focus, service-worker control, offline switching, offline reload in both languages and an offline lesson. See [browser-report.json](verification/compliance-01/browser-report.json). Additional modal and mentor-fixture records are in [additional-browser-report.json](verification/compliance-01/additional-browser-report.json).
- Compact test/build evidence is in [validation-summary.json](verification/compliance-01/validation-summary.json). Reproducible browser tooling and commands are in [scripts/testing/compliance-01/README.md](../scripts/testing/compliance-01/README.md).

## G. Visual evidence

Paired English/Tagalog captures cover 667×375, 844×390, 915×412, 1024×768 and 1366×768. Filenames are `{en|tl}-{screen}-{width}x{height}.png` in `docs/verification/compliance-01/`.

Reviewed comparison sheets:

- [Welcome](verification/compliance-01/review-welcome.jpg)
- [Learner home](verification/compliance-01/review-home.jpg)
- [Lesson](verification/compliance-01/review-lesson.jpg)
- [Writing](verification/compliance-01/review-writing.jpg)
- [Workspaces](verification/compliance-01/review-workspaces.jpg)
- [Join modal](verification/compliance-01/review-join-modal.jpg)
- [Mentor login](verification/compliance-01/review-mentor-login.jpg)
- [Mentor dashboard — fixture](verification/compliance-01/review-mentor-dashboard-fixture.jpg)
- [Settings](verification/compliance-01/review-settings.jpg)

The final main report contains 70 captures; additional verification contains 20. Ten earlier `*-join-*` images show the redirect destination and are not modal evidence; use `*-join-modal-*`. No page-level horizontal overflow was detected. Visual review found readable wrapping and scrollable content at compact sizes, with no new critical translation clipping in these states. Individual decorative BAYA letters trigger the internal-overflow heuristic, but the complete wordmark remains visible. Existing small navigation/card targets remain; only the new language selector's minimum target size is verified. This is not a full accessibility certification.

## H. Educational validation

**All entries in `apps/mobile/localization/education.ts` require subject-matter review** and explicitly carry `pending-subject-matter-review`. This is the complete entry-level review queue, with source, English and Tagalog side by side. Review covers lesson/topic names, Baybayin history and origins, syllabary explanations, vowels/consonants, Da/Ra distinctions, kudlit, modern marks, examples, takeaways and instructional phrasing. The original source's historical wording and terms such as “sipol” are preserved for review rather than silently corrected as a localization decision.

Reviewers should confirm meaning against the validated source, age suitability for Grade 3, spelling, terminology consistency, historical claims, pronunciation references and glyph/example relationships. UI translations also benefit from native-speaker proofreading. No expert approval was obtained or represented as complete.

| English concept | Proposed Tagalog treatment |
| --- | --- |
| Baybayin | Baybayin (retain proper name) |
| syllable | pantig |
| syllabary | silabaryo; explanatory wording requires review |
| vowel / consonant | patinig / katinig |
| character / character recognition | simbolo / pagkilala ng simbolo |
| kudlit | kudlit (retain subject-specific term) |
| workspace / mentor | workspace / mentor (retain familiar product-role terms consistently) |

## I. Remaining limitations

- Educational translations are drafts awaiting expert approval; full compliance must not be declared complete yet.
- No active quiz/adventure implementation existed to localize or verify. Existing placeholders remain.
- Browser coverage is representative, not every authenticated state, alert or server failure. Mentor dashboard evidence uses the existing clearly labeled test fixture; live authentication, backend writes and real-device Android/iOS screen readers were not tested.
- Existing narrated audio/video is not dubbed or replaced. Baybayin pronunciation retains its original speech locale. External pages, browser-native prompts and user-generated content are not translated.
- Unrecognized future source content falls back unchanged. New UI must add resource entries and tests. The compatibility adapter cannot guarantee translation of arbitrary server-provided prose.
- Device-local language is shared across accounts and does not roam between devices. Cache/storage clearing removes it. Offline startup assumes previously cached application assets.
- Existing compact touch targets and general accessibility issues outside the selector are not comprehensively remediated by this language task.

## J. Compliance matrix remarks

Implemented English and Tagalog selection in learner and mentor Settings through centralized bundled resources. The device-local preference updates integrated learner/mentor UI without signing out and persists across navigation/reload; cached offline switching and reload were verified. Automated tests, TypeScript, lint and production export passed, with paired viewport evidence collected. Educational translations are prepared and explicitly pending subject-matter validation; final compliance approval remains outstanding.
