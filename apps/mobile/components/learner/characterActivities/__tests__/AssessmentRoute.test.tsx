import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { AssessmentRoute } from '../AssessmentRoute';
import { createApprovedModules } from '../../../../content/modules/catalog';

let mockParams: Record<string, string> = {};
let mockModules = createApprovedModules();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ replace: jest.fn() }),
  useFocusEffect: (callback: () => void) => jest.requireActual('react').useEffect(callback, [callback]),
  Redirect: ({ href }: { href: string }) => jest.requireActual('react').createElement(jest.requireActual('react-native').Text, null, JSON.stringify(href)),
}));
jest.mock('../../../../database/services/curriculumService', () => ({ curriculumService: { getCurriculumModules: async () => mockModules } }));
jest.mock('../../../../database/services/localLearnerService', () => ({ localLearnerService: { getActiveLearner: async () => ({ profile_id: 'qa' }) } }));
jest.mock('../CharacterActivityHub', () => ({ CharacterActivityHub: () => jest.requireActual('react').createElement(jest.requireActual('react-native').Text, null, 'Protected player') }));
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));
beforeEach(() => { mockParams = {}; mockModules = createApprovedModules(); });
test('legacy and unknown links redirect safely', () => {
  render(<AssessmentRoute />);
  expect(screen.getByText(/learner\/lessons/)).toBeTruthy();
});
test('direct activity link does not render the player before prerequisites', async () => {
  mockParams = { checkpointId: 'checkpoint-v1-topic-2-2' };
  render(<AssessmentRoute />);
  await waitFor(() => expect(screen.queryByText(/Locked|Naka-lock/)).toBeTruthy());
  expect(screen.queryByText('Protected player')).toBeNull();
});
test('eligible direct link renders the reused player', async () => {
  mockParams = { checkpointId: 'checkpoint-v1-topic-3-2' };
  mockModules.forEach(m => m.topics.forEach(t => { t.completed = true; }));
  render(<AssessmentRoute />);
  await waitFor(() => expect(screen.getByText('Protected player')).toBeTruthy());
});

test('legacy bank link returns to lessons without opening an attempt', () => {
  mockParams = { activityId: 'character-1' };
  render(<AssessmentRoute />);
  expect(screen.getByText(/learner\/lessons/)).toBeTruthy();
  expect(screen.queryByText('Protected player')).toBeNull();
});
