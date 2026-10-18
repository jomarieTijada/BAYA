import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LessonScreen } from '../LessonScreen';
import { curriculumService } from '../../../../database/services/curriculumService';
import { createApprovedModules } from '../lessonData';

// Render the real card tree; cold React Native setup can exceed Jest's 5s
// default when the complete workspace suite runs on a busy development host.
jest.setTimeout(15000);

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), dismissTo: jest.fn(), back: jest.fn(), canGoBack: () => false }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = jest.requireActual('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('../../../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({ isPhone: true, isPhonePortrait: true, isPhoneLandscape: false, isCompactHeight: false, width: 390, height: 844 }),
}));
jest.mock('../../../../database/services/curriculumService', () => ({
  curriculumService: { getCurriculumModules: jest.fn() },
}));
jest.mock('../LessonHeader', () => ({ LessonHeader: () => null }));
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../../../ui/BackButton', () => ({ BackButton: () => null }));

function expectOnlyApprovedTopics() {
  expect(screen.getAllByTestId(/^topic-card-/)).toHaveLength(9);
  expect(screen.getByTestId('topic-card-topic-1-1').props.accessibilityLabel).toContain('Kasaysayan at Kahalagahan ng Baybayin');
  expect(screen.getByTestId('topic-card-topic-1-2').props.accessibilityLabel).toContain('Baybayin: Isang Silabaryo (Pantigan)');
  expect(screen.getByTestId('topic-card-topic-1-3').props.accessibilityLabel).toContain('Ang 17 Simbolo ng Baybayin');
  expect(screen.getByTestId('topic-card-topic-1-4').props.accessibilityLabel).toContain('Magkaibang Letra, Iisang Simbolo?');
  expect(screen.getByTestId('topic-card-topic-1-5').props.accessibilityLabel).toContain('Paano naman ang Da at Ra?');
  expect(screen.getByTestId('topic-card-topic-1-1').props.accessibilityState.disabled).toBe(false);
  expect(screen.getByTestId('topic-card-topic-1-2').props.accessibilityState.disabled).toBe(true);
  expect(screen.getByTestId('topic-card-topic-1-3').props.accessibilityState.disabled).toBe(true);
  expect(screen.getByTestId('topic-card-topic-2-1').props.accessibilityLabel).toContain('Ang mga Patinig');
  expect(screen.getByTestId('topic-card-topic-2-2').props.accessibilityLabel).toContain('Kilalanin ang mga Katinig');
  expect(screen.getByTestId('topic-card-topic-3-1').props.accessibilityLabel).toContain('Mga Patinig');
  expect(screen.getByTestId('topic-card-topic-3-2').props.accessibilityLabel).toContain('Mga Katinig');
  expect(screen.queryByText(/Kudlit|First Strokes/)).toBeNull();
}

describe('Approved curriculum rendered in learner screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(curriculumService.getCurriculumModules).mockResolvedValue(createApprovedModules());
  });
  it('shows all three modules and nine topic cards before and after hydration', async () => {
    render(<LessonScreen />);
    expectOnlyApprovedTopics();
    expect(screen.getAllByRole('tab').map(tab => tab.props.accessibilityLabel))
      .toEqual(['Home', 'Lessons', 'Achievements', 'Profile']);
    await waitFor(() => expect(curriculumService.getCurriculumModules).toHaveBeenCalled());
    expect(screen.getAllByTestId(/^lesson-card-/)).toHaveLength(3);
    expect(screen.getByTestId('lesson-card-module-1').props.accessibilityLabel).toContain('Modyul 1');
    expect(screen.getByText('Pagkilala sa Baybayin')).toBeTruthy();
    expectOnlyApprovedTopics();
    fireEvent.press(screen.getByRole('button', { name: /Simulan ang mga Paksa/ }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/learner/activities/[topicId]', params: { topicId: 'topic-1-1' } });
  });
  it('shows completion only as an upper-right check on a finished module card', async () => {
    const completedModule = createApprovedModules()[0];
    completedModule.status = 'completed';
    completedModule.topics = completedModule.topics.map((topic) => ({ ...topic, completed: true, status: 'completed' }));
    jest.mocked(curriculumService.getCurriculumModules).mockResolvedValue([completedModule]);

    render(<LessonScreen />);
    await waitFor(() => expect(screen.getByTestId('lesson-completed-check-module-1', { includeHiddenElements: true })).toBeTruthy());
    expect(screen.queryByText('Tapos na')).toBeNull();
    expect(screen.queryByText('Done')).toBeNull();
    expect(screen.getAllByTestId(/^topic-card-/)).toHaveLength(5);
    fireEvent.press(screen.getByRole('button', { name: /Balikan ang mga Paksa/ }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/learner/activities/[topicId]', params: { topicId: 'topic-1-1' } });
  });
  it('opens the next unfinished approved topic directly', async () => {
    const module = createApprovedModules()[0];
    module.topics[0].completed = true;
    module.topics[0].status = 'completed';
    module.topics[1].status = 'available';
    jest.mocked(curriculumService.getCurriculumModules).mockResolvedValue([module]);

    render(<LessonScreen />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Magpatuloy sa mga Paksa/ })).toBeTruthy());
    fireEvent.press(screen.getByRole('button', { name: /Magpatuloy sa mga Paksa/ }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/learner/activities/[topicId]', params: { topicId: 'topic-1-2' } });
  });
});
