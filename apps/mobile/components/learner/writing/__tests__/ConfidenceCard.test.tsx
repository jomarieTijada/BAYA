import React from 'react';
import { Animated, Text } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { ConfidenceCard } from '../ConfidenceCard';
import { useReducedMotionPreference } from '../../../../hooks/useReducedMotionPreference';

jest.mock('../../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: jest.fn(() => false) }));
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: ({ name }: { name: string }) => {
  const { Text } = jest.requireActual('react-native');
  return <Text>{name}</Text>;
} }));

let sequence: jest.SpyInstance;
beforeEach(() => {
  (useReducedMotionPreference as jest.Mock).mockReturnValue(false);
  sequence = jest.spyOn(Animated, 'sequence').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() });
});
afterEach(() => jest.restoreAllMocks());

it('opens a guided popup beside Pagsusuri and keeps feedback mounted', () => {
  const mounts = jest.fn();
  function Feedback() { React.useEffect(mounts, []); return <Text>Saved result</Text>; }
  render(<ConfidenceCard embedded dense><Feedback /></ConfidenceCard>);
  const header = within(screen.getByTestId('writing-feedback-header'));
  expect(header.getByText("Check Results")).toBeTruthy();
  expect(header.getByText('help')).toBeTruthy();
  const button = header.getByRole('button', { name: "Help with checking" });
  expect(button.props.accessibilityState.expanded).toBe(false);
  expect(screen.queryByTestId('writing-help-popup')).toBeNull();
  fireEvent.press(button);
  expect(button.props.accessibilityState.expanded).toBe(true);
  expect(screen.getByTestId('writing-help-popup')).toBeTruthy();
  expect(screen.getByText("How Do I Earn a Star?")).toBeTruthy();
  expect(screen.queryByText(/80%/)).toBeNull();
  fireEvent.press(screen.getByTestId('writing-technical-toggle'));
  expect(screen.getByText(/first recognized character.*at least 80%/)).toBeTruthy();
  expect(screen.getByText(/80%.*not a grade for your writing/)).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Close the guide"));
  expect(screen.queryByTestId('writing-help-popup')).toBeNull();
  expect(screen.getByText('Saved result')).toBeTruthy();
  expect(mounts).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByLabelText("Help with checking"));
  expect(screen.queryByTestId('writing-technical-details')).toBeNull();
});

it('pulses once, with no replay on rerender, disclosure or preference changes', () => {
  const view = render(<ConfidenceCard />);
  expect(sequence).toHaveBeenCalledTimes(1);
  view.rerender(<ConfidenceCard dense />);
  fireEvent.press(screen.getByLabelText("Help with checking"));
  fireEvent.press(screen.getByLabelText("Close the guide"));
  (useReducedMotionPreference as jest.Mock).mockReturnValue(true);
  view.rerender(<ConfidenceCard />);
  (useReducedMotionPreference as jest.Mock).mockReturnValue(false);
  view.rerender(<ConfidenceCard />);
  expect(sequence).toHaveBeenCalledTimes(1);
});

it('stays static for reduced motion and does not pulse after help has already been used', () => {
  (useReducedMotionPreference as jest.Mock).mockReturnValue(true);
  const view = render(<ConfidenceCard />);
  expect(sequence).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText("Help with checking"));
  fireEvent.press(screen.getByLabelText("Close the guide"));
  (useReducedMotionPreference as jest.Mock).mockReturnValue(false);
  view.rerender(<ConfidenceCard />);
  expect(sequence).not.toHaveBeenCalled();
});

it('keeps help usable if animation setup fails', () => {
  sequence.mockImplementation(() => { throw new Error('animation unavailable'); });
  render(<ConfidenceCard />);
  fireEvent.press(screen.getByLabelText("Help with checking"));
  expect(screen.getByText("How Do I Earn a Star?")).toBeTruthy();
});
