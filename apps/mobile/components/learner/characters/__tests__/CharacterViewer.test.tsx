import { translateText } from '../../../../localization/core';
import React, { useState } from 'react';
import { fireEvent, render as renderComponent, screen, waitFor, within } from '@testing-library/react-native';


import { StyleSheet } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import { characterRecording } from '../../../../modules/audio/manifest';
import * as Speech from 'expo-speech';
import { Colors } from '../../../../constants/theme';
import { CharacterViewer } from '../CharacterViewer';
import { getBaybayinCharacterTopic, type BaybayinCharacterTopic } from '../../../../content/baybayinCharactersData';
jest.mock('../../../../database/services/localLearnerService', () => ({ localLearnerService: { getActiveLearner: jest.fn().mockResolvedValue(null) } }));
const english = (source: string) => translateText('en', source);

// React Native's test renderer does not dispatch native layout events.
function render(element: React.ReactElement) {
  const result = renderComponent(element);
  fireEvent(screen.getByTestId('storybook-page'), 'layout', {
    nativeEvent: { layout: { width: 1366, height: 650 } },
  });
  return result;
}

jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../../../branding/BayaMascot', () => ({ BayaMascot: () => null }));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn().mockResolvedValue(undefined) }));

function ViewerHarness({ topic }: { topic: BaybayinCharacterTopic }) {
  const [selection, setSelection] = useState({ topicId: topic.id, index: 0 });
  return <CharacterViewer
    topicId={topic.id}
    characters={topic.characters}
    selectedIndex={(() => {
      if (selection.topicId === topic.id) {
        return selection.index;
      } else {
        return 0;
      }
    })()}
    onSelectCharacter={index => setSelection({ topicId: topic.id, index })}
  />;
}

