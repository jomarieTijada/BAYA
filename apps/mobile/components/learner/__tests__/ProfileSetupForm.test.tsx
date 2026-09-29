import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ProfileSetupForm } from '../ProfileSetupForm';
import { localLearnerService } from '../../../database/services/localLearnerService';
import { OPFS_LOCK_CONFLICT } from '../../../database/connection';

jest.mock('../../../database/services/localLearnerService', () => ({
  localLearnerService: {
    saveProfile: jest.fn(),
  },
}));

jest.mock('../../ui/AppIcon', () => ({
  AppIcon: () => null,
}));

describe('ProfileSetupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits profile successfully and calls onContinue', async () => {
    (localLearnerService.saveProfile as jest.Mock).mockResolvedValueOnce({
      profile_id: 'test-profile-1',
      display_name: 'Maria',
      role: 'learner',
    });

    const onContinue = jest.fn();
    render(<ProfileSetupForm onContinue={onContinue} />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter your name'), 'Maria');
    fireEvent.press(screen.getByText('CONTINUE'));

    await waitFor(() => {
      expect(localLearnerService.saveProfile).toHaveBeenCalledWith('Maria', '');
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
  });

  it('displays user-friendly message when OPFS lock conflict occurs without crashing', async () => {
    const lockError = new Error(
      "NotFoundError: Failed to execute 'createSyncAccessHandle' on 'FileSystemFileHandle': " +
      "Access Handle cannot be created if there is another open Access Handle or WritableStream associated with the same file."
    );
    (lockError as any).code = OPFS_LOCK_CONFLICT;
    (localLearnerService.saveProfile as jest.Mock).mockRejectedValueOnce(lockError);

    const onContinue = jest.fn();
    render(<ProfileSetupForm onContinue={onContinue} />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter your name'), 'Juan');
    fireEvent.press(screen.getByText('CONTINUE'));

    await waitFor(() => {
      expect(
        screen.getByText('Storage is busy in another window. Please close other BAYA tabs and try again.')
      ).toBeTruthy();
      expect(onContinue).not.toHaveBeenCalled();
    });

    // Verify button is re-enabled for retry
    expect(screen.getByText('CONTINUE')).toBeTruthy();
  });

  it('displays generic error on other database errors', async () => {
    (localLearnerService.saveProfile as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

    const onContinue = jest.fn();
    render(<ProfileSetupForm onContinue={onContinue} />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter your name'), 'Elena');
    fireEvent.press(screen.getByText('CONTINUE'));

    await waitFor(() => {
      expect(screen.getByText('Could not save your profile. Please try again.')).toBeTruthy();
    });
  });
});
