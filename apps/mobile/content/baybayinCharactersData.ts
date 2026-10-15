import { baybayinAssets } from './baybayinAssets';

export interface BaybayinExample {
  word: string;
  /** Modern spelling: U+1714 cancels the inherent vowel of ending consonants. */
  baybayinWord: string;
  /** Zero-based syllable index in the example. */
  highlightIndex: number;
  /** Latin spelling of that syllable; Baybayin and Latin do not share code-point boundaries. */
  highlightedSyllable: string;
}

export interface BaybayinCharacter {
  id: string;
  category: 'patinig' | 'katinig';
  latinEquivalent: string;
  unicodeSymbol: string;
  imageAsset: number;
  /** Optional approved recording; device speech is used while this is null. */
  audioSrc: string | null;
  example: BaybayinExample;
}

export interface BaybayinCharacterTopic {
  id: string;
  title: string;
  description: string;
  category: BaybayinCharacter['category'];
  characters: readonly BaybayinCharacter[];
}

const vowels: readonly BaybayinCharacter[] = [
  { id: 'a', category: 'patinig', latinEquivalent: 'A', unicodeSymbol: 'ᜀ', imageAsset: baybayinAssets.a, audioSrc: null, example: { word: 'Aso', baybayinWord: 'ᜀᜐᜓ', highlightIndex: 0, highlightedSyllable: 'A' } },
  { id: 'e_i', category: 'patinig', latinEquivalent: 'E / I', unicodeSymbol: 'ᜁ', imageAsset: baybayinAssets.e_i, audioSrc: null, example: { word: 'Ibon', baybayinWord: 'ᜁᜊᜓᜈ᜔', highlightIndex: 0, highlightedSyllable: 'I' } },
  { id: 'o_u', category: 'patinig', latinEquivalent: 'O / U', unicodeSymbol: 'ᜂ', imageAsset: baybayinAssets.o_u, audioSrc: null, example: { word: 'Ulan', baybayinWord: 'ᜂᜎᜈ᜔', highlightIndex: 0, highlightedSyllable: 'U' } },
];

