import type { AudioSource } from 'expo-audio';
export type PlaybackPhase = 'ready' | 'loading' | 'playing' | 'error';
export type PlaybackDriver = (source: AudioSource, update: (phase: PlaybackPhase) => void) => { dispose(): void };
