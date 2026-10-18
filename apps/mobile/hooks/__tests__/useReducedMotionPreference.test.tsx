import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { useReducedMotionPreference } from '../useReducedMotionPreference';

function Preference() { return <Text>{useReducedMotionPreference() ? 'static' : 'motion'}</Text>; }
afterEach(() => jest.restoreAllMocks());
it('defaults to static and does not overwrite a newer preference event with a delayed query', async () => {
  let resolve!: (enabled: boolean) => void;
  let change!: (enabled: boolean) => void;
  const remove = jest.fn();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise(r => { resolve = r; }));
  const subscribe = (_event: string, callback: (enabled: boolean) => void) => { change = callback; return { remove }; };
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(subscribe as unknown as typeof AccessibilityInfo.addEventListener);
  const view = render(<Preference />);
  expect(screen.getByText('static')).toBeTruthy();
  act(() => change(false));
  await act(async () => resolve(true));
  expect(screen.getByText('motion')).toBeTruthy();
  act(() => change(true));
  expect(screen.getByText('static')).toBeTruthy();
  view.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});
it('retains a static presentation if the platform preference query fails', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockRejectedValue(Error('unavailable'));
  render(<Preference />);
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByText('static')).toBeTruthy();
});
