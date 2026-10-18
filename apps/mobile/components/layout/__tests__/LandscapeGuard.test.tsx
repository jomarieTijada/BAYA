import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { LandscapeGuard } from '../LandscapeGuard';

let mockDimensions = { width: 844, height: 390, scale: 1, fontScale: 1 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true, default: () => mockDimensions,
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.mock('../../ui/AppIcon', () => ({ AppIcon: () => null }));

it('keeps the same child state across portrait and landscape', () => {
  let mounts = 0;
  function Lesson() {
    const [count, setCount] = useState(() => { mounts++; return 0; });
    return <Pressable accessibilityLabel="Saved success" onPress={() => setCount(count + 1)}><Text>{count} saved</Text></Pressable>;
  }
  const view = render(<LandscapeGuard><Lesson /></LandscapeGuard>);
  fireEvent.press(screen.getByLabelText('Saved success'));
  mockDimensions = { ...mockDimensions, width: 390, height: 844 };
  view.rerender(<LandscapeGuard><Lesson /></LandscapeGuard>);
  expect(screen.getByTestId('landscape-orientation-guard')).toBeTruthy();
  mockDimensions = { ...mockDimensions, width: 844, height: 390 };
  view.rerender(<LandscapeGuard><Lesson /></LandscapeGuard>);
  expect(screen.queryByTestId('landscape-orientation-guard')).toBeNull();
  expect(screen.getByText('1 saved')).toBeTruthy();
  expect(mounts).toBe(1);
});
