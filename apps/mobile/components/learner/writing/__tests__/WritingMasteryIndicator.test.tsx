import React from 'react';
import { Animated, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { WritingMasteryIndicator } from '../WritingMasteryIndicator';
import { useReducedMotionPreference } from '../../../../hooks/useReducedMotionPreference';

jest.mock('../../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: jest.fn(() => false) }));
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: ({ name }: { name: string }) => {
  const { Text } = jest.requireActual('react-native');
  return <Text>{name}</Text>;
} }));

describe('writing achievement stars', () => {
  let spring: jest.SpyInstance;
  let timing: jest.SpyInstance;
  beforeEach(() => {
    (useReducedMotionPreference as jest.Mock).mockReturnValue(false);
    const animation = () => ({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() });
    jest.spyOn(Animated, 'sequence').mockImplementation(animation);
    jest.spyOn(Animated, 'parallel').mockImplementation(animation);
    timing = jest.spyOn(Animated, 'timing').mockImplementation(animation);
    spring = jest.spyOn(Animated, 'spring').mockImplementation(animation);
  });
  afterEach(() => jest.restoreAllMocks());
  it('breathes only the next outlined star, removes visible fractions, and celebrates actual increases', () => {
    const view = render(<WritingMasteryIndicator count={0} />);
    expect(screen.getAllByText('starOutline')).toHaveLength(2);
    expect(screen.queryByText(/\d\/2/)).toBeNull();
    expect(timing.mock.calls.filter(call => call[1].toValue === 1.04)).toHaveLength(1);
    expect(spring).not.toHaveBeenCalled();
    const idleCalls = timing.mock.calls.length;
    view.rerender(<WritingMasteryIndicator count={0} />);
    expect(timing).toHaveBeenCalledTimes(idleCalls);
    view.rerender(<WritingMasteryIndicator count={1} />);
    expect(screen.getByTestId('writing-milestone-1-complete')).toBeTruthy();
    expect(screen.getByTestId('writing-milestone-2-pending')).toBeTruthy();
    expect(spring).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
    view.rerender(<WritingMasteryIndicator count={1} />);
    expect(spring).toHaveBeenCalledTimes(1);
    view.rerender(<WritingMasteryIndicator count={2} />);
    expect(screen.getAllByText('check')).toHaveLength(2);
    expect(screen.getAllByText('star')).toHaveLength(2);
    expect(spring).toHaveBeenCalledTimes(2);
    expect(timing.mock.calls.some(call => call[1].toValue === 1.16)).toBe(true);
    view.rerender(<WritingMasteryIndicator count={2} compact />);
    expect(spring).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/\d\/2/)).toBeNull();
  });
  it('does not celebrate restored state or a character reset', () => {
    const view = render(<View><WritingMasteryIndicator key="a" count={2} /></View>);
    expect(spring).not.toHaveBeenCalled();
    view.rerender(<View><WritingMasteryIndicator key="e" count={0} /></View>);
    expect(screen.getAllByText('starOutline')).toHaveLength(2);
    expect(spring).not.toHaveBeenCalled();
  });
  it('honors reduced motion without replaying success when preference changes', () => {
    (useReducedMotionPreference as jest.Mock).mockReturnValue(true);
    const view = render(<WritingMasteryIndicator count={0} />);
    view.rerender(<WritingMasteryIndicator count={1} />);
    expect(timing).not.toHaveBeenCalled();
    expect(spring).not.toHaveBeenCalled();
    (useReducedMotionPreference as jest.Mock).mockReturnValue(false);
    view.rerender(<WritingMasteryIndicator count={1} />);
    expect(spring).not.toHaveBeenCalled();
  });
  it('keeps static earned states when animation setup fails', () => {
    timing.mockImplementation(() => { throw Error('animation unavailable'); });
    const view = render(<WritingMasteryIndicator count={0} />);
    expect(() => view.rerender(<WritingMasteryIndicator count={2} />)).not.toThrow();
    expect(screen.getAllByText('check')).toHaveLength(2);
  });
});
