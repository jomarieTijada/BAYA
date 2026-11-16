import { translateText } from '../../../../localization/core';
import React from 'react';
import { Alert, Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { baybayinVideoCredit } from '../../../../content/baybayinIntroduction';
import { VideoCreditLink } from '../VideoCreditLink';
const english = (source: string) => translateText('en', source);

it('keeps the lesson mounted and reports external-link failures', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Offline'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  render(<VideoCreditLink credit={baybayinVideoCredit} />);
  fireEvent.press(screen.getByRole('link', { name: english(baybayinVideoCredit.label) }));
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Unable to open the website', 'Try again when connected to the internet.'));
  expect(screen.getByRole('link')).toBeTruthy();
  open.mockRestore(); alert.mockRestore();
});
