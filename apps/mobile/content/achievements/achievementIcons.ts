import { achievementCatalog } from './achievementCatalog';

const glyphs: Record<string, string> = {
  three_vowels: 'ᜀ', consonant_companion: 'ᜊ', upper_mark_explorer: 'ᜊᜒ', lower_mark_explorer: 'ᜊᜓ',
  kudlit_explorer: 'ᜃᜒ', base_character_artist: 'ᜃ', upper_kudlit_artist: 'ᜃᜒ', lower_kudlit_artist: 'ᜃᜓ',
};
const accents: Record<string, string> = {
  listening_legend: 'star-outline', sound_scholar: 'volume-medium-outline', story_revisited: 'repeat-outline',
  second_chance_champion: 'medal-outline', script_sleuth: 'document-text-outline', values_hero: 'heart-outline',
};
/** All artwork is bundled: Ionicons outlines, canonical tracing images, or local vectors. */
export const achievementIcons = Object.fromEntries(achievementCatalog.map(d => [d.id, {
  primaryIcon: d.id === 'story_revisited' ? 'book-outline' : d.id === 'values_hero' ? 'shield-outline' : d.iconKey,
  secondaryIcon: accents[d.id], glyph: glyphs[d.id],
  feather: d.id === 'first_feather' ? 1 : d.id === 'fourteen_feathers' ? 2 : 0,
}]));
