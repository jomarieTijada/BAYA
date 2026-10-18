import React from 'react';
import { Animated } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SwipeHint, swipeDirection } from '../SwipeHint';
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference';
jest.mock('../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: jest.fn(() => false) }));
jest.mock('../AppIcon', () => ({ AppIcon: () => null }));

afterEach(() => jest.restoreAllMocks());
it('uses actual overflow and reverses the finger direction at the end, including resize', () => {
  expect(swipeDirection(0, 900, 0)).toBeNull();
  expect(swipeDirection(600, 600, 0)).toBeNull();
  expect(swipeDirection(600, 900, 0)).toBe('left');
  expect(swipeDirection(600, 900, 150)).toBe('left');
  expect(swipeDirection(600, 900, 300)).toBe('right');
  expect(swipeDirection(1000, 900, 300)).toBeNull();
});
it('demonstrates the gesture twice, then stays static across rerenders and boundaries without intercepting touch', () => {
  (useReducedMotionPreference as jest.Mock).mockReturnValue(false);
  const timing = jest.spyOn(Animated, 'timing');
  const start = jest.fn(), stop = jest.fn();
  jest.spyOn(Animated, 'sequence').mockReturnValue({ start, stop, reset: jest.fn() });
  const view = render(<SwipeHint direction={null} />);
  expect(timing).not.toHaveBeenCalled();
  view.rerender(<SwipeHint direction="left" />);
  expect(screen.getByTestId('lesson-swipe-hint').props.pointerEvents).toBe('none');
  expect(screen.getByLabelText('I-swipe pakaliwa')).toBeTruthy();
  expect(timing.mock.calls.map(call => call[1].toValue)).toEqual([-7, 0, -7, 0]);
  view.rerender(<SwipeHint direction="left" />);
  view.rerender(<SwipeHint direction="right" />);
  expect(screen.getByLabelText('I-swipe pakanan')).toBeTruthy();
  expect(timing).toHaveBeenCalledTimes(4);
  expect(stop).toHaveBeenCalled();
  view.rerender(<SwipeHint direction={null} />);
  expect(screen.queryByTestId('lesson-swipe-hint')).toBeNull();
});
it('keeps a visible static cue for reduced motion', () => {
  (useReducedMotionPreference as jest.Mock).mockReturnValue(true);
  const timing = jest.spyOn(Animated, 'timing');
  render(<SwipeHint direction="left" />);
  expect(screen.getByLabelText('I-swipe pakaliwa')).toBeTruthy();
  expect(timing).not.toHaveBeenCalled();
});
