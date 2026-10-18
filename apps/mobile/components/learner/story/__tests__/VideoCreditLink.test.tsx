import React from 'react';
import { Alert, Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { baybayinVideoCredit } from '../../../../content/baybayinIntroduction';
import { VideoCreditLink } from '../VideoCreditLink';

it('keeps the lesson mounted and reports external-link failures', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Offline'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  render(<VideoCreditLink credit={baybayinVideoCredit} />);
  fireEvent.press(screen.getByRole('link', { name: baybayinVideoCredit.label }));
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Hindi mabuksan ang website', 'Subukan muli kapag may koneksiyon sa internet.'));
  expect(screen.getByRole('link')).toBeTruthy();
  open.mockRestore(); alert.mockRestore();
});
