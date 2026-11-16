import React from 'react';
import { Modal, View } from 'react-native';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { WritingHelpGuide, type WritingGuideTargets } from '../WritingHelpGuide';
import { placeWritingGuide } from '../writingGuideLayout';

it('guides in order, highlights real targets, and illustrates an unavailable action without invoking it', async () => {
  const onClose = jest.fn();
  const measure = jest.fn((done: (x: number, y: number, w: number, h: number) => void) => done(20, 30, 100, 100));
  const ref = { current: { measureInWindow: measure } as unknown as View };
  const targets: WritingGuideTargets = { reference: ref, canvas: ref, stars: ref, action: ref };
  render(<WritingHelpGuide phase="ready" targets={targets} onClose={onClose} />);
  await waitFor(() => expect(screen.getByTestId('writing-guide-highlight-reference', { includeHiddenElements: true })).toBeTruthy());
  expect(screen.getByText("Look at the character you will write!")).toBeTruthy();
  fireEvent.press(screen.getByText("Next Guide"));
  await waitFor(() => expect(screen.getByTestId('writing-guide-highlight-canvas', { includeHiddenElements: true })).toBeTruthy());
  fireEvent.press(screen.getByText("Next Guide"));
  await waitFor(() => expect(screen.getByTestId('writing-guide-highlight-action', { includeHiddenElements: true })).toBeTruthy());
  fireEvent.press(screen.getByText("Next Guide"));
  await waitFor(() => expect(screen.getByTestId('writing-guide-highlight-stars', { includeHiddenElements: true })).toBeTruthy());
  fireEvent.press(screen.getByText("Next Guide"));
  expect(screen.queryByTestId('writing-guide-highlight-action', { includeHiddenElements: true })).toBeNull();
  expect(screen.getByTestId('writing-guide-illustration')).toBeTruthy();
  expect(within(screen.getByTestId('writing-guide-illustration')).getByText("Next")).toBeTruthy();
  fireEvent.press(screen.getByText("Back"));
  expect(screen.getByText("Guide 4 of 5")).toBeTruthy();
  fireEvent.press(screen.getByText("Next Guide"));
  fireEvent.press(screen.getByText("Done"));
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByLabelText("Close the guide"));
  screen.UNSAFE_getByType(Modal).props.onRequestClose();
  expect(onClose).toHaveBeenCalledTimes(3);
});

it('keeps a popup within safe bounds and avoids a target when room is available', () => {
  const insets = { top: 20, right: 10, left: 10, bottom: 20 };
  const target = { x: 900, y: 50, width: 350, height: 500 };
  const result = placeWritingGuide(1366, 768, 370, 300, insets, target);
  expect(result.x + 370).toBeLessThan(target.x);
  expect(result.y).toBeGreaterThanOrEqual(20);
  expect(result.y + 300).toBeLessThanOrEqual(748);
});
