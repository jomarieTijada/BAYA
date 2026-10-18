import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { WritingNavigation, type WritingActionPhase } from '../WritingNavigation';

const handlers = { onCheck: jest.fn(), onNext: jest.fn(), onRetry: jest.fn(), onBackToWriting: jest.fn() };
const defaults = { ...handlers, busy: false, canCheck: false, canEdit: true, canAdvance: false, isLast: false, compact: false };
beforeEach(() => jest.clearAllMocks());

it.each<[WritingActionPhase, boolean, string, boolean]>([
  ['ready', false, 'Suriin ang isinulat', true],
  ['ready', true, 'Suriin ang isinulat', false],
  ['checking', false, 'Suriin ang isinulat', true],
  ['retry', false, 'Ulitin ang pagsulat', false],
  ['complete', false, 'Susunod na simbolo', false],
])('has one primary action for %s (drawing=%s)', (phase, canCheck, label, disabled) => {
  render(<WritingNavigation {...defaults} phase={phase} canCheck={canCheck} busy={phase === 'checking'} canAdvance={phase === 'complete'} />);
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.getByLabelText(label).props.accessibilityState.disabled).toBe(disabled);
  expect(screen.queryByText('Bumalik')).toBeNull();
  if (phase !== 'complete') expect(screen.queryByLabelText('Susunod na simbolo')).toBeNull();
  if (phase === 'retry') {
    expect(screen.queryByLabelText('Suriin ang isinulat')).toBeNull();
    fireEvent.press(screen.getByLabelText(label));
    expect(handlers.onRetry).toHaveBeenCalledTimes(1);
  }
});

it('keeps completion stable and blocks all actions while topic persistence is pending', () => {
  render(<WritingNavigation {...defaults} phase="complete" busy canAdvance={false} canEdit={false} isLast />);
  expect(screen.queryByLabelText('Ulitin ang pagsulat')).toBeNull();
  for (const button of screen.getAllByRole('button')) {
    expect(button.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(button);
  }
  expect(handlers.onNext).not.toHaveBeenCalled();
  expect(handlers.onBackToWriting).not.toHaveBeenCalled();
});
