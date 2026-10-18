import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
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
  expect(screen.getByText('Magsulat na!')).toBeTruthy();
});
it('preserves accepted/rejected feedback and raw probabilities with the same bubble treatment', () => {
  const prediction = { classIndex: 0, label: 'A', probability: .92 };
  const view = render(<BayaWritingGuide recognition={{ status: 'success', predictions: [prediction] }} targetClass="A" mascotSize={64} dense />);
  expect(screen.getByText('Mahusay!')).toBeTruthy();
  expect(screen.getByText('92.0%')).toBeTruthy();
  view.rerender(<BayaWritingGuide recognition={{ status: 'success', predictions: [{ ...prediction, probability: .79 }] }} targetClass="A" mascotSize={64} dense />);
  expect(screen.getByText('Malapit na!')).toBeTruthy();
  expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe(SpeechBubbleColors.border);
  view.rerender(<BayaWritingGuide recognition={{ status: 'error' }} targetClass="A" mascotSize={64} dense />);
  const message = screen.getByText('Hindi masuri ni BAYA ang sulat. Subukan muli.');
  expect(message.props.numberOfLines).toBeUndefined();
});
