import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { LandingHero } from '../LandingHero';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 1. Mock Responsive Hook & Safe Area Context
jest.mock('../../../hooks/useResponsiveLayout');
jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    SafeAreaView: ({ children, edges, style }: { children?: React.ReactNode; edges?: string[]; style?: any }) =>
      React.createElement(
        View,
        { testID: 'safe-area-view', accessibilityLabel: JSON.stringify(edges), style },
        children
      ),
    useSafeAreaInsets: jest.fn(),
  };
});

// 2. Mock Brand Components
jest.mock('../../branding/BayaLogo', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    BayaLogo: ({ size }: { size: number }) =>
      React.createElement(View, { testID: 'baya-logo' }, React.createElement(Text, null, `LogoSize:${size}`)),
  };
});

jest.mock('../../branding/BayaMascot', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    BayaMascot: ({ size, state }: { size: number; state: string }) =>
      React.createElement(
        View,
        { testID: 'baya-mascot' },
        React.createElement(Text, null, `MascotSize:${Math.round(size)},State:${state}`)
      ),
  };
});

// 3. Mock RoleSelector Component
jest.mock('../RoleSelector', () => {
  const React = jest.requireActual('react');
  const { View, TouchableOpacity, Text } = jest.requireActual('react-native');
  return {
    RoleSelector: ({ compact, onLearnerPress, onMentorPress }: any) =>
      React.createElement(
        View,
        { testID: 'role-selector' },
        React.createElement(Text, null, `Compact:${compact}`),
        React.createElement(TouchableOpacity, { testID: 'btn-learner', onPress: onLearnerPress }),
        React.createElement(TouchableOpacity, { testID: 'btn-mentor', onPress: onMentorPress })
      ),
  };
});

describe('LandingHero (White-Box Suite)', () => {
  const mockUseResponsiveLayout = useResponsiveLayout as jest.Mock;
  const mockUseSafeAreaInsets = useSafeAreaInsets as jest.Mock;

  const defaultProps = {
    onLearnerPress: jest.fn(),
    onMentorPress: jest.fn(),
  };

  const defaultLayout = {
    height: 800,
    width: 390,
    isCompactHeight: false,
    isDesktop: false,
    isPhone: true,
    isPhoneLandscape: false,
    isPhonePortrait: true,
    isTablet: false,
    isTabletLandscape: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSafeAreaInsets.mockReturnValue({ top: 40, bottom: 20, left: 0, right: 0 });
  });

  // --- BRANCH 1: Phone Portrait (Small width < 360) ---
  it('Branch: renders stacked layout for Phone Portrait with width < 360', () => {
    mockUseResponsiveLayout.mockReturnValue({
      ...defaultLayout,
      width: 320,
      height: 600,
      isPhonePortrait: true,
    });

    render(<LandingHero {...defaultProps} />);

    expect(screen.getByText('LogoSize:52')).toBeTruthy();
    expect(screen.getByText('MascotSize:204,State:ambient')).toBeTruthy();
    expect(screen.getByText('Compact:true')).toBeTruthy();
    expect(screen.getByTestId('safe-area-view').props.accessibilityLabel).toContain('top');
  });

  // --- BRANCH 2: Phone Portrait (Standard width >= 360) ---
  it('Branch: evaluates logo size 60 for Phone Portrait with width >= 360', () => {
    mockUseResponsiveLayout.mockReturnValue({
      ...defaultLayout,
      width: 390,
      height: 844,
      isPhonePortrait: true,
    });

    render(<LandingHero {...defaultProps} />);

    expect(screen.getByText('LogoSize:60')).toBeTruthy();
  });

  // --- BRANCH 3: Phone Landscape ---
  it('Branch: renders wide layout and omits top edge in Phone Landscape', () => {
    mockUseResponsiveLayout.mockReturnValue({
      ...defaultLayout,
      width: 844,
      height: 390,
      isPhone: true,
      isPhoneLandscape: true,
      isPhonePortrait: false,
    });

    render(<LandingHero {...defaultProps} />);

    const edges = screen.getByTestId('safe-area-view').props.accessibilityLabel;
    expect(screen.getByText("Mabuhay! Let's learn Baybayin together!")).toBeTruthy();
    expect(edges).toEqual(JSON.stringify(['left', 'right', 'bottom']));
    expect(screen.getByText('LogoSize:66')).toBeTruthy();
    expect(screen.getByText('MascotSize:300,State:ambient')).toBeTruthy();
    expect(screen.getByText('Compact:true')).toBeTruthy();
  });

  // --- BRANCH 4: Desktop Wide Layout ---
  it('Branch: renders wide desktop layout with uncompact controls and 820 cap', () => {
    mockUseResponsiveLayout.mockReturnValue({
      ...defaultLayout,
      width: 1440,
      height: 900,
      isDesktop: true,
      isPhone: false,
      isPhoneLandscape: false,
      isPhonePortrait: false,
      isCompactHeight: false,
    });

    render(<LandingHero {...defaultProps} />);

    expect(screen.getByText(/LogoSize:(100\.8|101)/)).toBeTruthy();
    expect(screen.getByText('MascotSize:749,State:ambient')).toBeTruthy();
    expect(screen.getByText('Compact:false')).toBeTruthy();
  });

  // --- BRANCH 5: Tablet Landscape ---
  it('Branch: uses 500 cap for Tablet Landscape mascot sizing', () => {
    mockUseResponsiveLayout.mockReturnValue({
      ...defaultLayout,
      width: 1200,
      height: 800,
      isTablet: true,
      isTabletLandscape: true,
      isPhone: false,
      isPhonePortrait: false,
    });

    render(<LandingHero {...defaultProps} />);

    expect(screen.getByText('MascotSize:500,State:ambient')).toBeTruthy();
  });

  // --- BRANCH 6: Stacked Tablet Portrait Fallback ---
  it('Branch: uses 390 cap and size 76 logo for stacked non-phone layout', () => {
    mockUseResponsiveLayout.mockReturnValue({
      ...defaultLayout,
      width: 768,
      height: 1024,
      isTablet: true,
      isPhone: false,
      isPhonePortrait: false,
      isPhoneLandscape: false,
      isTabletLandscape: false,
      isDesktop: false,
    });

    render(<LandingHero {...defaultProps} />);

    expect(screen.getByText('LogoSize:76')).toBeTruthy();
    expect(screen.getByText('MascotSize:390,State:ambient')).toBeTruthy();
  });

  // --- BRANCH 7: Event Delegation ---
  it('delegates learner and mentor button presses to prop handlers', () => {
    mockUseResponsiveLayout.mockReturnValue(defaultLayout);

    render(<LandingHero {...defaultProps} />);

    fireEvent.press(screen.getByTestId('btn-learner'));
    expect(defaultProps.onLearnerPress).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId('btn-mentor'));
    expect(defaultProps.onMentorPress).toHaveBeenCalledTimes(1);
  });
});
