import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { BAYA_PLAYBACK_TIMELINES, BAYA_RESTING_FRAME } from '../../branding/baya/animationAssets';
import { useBayaAnimation } from '../../branding/baya/useBayaAnimation';

afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

it('uses the existing wave and exact resting image for a single 1.8-second greeting', () => {
  const steps = BAYA_PLAYBACK_TIMELINES.greeting;
  expect(steps[0]).toMatchObject({ source: BAYA_RESTING_FRAME, phase: 'rest', durationMs: 300 });
  expect(steps.slice(1, -1)).toEqual(BAYA_PLAYBACK_TIMELINES.wave);
  expect(steps.slice(0, -1).reduce((ms, step) => ms + step.durationMs, 0)).toBe(1800);
  expect(steps[steps.length - 1]).toMatchObject({ source: BAYA_RESTING_FRAME, phase: 'rest' });
});

it('plays once then stays at rest and releases its timer on unmount', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest.useFakeTimers();
  const view = renderHook(() => useBayaAnimation({ state: 'greeting', autoplay: true, loop: false }));
  await act(async () => {});
  expect(view.result.current.phase).toBe('rest');
  act(() => jest.advanceTimersByTime(300));
  expect(view.result.current.phase).toBe('wave');
  for (let i = 0; i < 25; i++) act(() => jest.advanceTimersByTime(60));
  expect(view.result.current).toMatchObject({ source: BAYA_RESTING_FRAME, phase: 'rest' });
  act(() => jest.advanceTimersByTime(10000));
  expect(view.result.current.phase).toBe('rest');
  view.unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it('keeps the canonical frame when reduced motion is requested', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const view = renderHook(() => useBayaAnimation({ state: 'greeting', autoplay: false, loop: false }));
  await waitFor(() => expect(view.result.current).toMatchObject({ source: BAYA_RESTING_FRAME, phase: 'rest', frameIndex: null }));
  view.unmount();
});
