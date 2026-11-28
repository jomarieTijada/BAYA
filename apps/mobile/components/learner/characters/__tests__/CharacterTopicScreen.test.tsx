import React from 'react';
import { fireEvent, render as renderComponent, screen, waitFor, within } from '@testing-library/react-native';



import { Topic2_1Screen, Topic2_2Screen } from '../CharacterTopicScreen';
import { getBaybayinCharacterTopic } from '../../../../content/baybayinCharactersData';
import { localLearnerService } from '../../../../database/services/localLearnerService';

// React Native's test renderer does not dispatch native layout events.
function render(element: React.ReactElement) {
  const result = renderComponent(element);
  fireEvent(screen.getByTestId('storybook-page'), 'layout', {
    nativeEvent: { layout: { width: 1366, height: 650 } },
  });
  return result;
}

const mockSetParams = jest.fn();
const mockDismissTo = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ setParams: mockSetParams, dismissTo: mockDismissTo, push: mockPush }) }));
jest.mock('../../../../database/services/localLearnerService', () => ({ localLearnerService: { getActiveLearner: jest.fn().mockResolvedValue(null), completeTopic: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../../../branding/BayaMascot', () => ({ BayaMascot: () => null }));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn().mockResolvedValue(undefined) }));

describe('Module 2 letter navigation', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSetParams.mockClear();
    mockDismissTo.mockClear();
    jest.mocked(localLearnerService.completeTopic).mockClear();
  });

  it('moves through letters with the footer before completing the vowel topic', async () => {
    render(<Topic2_1Screen />);
    const vowels = getBaybayinCharacterTopic('topic-2-1')!;
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[0].imageAsset);
    expect(screen.queryByLabelText("Next topic")).toBeNull();

    fireEvent.press(screen.getByLabelText("Next character"));
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[1].imageAsset);
    expect(localLearnerService.completeTopic).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Go back to the previous character"));
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[0].imageAsset);

    fireEvent.press(screen.getByLabelText("Next character"));
    fireEvent.press(screen.getByLabelText("Next character"));
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[2].imageAsset);
    expect(screen.getByLabelText("Next")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Next"));
    await waitFor(() => expect(localLearnerService.completeTopic).toHaveBeenCalledWith('topic-2-1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/learner/character-activities', params: { checkpointId: 'checkpoint-v1-topic-2-1' } });
    expect(mockSetParams).not.toHaveBeenCalled();
  });

  it('keeps the final topic button as Susunod until the final consonant', async () => {
    render(<Topic2_2Screen />);
    const consonants = getBaybayinCharacterTopic('topic-2-2')!;
    expect(screen.getByLabelText("Next character")).toBeTruthy();
    expect(screen.queryByLabelText("Back to topics")).toBeNull();
    fireEvent.press(screen.getByTestId('character-chip-ya'));
    expect(screen.getByTestId('character-glyph').props.source).toBe(consonants.characters[13].imageAsset);
    expect(within(screen.getByTestId('story-content-column')).getByText("Characters")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Next"));
    await waitFor(() => expect(localLearnerService.completeTopic).toHaveBeenCalledWith('topic-2-2'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/learner/character-activities', params: { checkpointId: 'checkpoint-v1-topic-2-2' } });
  });
});
