import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ActivityScreen } from '../ActivityScreen';
import { topic11ActivityData } from '../activityData';
import {
  VIDEO_CONTROL_SAFE_BOTTOM,
  VIDEO_CONTROL_SAFE_BOTTOM_LANDSCAPE,
  VIDEO_CONTROL_SAFE_BOTTOM_MOBILE,
  VIDEO_CONTROL_SAFE_BOTTOM_TABLET,
} from '../ActivityNavigationControls';

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


jest.mock('../../../media/VideoPlayer', () => ({
  VideoPlayer: ({ onEnd }: { onEnd?: () => void }) => {
    const { Pressable, Text } = jest.requireActual('react-native');
    return <Pressable accessibilityLabel="Finish test video" onPress={onEnd}><Text>Video surface</Text></Pressable>;
  },
}));

describe('Activity lifecycle', () => {
  beforeEach(() => jest.clearAllMocks());
  it('does not substitute another topic for an unknown topic', () => {
    render(<ActivityScreen topicId="missing-topic" />);
    expect(screen.getByTestId('activity-unavailable')).toBeTruthy();
    expect(screen.queryByTestId('video-activity-card')).toBeNull();
  });
  it('requires the video end event before advancing', () => {
    render(<ActivityScreen data={topic11ActivityData} />);
    fireEvent.press(screen.getByLabelText('Ituloy ang aralin'));
    expect(screen.queryByTestId('activity-renderer-slide')).toBeNull();
    fireEvent.press(screen.getByLabelText('Finish test video'));
    fireEvent.press(screen.getByLabelText('Ituloy ang aralin'));
    expect(screen.getByTestId('activity-renderer-slide')).toBeTruthy();
  });
  it('resets step state when the supplied topic changes and tolerates empty content', () => {
    const view = render(<ActivityScreen data={topic11ActivityData} />);
    fireEvent.press(screen.getByLabelText('Finish test video'));
    fireEvent.press(screen.getByLabelText('Ituloy ang aralin'));
    view.rerender(<ActivityScreen data={{ ...topic11ActivityData, id: 'topic-new' }} />);
    expect(screen.getByTestId('video-activity-card')).toBeTruthy();
    view.rerender(<ActivityScreen data={{ ...topic11ActivityData, steps: [], slides: [], video: { title: '', source: null } }} />);
    expect(screen.getByTestId('activity-unavailable')).toBeTruthy();
  });
  it('does not reuse the first video completion for a second video', () => {
    render(<ActivityScreen data={{ ...topic11ActivityData, steps: [topic11ActivityData.steps[0], { ...topic11ActivityData.steps[0], id: 'second-video' }] }} />);
    fireEvent.press(screen.getByLabelText('Finish test video'));
    fireEvent.press(screen.getByLabelText('Ituloy ang aralin'));
    expect(screen.getByLabelText('Tapusin ang aralin').props.accessibilityState?.disabled).toBe(true);
  });
  it.each([
    [390, 844, true, false, false, false, VIDEO_CONTROL_SAFE_BOTTOM_MOBILE],
    [844, 390, true, true, false, false, VIDEO_CONTROL_SAFE_BOTTOM_LANDSCAPE],
    [768, 1024, false, false, true, false, VIDEO_CONTROL_SAFE_BOTTOM_TABLET],
    [1440, 900, false, false, false, true, VIDEO_CONTROL_SAFE_BOTTOM],
  ])('keeps video controls clear at %s x %s', (width, height, isPhone, isPhoneLandscape, isTablet, isDesktop, bottom) => {
    mockResponsiveState = { width, height, isPhone, isPhoneLandscape, isPhonePortrait: isPhone && !isPhoneLandscape, isTablet, isDesktop, isCompactHeight: height < 500 };
    render(<ActivityScreen data={topic11ActivityData} />);
    const { StyleSheet } = jest.requireActual('react-native');
    expect(StyleSheet.flatten(screen.getByTestId('activity-navigation-controls').props.style).bottom).toBe(bottom);
  });
});
