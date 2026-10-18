# Module 2 modern Baybayin spelling audit

On 2026-10-07, the user explicitly selected modern Baybayin with a vowel-cancelling mark after reviewing the KAibigan example. This supersedes the traditional ending-consonant omission recorded in the earlier Lesson 2 revision report.

## Verified rules

The audit uses the [Unicode Tagalog character chart](https://www.unicode.org/charts/PDF/U1700.pdf) and [Unicode's Philippine script principles](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-17/): consonants carry an inherent A; the upper vowel sign represents I/E, the lower sign represents U/O, and a virama cancels the inherent vowel. The examples consistently use **U+1714 TAGALOG SIGN VIRAMA**, the cross-shaped cancellation mark. A final N is consequently `ᜈ᜔`, not unmarked `ᜈ` (NA).

The spellings below are a word-by-word application of those rules. They are not a claim that Unicode publishes a Filipino word dictionary. On 2026-10-17 the teacher selected HALAMAN to replace HARI. Its Filipino syllables are ha-la-man; its encoded units are ha-la-ma-n. The final N uses U+1714. Character IDs, HA reference glyph, illustration and pronunciation remain unchanged; no word-specific audio or illustration exists.

## All 17 examples

| Example | Encoded sound components | Modern Baybayin | Audit result |
| --- | --- | --- | --- |
| Aso | a-so | ᜀᜐᜓ | Already complete |
| Ibon | i-bo-n | ᜁᜊᜓᜈ᜔ | Added final N + virama |
| Ulan | u-la-n | ᜂᜎᜈ᜔ | Added final N + virama |
| BAta | ba-ta | ᜊᜆ | Already complete |
| KAibigan | ka-i-bi-ga-n | ᜃᜁᜊᜒᜄᜈ᜔ | Added final N + virama |
| DAhon | da-ho-n | ᜇᜑᜓᜈ᜔ | Added final N + virama |
| GAtas | ga-ta-s | ᜄᜆᜐ᜔ | Added final S + virama |
| HAlaman | ha-la-ma-n | ᜑᜎᜋᜈ᜔ | Teacher-selected replacement, 2026-10-17; final N + virama |
| LAwa | la-wa | ᜎᜏ | Already complete |
| MAta | ma-ta | ᜋᜆ | Already complete |
| NAnay | na-na-y | ᜈᜈᜌ᜔ | Added final Y + virama |
| NGAyon | nga-yo-n | ᜅᜌᜓᜈ᜔ | Added final N + virama |
| PAna | pa-na | ᜉᜈ | Already complete |
| SApa | sa-pa | ᜐᜉ | Already complete |
| TAla | ta-la | ᜆᜎ | Already complete |
| WAtawat | wa-ta-wa-t | ᜏᜆᜏᜆ᜔ | Added final T + virama |
| YAman | ya-ma-n | ᜌᜋᜈ᜔ | Added final N + virama |

Nine examples required additions for the chosen modern convention. The preceding spellings omitted their ending consonants consistently with traditional practice; they should not be described as universally invalid spellings.

The other learner-content Baybayin strings were checked: the Lesson 1 BA/KA/TA examples, I/E and U/O vowel symbols, and the shared DA/RA example are consistent with the supplied 17-character set and need no edits. Lesson 3 continues to use the unchanged base character, asset, romanization, and pronunciation data; it does not display these word examples.

## Rendering

The canonical examples remain in `apps/mobile/content/baybayinCharactersData.ts`. `CharacterViewer` keeps I/E and U/O kudlit signs and the final virama inside the same text cell as their base character. The final NA + virama renders as one cluster, so it cannot wrap or detach from the ending consonant.

The user subsequently requested an **X-shaped cancellation mark**. The shared renderer displays `×` beneath the cancelled consonant, independently of a platform font's plus-shaped virama. Canonical word strings and accessibility labels retain U+1714; the visible X is part of that same glyph cell rather than a separate letter in the spelling.

An initial browser check found that modern KAibigan exceeded the narrow 768-pixel tablet speech bubble. The shared example renderer now measures its available width and actual font glyph widths, reducing only the example text size when necessary. The existing responsive maximum sizes remain 48, 58, and 32; reference images and font files are unchanged. The neutral guide retains its explicit 1-unit thickness.

## Completed checks

- The three Lesson 2 Jest suites passed: **38 tests**, including all 17 full modern spellings, preserved reference associations, final-consonant grouping, and narrow-bubble fitting.
- TypeScript, scoped ESLint, and Expo production web export passed.
- **136 live browser checks passed:** all 17 examples at 360, 390, 430, 768, 1024, 1366, 1440, and 1600 pixels. Complete spellings, attached vowel/cancellation marks, uppercase target spans, one-line Latin words, fitting within the bubble's content area, and the unchanged muted 1-pixel guide were verified. No runtime exceptions or viewport overflow occurred. The smallest example glyph size across these checks was 39 pixels.
- All 17 supplied reference PNGs retain identical SHA-256 hashes.
- Recognition, ONNX, handwriting, mastery, progression, XP, SQLite, and Supabase were not edited.

Responsive browser results are recorded in `sandbox/baybayin-modern-audit/checks.json`; browser screenshots and logs are local review evidence, not new app assets.
