# Character Level functional test results

Date: 2026-11-21 (Asia/Taipei). Tests use an isolated local learner, local production export, and real Chrome. No remote account or deployment was changed.

## Automated checks

- Full Jest suite: **84 suites / 949 tests passed**. Command used `--runInBand --forceExit`, consistent with the existing suite open-handle limitation. React act warnings remain; this is not an open-handle audit.
- Targeted content/storage/component/mapping tests: **119 passed**. All 100 content records are compared with extracted DOCX tables and run-level underline ranges.
- TypeScript, Expo lint, production web export: passed. Final accessibility-only adjustment also has focused component verification.
- Content validator reports exactly two unresolved recording mappings (DE, RE), intentionally asserted as known issues; it does not certify complete audio availability.
- Original audio audit: 87/87 decoded and unchanged; integrated assets: 69/69 checksum verified.
- Browser evidence: `../verification/character-level/browser-results.json`, `restart-results.json`, screenshots, and accessibility tree.

## Fifty functional cases

| Test Case ID | Description | Steps | Expected Results | Actual Results | Status |
|---|---|---|---|---|---|
| CHAR-A-01 | Open Character Level | Open Lessons; activate Character Level | Hub opens | Browser Lessons entry point passed | Passed |
| CHAR-A-02 | View four activities | Inspect hub cards | Four ordered cards | Four cards verified | Passed |
| CHAR-A-03 | Open selected activity | Select each card and set | Correct question opens | All four activities exercised | Passed |
| CHAR-A-04 | Return to hub | Use Back or reload hub route | Hub restores progress | Repeated navigation succeeded | Passed |
| CHAR-A-05 | Resume started activity | Reload and reopen active set | Saved feedback/position returns | SQLite and browser resume verified | Passed |
| CHAR-B-01 | Play pronunciation | Press Play Sound on available item | Real clip plays | 23 specific recordings played in browser | Passed |
| CHAR-B-02 | Correct sound selection | Play clip; select key; Check | Correct feedback | All available audio keys submitted | Passed |
| CHAR-B-03 | Incorrect sound selection | Evaluate each non-key option | False correctness | All non-key options tested in source/engine tests; not separately clicked in audio UI | Passed |
| CHAR-B-04 | Replay | Press Play Sound twice | Playback restarts without overlap | Real replay and controller race tests passed | Passed |
| CHAR-B-05 | Complete set | Submit five valid audio items | 5/5 answered and result | Sets 1,3,4,5 completed; set 2 has 3 scored + 2 pending | Passed |
| CHAR-C-01 | Base glyph | Open Activity 2 Set 1 | Source glyph renders | All 25 glyph prompts exercised | Passed |
| CHAR-C-02 | Correct romanization | Select supplied key; Check | Correct feedback | All supplied keys tested | Passed |
| CHAR-C-03 | Incorrect choice | Select non-key; Check | Gentle corrective feedback | Deliberately incorrect item exercised | Passed |
| CHAR-C-04 | Kudlit glyph | Open Sets 3–5 | Full upper/lower marks visible | Assets loaded, all questions exercised | Passed |
| CHAR-C-05 | Complete set | Finish five items | Set summary | All five sets completed | Passed |
| CHAR-D-01 | Latin prompt | Open Activity 3 | Exact source syllable | 25 prompts exercised | Passed |
| CHAR-D-02 | Correct glyph | Choose supplied key | Correct feedback | All answer keys tested | Passed |
| CHAR-D-03 | Incorrect option | Choose non-key; Check | Corrective feedback | Incorrect item exercised in set 1 | Passed |
| CHAR-D-04 | Kudlit contrast | Open Set 4 | TA/TI/TU distinguishable | Full source assets, no truncation | Passed |
| CHAR-D-05 | Complete set | Finish five items | Summary and repeat | All five sets completed; repeated set retained history | Passed |
| CHAR-E-01 | Underline | Open every writing item | Exact source target only | All 25 underline texts checked in browser and OOXML tests | Passed |
| CHAR-E-02 | Draw | Inject pointer strokes into real canvas | Visible strokes | Real canvas pointer path exercised | Passed |
| CHAR-E-03 | Clear and retry | Draw; Clear; draw again | No old strokes remain | DOM paths checked after clearing | Passed |
| CHAR-E-04 | Real inference | Submit actual canvas strokes | LiteRT predicts locally | 25 real model submissions; synthetic paths, not accuracy certification | Passed |
| CHAR-E-05 | Save feedback | Inspect prediction/confidence; reload | Same scored result persists | SQLite records and offline reload verified | Passed |
| CHAR-F-01 | Correct feedback | Submit key option | Supportive success + Continue | Browser evidence correct-feedback.png | Passed |
| CHAR-F-02 | Incorrect feedback | Submit non-key | Gentle correction + target | Browser evidence incorrect-feedback.png | Passed |
| CHAR-F-03 | Score | Compare responses to result | Correct count / scored count | SQLite tests and browser attempt evidence | Passed |
| CHAR-F-04 | Set completion | Finish five scored items | Set complete | All applicable sets completed; missing clips cannot falsely complete | Passed |
| CHAR-F-05 | Activity completion | Finish all five sets | 25-question aggregate | Activities 2 and 3 full results captured; A1 remains 23/25 | Passed |
| CHAR-G-01 | Local save | Submit response | Transactional SQLite record | Service tests and real browser records | Passed |
| CHAR-G-02 | Navigate and return | Leave set; reopen | Same attempt remains | Browser navigation and service begin tests | Passed |
| CHAR-G-03 | Application restart | Close isolated browser; reopen same profile offline | Persisted result remains | Full browser process closed/reopened offline; prior writing result restored | Passed |
| CHAR-G-04 | Incomplete resume | Reload after feedback | Feedback returns before advance | Browser and SQLite tests passed | Passed |
| CHAR-G-05 | Repeat history | Repeat completed set | New attempt; prior result intact | SQLite assertions and multiple browser repeats | Passed |
| CHAR-H-01 | Offline hub | Disable network and HTTP cache; reload | Hub available | Service-worker-backed hub loaded | Passed |
| CHAR-H-02 | Offline audio | Play and submit cached pronunciation | Playback and score succeed | Offline real audio and SQLite exercised | Passed |
| CHAR-H-03 | Offline visual MC | Select and submit while offline | Local score saved | Offline visual answer submitted and saved after browser restart | Passed |
| CHAR-H-04 | Offline writing | Draw and submit while offline | Real model result | Offline LiteRT prediction saved | Passed |
| CHAR-H-05 | Offline reopening | Reload set with network disabled | Saved result restores | Browser persisted result restored | Passed |
| CHAR-I-01 | Small phone | 320×568 viewport | No horizontal overflow; touch choices readable | Image load, dimensions and screenshot checked | Passed |
| CHAR-I-02 | Standard phones | 360×800,390×844,430×932 | Usable scroll layout | Each viewport captured and geometrically checked | Passed |
| CHAR-I-03 | Landscape | 844×390 | Scrollable question and actions | No horizontal overflow; screenshot retained | Passed |
| CHAR-I-04 | Tablet | 768×1024,1024×768 | Centered readable layout | Both viewports tested | Passed |
| CHAR-I-05 | Desktop | 1280×800,1440×900 | Bounded learning column | Both viewports tested | Passed |
| CHAR-J-01 | English | Use English preference | English UI; unchanged source content | English browser workflow passed | Passed |
| CHAR-J-02 | Tagalog | Persist tl; reload | Localized generic interface | Tagalog hub screenshot and persisted preference | Passed |
| CHAR-J-03 | Keyboard | Tab, focus answer, press Enter | Focus and checked state exposed | Browser caught missing ARIA state; fixed and DOM aria-checked verified after keyboard Enter | Passed |
| CHAR-J-04 | Screen reader | Use real screen reader on all activities | Useful announcements without answer leakage | NOT EXECUTED: accessibility tree/state inspection only | Not executed |
| CHAR-J-05 | Reduced motion | Emulate reduced-motion preference | No required motion | Preference confirmed; assessment has no required animation | Passed |

## Limits and regression scope

No physical Android device was attached (`adb devices -l`: empty). Finger/stylus, hardware audio output, orientation on-device, installed mobile PWA behavior, and real screen-reader speech are unverified. Viewport emulation is not device testing.
Existing learner dashboard, lesson entry, and public mentor entry rendered in browser. The full regression suite covers existing lesson, ownership, synchronization, membership and writing contracts. Authenticated mentor/workspace end-to-end checks were not executed because no authorized test credentials were supplied. New assessment scores remain local-only.
Synthetic pointer strokes were submitted to the actual unmodified model. Their high-confidence predictions verify capture/inference/persistence, not linguistic accuracy or out-of-distribution rejection. No fake prediction was used in the browser.
The initial browser harness used a browser-reserved port and was corrected to 5080. A later restart test clicked while data was still loading; its readiness condition was corrected. Keyboard verification then detected missing web ARIA checked state; the product was fixed rather than weakening the assertion. Final JSON files record the subsequent verified run.

Final evidence: 42 primary browser checks and 13 restart/accessibility/layout checks passed with no recorded errors. 100 distinct source questions were reached; 98 scored and two explicitly deferred. Complete five-question listening and writing sets finished with network disabled.
