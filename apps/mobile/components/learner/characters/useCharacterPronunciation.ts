import type { BaybayinCharacter } from '../../../content/baybayinCharactersData';
import { characterPronunciation } from '../../../modules/audio/pronunciationMapping';
import { usePronunciation } from '../../../modules/audio/usePronunciation';

/** Only mapped recordings; unavailable audio never falls back to TTS. */
export function useCharacterPronunciation(character: BaybayinCharacter) {
  return usePronunciation(characterPronunciation(character.id));
}