describe('CharacterViewer', () => {
  it('shows one contextual swipe hint only while the selector overflows', () => {
    render(<ViewerHarness topic={getBaybayinCharacterTopic('topic-2-2')!} />);
    const row = screen.getByTestId('character-selector');
    fireEvent(row, 'layout', { nativeEvent: { layout: { width: 300 } } });
    fireEvent(row, 'contentSizeChange', 900, 50);
    expect(screen.getAllByTestId('lesson-swipe-hint')).toHaveLength(1);
    expect(screen.getByLabelText("Swipe left")).toBeTruthy();
    fireEvent.scroll(row, { nativeEvent: { contentOffset: { x: 600, y: 0 } } });
    expect(screen.getByLabelText("Swipe right")).toBeTruthy();
    fireEvent(row, 'layout', { nativeEvent: { layout: { width: 1000 } } });
    expect(screen.queryByTestId('lesson-swipe-hint')).toBeNull();
  });
  it.each([
    ['ka', 'KAibigan', 'KA', 'ᜃ'],
    ['nga', 'NGAyon', 'NGA', 'ᜅ'],
    ['ya', 'YAman', 'YA', 'ᜌ'],
  ] as const)('renders the approved %s word and target emphasis with a subordinate guide', async (id, word, syllable, glyph) => {
    const topic = getBaybayinCharacterTopic('topic-2-2')!;
    render(<ViewerHarness topic={topic} />);
    fireEvent.press(screen.getByTestId(`character-chip-${id}`));
    const character = topic.characters.find(item => item.id === id)!;
    expect(screen.getByTestId('character-example-latin').props.accessibilityLabel).toBe(word);
    expect(screen.getByTestId('character-example-syllable').props.children).toBe(syllable);
    expect(StyleSheet.flatten(screen.getByTestId('character-example-syllable').props.style).color).toBe(Colors.rolePrimary);
    expect(screen.getByTestId('character-example-highlighted-glyph').props.children).toBe(glyph);
    expect(screen.getByTestId('character-glyph').props.source).toBe(character.imageAsset);
    expect(screen.getByTestId('character-example-baybayin').props.accessibilityLabel).toBe(`Baybayin: ${character.example.baybayinWord}`);
    expect(StyleSheet.flatten(screen.getByTestId('character-example-highlighted-glyph').props.style).textDecorationLine).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByTestId('character-example-guide-line').props.style)).toEqual(expect.objectContaining({ backgroundColor: Colors.textMuted, height: 1 }));
    expect(screen.getAllByTestId('character-example-guide-line')).toHaveLength(1);
    for (const oldWord of ['Kama', 'Ngipin', 'Yaya']) expect(screen.queryByLabelText(english(oldWord))).toBeNull();
    fireEvent.press(screen.getByTestId('baya-pronunciation-button'));
    await waitFor(() => expect(createAudioPlayer).toHaveBeenLastCalledWith(characterRecording(character.id)!.source, { updateInterval: 100 }));
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('uses one thin neutral guide for every Lesson 2 character', () => {
    for (const topic of ['topic-2-1', 'topic-2-2']) {
      const source = getBaybayinCharacterTopic(topic)!;
      const view = render(<ViewerHarness topic={source} />);
      for (const character of source.characters) {
        fireEvent.press(screen.getByTestId(`character-chip-${character.id}`));
        expect(screen.getAllByTestId('character-example-guide-line')).toHaveLength(1);
        expect(StyleSheet.flatten(screen.getByTestId('character-example-guide-line').props.style)).toEqual(expect.objectContaining({ backgroundColor: Colors.textMuted, height: 1 }));
        const cancellationMarks = screen.queryAllByTestId('character-example-cancellation-mark', { includeHiddenElements: true });
        expect(cancellationMarks).toHaveLength((() => {
          if (character.example.baybayinWord.includes('᜔')) {
            return 1;
          } else {
            return 0;
          }
        })());
        for (const mark of cancellationMarks) expect(mark.props.children).toBe('×');
      }
      view.unmount();
    }
  });

  it('keeps the final consonant and virama together when fitting KAibigan into a narrow bubble', () => {
    const topic = getBaybayinCharacterTopic('topic-2-2')!;
    render(<ViewerHarness topic={topic} />);
    fireEvent.press(screen.getByTestId('character-chip-ka'));
    const spelling = screen.getByTestId('character-example-baybayin');
    const ending = within(spelling).getByLabelText('ᜈ᜔');
    expect(within(ending).getByText('ᜈ')).toBeTruthy();
    expect(within(ending).getByTestId('character-example-cancellation-mark', { includeHiddenElements: true }).props.children).toBe('×');
    expect(within(spelling).queryByText('᜔')).toBeNull();
    fireEvent(spelling, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 217.625, height: 64 } } });
    fireEvent(screen.getByTestId('character-example-container'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 177, height: 128 } } });
    const fittedFont = StyleSheet.flatten(screen.getByTestId('character-example-highlighted-glyph').props.style).fontSize;
    expect(fittedFont).toBeLessThan(48);
    expect(within(spelling).getByLabelText('ᜈ᜔')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('character-example-guide-line').props.style).height).toBe(1);
  });

  it('uses the same example, BAYA control, and selector for vowels and consonants', () => {
    const vowels = getBaybayinCharacterTopic('topic-2-1')!;
    const { rerender } = render(<ViewerHarness topic={vowels} />);
    expect(within(screen.getByTestId('story-content-column')).getByText("Example")).toBeTruthy();
    expect(within(screen.getByTestId('story-content-column')).getByText("Characters")).toBeTruthy();
    expect(within(screen.getByTestId('story-image-column')).queryByText("Characters")).toBeNull();
    expect(screen.queryByText(english(vowels.description))).toBeNull();
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
    expect(screen.queryByText(english(consonants.description))).toBeNull();
    expect(within(screen.getByTestId('story-content-column')).getByTestId('character-selector')).toBeTruthy();
    expect(within(screen.getByTestId('story-content-column')).getByText("Example")).toBeTruthy();
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

  it('plays the mapped recording and releases it when the character changes', () => {
    const source = getBaybayinCharacterTopic('topic-2-1')!;
    const view = render(<ViewerHarness topic={source} />);
    fireEvent.press(screen.getByTestId('baya-pronunciation-button'));
    const first = jest.mocked(createAudioPlayer).mock.results.at(-1)!.value;
    expect(first.play).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId('character-chip-e_i'));
    expect(first.pause).toHaveBeenCalledTimes(1);
    expect(first.remove).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId('baya-pronunciation-button'));
    expect(createAudioPlayer).toHaveBeenLastCalledWith(characterRecording('e_i')!.source, { updateInterval: 100 });
    const second = jest.mocked(createAudioPlayer).mock.results.at(-1)!.value;
    view.unmount();
    expect(second.remove).toHaveBeenCalledTimes(1);
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('disables unavailable recordings without synthesized substitution', () => {
    const source = getBaybayinCharacterTopic('topic-2-1')!;
    const character = { ...source.characters[0], id: 'unmapped', audioSrc: null };
    render(<CharacterViewer topicId={source.id} characters={[character]} selectedIndex={0} onSelectCharacter={jest.fn()} />);
    expect(screen.getByTestId('baya-pronunciation-button').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Recording unavailable.')).toBeTruthy();
    expect(Speech.speak).not.toHaveBeenCalled();
  });
});


describe('Base-only and separate kudlit instruction', () => {
  it('renders all fourteen original base illustrations without any variation controls', () => {
    const topic = getBaybayinCharacterTopic('topic-2-2')!;
    expect(topic.characters).toHaveLength(14);
    expect(topic.characters.map(c => c.id)).toEqual(['ba','ka','da_ra','ga','ha','la','ma','na','nga','pa','sa','ta','wa','ya']);
    expect(topic.characters.find(c => c.id === 'da_ra')?.unicodeSymbol).toBe('ᜇ');
    render(<ViewerHarness topic={topic} />);
    for (const character of topic.characters) {
      fireEvent.press(screen.getByTestId(`character-chip-${character.id}`));
      expect(screen.getByTestId('character-glyph').props.source).toBe(character.imageAsset);
      expect(screen.getByTestId('character-example-syllable').props.children.toLowerCase()).toBe(character.example.highlightedSyllable.toLowerCase());
      expect(screen.queryByTestId('kudlit-recordings')).toBeNull();
      expect(screen.queryByText(/Sounds with kudlit|Mga tunog na may kudlit/)).toBeNull();
      expect(screen.queryByText('Be')).toBeNull();
      expect(screen.queryByText('Bi')).toBeNull();
      expect(screen.queryByText('Bo')).toBeNull();
      expect(screen.queryByText('Bu')).toBeNull();
      expect(characterRecording(character.id)).toBeTruthy();
    }
  });
  it.each(['upper','lower'])('retains %s variant illustrations and verified recordings in its own topic', position => {
    const topic = getBaybayinCharacterTopic(`topic-kudlit-${position}`)!;
    render(<ViewerHarness topic={topic} />);
    expect(screen.getByTestId('kudlit-recordings')).toBeTruthy();
    expect(screen.getByText(position === 'upper' ? 'Be' : 'Bo')).toBeTruthy();
    expect(screen.queryByText(position === 'upper' ? 'Bo' : 'Be')).toBeNull();
    fireEvent.press(screen.getByTestId('character-chip-da_ra'));
    if (position === 'upper') { expect(screen.getByText('De / Re')).toBeTruthy(); expect(screen.getByText('Di / Ri')).toBeTruthy(); }
    else expect(screen.getByText(/Recording awaiting validation|Hinihintay ang pagpapatunay/)).toBeTruthy();
  });
});
