import { act, renderHook } from '@testing-library/react-native';
import { Platform, View } from 'react-native';
import { useStorybookTurn } from '../useStorybookTurn';

jest.mock('../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => false }));

const originalOS = Platform.OS;
afterEach(() => { Object.defineProperty(Platform, 'OS', { value: originalOS }); });

it('recovers to a readable destination if the browser rejects an animation', async () => {
  Object.defineProperty(Platform, 'OS', { value: 'web' });
  const cancel = jest.fn();
  const { result } = renderHook(() => useStorybookTurn(5));
  result.current.surface.current = { animate: () => ({ finished: Promise.reject(new Error('effect unavailable')), cancel }) } as unknown as View;
  await act(async () => { await result.current.turn(1); });
  expect(result.current.page).toBe(1);
  expect(result.current.busy).toBe(false);
  expect(cancel).toHaveBeenCalled();
});

it('locks repeated and opposite requests synchronously, and cancels on unmount', async () => {
  Object.defineProperty(Platform, 'OS', { value: 'web' });
  let reject!: (reason: Error) => void;
  const finished = new Promise<void>((_, fail) => { reject = fail; });
  const cancel = jest.fn(() => reject(new Error('cancelled')));
  const animate = jest.fn(() => ({ finished, cancel }));
  const { result, unmount } = renderHook(() => useStorybookTurn(5));
  result.current.surface.current = { animate } as unknown as View;
  let pending!: Promise<void>;
  act(() => { pending = result.current.turn(1); void result.current.turn(1); void result.current.turn(-1); });
  expect(animate).toHaveBeenCalledTimes(1);
  expect(result.current.busy).toBe(true);
  unmount();
  await act(async () => { await pending; });
  expect(cancel).toHaveBeenCalledTimes(1);
});
