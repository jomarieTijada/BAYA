import { presentTopPrediction } from '../recognitionPresentation';
import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BayaWritingGuide } from '../BayaWritingGuide';
import { StorySpeechBubble } from '../../story/StorySpeechBubble';
import { SpeechBubbleColors } from '../../../ui/speechBubbleStyles';
jest.mock('../../../branding/BayaMascot', () => ({ BayaMascot: () => null }));
it('shares the lesson paper, border, radius and shadow while pointing to the mascot below', () => {
  render(<><StorySpeechBubble takeawayText="Aralin" compact={false} effectiveLandscape={false} isDesktop={false} isTablet={false} stackGuide={false} /><BayaWritingGuide recognition={{ status: 'idle' }} targetClass="A" mascotSize={80} /></>);
  const lesson = StyleSheet.flatten(screen.getByTestId('story-speech-bubble').props.style);
  const writing = StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style);
  for (const key of ['backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'shadowColor', 'shadowOpacity', 'elevation']) expect(writing[key]).toEqual(lesson[key]);
  expect(writing.backgroundColor).toBe(SpeechBubbleColors.paper);
  expect(screen.getByTestId('speech-tail-bottom', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.getByTestId('speech-tail-right', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.getByText("Let's write!")).toBeTruthy();
});
it('preserves accepted/rejected feedback and raw probabilities with the same bubble treatment', () => {
  const prediction = { classIndex: 0, label: 'A', probability: .92 };
  const view = render(<BayaWritingGuide recognition={{ status: 'success', prediction: presentTopPrediction(prediction) }} targetClass="A" mascotSize={64} dense />);
  expect(screen.getByText("Great!")).toBeTruthy();
  expect(screen.queryByTestId("baya-predicted-glyph")).toBeNull();
  expect(screen.getByText('92.0%')).toBeTruthy();
  view.rerender(<BayaWritingGuide recognition={{ status: 'success', prediction: presentTopPrediction({ ...prediction, probability: .79 }) }} targetClass="A" mascotSize={64} dense />);
  expect(screen.getByText("Almost there!")).toBeTruthy();
  expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe(SpeechBubbleColors.border);
  view.rerender(<BayaWritingGuide recognition={{ status: 'error' }} targetClass="A" mascotSize={64} dense />);
  const message = screen.getByText("BAYA couldn't check your writing. Try again.");
  expect(message.props.numberOfLines).toBeUndefined();
});

it('fits the mascot below a result bubble within the space reserved beneath the stars', async () => {
  render(<BayaWritingGuide fillHeight recognition={{ status: 'success', prediction: presentTopPrediction({ classIndex: 0, label: 'A', probability: .99 }) }} targetClass="A" mascotSize={180} dense />);
  fireEvent(screen.getByTestId('baya-writing-guide'), 'layout', { nativeEvent: { layout: { width: 160, height: 120 } } });
  fireEvent(screen.getByTestId('baya-result-bubble'), 'layout', { nativeEvent: { layout: { width: 160, height: 60 } } });
  await act(async () => {});
  const mascot = StyleSheet.flatten(screen.getByTestId('baya-writing-mascot').props.style);
  expect(mascot.height + 60 + 16).toBeLessThanOrEqual(120);
  expect(screen.queryByTestId('baya-predicted-glyph')).toBeNull();
});
