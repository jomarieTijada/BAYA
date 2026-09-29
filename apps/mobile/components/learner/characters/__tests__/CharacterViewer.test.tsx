import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { CharacterViewer } from '../CharacterViewer';
import { getBaybayinCharacterTopic, type BaybayinCharacterTopic } from '../../../../content/baybayinCharactersData';

jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../../../branding/BayaMascot', () => ({ BayaMascot: () => null }));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn().mockResolvedValue(undefined) }));

function ViewerHarness({ topic }: { topic: BaybayinCharacterTopic }) {
  const [selection, setSelection] = useState({ topicId: topic.id, index: 0 });
  return <CharacterViewer
    topicId={topic.id}
    characters={topic.characters}
    selectedIndex={selection.topicId === topic.id ? selection.index : 0}
    onSelectCharacter={index => setSelection({ topicId: topic.id, index })}
  />;
}

describe('CharacterViewer', () => {
  it('uses the same example, BAYA control, and selector for vowels and consonants', () => {
    const vowels = getBaybayinCharacterTopic('topic-2-1')!;
    const { rerender } = render(<ViewerHarness topic={vowels} />);
    expect(within(screen.getByTestId('story-content-column')).getByText('Halimbawa')).toBeTruthy();
    expect(within(screen.getByTestId('story-content-column')).getByText('Mga simbolo')).toBeTruthy();
    expect(within(screen.getByTestId('story-image-column')).queryByText('Mga simbolo')).toBeNull();
    expect(screen.queryByText(vowels.description)).toBeNull();
    expect(within(screen.getByTestId('story-image-column')).getByTestId('character-glyph')).toBeTruthy();
    expect(within(screen.getByTestId('story-content-column')).getByTestId('character-selector')).toBeTruthy();
    expect(within(screen.getByTestId('story-content-column')).getByTestId('baya-mascot')).toBeTruthy();
    expect(within(screen.getByTestId('story-content-column')).getByTestId('story-speech-bubble')).toBeTruthy();
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[0].imageAsset);
    expect(screen.getByTestId('baya-pronunciation-button').props.accessibilityState.selected).toBe(false);
    expect(screen.getAllByTestId(/^character-chip-/)).toHaveLength(3);
    expect(screen.queryByTestId('character-next')).toBeNull();
    expect(screen.queryByTestId('character-previous')).toBeNull();
    const mascot = screen.getByTestId('baya-mascot');
    fireEvent.press(screen.getByTestId('character-chip-e_i'));
    expect(screen.getByTestId('baya-mascot')).toBe(mascot);
    expect(screen.getByTestId('character-glyph').props.source).toBe(vowels.characters[1].imageAsset);
    expect(screen.getByTestId('character-chip-e_i').props.accessibilityState.selected).toBe(true);

    const consonants = getBaybayinCharacterTopic('topic-2-2')!;
    rerender(<ViewerHarness topic={consonants} />);
    expect(screen.queryByText(consonants.description)).toBeNull();
    expect(within(screen.getByTestId('story-content-column')).getByTestId('character-selector')).toBeTruthy();
    expect(within(screen.getByTestId('story-content-column')).getByText('Halimbawa')).toBeTruthy();
    expect(screen.getAllByTestId(/^character-chip-/)).toHaveLength(14);
    fireEvent.press(screen.getByTestId('character-chip-ya'));
    expect(screen.getByTestId('character-glyph').props.source).toBe(consonants.characters[13].imageAsset);
    expect(screen.getByTestId('character-chip-ya').props.accessibilityState.selected).toBe(true);
  });

  it.each([[390, 'column'], [726, 'row'], [780, 'row'], [1440, 'row']] as const)(
    'uses the Module 1 storybook layout at %s px',
    (width, direction) => {
      const topic = getBaybayinCharacterTopic('topic-2-1')!;
      render(<ViewerHarness topic={topic} />);
      fireEvent(screen.getByTestId('storybook-page'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height: 260 } },
      });
      expect(StyleSheet.flatten(screen.getByTestId('storybook-page').props.style).flexDirection).toBe(direction);
      expect(screen.getByTestId('character-glyph')).toBeTruthy();
      expect(screen.getByTestId('character-selector')).toBeTruthy();
      expect(StyleSheet.flatten(screen.getByTestId('story-visual-frame').props.style).aspectRatio).toBe(4 / 3);
    },
  );

  it('speaks the selected character when BAYA is pressed without a recording', async () => {
    const source = getBaybayinCharacterTopic('topic-2-1')!;
    render(<ViewerHarness topic={source} />);
    const player = jest.mocked(useAudioPlayer).mock.results.at(-1)?.value;
    const mascot = screen.getByTestId('baya-mascot');
    fireEvent.press(screen.getByTestId('baya-pronunciation-button'));
    await waitFor(() => expect(Speech.speak).toHaveBeenCalledWith('A', expect.objectContaining({ language: 'fil-PH' })));
    expect(player.pause).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('character-chip-e_i'));
    expect(screen.getByTestId('baya-mascot')).toBe(mascot);
    expect(screen.getByTestId('baya-pronunciation-button').props.accessibilityState.selected).toBe(false);
    expect(player.pause).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('baya-pronunciation-button'));
    await waitFor(() => expect(Speech.speak).toHaveBeenCalledWith('E o I', expect.any(Object)));
  });

  it('leaves Expo to release the player when a letter or topic unmounts', () => {
    const source = getBaybayinCharacterTopic('topic-2-1')!;
    const firstPlayerIndex = jest.mocked(useAudioPlayer).mock.results.length;
    const view = render(<ViewerHarness topic={source} />);
    fireEvent.press(screen.getByTestId('character-chip-e_i'));
    view.unmount();
    for (const result of jest.mocked(useAudioPlayer).mock.results.slice(firstPlayerIndex)) {
      expect(result.value.pause).not.toHaveBeenCalled();
    }
  });

  it('plays a supplied recording through the shared Expo audio controller', async () => {
    const source = getBaybayinCharacterTopic('topic-2-1')!;
    const character = { ...source.characters[0], audioSrc: 'https://cdn.example.test/a.mp3' };
    render(<CharacterViewer topicId={source.id} characters={[character]} selectedIndex={0} onSelectCharacter={jest.fn()} />);
    fireEvent.press(screen.getByTestId('baya-pronunciation-button'));
    const player = jest.mocked(useAudioPlayer).mock.results.at(-1)?.value;
    expect(player.pause).toHaveBeenCalled();
    await waitFor(() => expect(player.seekTo).toHaveBeenCalledWith(0));
    await waitFor(() => expect(player.play).toHaveBeenCalled());
  });
});
