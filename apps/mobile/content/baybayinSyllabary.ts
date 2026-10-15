/**
 * Adapted from the user's Baybayin Buhayin 2.0 screenshot, attributed there to
 * Bb. Rusell Irene L. Lagunsad, MAF, Baybayin advocate and lecturer,
 * University of the Philippines–Diliman. Minor grammar fixes and omission of
 * the colonial reference follow the user's learner-content preferences.
 */
export const baybayinSyllabaryParagraphs = [
  'Ang Baybayin ay hindi alpabeto na tulad ng ginagamit natin ngayon kundi SILABARYO. Bawat simbolo nito ay katumbas ng isang pantig (syllable), hindi tulad ng ating alpabeto na bawat titik ay isang tunog.',
  'Mula sa ugat na salitang “baybáy” o ang pagbabaybay ng mga salita (to spell, to syllabicate).',
] as const;

export const baybayinSyllabaryText = baybayinSyllabaryParagraphs.join('\n\n');

export const baybayinSyllabaryHighlights = [
  'Baybayin',
  'SILABARYO',
  'pantig',
  'baybáy',
  'pagbabaybay',
];
