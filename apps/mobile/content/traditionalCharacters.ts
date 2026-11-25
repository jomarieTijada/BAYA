/** Traditional glyph groups, independent of the model's immutable training labels.
 * Modern RA classes remain separate: never relabel or merge model outputs.
 */
export const traditionalDrGroups = Object.freeze([
  { glyph: 'ᜇ', modelClass: 'da_ra', label: 'DA/RA', syllables: ['da', 'ra'], recordings: ['baya-a-dara'] },
  { glyph: 'ᜇᜒ', modelClass: 'de_di', label: 'DE/DI/RE/RI', syllables: ['de', 'di', 're', 'ri'], recordings: ['baya-e-dere', 'baya-i-diri'] },
  { glyph: 'ᜇᜓ', modelClass: 'do_du', label: 'DO/DU/RO/RU', syllables: ['do', 'du', 'ro', 'ru'], recordings: ['baya-o-doro', 'baya-u-duru'] },
] as const);
export const traditionalGroupForClass = (id: string) => traditionalDrGroups.find(g => g.modelClass === id);
export const traditionalGroupForGlyph = (glyph: string) => traditionalDrGroups.find(g => g.glyph === glyph);
export const traditionalGroupForSyllable = (syllable: string) => traditionalDrGroups.find(g => (g.syllables as readonly string[]).includes(syllable.toLowerCase()));

/** Traditional consonant variant IDs match the existing tracing/model registry. */
export function kudlitVariant(baseId: string, position: 'upper' | 'lower') {
  const stem = baseId === 'da_ra' ? 'd' : baseId.slice(0, -1);
  const id = position === 'upper' ? `${stem}e_${stem}i` : `${stem}o_${stem}u`;
  return { id, label: traditionalGroupForClass(id)?.label ?? id.replaceAll('_', ' / ').toUpperCase() };
}
