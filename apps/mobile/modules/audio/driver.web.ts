import { Asset } from 'expo-asset';
import type { PlaybackDriver } from './types';

/** HTMLAudio exposes the rejected play promise that Expo's web play() discards. */
export const startPlayback: PlaybackDriver = (source, update) => {
  const uri = typeof source === 'number' ? Asset.fromModule(source).uri : typeof source === 'string' ? source : source?.uri;
  if (!uri) throw new Error('Unavailable recording');
  const audio = new Audio(uri);
  audio.preload = 'auto';
  audio.onplaying = () => update('playing');
  audio.onended = () => update('ready');
  audio.onerror = () => update('error');
  audio.onwaiting = () => update('loading');
  void audio.play().catch(() => update('error'));
  return { dispose() {
    audio.onplaying = audio.onended = audio.onerror = audio.onwaiting = null;
    audio.pause(); audio.removeAttribute('src'); audio.load();
  } };
};
