export type BayaMascotState = 'ambient' | 'idle' | 'wave';

export type BayaAnimationPhase = 'blink' | 'rest' | 'wave';

export type BayaPlaybackStep = {
  source: number;
  durationMs: number;
  phase: BayaAnimationPhase;
  frameIndex: number | null;
};

const FRAME_DURATION_MS = 60;

const WAVE_FRAMES: readonly number[] = [
  require('../../../assets/branding/baya/expressions/wave/frame-000.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-001.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-002.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-003.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-004.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-005.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-006.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-007.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-008.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-009.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-010.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-011.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-012.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-013.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-014.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-015.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-016.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-017.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-018.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-019.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-020.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-021.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-022.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-023.png'),
  require('../../../assets/branding/baya/expressions/wave/frame-024.png'),
];

const BLINK_FRAMES: readonly number[] = [
  require('../../../assets/branding/baya/idle/frame-000.png'),
  require('../../../assets/branding/baya/idle/frame-001.png'),
  require('../../../assets/branding/baya/idle/frame-002.png'),
  require('../../../assets/branding/baya/idle/frame-003.png'),
  require('../../../assets/branding/baya/idle/frame-004.png'),
  require('../../../assets/branding/baya/idle/frame-005.png'),
  require('../../../assets/branding/baya/idle/frame-006.png'),
  require('../../../assets/branding/baya/idle/frame-007.png'),
  require('../../../assets/branding/baya/idle/frame-008.png'),
  require('../../../assets/branding/baya/idle/frame-009.png'),
  require('../../../assets/branding/baya/idle/frame-010.png'),
  require('../../../assets/branding/baya/idle/frame-011.png'),
  require('../../../assets/branding/baya/idle/frame-012.png'),
  require('../../../assets/branding/baya/idle/frame-013.png'),
  require('../../../assets/branding/baya/idle/frame-014.png'),
  require('../../../assets/branding/baya/idle/frame-015.png'),
  require('../../../assets/branding/baya/idle/frame-016.png'),
  require('../../../assets/branding/baya/idle/frame-017.png'),
  require('../../../assets/branding/baya/idle/frame-018.png'),
  require('../../../assets/branding/baya/idle/frame-019.png'),
  require('../../../assets/branding/baya/idle/frame-020.png'),
  require('../../../assets/branding/baya/idle/frame-021.png'),
  require('../../../assets/branding/baya/idle/frame-022.png'),
  require('../../../assets/branding/baya/idle/frame-023.png'),
  require('../../../assets/branding/baya/idle/frame-024.png'),
];

export const BAYA_RESTING_FRAME = BLINK_FRAMES[0];

// The gesture frame cadence comes directly from the supplied GIF metadata.
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
};
