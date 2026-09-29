import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { DashboardCards } from '../DashboardCards';
import { LearnerHeader } from '../LearnerHeader';
import { learnerHomeDemo } from '../learnerHomeDemo';

let mockViewport = { width: 390, height: 844 };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    dismissTo: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('../../../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => {
    const { height, width } = mockViewport;
    const isPhone = Math.min(width, height) < 600;
    return {
      height,
      width,
      isCompactHeight: height < 650,
      isPhone,
      isPhoneLandscape: isPhone && width > height,
      isPhonePortrait: isPhone && width <= height,
    };
  },
}));
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));

const noOpRewards = jest.fn();
const noOpLessons = jest.fn();

function renderDashboard() {
  return render(
    <DashboardCards
      adventure={learnerHomeDemo.adventure}
      dailyGoal={learnerHomeDemo.dailyGoal}
      onGoToLessons={noOpLessons}
      onViewRewards={noOpRewards}
      recentAchievement={learnerHomeDemo.recentAchievement}
    />
  );
}

function renderHeader() {
  return render(
    <LearnerHeader
      learner={learnerHomeDemo.learner}
      onOpenSettings={jest.fn()}
    />
  );
}

describe('Learner Home — English copy consistency', () => {
  const viewports = [360, 390, 430, 768, 1024, 1366, 1440];

  beforeEach(() => {
    jest.clearAllMocks();
    mockViewport = { width: 390, height: 844 };
  });

  // ── DashboardCards ──────────────────────────────────────────────────────────

  describe('DashboardCards', () => {
    it.each(viewports)('shows English button labels at %ipx — no Filipino', (width) => {
      mockViewport = { width, height: width < 600 ? 844 : 900 };
      const view = renderDashboard();

      // English labels that MUST appear
      expect(screen.getByText('Lessons')).toBeTruthy();
      expect(screen.getByText('Locked')).toBeTruthy();
      expect(screen.getByText('None Yet')).toBeTruthy();

      // Filipino labels that must NOT appear
      const text = view.toJSON();
      const allText = JSON.stringify(text);
      expect(allText).not.toContain('Mga Aralin');
      expect(allText).not.toContain('Naka-lock');
      expect(allText).not.toContain('Wala Pa');
      expect(allText).not.toContain('Mga Gantimpala');
      expect(allText).not.toContain('Wala pang gantimpala');
      expect(allText).not.toContain('Pumunta sa mga aralin');
      expect(allText).not.toContain('Naka-lock ang pakikipagsapalaran');
      expect(allText).not.toContain('Tingnan ang mga gantimpala');

      view.unmount();
    });

    it('shows "None Yet" when there is no achievement', () => {
      renderDashboard(); // learnerHomeDemo has recentAchievement: null
      expect(screen.getByText('None Yet')).toBeTruthy();
    });

    it('shows "Rewards" and enables button when there is an achievement', () => {
      render(
        <DashboardCards
          adventure={learnerHomeDemo.adventure}
          dailyGoal={learnerHomeDemo.dailyGoal}
          onGoToLessons={noOpLessons}
          onViewRewards={noOpRewards}
          recentAchievement={{ title: 'First Steps', description: 'Completed your first lesson.' }}
        />
      );
      expect(screen.getByText('Rewards')).toBeTruthy();
    });
  });

  // ── LearnerHeader ────────────────────────────────────────────────────────────

  describe('LearnerHeader', () => {
    it.each(viewports)('shows English workspace link and settings label at %ipx', (width) => {
      mockViewport = { width, height: width < 600 ? 844 : 900 };
      const view = renderHeader();

      expect(screen.getByLabelText('Join Workspace')).toBeTruthy();
      expect(screen.getByText('Join Workspace')).toBeTruthy();
      expect(screen.getByLabelText('Settings')).toBeTruthy();

      const allText = JSON.stringify(view.toJSON());
      expect(allText).not.toContain('Sumali sa Workspace');
      expect(allText).not.toContain('Mga Setting');

      view.unmount();
    });
  });
});
