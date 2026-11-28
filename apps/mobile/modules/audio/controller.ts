import type { AudioSource } from 'expo-audio';
import type { PlaybackDriver, PlaybackPhase } from './types';

/** One active, on-demand recording. Generation guards reject stale media callbacks. */
export function createPronunciationController(driver: PlaybackDriver) {
  let snapshot: { owner: symbol | null; id: string | null; phase: PlaybackPhase } = { owner: null, id: null, phase: 'ready' };
  let generation = 0;
  let active: ReturnType<PlaybackDriver> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  const release = () => { clearTimeout(timer); timer = undefined; active?.dispose(); active = undefined; };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => snapshot,
    stop(owner?: symbol) {
      if (owner && snapshot.owner !== owner) return;
      generation++; release(); snapshot = { owner: null, id: null, phase: 'ready' }; emit();
    },
    play(owner: symbol, id: string, source: AudioSource, onComplete?: () => void) {
      const current = ++generation; release(); snapshot = { owner, id, phase: 'loading' }; emit();
      const update = (phase: PlaybackPhase) => {
        if (current !== generation) return;
        if (phase === 'loading') {
          clearTimeout(timer); timer = setTimeout(() => update('error'), 15000);
        } else { clearTimeout(timer); timer = undefined; }
        if (phase === 'ready') onComplete?.();
        snapshot = { owner, id, phase }; emit();
        if (phase === 'ready' || phase === 'error') { generation++; release(); }
      };
      timer = setTimeout(() => update('error'), 15000);
      try {
        const resource = driver(source, update);
        if (current === generation) active = resource;
        else resource.dispose();
      } catch { update('error'); }
    },
  };
}
