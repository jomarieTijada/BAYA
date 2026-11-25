import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { useLocalization } from '../../localization/LocalizationProvider';
import { createPronunciationController } from './controller';
import { startPlayback } from './driver';
import type { BayaAudioEntry } from './manifest';

export const pronunciation = createPronunciationController(startPlayback);
export function usePronunciation(entry?: BayaAudioEntry) {
  const owner = useRef(Symbol('pronunciation')).current;
  const { language } = useLocalization();
  const snapshot = useSyncExternalStore(pronunciation.subscribe, pronunciation.getSnapshot, pronunciation.getSnapshot);
  useEffect(() => {
    const app = AppState.addEventListener('change', state => { if (state !== 'active') pronunciation.stop(owner); });
    const hidden = () => { if (document.hidden) pronunciation.stop(owner); };
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.addEventListener('visibilitychange', hidden);
    return () => {
      app.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') document.removeEventListener('visibilitychange', hidden);
      pronunciation.stop(owner);
    };
  }, [owner, entry?.id, language]);
  const phase = snapshot.owner === owner && snapshot.id === entry?.id ? snapshot.phase : 'ready';
  const stop = useCallback(() => pronunciation.stop(owner), [owner]);
  return { phase, speaking: phase === 'playing', loading: phase === 'loading', error: phase === 'error', available: !!entry,
    pronounce: () => { if (entry) pronunciation.play(owner, entry.id, entry.source); }, stop };
}