const consonants: readonly BaybayinCharacter[] = [
  { id: 'ba', category: 'katinig', latinEquivalent: 'Ba', unicodeSymbol: 'ᜊ', imageAsset: baybayinAssets.ba, audioSrc: null, example: { word: 'BAta', baybayinWord: 'ᜊᜆ', highlightIndex: 0, highlightedSyllable: 'Ba' } },
  { id: 'ka', category: 'katinig', latinEquivalent: 'Ka', unicodeSymbol: 'ᜃ', imageAsset: baybayinAssets.ka, audioSrc: null, example: { word: 'KAibigan', baybayinWord: 'ᜃᜁᜊᜒᜄᜈ᜔', highlightIndex: 0, highlightedSyllable: 'Ka' } },
  { id: 'da_ra', category: 'katinig', latinEquivalent: 'Da / Ra', unicodeSymbol: 'ᜇ', imageAsset: baybayinAssets.da_ra, audioSrc: null, example: { word: 'DAhon', baybayinWord: 'ᜇᜑᜓᜈ᜔', highlightIndex: 0, highlightedSyllable: 'Da' } },
  { id: 'ga', category: 'katinig', latinEquivalent: 'Ga', unicodeSymbol: 'ᜄ', imageAsset: baybayinAssets.ga, audioSrc: null, example: { word: 'GAtas', baybayinWord: 'ᜄᜆᜐ᜔', highlightIndex: 0, highlightedSyllable: 'Ga' } },
  { id: 'ha', category: 'katinig', latinEquivalent: 'Ha', unicodeSymbol: 'ᜑ', imageAsset: baybayinAssets.ha, audioSrc: null, example: { word: 'HAri', baybayinWord: 'ᜑᜇᜒ', highlightIndex: 0, highlightedSyllable: 'Ha' } },
  { id: 'la', category: 'katinig', latinEquivalent: 'La', unicodeSymbol: 'ᜎ', imageAsset: baybayinAssets.la, audioSrc: null, example: { word: 'LAwa', baybayinWord: 'ᜎᜏ', highlightIndex: 0, highlightedSyllable: 'La' } },
  { id: 'ma', category: 'katinig', latinEquivalent: 'Ma', unicodeSymbol: 'ᜋ', imageAsset: baybayinAssets.ma, audioSrc: null, example: { word: 'MAta', baybayinWord: 'ᜋᜆ', highlightIndex: 0, highlightedSyllable: 'Ma' } },
  { id: 'na', category: 'katinig', latinEquivalent: 'Na', unicodeSymbol: 'ᜈ', imageAsset: baybayinAssets.na, audioSrc: null, example: { word: 'NAnay', baybayinWord: 'ᜈᜈᜌ᜔', highlightIndex: 0, highlightedSyllable: 'Na' } },
  { id: 'nga', category: 'katinig', latinEquivalent: 'Nga', unicodeSymbol: 'ᜅ', imageAsset: baybayinAssets.nga, audioSrc: null, example: { word: 'NGAyon', baybayinWord: 'ᜅᜌᜓᜈ᜔', highlightIndex: 0, highlightedSyllable: 'Nga' } },
  { id: 'pa', category: 'katinig', latinEquivalent: 'Pa', unicodeSymbol: 'ᜉ', imageAsset: baybayinAssets.pa, audioSrc: null, example: { word: 'PAna', baybayinWord: 'ᜉᜈ', highlightIndex: 0, highlightedSyllable: 'Pa' } },
  { id: 'sa', category: 'katinig', latinEquivalent: 'Sa', unicodeSymbol: 'ᜐ', imageAsset: baybayinAssets.sa, audioSrc: null, example: { word: 'SApa', baybayinWord: 'ᜐᜉ', highlightIndex: 0, highlightedSyllable: 'Sa' } },
  { id: 'ta', category: 'katinig', latinEquivalent: 'Ta', unicodeSymbol: 'ᜆ', imageAsset: baybayinAssets.ta, audioSrc: null, example: { word: 'TAla', baybayinWord: 'ᜆᜎ', highlightIndex: 0, highlightedSyllable: 'Ta' } },
  { id: 'wa', category: 'katinig', latinEquivalent: 'Wa', unicodeSymbol: 'ᜏ', imageAsset: baybayinAssets.wa, audioSrc: null, example: { word: 'WAtawat', baybayinWord: 'ᜏᜆᜏᜆ᜔', highlightIndex: 0, highlightedSyllable: 'Wa' } },
  { id: 'ya', category: 'katinig', latinEquivalent: 'Ya', unicodeSymbol: 'ᜌ', imageAsset: baybayinAssets.ya, audioSrc: null, example: { word: 'YAman', baybayinWord: 'ᜌᜋᜈ᜔', highlightIndex: 0, highlightedSyllable: 'Ya' } },
];

export const baybayinCharacterTopics: readonly BaybayinCharacterTopic[] = [
  {
    id: 'topic-2-1', title: 'Ang mga Patinig', category: 'patinig',
    description: 'Unahin natin ang tatlong Patinig. Ito ang mga letrang kayang tumayong mag-isa: ang A, E/I, at O/U. Pansinin na sa Baybayin, pinagsasama ang E at I sa iisang simbolo, pati na rin ang O at U!',
    characters: vowels,
  },
  {
    id: 'topic-2-2', title: 'Kilalanin ang mga Katinig', category: 'katinig',
    description: "Sunod naman ang 14 na Katinig. Tandaan, bawat isa rito ay may automatic na tunog na 'A' sa dulo. Nandito ang Ba, Ka, Da/Ra (pareho ng simbolo), Ga, Ha, La, Ma, Na, Nga, Pa, Sa, Ta, Wa, at Ya.",
    characters: consonants,
  },
];

export const baybayinCharacters = [...vowels, ...consonants] as const;

export function getBaybayinCharacterTopic(id: string): BaybayinCharacterTopic | null {
  return baybayinCharacterTopics.find(topic => topic.id === id) ?? null;
}
