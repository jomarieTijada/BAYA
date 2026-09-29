import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Speech from 'expo-speech';

import type { BaybayinCharacter } from '../../../content/baybayinCharactersData';

/** Prefer an approved recording; use device speech until one is available. */
export function useCharacterPronunciation(character: BaybayinCharacter) {
  const player = useAudioPlayer(character.audioSrc);
  const status = useAudioPlayerStatus(player);
  const [speech, setSpeech] = useState({ characterId: character.id, speaking: false });
  const request = useRef(0);

  useEffect(() => {
    return () => {
      request.current += 1;
      // Expo releases the previous player when its source changes. Never call
      // pause on that released instance while switching letters.
      void Speech.stop();
    };
  }, [character.id]);

  const pronounce = async () => {
    const current = ++request.current;
    try {
      if (character.audioSrc && status.isLoaded) player.pause();
      await Speech.stop();
      if (current !== request.current) return;
      if (character.audioSrc && status.isLoaded) {
        await player.seekTo(0);
        if (current === request.current) player.play();
        return;
      }
      setSpeech({ characterId: character.id, speaking: true });
      Speech.speak(character.latinEquivalent.replace(' / ', ' o '), {
        language: 'fil-PH',
        rate: 0.85,
        onDone: () => { if (current === request.current) setSpeech({ characterId: character.id, speaking: false }); },
        onError: () => { if (current === request.current) setSpeech({ characterId: character.id, speaking: false }); },
        onStopped: () => { if (current === request.current) setSpeech({ characterId: character.id, speaking: false }); },
      });
    } catch (error) {
      if (current === request.current) setSpeech({ characterId: character.id, speaking: false });
      if (__DEV__ && current === request.current) console.warn('[BAYA AUDIO] Pronunciation failed', character.id, error);
    }
  };

  return { pronounce, speaking: (speech.characterId === character.id && speech.speaking) || status.playing };
}
