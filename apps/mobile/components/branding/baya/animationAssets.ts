import { WAVE_FRAMES, BLINK_FRAMES } from './frameSources';

export type BayaMascotState = 'ambient' | 'idle' | 'wave' | 'greeting';

export type BayaAnimationPhase = 'blink' | 'rest' | 'wave';

export type BayaPlaybackStep = {
  source: number;
  durationMs: number;
  phase: BayaAnimationPhase;
  frameIndex: number | null;
};

const FRAME_DURATION_MS = 60;

export const BAYA_RESTING_FRAME = BLINK_FRAMES[0];

/** v1.1 keeps the established cadence; the supplied PNGs contain no timing metadata. */
export const BAYA_ANIMATIONS = {
  blink: { version: 'v1.1', state: 'blink', frames: BLINK_FRAMES, frameCount: BLINK_FRAMES.length, frameDurationMs: FRAME_DURATION_MS, loopPolicy: 'caller-controlled', staticFrame: BAYA_RESTING_FRAME },
  wave: { version: 'v1.1', state: 'wave', frames: WAVE_FRAMES, frameCount: WAVE_FRAMES.length, frameDurationMs: FRAME_DURATION_MS, loopPolicy: 'caller-controlled', staticFrame: BAYA_RESTING_FRAME },
} as const;

const toFrameSteps = (
  frames: readonly number[],
  phase: Exclude<BayaAnimationPhase, 'rest'>,
): BayaPlaybackStep[] =>
  frames.map((source, frameIndex) => ({
    source,
    durationMs: FRAME_DURATION_MS,
    phase,
    frameIndex,
  }));

const rest = (durationMs: number): BayaPlaybackStep => ({
  source: BAYA_RESTING_FRAME,
  durationMs,
  phase: 'rest',
  frameIndex: null,
});

const WAVE_STEPS = toFrameSteps(WAVE_FRAMES, 'wave');
const BLINK_STEPS = toFrameSteps(BLINK_FRAMES, 'blink');

/** Centralized pauses make the mascot timing easy to tune without touching rendering code. */
export const BAYA_AMBIENT_TIMING = {
  beforeBlinkMs: 2400,
  afterBlinkMs: 4200,
} as const;

export const BAYA_PLAYBACK_TIMELINES: Readonly<
  Record<BayaMascotState, readonly BayaPlaybackStep[]>
> = {
  ambient: [
    ...WAVE_STEPS,
    rest(BAYA_AMBIENT_TIMING.beforeBlinkMs),
    ...BLINK_STEPS,
    rest(BAYA_AMBIENT_TIMING.afterBlinkMs),
  ],
  idle: [
    rest(BAYA_AMBIENT_TIMING.beforeBlinkMs),
    ...BLINK_STEPS,
    rest(BAYA_AMBIENT_TIMING.afterBlinkMs),
  ],
  wave: WAVE_STEPS,
  // One deliberate welcome, followed by the exact canonical resting frame.
  greeting: [rest(300), ...WAVE_STEPS, rest(1)],
};
