# Compliance #3 — Module 1 correction register

Prepared before substantive edits, 7 November 2026. The panel recommendation supplies no itemized errors; none are attributed to the panel here. “Verified correction” means an evidence-supported implementation, not validator approval. All revised educational wording remains pending formal review.

Sources: [NMP exhibition](https://www.nationalmuseum.gov.ph/exhibitions/anthropology/baybayin/); [Unicode 16 §17.1](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-17/); [Tagalog code chart](https://www.unicode.org/charts/PDF/U1700.pdf). Local provenance: `docs/content/baybayin-history-revision.md`, `docs/content/baybayin-syllabary-revision.md`, `docs/content/baybayin-modern-spelling-audit.md`, `docs/content/lesson-two-validator-revision.md`, and `apps/mobile/content/README.md`. The chart currently identifies itself as Unicode 18; code-point checks below concern unchanged basic characters, not a claim that the whole chart is version 16.

## Findings and planned actions

| ID / Severity | Topic | Original text or element | Identified issue | Proposed correction | Evidence | Action | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1-01 Major | 1.3–1.5 | Body is split into paragraphs before translation; dictionary keys contain entire two-paragraph bodies | English presentation falls back to Tagalog even though a translation exists | Translate the complete message first, preserve paragraph boundaries, then highlight; retain paragraph-level resources for 1.2 | Runtime code and before captures; bilingual snapshot | Verified correction implemented | Technical regression tests; existing claims still need content review |
| M1-02 Minor | 1.2–1.5 | ASCII `\\b` highlight boundaries; `nagiging R` does not occur in the source (`maging R`) | Unicode glyphs and parenthesized counts can fail highlighting; stale phrase | Unicode-aware non-destructive text segmentation; align phrase with source; supply missing English keyword translations | Actual source strings and glyph code points | Verified correction implemented | Technical; no changed glyphs |
| M1-03 Moderate | 1.3 takeaway | “17 simbolo lang ang kailangan mong matutunan!” / “You only need to learn 17 characters!” | Implies the base set is everything a learner ever needs; app later teaches marks/variants | “Magsimula tayo sa 17 payak na simbolo!” / “Let’s start with the 17 basic characters!” | Existing base-set paragraph and later curriculum; Unicode consonant/vowel-sign distinction | Verified correction implemented | Revised wording pending validator review |
| M1-04 Major | 1.1 legacy preview, tools slide | “Dahil wala pang papel noon…”; carving on trees, bamboo and leaves; “gamit ang sipol” | Unbounded absence-of-paper claim; unsupported whistle-as-writing-tool wording; materials/techniques conflated | Describe sharp tools engraving bamboo and pigments on leaves, without a universal paper claim | NMP exhibition materials explanation; Unicode directionality paragraph supports bamboo engraving | Verified correction implemented in preview only | New wording pending review; not promoted to live content |
| M1-05 Minor | 1.1/1.2 preview metadata | Module title “What is Baybayin?”, total 3; old Topic 1.2 title | Previews contradict the five-topic active manifest | Derive module title, topic title and count from existing manifest; preserve IDs and step order | `approvedCurriculum.ts` and runtime service | Verified correction implemented | Technical |
| M1-06 Moderate | 1.2–1.5 illustration area | “Add Image Here” | Developer instruction presented as learner content; no approved image exists | Honest localized “Illustration not yet available.” fallback | Actual empty asset state and live screen | Verified correction implemented | Does not fulfill missing-illustration approval |
| M1-07 No issue | 1.1 active history and invitation | One of the ancient writing systems; historical Tagalog association; heritage | No invented origin, inventor, universal language claim, or Alibata claim found | Preserve current live wording and GINHAWA attribution | Local history revision; Unicode historical-use section | No correction required | Existing source provenance is not new approval |
| M1-08 Moderate | 1.2 approved terminology | SILABARYO / each symbol a syllable / each alphabet letter one sound | Useful school-level shorthand but technically incomplete; Latin spelling is not always one-letter/one-sound | Validator option: retain the approved title, explain syllabic reading and consonants’ default A; optionally introduce “abugida” in teacher notes | Unicode describes abugida; NMP uses “syllabic”; local screenshot-based wording was explicitly selected by researcher | Proposed correction pending validation; preserve source | Do not silently override approved instructional terminology |
| M1-09 Major | 1.4 body, takeaway and dormant allophone diagram | E/I and O/U “malayang nagpapalitan…hindi nagbabago ang kahulugan”; LALAKI/LALAKE, BABAE/BABAI, KAIN/KAEN | Encoding equivalence does not establish universal lexical interchange or accepted spelling; examples require linguistic/grade-level review | Focus on shared vowel symbols and reading in context; remove universal historical explanation only after validator decision | Unicode verifies shared vowel representation, not these word claims | Proposed correction pending validation | Existing glyphs ᜁ and ᜂ preserved; dormant word chart not enabled |
| M1-10 Major | 1.5 body and dormant morphology diagram | DA/RA always one symbol; D often becomes R between vowels; ma+dapat→marapat, tawid+an→tawiran, ma+dunong→marunong | App’s shared DA/RA convention is valid baseline, not a complete account of all historical/modern forms; causal/morphological explanation needs review | Explicitly scope shared DA/RA to this course; validate word morphology and regional/historical exceptions | Existing 17-character baseline; Unicode lists distinct RA forms | Proposed correction pending validation | No new RA glyph, class or word example added |
| M1-11 No issue | 1.2/1.4/1.5 active examples | ᜊ=Ba, ᜃ=Ka, ᜆ=Ta; ᜁ=E/I, ᜂ=O/U; ᜇ=Da/Ra | Basic code points match the existing instructional convention | Preserve sequences, font and class mappings | Unicode chart + repository character baseline | No correction required | No combining signs occur in active Module 1 examples |
| M1-12 Moderate | All five topics | No explicit learning-objective field | Topic aims can be inferred, but no formal objective approval found | Provide proposed objectives in the inventory for reviewer confirmation; no runtime schema or curricular expansion | Actual types/data | Proposed correction pending validation | Inferred objectives are labeled as such |
| M1-13 Moderate | Media | Topic 1.1 bundled song; other topics have placeholders; special charts dormant | Existing media provenance is not proof of complete audiovisual content validation | Preserve asset, entry time and credit; review full song transcript/rights and approve illustrations separately | Existing content/media registry and local revision notes | Unable to verify full audiovisual accuracy | No new media downloaded or artwork generated |

## Reviewer-ready before / after wording

### M1-03 — 17 basic characters (live 1.3)

- Before TL: **17 simbolo lang ang kailangan mong matutunan!**
- Before EN: **You only need to learn 17 characters!**
- Revised TL: **Magsimula tayo sa 17 payak na simbolo!**
- Revised EN: **Let’s start with the 17 basic characters!**
- Reason: encouragement should describe the basic set without denying later marks and forms. Count, IDs and glyphs remain unchanged.
- Validation: implementation verified; academic acceptance pending.

### M1-04 — historical writing materials (legacy 1.1 preview only)

- Before TL: **Dahil wala pang papel noon, sa mga puno, kawayan, at dahon sila umuukit gamit ang matutulis na bagay para magsulat ng mga tula at mensahe.**
- Before EN: **Because there was no paper then, they carved on trees, bamboo, and leaves using sharp objects to write poems and messages.**
- Revised TL: **May mga sinaunang sulat-Baybayin na iniukit sa kawayan gamit ang matutulis na bagay. Mayroon ding isinulat sa mga dahon gamit ang pangkulay.**
- Revised EN: **Some early Baybayin writing was carved on bamboo with sharp tools. People also wrote on leaves using pigments.**
- Takeaway before TL: **Umuukit gamit ang sipol sa mga biyas ng kawayan at dahon.** EN: **They carved using a sipol on bamboo sections and leaves.**
- Revised TL: **Matutulis na bagay ang ginamit sa pag-ukit sa kawayan.** EN: **Sharp tools were used to carve on bamboo.**
- Reason/reference: NMP distinguishes leaf pigments and bamboo engraving; remove unsupported causal/generalized wording. This is not a new claim that all writing used those materials.
- Validation: evidence-supported correction; wording still pending validator review. Preview remains a preview.

### M1-08–10 — proposed, NOT substituted into approved source

| Topic | Proposed English for validator consideration | Proposed Tagalog for validator consideration | Decision needed |
| --- | --- | --- | --- |
| 1.2 | We read Baybayin using syllables. A basic consonant character includes the sound A, as in Ba, Ka and Ta. Marks can change that vowel sound. | Binabasa natin ang Baybayin gamit ang mga pantig. May kasamang tunog na A ang payak na simbolo ng katinig, tulad ng Ba, Ka at Ta. Maaaring baguhin ng mga marka ang tunog ng patinig. | How to retain the researcher-selected SILABARYO terminology while qualifying it accurately; when to introduce marks |
| 1.4 | In this basic set, E and I share ᜁ; O and U share ᜂ. The word and its meaning help us read the symbol. | Sa payak na hanay na ito, iisa ang simbolong ᜁ para sa E at I, at ᜂ para sa O at U. Tumutulong ang salita at kahulugan nito sa pagbasa ng simbolo. | Validate contextual explanation and selected word examples; avoid universal sound-interchange claim |
| 1.5 | In the basic set used in this course, Da and Ra share ᜇ. Other forms of Ra also exist. | Sa payak na hanay na ginagamit sa araling ito, iisa ang simbolong ᜇ para sa Da at Ra. May iba pang anyo ng Ra. | Scope the chosen convention; decide whether mentioning other forms is suitable at this stage |

These alternatives are reviewer drafts, not silently approved replacements. Original complete live and preview records, including both existing translations, are preserved in `verification/compliance-03/before-content.json`.
