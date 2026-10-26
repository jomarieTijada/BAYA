import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { RolePlaceholderScreen } from '../RolePlaceholderScreen';
import { useRouter } from 'expo-router';

// 1. Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// 2. Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: ({ children, style }: any) =>
      React.createElement(View, { testID: 'safe-area-view', style }, children),
  };
});

// 3. Mock AppButton with the correct two-level relative path
jest.mock('../../ui/AppButton', () => {
  const React = jest.requireActual('react');
  const { TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    AppButton: (props: any) =>
      React.createElement(
        TouchableOpacity,
        {
          testID: 'mock-app-button',
          accessibilityLabel: props.accessibilityLabel,
          onPress: props.onPress,
          accessibilityHint: JSON.stringify({
            compact: props.compact,
            fullWidth: props.fullWidth,
            icon: props.icon,
            iconPosition: props.iconPosition,
            label: props.label,
          }),
        },
        React.createElement(Text, null, props.label)
      ),
  };
});

describe('RolePlaceholderScreen (White-Box Suite)', () => {
  const mockUseRouter = useRouter as jest.Mock;
  const mockBack = jest.fn();
  const mockReplace = jest.fn();
  const mockCanGoBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      back: mockBack,
      replace: mockReplace,
      canGoBack: mockCanGoBack,
    });
  });

  // --- BRANCH 1: Learner Role + canGoBack() === true ---
  it('Branch: renders Learner content and navigates back when canGoBack is true', () => {
    mockCanGoBack.mockReturnValue(true);

    render(<RolePlaceholderScreen role="Learner" />);

    expect(screen.getByText('LEARNER AREA')).toBeTruthy();
    expect(screen.getByText('Learner application coming next.')).toBeTruthy();
    expect(
      screen.getByText(
        'This route is ready. The full learner experience will be added in a future step.'
      )
    ).toBeTruthy();

    const button = screen.getByTestId('mock-app-button');
    const buttonProps = JSON.parse(button.props.accessibilityHint);
    expect(button.props.accessibilityLabel).toBe('Return to role selection');
    expect(buttonProps).toEqual({
      compact: true,
      fullWidth: false,
      icon: 'back',
      iconPosition: 'leading',
      label: 'BACK TO BAYA',
    });

    fireEvent.press(button);

    expect(mockCanGoBack).toHaveBeenCalledTimes(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // --- BRANCH 2: Mentor Role + canGoBack() === false ---
  it('Branch: renders Mentor content and replaces route with root when canGoBack is false', () => {
    mockCanGoBack.mockReturnValue(false);

    render(<RolePlaceholderScreen role="Mentor" />);

    expect(screen.getByText('MENTOR AREA')).toBeTruthy();
    expect(screen.getByText('Mentor application coming next.')).toBeTruthy();
    expect(
      screen.getByText(
        'This route is ready. The full mentor experience will be added in a future step.'
      )
    ).toBeTruthy();

    const button = screen.getByTestId('mock-app-button');
    fireEvent.press(button);

    expect(mockCanGoBack).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
