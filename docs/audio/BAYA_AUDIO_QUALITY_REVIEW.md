# BAYA audio quality and educational review

This is an engineering audit, not linguistic approval. All 87 files still require researcher listening sign-off. Use [the offline A/B worksheet](listening-review.html) and export its reviewer results. No file is marked linguistically validated.

All originals are 48 kHz, stereo AAC in M4A containers and decode successfully. Channels are effectively identical; averaging preserves amplitude. No original crosses the digital-clipping threshold, no file is near-silent, and the measured 50/60 Hz energy does not trigger the hum heuristic. 64 files have silence/pause runs over one second. Their full boundaries remain intact; 23 have no automated technical flags. There are no identical SHA-256 duplicates. Eleven envelope-similarity pairs are listed in duplicate-candidates.json; similar timing is not evidence that the spoken syllables are duplicates.

Signal checks cover duration, peak/RMS, integrated loudness, true peak, silence and pause runs, stereo correlation and downmix loss, hum energy, end-window amplitude, quiet-window RMS/high-frequency energy and short opposite-slope impulse candidates. No impulses cross the conservative sample-step heuristic. The quietest 20% of 10ms windows have RMS between -87.34 and -78.83 dBFS across files. Those windows may contain quiet speech; the measurements do not prove absence of hiss or clicks. Clicks, hiss, speech distortion, truncated phonemes and multiple spoken pronunciations still need listening. No denoising, silence deletion, speed change or pitch change is applied. Static gain is limited to +6 dB and leaves at least 2.5 dB measured source true-peak headroom; the chosen outputs also pass decoded peak checks.

## Withheld mappings

- `e/DeRe.m4a` — Combined D/R recording; current modified guide labels D only. Confirm intended sequence before assignment.
- `i/DiRi.m4a` — Combined D/R recording; current modified guide labels D only. Confirm intended sequence before assignment.
- `KATINIG/B.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/DR.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/G.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/H.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/K.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/L.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/M.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/N.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/Ng.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/P.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/S.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/T.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/W.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `KATINIG/Y.m4a` — May be letter names or vowel-cancelled sounds. Listening/content confirmation required; no inherent-a substitution.
- `o/DoRo.m4a` — Combined D/R recording; current modified guide labels D only. Confirm intended sequence before assignment.
- `u/DuRu.m4a` — Combined D/R recording; current modified guide labels D only. Confirm intended sequence before assignment.

## Listening priorities

1. All separate E/I and O/U variants, against their intended spoken vowel.
2. Combined Vowel/EoI, Vowel/OoU and a/DaRa: confirm the complete sequence matches the combined label. These are never substituted for a single contextual sound.
3. All KATINIG recordings: distinguish letter names from vowel-cancelled consonants.
4. DeRe, DiRi, DoRo and DuRu: validate D/R sequence and approved glyph context.
5. Soft consonants, release sounds, the 64 long-pause recordings, and the eleven envelope-similarity pairs.
6. Original versus AAC64, then all five codec trials. Smaller Opus encodings have not been accepted on acoustic evidence alone.

See BAYA_AUDIO_LISTENING_REVIEW.csv for all 87 individual review records, including withheld recordings. Withheld optimized candidates stay in .codex-tmp and are not deployed.
