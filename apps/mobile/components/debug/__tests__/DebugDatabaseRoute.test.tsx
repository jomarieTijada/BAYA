import React from 'react';
import { cleanup, render, screen } from '@testing-library/react-native';
import DebugDatabaseRoute from '../../../app/debug/database';
import DatabaseInspector from '../DatabaseInspector';

jest.mock('../DatabaseInspector', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const originalFlag = process.env.EXPO_PUBLIC_ENABLE_DB_INSPECTOR;

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  if (originalFlag === undefined) {
    delete process.env.EXPO_PUBLIC_ENABLE_DB_INSPECTOR;
  } else {
    process.env.EXPO_PUBLIC_ENABLE_DB_INSPECTOR = originalFlag;
  }
});

it.each([undefined, '', 'false', 'TRUE', '1'])('keeps the inspector disabled for %s', (value) => {
  if (value === undefined) {
    delete process.env.EXPO_PUBLIC_ENABLE_DB_INSPECTOR;
  } else {
    process.env.EXPO_PUBLIC_ENABLE_DB_INSPECTOR = value;
  }

  render(<DebugDatabaseRoute />);

  expect(screen.getByText('Database Inspector Disabled')).toBeTruthy();
  expect(DatabaseInspector).not.toHaveBeenCalled();
});

it('renders the inspector only when explicitly enabled', () => {
  process.env.EXPO_PUBLIC_ENABLE_DB_INSPECTOR = 'true';

  render(<DebugDatabaseRoute />);

  expect(screen.queryByText('Database Inspector Disabled')).toBeNull();
  expect(DatabaseInspector).toHaveBeenCalledTimes(1);
});
