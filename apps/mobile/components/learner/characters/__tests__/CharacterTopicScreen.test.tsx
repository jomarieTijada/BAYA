import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { Topic2_1Screen, Topic2_2Screen } from '../CharacterTopicScreen';
import { getBaybayinCharacterTopic } from '../../../../content/baybayinCharactersData';
import { localLearnerService } from '../../../../database/services/localLearnerService';

const mockSetParams = jest.fn();
const mockDismissTo = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ setParams: mockSetParams, dismissTo: mockDismissTo, push: mockPush }) }));
jest.mock('../../../../database/services/localLearnerService', () => ({ localLearnerService: { completeTopic: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../../../branding/BayaMascot', () => ({ BayaMascot: () => null }));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn().mockResolvedValue(undefined) }));

describe('Module 2 letter navigation', () => {
  beforeEach(() => {
    mockSetParams.mockClear();
    mockDismissTo.mockClear();
    jest.mocked(localLearnerService.completeTopic).mockClear();
  });

  it('moves through letters with the footer before completing the vowel topic', async () => {
    render(<Topic2_1Screen />);
    const vowels = getBaybayinCharacterTopic('topic-2-1')!;
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[0].imageAsset);
    expect(screen.queryByLabelText('Susunod na paksa')).toBeNull();

    fireEvent.press(screen.getByLabelText('Susunod na simbolo'));
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[1].imageAsset);
    expect(localLearnerService.completeTopic).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Bumalik sa nakaraang simbolo'));
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[0].imageAsset);

    fireEvent.press(screen.getByLabelText('Susunod na simbolo'));
    fireEvent.press(screen.getByLabelText('Susunod na simbolo'));
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[2].imageAsset);
    expect(screen.getByLabelText('Susunod na paksa')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Susunod na paksa'));
    await waitFor(() => expect(localLearnerService.completeTopic).toHaveBeenCalledWith('topic-2-1'));
    expect(mockSetParams).toHaveBeenCalledWith({ topicId: 'topic-2-2' });
  });

  it('keeps the final topic button as Susunod until the final consonant', async () => {
    render(<Topic2_2Screen />);
    const consonants = getBaybayinCharacterTopic('topic-2-2')!;
    expect(screen.getByLabelText('Susunod na simbolo')).toBeTruthy();
    expect(screen.queryByLabelText('Bumalik sa mga paksa')).toBeNull();
    fireEvent.press(screen.getByTestId('character-chip-ya'));
    expect(screen.getByTestId('character-glyph').props.source).toBe(consonants.characters[13].imageAsset);
    expect(within(screen.getByTestId('story-content-column')).getByText('Mga simbolo')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Bumalik sa mga paksa'));
    await waitFor(() => expect(localLearnerService.completeTopic).toHaveBeenCalledWith('topic-2-2'));
    expect(mockDismissTo).toHaveBeenCalledWith('/learner/lessons');
  });
});
