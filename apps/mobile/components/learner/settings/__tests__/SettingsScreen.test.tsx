import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, StyleSheet } from 'react-native';

import { BackButton } from '../../../ui/BackButton';
import { ConnectionStatusBadge } from '../ConnectionStatusBadge';
import { SettingsScreen } from '../SettingsScreen';
import { WorkspaceSyncCard } from '../WorkspaceSyncCard';
import { SETTINGS_COPY } from '../settingsCopy';
import { connectedWorkspaceInfo } from '../workspaceSettingsData';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockViewport = { width: 390, height: 844 };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: () => true,
    dismissTo: jest.fn(),
    replace: mockReplace,
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

function visibleText(node: ReturnType<typeof render>['toJSON'] extends () => infer T ? T : never): string[] {
  const values: string[] = [];
  const walk = (item: any) => {
    if (Array.isArray(item)) item.forEach(walk);
    else if (typeof item === 'string') values.push(item);
    else if (item?.children) item.children.forEach(walk);
  };
  walk(node);
  return values;
}

describe('unified learner Settings screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockViewport = { width: 390, height: 844 };
  });

  const viewports = [360, 390, 430, 768, 1024, 1280, 1366, 1440, 1920];

  it.each(viewports)('uses the same header, card, status, action, and English copy at %ipx', (width) => {
    mockViewport = { width, height: width < 600 ? 844 : width < 1100 ? 1024 : 900 };
    const view = render(<SettingsScreen />);

    expect(screen.UNSAFE_getByType(BackButton)).toBeTruthy();
    expect(screen.UNSAFE_getByType(WorkspaceSyncCard)).toBeTruthy();
    expect(screen.UNSAFE_getByType(ConnectionStatusBadge)).toBeTruthy();
    expect(screen.getAllByTestId('settings-header')).toHaveLength(1);
    expect(screen.getAllByTestId('workspace-sync-card')).toHaveLength(1);
    expect(screen.getAllByTestId('workspace-status-pill')).toHaveLength(1);
    expect(screen.getByLabelText('Back')).toBeTruthy();
    expect(screen.getByText(SETTINGS_COPY.disconnected)).toBeTruthy();
    expect(screen.getByLabelText(SETTINGS_COPY.joinAccessibility)).toBeTruthy();

    const text = visibleText(view.toJSON()).join(' ');
    for (const copy of [
      SETTINGS_COPY.title,
      SETTINGS_COPY.workspaceTitle,
      SETTINGS_COPY.workspaceSubtitle,
      SETTINGS_COPY.independentHeadline,
      SETTINGS_COPY.independentDescription,
      SETTINGS_COPY.joinWorkspace,
      SETTINGS_COPY.independentFooter,
    ]) expect(text).toContain(copy);
    for (const removed of [
      'Workspace & Sync',
      'Workspace progress tracker',
      'You are currently learning independently.',
      'Join a workspace to synchronize your learning progress with a mentor.',
      'Your progress will link seamlessly upon joining a mentor\'s workspace code.',
      'Aking Workspace',
      'Progreso sa pag-aaral',
      'Walang Koneksyon',
      'Nag-aaral ka nang mag-isa.',
      'Sumali sa workspace upang maibahagi ang iyong progreso sa tagapayo.',
      'SUMALI SA WORKSPACE',
      'Maiuugnay ang iyong progreso kapag sumali ka gamit ang code ng workspace ng tagapayo.',
    ]) expect(text).not.toContain(removed);

    const cardStyle = StyleSheet.flatten(screen.getByTestId('workspace-sync-card').props.style);
    expect(cardStyle.width).toBe('100%');
    expect(cardStyle.maxWidth).toBe(width < 600 ? '100%' : 680);
    view.unmount();
  });

  it('keeps the same connected state and sync action on phone, tablet, and desktop', () => {
    for (const width of [390, 768, 1366]) {
      mockViewport = { width, height: width === 390 ? 844 : 900 };
      const view = render(<WorkspaceSyncCard initialInfo={connectedWorkspaceInfo} onSyncPress={jest.fn()} />);
      expect(screen.getByText(SETTINGS_COPY.connected)).toBeTruthy();
      expect(screen.getByText(connectedWorkspaceInfo.workspaceCode!)).toBeTruthy();
      expect(screen.getByText(SETTINGS_COPY.lastSynchronized)).toBeTruthy();
      expect(screen.getByText(SETTINGS_COPY.justNow)).toBeTruthy();
      expect(screen.getByLabelText(SETTINGS_COPY.syncAccessibility)).toBeTruthy();
      view.unmount();
    }
  });

  it('preserves join, status toggle, sync, and shared back behavior', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText(SETTINGS_COPY.joinAccessibility));
    expect(alert).toHaveBeenCalledWith(SETTINGS_COPY.joinDialogTitle, SETTINGS_COPY.joinDialogBody);
    fireEvent.press(screen.getByTestId('workspace-status-pill'));
    expect(screen.getByText(SETTINGS_COPY.connected)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(SETTINGS_COPY.syncAccessibility));
    expect(alert).toHaveBeenCalledWith(SETTINGS_COPY.syncDialogTitle, SETTINGS_COPY.syncDialogBody);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });
});
