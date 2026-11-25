# Character Level content validation

Date: 2026-11-21 (Asia/Taipei).

## Source fidelity

All 100 questions were imported from the supplied DOCX with a standard-library OOXML parser. The full body (including excluded Activity 5), all table rows/cells, paragraph/run properties, underline flags, styles, and numbering are retained in `source-extraction.json`. The inventory records the source SHA-256. The application includes only Activities 1–4.

Automated tests compare all 100 runtime questions against independent extracted table cells, including prompts, option order, answer letters, glyphs, set order, target text, and exact underlined runs. All 75 multiple-choice keys resolve to supplied options. All 25 handwriting targets resolve to existing model classes and bundled reference images. No questions, answer positions, or source romanization labels were rewritten.

## Audio audit and unresolved validation

Fresh inspection decoded all 87 original recordings and verified unchanged SHA-256 checksums against the earlier inventory. All 69 optimized application recordings exist and match their manifest checksums. Evidence: `audio-reinspection.json`. No source audio was edited, generated, or replaced.

| Recording | Existing state | Inspection / use |
|---|---|---|
| a/DaRa.m4a | Optimized, integrated | Reused for the combined DA/RA character reference. Local ASR: “Da-o-ra”. Never described as an isolated DA or RA recording. |
| e/DeRe.m4a | Original + benchmark derivative | Found and decoded. Local ASR returned “Da / Ora”; English retry also ambiguous. Actual vowel identification is not verified. Pending validator listening; not scored as DE or RE. |
| i/DiRi.m4a | Original + benchmark derivative | Found and decoded. ASR returned “D. / O. / Rhee.”; pending listening approval. |
| o/DoRo.m4a | Original + benchmark derivative | Found and decoded. ASR returned “DO / O / RO”; combined-candidate mapping retained, pending listening approval before integration. |
| u/DuRu.m4a | Original + benchmark derivative | Found and decoded. ASR returned “DU O RU”; combined-candidate mapping retained, pending listening approval before integration. |

No separate D/R variants were found in the complete original inventory or optimized registry. Filenames and ASR are not linguistic certification. Transcription was performed locally using the pre-existing cached faster-whisper small model; no audio was uploaded to an external service. `combined-audio-transcription.json` preserves the raw machine output.

**23 of 25 listening questions have an integrated specific recording. Questions character-1-q-06 (DE) and character-1-q-10 (RE) remain unscored pending recording validation.** They show a recoverable unavailable state and an explicit Continue without scoring action. The three validated questions in the same set remain usable. Deferred items count as neither incorrect nor complete; that set can show 3/3 scored, 3/5 answered, and cannot confer activity completion.

## Traditional character conventions

`traditionalCharacters.ts` centralizes DA/RA → ᜇ / da_ra; DE/DI/RE/RI → ᜇᜒ / de_di; DO/DU/RO/RU → ᜇᜓ / do_du. `pronunciationMapping.ts` separates specific pronunciation lookup, explicitly allowed combined lookup, and pending original-recording candidates. Lesson/reference audio, activity audio, quiz glyph mapping, and handwriting-feedback equivalents consume these shared mappings.

The model retains its original labels, weights, preprocessing, confidence threshold, and distinct modern RA classes. A modern RA prediction is not silently accepted as traditional DA/RA. Recognition feedback retains the exact model result and adds the traditional reading group where applicable. A1 Q10 keeps source option A (ᜇᜒ). I/E, O/U, PI/PE, DO/DU, DI/DE/RI/RE and every other supplied choice remain unchanged.

Validator decisions still needed: listen to the four kudlit D/R clips; confirm whether combined DE/RE audio is acceptable for both specific source prompts; approve any future audio-mapping adjustment. Once approved, integrate a checksum-verified optimized asset and explicitly promote its status in the centralized mapping. Never trim a combined clip into guessed isolated syllables.

## Exact writing ranges

| ID | Prefix | Underlined target | Suffix | Expected glyph |
|---|---|---|---|---|
| character-4-q-01 |  | GA | BI | ᜄ |
| character-4-q-02 |  | DA | LAW | ᜇ |
| character-4-q-03 |  | YA | KAP | ᜌ |
| character-4-q-04 |  | PA | LAY | ᜉ |
| character-4-q-05 |  | NGA | YON | ᜅ |
| character-4-q-06 | LA | BA |  | ᜊ |
| character-4-q-07 | PU | SA |  | ᜐ |
| character-4-q-08 | A | MA |  | ᜋ |
| character-4-q-09 | BA | TA |  | ᜆ |
| character-4-q-10 | PA | NA |  | ᜈ |
| character-4-q-11 |  | KI | LAY | ᜃᜒ |
| character-4-q-12 |  | HI | GA | ᜑᜒ |
| character-4-q-13 |  | WI | KA | ᜏᜒ |
| character-4-q-14 |  | MI | SA | ᜋᜒ |
| character-4-q-15 |  | NGI | TI | ᜅᜒ |
| character-4-q-16 | SU | SI |  | ᜐᜒ |
| character-4-q-17 | PU | TI |  | ᜆᜒ |
| character-4-q-18 | KA | PE |  | ᜉᜒ |
| character-4-q-19 | TA | BI |  | ᜊᜒ |
| character-4-q-20 | LA | GI |  | ᜄᜒ |
| character-4-q-21 | TU | LO |  | ᜎᜓ |
| character-4-q-22 | BU | KO |  | ᜃᜓ |
| character-4-q-23 | PI | TO |  | ᜆᜓ |
| character-4-q-24 | LO | BO |  | ᜊᜓ |
| character-4-q-25 | PU | SO |  | ᜐᜓ |

## Assessment policy requiring adviser confirmation

There is no existing policy for these four new assessments. The documented draft awards one scored response per question per set attempt, keeps repeat attempts separate, and introduces no pass percentage, XP, penalties, locks, or mastery changes. Existing foundational writing still requires two accepted attempts at the established confidence threshold. Technical failures and uncertain recognition are retryable and unscored. Source-content fidelity does not certify model accuracy on children’s handwriting.
