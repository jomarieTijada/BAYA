import { baybayinCharacterTopics, type BaybayinCharacter } from './baybayinCharactersData';

/** The writing curriculum reuses the same bundled glyphs and pronunciation data as Module 2. */
export interface WritingExercise {
  id: string;
  characterId: string;
  character: string;
  romanization: string;
  sound: string;
  referenceImage: number;
  pronunciation: BaybayinCharacter;
}

export interface WritingTopic {
  id: 'topic-3-1' | 'topic-3-2';
  title: string;
  exercises: readonly WritingExercise[];
}

function toExercise(character: BaybayinCharacter): WritingExercise {
  const romanization = character.latinEquivalent.toUpperCase();
  return {
    id: `write-${character.id}`,
    characterId: character.id,
    character: character.unicodeSymbol,
    romanization,
    sound: `/${character.latinEquivalent.toLowerCase().replace(/\s*\/\s*/g, ' o ')}/`,
    referenceImage: character.imageAsset,
    pronunciation: character,
  };
}

export const writingTopics: readonly WritingTopic[] = baybayinCharacterTopics.map((topic, index) => ({
  id: index === 0 ? 'topic-3-1' as const : 'topic-3-2' as const,
  title: index === 0 ? 'Mga Patinig' : 'Mga Katinig',
  exercises: topic.characters.map(toExercise),
}));

export function getWritingTopic(topicId: string): WritingTopic | null {
  return writingTopics.find(topic => topic.id === topicId) ?? null;
}
