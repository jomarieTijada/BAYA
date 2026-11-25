import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { BAYA_ANIMATIONS, BAYA_PLAYBACK_TIMELINES, BAYA_RESTING_FRAME, type BayaMascotState } from '../../branding/baya/animationAssets';
import { useBayaAnimation } from '../../branding/baya/useBayaAnimation';
import manifest from '../../../assets/branding/baya/animations/v1.1/manifest.json';

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

it('maps every supplied v1.1 frame into the shared timelines', () => {
  for (const state of ['blink', 'wave'] as const) {
    const definition = BAYA_ANIMATIONS[state];
    expect(definition.version).toBe(manifest.version);
    expect(definition.frames).toHaveLength(manifest.sequences[state].frameCount);
    const steps = BAYA_PLAYBACK_TIMELINES[state === 'blink' ? 'idle' : 'wave'].filter(step => step.phase === state);
    expect(steps.map(step => step.frameIndex)).toEqual(definition.frames.map((_, i) => i));
    expect(steps.map(step => step.source)).toEqual(definition.frames);
  }
});

it('plays every blink frame, returns to rest, switches to wave, loops, and cancels timers', async () => {
  const view = renderHook(({ state }: {state: BayaMascotState}) => useBayaAnimation({ state, autoplay: true, loop: true }), { initialProps: {state: 'idle' as BayaMascotState} });
  await act(async () => {});
  act(() => jest.advanceTimersByTime(2400));
  for (let i = 0; i < BAYA_ANIMATIONS.blink.frameCount; i++) {
    expect(view.result.current).toMatchObject({phase: 'blink', frameIndex: i});
    act(() => jest.advanceTimersByTime(60));
  }
  expect(view.result.current).toMatchObject({phase: 'rest', source: BAYA_RESTING_FRAME});
  view.rerender({state: 'wave'});
  for (let i = 0; i < BAYA_ANIMATIONS.wave.frameCount; i++) {
    expect(view.result.current).toMatchObject({phase: 'wave', frameIndex: i});
    act(() => jest.advanceTimersByTime(60));
  }
  expect(view.result.current.frameIndex).toBe(0);
  view.unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('stops a one-shot wave at its supplied last frame', async () => {
  const view = renderHook(() => useBayaAnimation({state: 'wave', autoplay: true, loop: false}));
  await act(async () => {});
  for (let i = 1; i < BAYA_ANIMATIONS.wave.frameCount; i++) act(() => jest.advanceTimersByTime(60));
  expect(view.result.current.frameIndex).toBe(BAYA_ANIMATIONS.wave.frameCount - 1);
  expect(jest.getTimerCount()).toBe(0);
  view.unmount();
});

it('uses the v1.1 resting frame and schedules no playback with reduced motion', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const view = renderHook(() => useBayaAnimation({state: 'wave', autoplay: true, loop: true}));
  await act(async () => {});
  expect(view.result.current).toMatchObject({phase: 'rest', source: BAYA_ANIMATIONS.blink.frames[0]});
  act(() => jest.runAllTicks());
  expect(jest.getTimerCount()).toBe(0);
  view.unmount();
});
