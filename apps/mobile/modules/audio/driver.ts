import { createAudioPlayer } from 'expo-audio';
import type { PlaybackDriver } from './types';

export const startPlayback: PlaybackDriver = (source, update) => {
  const player = createAudioPlayer(source, { updateInterval: 100 });
  const subscription = player.addListener('playbackStatusUpdate', status => {
    if (status.error) update('error');
    else if (status.didJustFinish) update('ready');
    else if (status.playing && !status.isBuffering) update('playing');
  });
  try { player.play(); } catch (error) { subscription.remove(); player.remove(); throw error; }
  return { dispose() { subscription.remove(); player.pause(); player.remove(); } };
};
