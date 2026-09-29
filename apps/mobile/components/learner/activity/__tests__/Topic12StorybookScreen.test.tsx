import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ActivityScreen } from '../ActivityScreen';
import { getActivityData, topic12ActivityData } from '../activityData';

// Mock useRouter
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: { children?: React.ReactNode; style?: any }) =>
      React.createElement(View, { testID: 'safe-area-view', style }, children),
    useSafeAreaInsets: jest.fn(),
  };
});

// Dynamic Mock Responsive Hook for Multi-Viewport Testing
let mockResponsiveState = {
  isPhonePortrait: true,
  isPhoneLandscape: false,
  isPhone: true,
  isTablet: false,
  isDesktop: false,
  isCompactHeight: false,
  width: 390,
  height: 844,
};

jest.mock('../../../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => mockResponsiveState,
}));

describe('Topic 1.2 — Fullscreen Storybook Learning Screen (Paano ba gumagana ang Baybayin?)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResponsiveState = {
      isPhonePortrait: true,
      isPhoneLandscape: false,
      isPhone: true,
      isTablet: false,
      isDesktop: false,
      isCompactHeight: false,
      width: 390,
      height: 844,
    };
  });

  it('1. retrieves registered topic12ActivityData via getActivityData("topic-1-2")', () => {
    const data = getActivityData('topic-1-2');
    expect(data).toBeDefined();
    expect(data.id).toBe('topic-1-2');
    expect(data.title).toBe('Paano ba gumagana ang Baybayin?');
    expect(data.activityIndex).toBe(2);
    expect(data.steps).toHaveLength(1);
    expect(data.steps[0].type).toBe('slide');
  });

  it('2. renders Topic 1.2 with ONE SCREEN = ONE TOPIC storybook layout', () => {
    render(<ActivityScreen data={topic12ActivityData} />);

    // Header verifies Topic 2 of 3
    expect(screen.getByText('Pagkilala sa Baybayin')).toBeTruthy();
    expect(screen.getByText('Topic 2 of 3')).toBeTruthy();

    // No video activity card is mounted (pure concept/slide)
    expect(screen.queryByTestId('video-activity-card')).toBeNull();

    // Fullscreen storybook spread container is mounted
    expect(screen.getByTestId('storybook-page')).toBeTruthy();
    expect(screen.getByTestId('story-illustration-area')).toBeTruthy();
    expect(screen.getByTestId('story-content')).toBeTruthy();
  });

  it('3. reserves the left panel with a placeholder and removes unvalidated mockups', () => {
    render(<ActivityScreen data={topic12ActivityData} />);

    expect(screen.getByText('Add Image Here')).toBeTruthy();
    expect(screen.getByTestId('story-image-placeholder')).toBeTruthy();
    expect(screen.queryByTestId('bamboo-illustration-area')).toBeNull();
    expect(screen.queryByText('PAANO GUMAGANA ANG TUNOG')).toBeNull();
    expect(screen.queryByText('ALPABETO')).toBeNull();
    expect(screen.queryByText('Iba pang halimbawa:')).toBeNull();
  });
  it('4. renders Right Panel: Story content begins with its title, lead narration, and keywords', () => {
    render(<ActivityScreen data={topic12ActivityData} />);

    // Topic identity belongs in the header, not as a repeated body badge.
    expect(screen.queryByText('KASAYSAYAN AT KAHALAGAHAN')).toBeNull();

    // Big Storybook Title
    expect(screen.getByText('Paano ba gumagana ang Baybayin?')).toBeTruthy();

    // Opening Emphasized Lead
    expect(
      screen.getByText('Ang Baybayin ay hindi alpabeto, isa itong SILABARYO.')
    ).toBeTruthy();

    // Body narration text
    expect(screen.getByText(/Alam mo ba\? Ang Baybayin ay hindi tulad ng ating alpabeto/)).toBeTruthy();
    expect(screen.getByText(/bawat isang simbolo tulad ng ᜊ ay buo na/)).toBeTruthy();
  });

  it('5. renders BAYA mascot learning guide and speech bubble with custom line without "Sabi ni BAYA"', () => {
    render(<ActivityScreen data={topic12ActivityData} />);

    // BAYA mascot half-body guide
    expect(screen.getByTestId('baya-mascot')).toBeTruthy();

    // Speech bubble with takeaway line
    expect(screen.getByTestId('story-highlight')).toBeTruthy();
    expect(screen.getByText(/Basa tayo ng pantig, hindi paisa-isang letra!/)).toBeTruthy();

    // Strictly NO "Sabi ni BAYA" label
    expect(screen.queryByText(/Sabi ni BAYA/i)).toBeNull();
  });

  it('6. provides functional navigation: circular back exits/steps, circular next completes topic', () => {
    const handleBack = jest.fn();
    const handleComplete = jest.fn();

    render(
      <ActivityScreen
        data={topic12ActivityData}
        onBack={handleBack}
        onComplete={handleComplete}
      />
    );

    // Floating circular Back button (bottom-left) is present
    const backBtn = screen.getByLabelText('Nakaraang hakbang');
    expect(backBtn).toBeTruthy();
    fireEvent.press(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);

    // Floating circular Next button (bottom-right) has checkmark for completion
    const completeBtn = screen.getByLabelText('Tapusin ang aralin');
    expect(completeBtn).toBeTruthy();
    fireEvent.press(completeBtn);
    expect(handleComplete).toHaveBeenCalledTimes(1);
  });
});

