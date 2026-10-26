/* eslint-disable @typescript-eslint/no-require-imports -- Jest factory mocks. */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { WorkspaceManageScreen } from '../WorkspaceManageScreen';
import { ActiveMembers } from '../ActiveMembers';
import { CloudServicesContext, type CloudServices, type Result, type WorkspaceMember } from '../../../modules/cloud/services';
import { fixtureServices, workspaceFixture } from '../../debug/workspaces/fixtures';
const mockToast = jest.fn();
jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../../ui/BayaNotifications', () => ({ useBayaToast: () => mockToast }));
jest.mock('../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => true }));
const learners: WorkspaceMember[] = [{ profileId: 'one', displayName: 'Maria', active: true }, { profileId: 'two', displayName: 'A learner with a very long display name', active: true }];
function mount(data = learners, remove: NonNullable<CloudServices['workspaces']['setMemberActive']> = jest.fn()) {
  const members = jest.fn().mockResolvedValue({ ok: true, data });
  const pendingRequests = jest.fn().mockResolvedValue({ ok: true, data: [] });
  render(<CloudServicesContext.Provider value={{ ...fixtureServices, workspaces: { ...fixtureServices.workspaces,
    details: async () => ({ ok: true, data: workspaceFixture }), members, pendingRequests, setMemberActive: remove,
  } }}><WorkspaceManageScreen id={workspaceFixture.workspace_id} /></CloudServicesContext.Provider>);
  return { members, pendingRequests, remove };
}
beforeEach(() => jest.clearAllMocks());
it('renders named members, count and compact actions, then cancels without removal', async () => {
  const { remove } = mount();
  await screen.findByText('2 Active');
  expect(screen.getAllByText('Remove')).toHaveLength(2);
  expect(screen.getByText(learners[1].displayName)).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Remove workspace access for Maria'));
  expect(screen.getByText('Remove Maria from this workspace?')).toBeTruthy();
  expect(remove).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('CANCEL'));
  expect(screen.queryByText('Remove learner?')).toBeNull();
  expect(screen.getByText('2 Active')).toBeTruthy();
  expect(remove).not.toHaveBeenCalled();
});
it('confirms the correct service call once, then updates count and preserves restore access', async () => {
  let finish!: (value: Result<void>) => void;
  const remove = jest.fn(() => new Promise<Result<void>>(resolve => { finish = resolve; }));
  const { members, pendingRequests } = mount(learners, remove);
  await screen.findByText('2 Active');
  fireEvent.press(screen.getByLabelText('Remove workspace access for Maria'));
  fireEvent.press(screen.getByLabelText('REMOVE ACCESS'));
  fireEvent.press(screen.getByLabelText('REMOVE ACCESS'));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledWith(workspaceFixture.workspace_id, 'one', false);
  expect(screen.getByLabelText('CANCEL').props.accessibilityState.disabled).toBe(true);
  members.mockResolvedValue({ ok: true, data: [{ ...learners[0], active: false }, learners[1]] });
  await act(async () => finish({ ok: true, data: undefined }));
  await screen.findByText('1 Active');
  expect(screen.getByLabelText('Restore workspace access for Maria')).toBeTruthy();
  expect(mockToast).toHaveBeenCalledWith('Workspace access removed.');
  expect(pendingRequests).toHaveBeenCalledTimes(1);
});
it('keeps the member and confirmation available after a failed removal', async () => {
  const remove = jest.fn().mockResolvedValue({ ok: false, code: 'unauthorized' });
  mount(learners, remove);
  await screen.findByText('2 Active');
  fireEvent.press(screen.getByLabelText('Remove workspace access for Maria'));
  fireEvent.press(screen.getByLabelText('REMOVE ACCESS'));
  await waitFor(() => expect(screen.getByLabelText('REMOVE ACCESS').props.accessibilityState.disabled).toBe(false));
  expect(mockToast).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('CANCEL'));
  expect(screen.getByText('2 Active')).toBeTruthy();
  expect(screen.getByLabelText('Remove workspace access for Maria')).toBeTruthy();
});
it('shows a compact zero-member state', async () => {
  mount([]);
  await screen.findByText('0 Active');
  expect(screen.getByText('No active members. Approved learners will appear here.')).toBeTruthy();
  expect(screen.queryByText('Remove')).toBeNull();
});
it('labels genuinely missing names without inventing identity', async () => {
  mount([{ ...learners[0], displayName: ' ' }]);
  await screen.findByText('1 Active');
  expect(screen.getByLabelText('Remove workspace access for Unnamed learner')).toBeTruthy();
});
it('distinguishes loading and failed reads from an empty member list and offers retry', () => {
  const refresh = jest.fn();
  const { rerender } = render(<ActiveMembers workspaceId="workspace" refresh={refresh} />);
  expect(screen.getByText('Loading learners…')).toBeTruthy();
  expect(screen.queryByText('0 Active')).toBeNull();
  rerender(<ActiveMembers workspaceId="workspace" refresh={refresh} result={{ ok: false, code: 'offline' }} />);
  expect(screen.getByText('You’re offline. Connect to the internet and try again.')).toBeTruthy();
  expect(screen.queryByText('0 Active')).toBeNull();
  fireEvent.press(screen.getByText('Retry learners'));
  expect(refresh).toHaveBeenCalledTimes(1);
});
