# Lesson 2 validator revisions

Completed the three approved word replacements and the guide-line revision on 2026-10-07.

**Later spelling update:** The user subsequently selected modern Baybayin with ending consonants. The traditional spellings in this historical report are superseded by [the modern spelling audit](baybayin-modern-spelling-audit.md).

## 1. Files inspected

- `apps/mobile/AGENTS.md` and its required Expo SDK 57 documentation.
- `apps/mobile/content/baybayinCharactersData.ts` — canonical Lesson 2 examples and target metadata.
- `apps/mobile/content/baybayinAssets.ts` and the 17 Gavino reference PNGs — reference asset associations and hash audit.
- `apps/mobile/content/approvedCurriculum.ts` — Module 2 topics.
- `apps/mobile/app/learner/activities/[topicId].tsx` — actual Lesson 2 route.
- `apps/mobile/components/learner/characters/CharacterTopicScreen.tsx` — selection, navigation, and completion.
- `apps/mobile/components/learner/characters/CharacterViewer.tsx` — examples, emphasis, and original underline.
- `apps/mobile/components/learner/characters/useCharacterPronunciation.ts` — selected-character pronunciation and audio labels.
- `apps/mobile/components/learner/story/StoryGuide.tsx` and `StorybookTopicLayout.tsx` — shared layout and speech bubble.
- `apps/mobile/hooks/useResponsiveLayout.ts` — existing phone/tablet/desktop behavior.
- `apps/mobile/constants/theme.ts` — shared orange and muted neutral tokens.
- `apps/mobile/content/writingLessonData.ts` — confirmed Lesson 3 uses the unchanged character/reference/pronunciation fields and does not render these examples.
- Existing `baybayinCharactersData`, `CharacterViewer`, and `CharacterTopicScreen` test suites.

## 2. Content source of truth

`baybayinCharactersData.ts` supplies `getBaybayinCharacterTopic('topic-2-2')`. The live route renders `CharacterTopicScreen`, which passes that data to the single shared `CharacterViewer`. The examples are TypeScript data, not a responsive component-local array or a SQLite seed.

## 3. Files modified

- `apps/mobile/content/baybayinCharactersData.ts`
- `apps/mobile/components/learner/characters/CharacterViewer.tsx`
- `apps/mobile/content/__tests__/baybayinCharactersData.test.ts`
- `apps/mobile/components/learner/characters/__tests__/CharacterViewer.test.tsx`
- This report.

Browser check scripts, logs, screenshots, and asset hash evidence are local verification artifacts under `sandbox/lesson-two-*`. The normal Expo web export regenerated ignored build output.

## 4. Word mappings

| Previous example | New visible example | Target character | Example in Baybayin |
| --- | --- | --- | --- |
| Kama | KAibigan | KA / ᜃ | ᜃᜁᜊᜒᜄ |
| Ngipin | NGAyon | NGA / ᜅ | ᜅᜌᜓ |
| Yaya | YAman | YA / ᜌ | ᜌᜋ |

The example spellings follow the existing dataset's convention of omitting final consonants. Only the three examples changed; IDs, category, `latinEquivalent`, target `unicodeSymbol`, image asset, and recording association retain their original values.

## 5. Target emphasis

The existing `ExampleWord` renderer finds `example.highlightedSyllable` in `example.word`, then renders the matching substring in the existing orange `highlightedSyllable` text span. The exact visible uppercase prefixes are KA, NGA, and YA. `highlightIndex` remains zero. NGA's metadata now uses `Nga`, replacing the previous `Ngi`, so the unmodified NGA reference character matches the new opening syllable. Kudlit marks remain grouped with their base glyph in the example.

## 6–10. Exact line and before/after treatment

The validator's line was the browser/native font underline on `CharacterViewer`'s `styles.highlightedGlyph` in the example inside BAYA's speech bubble. It was not part of the reference PNG.

| Property | Before | After |
| --- | --- | --- |
| Line implementation | `textDecorationLine: 'underline'` on the target glyph | Separate `View` using shared `styles.exampleGlyphGuide` |
| Line color | `Colors.rolePrimary`, `#F76D22` | `Colors.textMuted`, `#8D8174` |
| Line thickness | Font-controlled `auto`; captured 4 solid pixels at 390 px and 5 at 1440 px | Explicit height 1: 1 CSS pixel on web / 1 layout unit on native |
| Glyph color and font sizing | Existing orange and responsive sizes | Retained |

The new line is absolutely positioned beneath the target glyph cell. It uses the existing `Spacing.xs` bottom offset; it does not add a font underline or alter the glyph's geometry. The Latin syllable's existing orange emphasis remains.

## 11–12. Visual hierarchy and sharing

The muted brown color clearly separates the guide from the orange glyph, and the fixed 1-unit thickness prevents the guide from resembling another full-weight character stroke. The guide remains visible against the cream background. One shared renderer and style apply to every Lesson 2 character, including the vowels; there are no per-character or per-breakpoint line overrides. All 17 reference PNGs have identical before/after SHA-256 hashes.

## 13–14. Responsive results

All three replacement examples passed live Chrome checks at 360, 390, 430, 768, 1024, 1366, 1440, and 1600 px. Across the 24 rendered combinations:

- The exact new word and its uppercase target span rendered correctly.
- Each complete Latin word stayed on one line.
- Both the Latin word and Baybayin example fit inside the speech bubble.
- There was no viewport overflow.
- The same muted 1-pixel guide rendered at every width.
- Back/Next restored the selected replacement word correctly.
- No runtime exceptions occurred.

The horizontal symbol selector retains its existing deliberate scrolling behavior. Phone, tablet, and desktop screenshots were visually inspected; no redesign or responsive spacing adjustment was needed.

## 15. Checks performed

- Three existing Lesson 2 Jest suites: **20 tests passed**, including added example/target/guide assertions and existing audio, selection, navigation, and completion checks.
- TypeScript: `npx tsc --noEmit` passed.
- ESLint on the four changed source/test files passed.
- Expo production web export and PWA generation passed (`baya-pwa-72ec8edd8721e939`).
- Chrome responsive checks passed at all eight widths, including 360 px.
- All 17 Lesson 2 characters were selected to verify exactly one shared muted 1-pixel guide each.
- Before/after image hash audit passed for all 17 supplied reference PNGs.
- Final learner-source search found no Kama, Ngipin, or Yaya examples. Remaining occurrences in app source are only the two negative regression-test assertions. This report also records the requested old-to-new mappings.

The visual checks used the exported web application. Native component behavior is covered by the React Native Jest suites; a physical native device build was not run.

## 16. Remaining validator items

None within the two requested Lesson 2 revisions. No changes were made to progression, completion/XP logic, Lesson 1, Lesson 3 rendering, glyph assets/fonts, handwriting, recognition, ONNX, preprocessing, thresholds, mastery, SQLite, or Supabase.
