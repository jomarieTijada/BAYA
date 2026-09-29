import { baybayinAssets } from '../baybayinAssets';
import { baybayinCharacters, baybayinCharacterTopics, getBaybayinCharacterTopic } from '../baybayinCharactersData';

describe('Module 2 character content', () => {
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
});
