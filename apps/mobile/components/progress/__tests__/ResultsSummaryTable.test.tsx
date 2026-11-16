/* eslint-disable @typescript-eslint/no-require-imports -- Jest factories resolve mocked components locally. */
import React from 'react';
import { Text, View } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { ResultsSummaryTable } from '../ResultsSummaryTable';
import { MentorDashboard } from '../MentorDashboard';
import { MentorBoundary } from '../../mentor/WorkspaceScreens';
import { MentorSessionRevisionContext } from '../../../modules/cloud/mentorSessionRevision';
import { CloudServicesContext, pendingCloudServices } from '../../../modules/cloud/services';
import { LocalizationProvider } from '../../../localization/LocalizationProvider';
import { LanguageSelector } from '../../../localization/LanguageSelector';
import { progressPreviewServices } from '../../debug/workspaces/progressFixtures';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args), replace: jest.fn() }, useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../../ui/BayaNotifications', () => ({ useBayaToast: () => jest.fn() }));
jest.mock('../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => true }));
// Keep refresh interaction explicit; the real shared menu has its own interaction tests.
jest.mock('../../mentor/MentorActionMenu', () => ({ MentorActionMenu: ({ groups }: any) => {
  const { Pressable, Text } = require('react-native');
  return <Pressable accessibilityLabel="Refresh results test" disabled={groups[0].actions[1].disabled} accessibilityState={{ disabled: groups[0].actions[1].disabled }} onPress={groups[0].actions[1].onPress}><Text>Refresh</Text></Pressable>;
} }));
const base = { profileId: 'a', displayName: 'Ana', lastSyncedAt: '2026-11-08T00:00:00Z', completedTopics: 4, totalTopics: 9, percentage: 44, currentTopic: 'Topic', stage: 1, totalStages: 3 };
const rows = [base, { ...base, profileId: 'b', displayName: 'Ben', completedTopics: 0, percentage: 0 }, { ...base, profileId: 'c', displayName: 'Cora', completedTopics: 0, lastSyncedAt: null, percentage: null }];
const data = (id: string, learners = rows) => ({ workspace: { workspace_id: id, workspace_name: id, workspace_code: 'BAYA-ABCDEF123456', mentor_profile_id: 'mentor', status: 'active' as const, created_at: '2026-11-08' }, learners, learnerCount: learners.length, nextOffset: null, lastSyncedAt: base.lastSyncedAt });
const storage = { load: async () => 'en' as const, save: jest.fn(async () => {}) };
beforeEach(() => jest.clearAllMocks());
it('exposes tabular relationships, counts, confirmed zero, missing data and detail action', () => {
  const view = jest.fn();render(<ResultsSummaryTable learners={rows} onView={view} />);
  expect(screen.getByTestId('results-table').props.role).toBe('table');expect(screen.UNSAFE_getAllByType(View).filter(node => node.props.role === 'columnheader')).toHaveLength(5);
  expect(within(screen.getByTestId('result-row-a')).getByText('4 / 9')).toBeTruthy();
  expect(within(screen.getByTestId('result-row-b')).getByText('0%')).toBeTruthy();
  expect(within(screen.getByTestId('result-row-c')).queryByText('0%')).toBeNull();
  expect(within(screen.getByTestId('result-row-c')).getAllByText('Not available')).toHaveLength(2);
  fireEvent.press(screen.getByLabelText("View Ana's progress"));expect(view).toHaveBeenCalledWith('a');
});
it('switches language without fetching again, changing numbers or losing workspace context', async () => {
  const dashboard = jest.fn(async (id: string) => ({ ok: true as const, data: data(id) }));
  render(<LocalizationProvider storage={storage}><LanguageSelector /><CloudServicesContext.Provider value={{ ...progressPreviewServices, progress: { ...progressPreviewServices.progress, dashboard } }}><MentorDashboard id="workspace-a" /></CloudServicesContext.Provider></LocalizationProvider>);
  await screen.findByText('Learner Results Summary');fireEvent.press(screen.getByLabelText('Tagalog'));
  await screen.findByText('Buod ng Resulta ng mga Mag-aaral');expect(screen.getByText('4 / 9')).toBeTruthy();expect(screen.getByText('44%')).toBeTruthy();
  expect(dashboard).toHaveBeenCalledTimes(1);fireEvent.press(screen.getByLabelText('Tingnan ang pag-unlad ni Ana'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/mentor/learner-progress', params: { workspaceId: 'workspace-a', profileId: 'a' } });
});
it('does not show another workspace while loading or after its late promise resolves', async () => {
  let finishA!: (value: any) => void;
  const dashboard = jest.fn((id: string) => id === 'A' ? new Promise<any>(resolve => { finishA = resolve; }) : Promise.resolve({ ok: true as const, data: data('B', [{ ...base, displayName: 'Only B' }]) }));
  const services = { ...progressPreviewServices, progress: { ...progressPreviewServices.progress, dashboard } };
  const tree = (id: string) => <CloudServicesContext.Provider value={services}><MentorDashboard id={id} /></CloudServicesContext.Provider>;
  const view = render(tree('A'));await waitFor(() => expect(dashboard).toHaveBeenCalledWith('A', 0));
  expect(screen.queryByTestId('results-table')).toBeNull();view.rerender(tree('B'));await screen.findByText('Only B');
  await act(async () => finishA({ ok: true, data: data('A') }));expect(screen.queryByText('Ana')).toBeNull();expect(screen.getByText('Only B')).toBeTruthy();
});
it('labels a transient refresh failure as stale but removes results after authorization fails', async () => {
  const dashboard = jest.fn().mockResolvedValueOnce({ ok: true, data: data('A') }).mockResolvedValueOnce({ ok: false, code: 'offline' }).mockResolvedValueOnce({ ok: false, code: 'unauthorized' });
  render(<CloudServicesContext.Provider value={{ ...progressPreviewServices, progress: { ...progressPreviewServices.progress, dashboard } }}><MentorDashboard id="A" /></CloudServicesContext.Provider>);
  await screen.findByText('Ana');await act(async () => { fireEvent.press(screen.getByLabelText('Refresh results test')); });
  await screen.findByText('Could not refresh. Showing the previously loaded results.');expect(screen.getByText('Ana')).toBeTruthy();
  await waitFor(() => expect(screen.getByLabelText('Refresh results test').props.accessibilityState.disabled).toBe(false));
  await act(async () => { fireEvent.press(screen.getByLabelText('Refresh results test')); });await waitFor(() => expect(screen.queryByTestId('results-table')).toBeNull());expect(screen.queryByText('Ana')).toBeNull();
  expect(screen.getByLabelText('Retry progress dashboard')).toBeTruthy();
});
it('hides protected content immediately on a Supabase session revision and rechecks authority', async () => {
  const session = jest.fn().mockResolvedValueOnce({ ok: true, data: { profileId: 'mentor' } }).mockResolvedValueOnce({ ok: true, data: null });
  const services = { ...pendingCloudServices, auth: { ...pendingCloudServices.auth, session } };
  const tree = (revision: number) => <CloudServicesContext.Provider value={services}><MentorSessionRevisionContext.Provider value={revision}><MentorBoundary><View><Text>Private results</Text></View></MentorBoundary></MentorSessionRevisionContext.Provider></CloudServicesContext.Provider>;
  const view = render(tree(0));await screen.findByText('Private results');view.rerender(tree(1));expect(screen.queryByText('Private results')).toBeNull();await screen.findByText('Please log in to access your workspaces.');
});
