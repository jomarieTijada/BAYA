# Slide 2 copy revision

The user requested that Topic 1.2 (“Ano Ba ang Silabaryo?”) use the passage beginning “Ang Baybayin ay hindi alpabeto” in their supplied Baybayin Buhayin 2.0 screenshot.

The shared source is now `apps/mobile/content/baybayinSyllabary.ts`. Both the live storybook in `approvedStorybook.ts` and the older Topic 1.2 preview consume these paragraphs:

> Ang Baybayin ay hindi alpabeto na tulad ng ginagamit natin ngayon kundi SILABARYO. Bawat simbolo nito ay katumbas ng isang pantig (syllable), hindi tulad ng ating alpabeto na bawat titik ay isang tunog.
>
> Mula sa ugat na salitang “baybáy” o ang pagbabaybay ng mga salita (to spell, to syllabicate).

The screenshot credits Bb. Rusell Irene L. Lagunsad, MAF, Baybayin advocate and lecturer, University of the Philippines–Diliman. That provenance is recorded in the source comment. The supplied wording was adapted with a minor grammatical correction (“ay katumbas ng”) and omission of the colonial reference to preserve the user's earlier preference. This is not a verbatim transcription of the entire screenshot.

Removed the old repeated introductory sentence and longer body, including the book/date example. The existing topic title, validated character examples, BAYA takeaway, navigation, video attribution in Topic 1, and recognition behavior were retained. No layout or database implementation changed.

Verification: **3 relevant suites / 68 tests passed**, including live/preview content, navigation regressions and database seed serialization. TypeScript, scoped ESLint, and production web/PWA export passed. Chrome checks at 360, 390, 430, 768, 1024, 1366, 1440, and 1600 px confirmed two identical paragraphs, both navigation buttons, no horizontal overflow, and no runtime exceptions. Phone and desktop screenshots were visually inspected. Cache: `baya-pwa-ec26e74c948836fe`.

Evidence: `sandbox/slide-two-copy-*.log` and `sandbox/slide-two-browser-validation/`.
