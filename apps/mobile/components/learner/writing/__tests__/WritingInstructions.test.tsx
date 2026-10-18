import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { WritingInstructions } from '../WritingInstructions';
import { BAYA_WRITING_MASTERY_POLICY } from '../../../../content/writingMastery';

it('derives the child-friendly goal from the policy and follows accepted state only', () => {
  const required = BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts;
  const view = render(<WritingInstructions count={0} />);
  expect(screen.getByText('Isulat ang simbolo at makakuha ng bituin!')).toBeTruthy();
  expect(screen.queryByText(/80%/)).toBeNull();
  view.rerender(<WritingInstructions count={1} />);
  expect(screen.getByText('Magaling! Isa pa para makapagpatuloy!')).toBeTruthy();
  view.rerender(<WritingInstructions count={1} unsuccessful />);
  expect(screen.getByText('Subukan muli! Isulat ulit ang simbolo.')).toBeTruthy();
  view.rerender(<WritingInstructions count={required} />);
  expect(screen.getByText('Mahusay! Maaari ka nang magpatuloy!')).toBeTruthy();
});

it('keeps help and technical explanations out of the canvas instructions', () => {
  render(<WritingInstructions count={0} compact />);
  expect(screen.queryByTestId('writing-help-toggle')).toBeNull();
  expect(screen.queryByText(/paliwanag|80%|Paano/)).toBeNull();
});