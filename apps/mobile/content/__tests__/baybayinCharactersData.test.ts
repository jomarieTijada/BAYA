import { baybayinAssets } from '../baybayinAssets';
import { baybayinCharacters, baybayinCharacterTopics, getBaybayinCharacterTopic } from '../baybayinCharactersData';

describe('Module 2 character content', () => {
  // Independently audited syllables using Unicode's Tagalog character table.
  // The DA/RA symbol remains shared, as in the supplied reference characters.
  it.each([
    ['a', 'a-so', 'ᜀᜐᜓ'],
    ['e_i', 'i-bo-n', 'ᜁᜊᜓᜈ᜔'],
    ['o_u', 'u-la-n', 'ᜂᜎᜈ᜔'],
    ['ba', 'ba-ta', 'ᜊᜆ'],
    ['ka', 'ka-i-bi-ga-n', 'ᜃᜁᜊᜒᜄᜈ᜔'],
    ['da_ra', 'da-ho-n', 'ᜇᜑᜓᜈ᜔'],
    ['ga', 'ga-ta-s', 'ᜄᜆᜐ᜔'],
    ['ha', 'ha-ri', 'ᜑᜇᜒ'],
    ['la', 'la-wa', 'ᜎᜏ'],
    ['ma', 'ma-ta', 'ᜋᜆ'],
    ['na', 'na-na-y', 'ᜈᜈᜌ᜔'],
    ['nga', 'nga-yo-n', 'ᜅᜌᜓᜈ᜔'],
    ['pa', 'pa-na', 'ᜉᜈ'],
    ['sa', 'sa-pa', 'ᜐᜉ'],
    ['ta', 'ta-la', 'ᜆᜎ'],
    ['wa', 'wa-ta-wa-t', 'ᜏᜆᜏᜆ᜔'],
    ['ya', 'ya-ma-n', 'ᜌᜋᜈ᜔'],
  ] as const)('writes the complete %s example as %s in modern Baybayin', (id, reading, spelling) => {
    const character = baybayinCharacters.find(item => item.id === id)!;
    expect(character.example.word.toLowerCase()).toBe(reading.replace(/-/g, ''));
    expect(character.example.baybayinWord).toBe(spelling);
    expect(character.example.baybayinWord.startsWith(character.unicodeSymbol)).toBe(true);
    expect(character.imageAsset).toBe(baybayinAssets[id]);
  });

  it('maps every supplied glyph to one bundled asset and one topic', () => {
    expect(Object.keys(baybayinAssets)).toHaveLength(17);
    expect(baybayinCharacterTopics.map(topic => [topic.id, topic.characters.length]))
      .toEqual([['topic-2-1', 3], ['topic-2-2', 14]]);
    expect(new Set(baybayinCharacters.map(character => character.id)).size).toBe(17);
    for (const character of baybayinCharacters) {
      expect(character.imageAsset).toBe(baybayinAssets[character.id as keyof typeof baybayinAssets]);
      expect(character.example.highlightIndex).toBe(0);
      expect(character.example.word.toLowerCase().startsWith(character.example.highlightedSyllable.toLowerCase())).toBe(true);
      expect(character.example.baybayinWord.startsWith(character.unicodeSymbol)).toBe(true);
    }
  });

  it('keeps the two topic datasets in the specified order', () => {
    expect(getBaybayinCharacterTopic('topic-2-1')?.characters.map(character => character.id))
      .toEqual(['a', 'e_i', 'o_u']);
    expect(getBaybayinCharacterTopic('topic-2-2')?.characters.map(character => character.id))
      .toEqual(['ba', 'ka', 'da_ra', 'ga', 'ha', 'la', 'ma', 'na', 'nga', 'pa', 'sa', 'ta', 'wa', 'ya']);
    expect(getBaybayinCharacterTopic('topic-2-3')).toBeNull();
  });

  it.each([
    ['ka', 'KAibigan', 'Ka', 'ᜃ', 'ᜃᜁᜊᜒᜄᜈ᜔'],
    ['nga', 'NGAyon', 'Nga', 'ᜅ', 'ᜅᜌᜓᜈ᜔'],
    ['ya', 'YAman', 'Ya', 'ᜌ', 'ᜌᜋᜈ᜔'],
  ] as const)('keeps the revised %s example associated with its original character', (id, word, syllable, symbol, baybayinWord) => {
    const character = getBaybayinCharacterTopic('topic-2-2')!.characters.find(item => item.id === id)!;
    expect(character.unicodeSymbol).toBe(symbol);
    expect(character.imageAsset).toBe(baybayinAssets[id]);
    expect(character.latinEquivalent).toBe(syllable);
    expect(character.example).toEqual({ word, baybayinWord, highlightedSyllable: syllable, highlightIndex: 0 });
  });

  it('excludes the superseded words from Lesson 2 examples', () => {
    const words = baybayinCharacters.map(character => character.example.word.toLowerCase());
    for (const oldWord of ['kama', 'ngipin', 'yaya']) expect(words).not.toContain(oldWord);
  });
});
