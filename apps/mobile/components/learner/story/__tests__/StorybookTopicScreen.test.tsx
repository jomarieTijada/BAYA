import { LocalizationProvider } from '../../../../localization/LocalizationProvider';
import { LanguageSelector } from '../../../../localization/LanguageSelector';
import { translateText } from '../../../../localization/core';
import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { StorybookTopicScreen } from '../StorybookTopicScreen';
import { StoryGuide } from '../StoryGuide';
import { baybayinHistoryContent, baybayinVideoCredit, baybayinVideoIntroduction } from '../../../../content/baybayinIntroduction';
import { baybayinSyllabaryParagraphs } from '../../../../content/baybayinSyllabary';
import { getApprovedStorybookActivities } from '../../../../content/approvedStorybook';
import { VideoActivityCard } from '../../activity/VideoActivityCard';
import { topic11Steps } from '../../../../content/topics/topic-1-1';
import type { VideoStepContent } from '../../../../content/types';
const english = (source: string) => translateText('en', source);

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSetParams = jest.fn();
const mockDismissTo = jest.fn();
const mockVideoMount = jest.fn();
let mockReducedMotion = false;
jest.mock('../../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => mockReducedMotion }));
let mockLayout = {
  isPhone: false,
  isPhonePortrait: false,
  isPhoneLandscape: false,
  isTablet: false,
  isCompactHeight: false,
  isDesktop: true,
  width: 1440,
  height: 900,
};
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, push: mockPush, setParams: mockSetParams, dismissTo: mockDismissTo }) }));
jest.mock('../../../../database/services/localLearnerService', () => ({ localLearnerService: { completeTopic: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../../../../hooks/useResponsiveLayout', () => ({ useResponsiveLayout: () => mockLayout }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: jest.requireActual('react-native').View }));
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../../../branding/BayaMascot', () => ({ BayaMascot: () => null }));
jest.mock('../../../media/VideoPlayer', () => ({
  VideoPlayer: ({ testID, title, startAtSeconds }: { testID: string; title: string; startAtSeconds: number }) => {
    jest.requireActual('react').useEffect(() => { mockVideoMount(); }, []);
    const { View } = jest.requireActual('react-native');
    const { Text } = jest.requireActual('../../../../localization/components');
    return <View testID={testID} accessibilityValue={{ now: startAtSeconds }}><Text>{title}</Text></View>;
  },
}));

describe('Approved storybooks with a separate introductory slide', () => {
  it('keeps Topic 1.3 active while switching complete body paragraphs without saving progress', async () => {
    setViewport(1366, 768);
    const { localLearnerService } = jest.requireMock('../../../../database/services/localLearnerService');
    const saves = localLearnerService.completeTopic.mock.calls.length;
    const storage = { load: async () => 'en' as const, save: jest.fn(async () => {}) };
    render(<LocalizationProvider storage={storage}><LanguageSelector /><StorybookTopicScreen topicId="topic-1-3" initialPage="content" /></LocalizationProvider>);
    await screen.findByLabelText('Tagalog');
    const plainText = (node: React.ReactNode): string => {
      if (typeof node === 'string' || typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(plainText).join('');
      if (React.isValidElement<{ children?: React.ReactNode }>(node)) return plainText(node.props.children);
      return '';
    };
    const paragraphs = () => screen.getAllByTestId(/story-paragraph/).map(node => plainText(node.props.children)).join('\n');
    const englishParagraphs = paragraphs();
    expect(englishParagraphs).toContain('basic');
    expect(englishParagraphs).not.toContain('May tatlong');
    fireEvent.press(screen.getByLabelText('Tagalog'));
    expect(paragraphs()).toContain('May ');
    fireEvent.press(screen.getByLabelText('English'));
    expect(paragraphs()).toBe(englishParagraphs);
    expect(localLearnerService.completeTopic).toHaveBeenCalledTimes(saves);
  });

  it('changes the lesson language without remounting the playing media', async () => {
    setViewport(1366, 768);
    const storage = { load: async () => 'en' as const, save: jest.fn(async () => {}) };
    render(<LocalizationProvider storage={storage}><LanguageSelector /><StorybookTopicScreen topicId="topic-1-1" /></LocalizationProvider>);
    await screen.findByLabelText('Tagalog', {}, { timeout: 5000 });
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    const mounts = mockVideoMount.mock.calls.length;
    expect(mounts).toBeGreaterThan(0);
    fireEvent.press(screen.getByLabelText('Tagalog'));
    expect(screen.getByText('Baybayin sa Kasaysayan')).toBeTruthy();
    expect(mockVideoMount).toHaveBeenCalledTimes(mounts);
    fireEvent.press(screen.getByLabelText('English'));
    expect(screen.getByText("Baybayin in History")).toBeTruthy();
    expect(mockVideoMount).toHaveBeenCalledTimes(mounts);
  });

  it('keeps desktop proportions and the inline guide when a long lesson needs scrolling', () => {
    setViewport(1920, 900);
    render(<StorybookTopicScreen topicId="topic-1-2" initialPage="content" />);
    fireEvent(screen.getByTestId('storybook-page'), 'layout', {
      nativeEvent: { layout: { x: 240, y: 0, width: 1440, height: 700 } },
    });
    fireEvent(screen.getByTestId('story-reading-scroll'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 800, height: 300 } },
    });
    fireEvent(screen.getByTestId('story-reading-scroll'), 'contentSizeChange', 800, 600);
    expect(screen.getByTestId('story-highlight')).toBeTruthy();
    expect(screen.queryByTestId('story-interactive-guide')).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId('story-visual-column').props.style).flex).toBe(0.5);
    const pageStyle = StyleSheet.flatten(screen.getByTestId('storybook-page').props.style);
    expect(pageStyle.maxWidth).toBe(1440);
    expect(pageStyle.alignSelf).toBe('center');
    expect(StyleSheet.flatten(screen.getByTestId('story-reading-scroll').props.contentContainerStyle).justifyContent).toBe('center');
  });
  it('never paints an unmeasured desktop layout during compact topic navigation', () => {
    setViewport(872, 447);
    const view = render(<StorybookTopicScreen topicId="topic-1-2" initialPage="content" />);
    const measure = () => fireEvent(screen.getByTestId('storybook-page'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 872, height: 347 } },
    });
    expect(StyleSheet.flatten(screen.getByTestId('storybook-page').props.style).opacity).toBe(0);
    expect(screen.queryByTestId('story-highlight')).toBeNull();
    measure();
    expect(StyleSheet.flatten(screen.getByTestId('storybook-page').props.style).opacity).toBeUndefined();
    view.rerender(<StorybookTopicScreen topicId="topic-1-3" initialPage="content" />);
    expect(StyleSheet.flatten(screen.getByTestId('storybook-page').props.style).opacity).toBe(0);
    expect(screen.queryByTestId('story-highlight')).toBeNull();
    measure();
    expect(screen.getByTestId('story-mascot-button')).toBeTruthy();
    expect(screen.getByTestId('storybook-page').props.pointerEvents).toBe('auto');
  });
  it.each([false, true])('opens and dismisses without remounting video or shifting layout (reduced motion: %s)', reduced => {
    mockReducedMotion = reduced;
    setViewport(667, 375);
    render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    fireEvent(screen.getByTestId('storybook-page'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 667, height: 275 } },
    });
    const mounts = mockVideoMount.mock.calls.length;
    const frameStyle = StyleSheet.flatten(screen.getByTestId('story-visual-frame').props.style);
    const navStyle = StyleSheet.flatten(screen.getByTestId('story-navigation').props.style);
    expect(screen.queryByTestId('story-mascot-popover')).toBeNull();
    fireEvent.press(screen.getByTestId('story-mascot-button'));
    expect(screen.getByTestId('story-mascot-button').props.accessibilityState.expanded).toBe(true);
    expect(screen.getByTestId('speech-tail-bottom', { includeHiddenElements: true })).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('story-mascot-popover').props.style).right).toBe(0);
    fireEvent.press(screen.getByLabelText("Close BAYA's message"));
    expect(screen.getByTestId('story-mascot-button').props.accessibilityState.expanded).toBe(false);
    if (reduced) expect(screen.queryByTestId('story-mascot-popover')).toBeNull();
    expect(mockVideoMount.mock.calls.length).toBe(mounts);
    expect(StyleSheet.flatten(screen.getByTestId('story-visual-frame').props.style)).toEqual(frameStyle);
    expect(StyleSheet.flatten(screen.getByTestId('story-navigation').props.style)).toEqual(navStyle);
    expect(screen.getByText(english(baybayinVideoCredit.label))).toBeTruthy();
  });
  beforeEach(() => {
    mockReducedMotion = false;
    mockReplace.mockClear(); mockPush.mockClear(); mockSetParams.mockClear(); mockDismissTo.mockClear();
    jest.requireMock('../../../../database/services/localLearnerService').localLearnerService.completeTopic.mockClear();
    setViewport(1440, 900);
  });

  it('returns to the introduction and resets it on topic re-entry without saving progress', () => {
    const { localLearnerService } = jest.requireMock('../../../../database/services/localLearnerService');
    const view = render(<StorybookTopicScreen topicId="topic-1-1" />);
    expect(screen.getByTestId('lesson-video-introduction')).toBeTruthy();
    expect(screen.queryByTestId('topic-intro-video-player')).toBeNull();
    expect(screen.queryByLabelText("Next topic")).toBeNull();
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    expect(screen.getByTestId('topic-intro-video-player')).toBeTruthy();
    expect(screen.getByTestId('topic-intro-video-player').props.accessibilityValue.now).toBe(17);
    expect(localLearnerService.completeTopic).not.toHaveBeenCalled();
    expect(mockSetParams).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText("Back to the introduction"));
    expect(screen.getByTestId('lesson-video-introduction')).toBeTruthy();
    expect(screen.queryByTestId('topic-intro-video-player')).toBeNull();
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    view.rerender(<StorybookTopicScreen topicId="topic-1-2" />);
    view.rerender(<StorybookTopicScreen topicId="topic-1-1" />);
    expect(screen.getByTestId('lesson-video-introduction')).toBeTruthy();
    expect(localLearnerService.completeTopic).not.toHaveBeenCalled();
  });

  it('also shows a separate introductory slide in the activity preview', () => {
    const onWatch = jest.fn();
    render(<VideoActivityCard content={topic11Steps[0].content as VideoStepContent} onWatch={onWatch} />);
    expect(screen.getByText(english(baybayinVideoIntroduction.body))).toBeTruthy();
    expect(screen.queryByText("The Story of Baybayin")).toBeNull();
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    expect(screen.queryByTestId('lesson-video-introduction')).toBeNull();
    expect(screen.getAllByText("The Story of Baybayin")).toHaveLength(2);
    expect(screen.getByText(english(baybayinVideoCredit.label))).toBeTruthy();
    expect(onWatch).not.toHaveBeenCalled();
  });

  it('returns from Topic 2 to Topic 1 content, even without a prior introductory visit', () => {
    const { localLearnerService } = jest.requireMock('../../../../database/services/localLearnerService');
    const view = render(<StorybookTopicScreen topicId="topic-1-2" initialPage="content" />);
    fireEvent.press(screen.getByLabelText("Go back to the previous topic"));
    expect(mockSetParams).toHaveBeenLastCalledWith({ topicId: 'topic-1-1', lessonPage: 'content' });
    view.rerender(<StorybookTopicScreen topicId="topic-1-1" initialPage="content" />);
    expect(screen.getByTestId('topic-intro-video-player')).toBeTruthy();
    expect(screen.getByText("Baybayin in History")).toBeTruthy();
    expect(screen.queryByTestId('lesson-video-introduction')).toBeNull();
    expect(localLearnerService.completeTopic).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText("Back to the introduction"));
    expect(screen.getByTestId('lesson-video-introduction')).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    expect(screen.getByTestId('topic-intro-video-player')).toBeTruthy();
  });

  it('uses the previous and next topic order and completes only on Next', async () => {
    const { localLearnerService } = jest.requireMock('../../../../database/services/localLearnerService');
    const ids = getApprovedStorybookActivities().map(activity => activity.id);
    const view = render(<StorybookTopicScreen topicId={ids[0]} initialPage="content" />);
    for (let index = 0; index < ids.length - 1; index++) {
      fireEvent.press(screen.getByLabelText("Next topic"));
      await waitFor(() => expect(mockSetParams).toHaveBeenLastCalledWith({ topicId: ids[index + 1], lessonPage: 'content' }));
      expect(localLearnerService.completeTopic).toHaveBeenLastCalledWith(ids[index]);
      view.rerender(<StorybookTopicScreen topicId={ids[index + 1]} initialPage="content" />);
    }
    const saves = localLearnerService.completeTopic.mock.calls.length;
    for (let index = ids.length - 1; index > 0; index--) {
      fireEvent.press(screen.getByLabelText("Go back to the previous topic"));
      expect(mockSetParams).toHaveBeenLastCalledWith({ topicId: ids[index - 1], lessonPage: 'content' });
      view.rerender(<StorybookTopicScreen topicId={ids[index - 1]} initialPage="content" />);
    }
    expect(screen.getByTestId('topic-intro-video-player')).toBeTruthy();
    expect(localLearnerService.completeTopic).toHaveBeenCalledTimes(saves);
    view.rerender(<StorybookTopicScreen topicId={ids.at(-1)!} initialPage="content" />);
    fireEvent.press(screen.getByLabelText("Back to topics"));
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/learner/lessons'));
    expect(localLearnerService.completeTopic).toHaveBeenLastCalledWith(ids.at(-1));
  });

  const setViewport = (width: number, height: number) => {
    const shortSide = Math.min(width, height);
    const isPhone = shortSide < 600;
    const isTablet = !isPhone && width >= 600 && width < 1100;
    mockLayout = {
      isPhone,
      isPhonePortrait: isPhone && height >= width,
      isPhoneLandscape: isPhone && width > height,
      isTablet,
      isCompactHeight: height < 650,
      isDesktop: !isPhone && width >= 1100,
      width,
      height,
    };
  };

  it.each([
    ['topic-1-1', 'Kasaysayan at Kahalagahan ng Baybayin', 'Baybayin sa Kasaysayan'],
    ['topic-1-2', 'Baybayin: Isang Silabaryo (Pantigan)', 'Baybayin: Isang Silabaryo (Pantigan)'],
  ])('renders %s with exact topic and story titles, visual and BAYA', async (id, topic, title) => {
    render(<StorybookTopicScreen topicId={id} />);
    if (id === 'topic-1-1') fireEvent.press(screen.getByLabelText("Watch the Video"));
    await waitFor(() => expect(screen.getAllByText(english(title))).toBeTruthy());
    expect(screen.getAllByText(english(topic))).toBeTruthy();
    expect(within(screen.getByTestId('activity-header')).getByText(english(topic))).toBeTruthy();
    expect(screen.getAllByText(english(topic))).toHaveLength((() => {
      if (id === "topic-1-2") {
        return 2;
      } else {
        return 1;
      }
    })());
    expect(screen.queryByTestId('story-header')).toBeNull();
    expect(screen.getAllByTestId('storybook-page')).toHaveLength(1);
    expect(screen.getByTestId('baya-mascot')).toBeTruthy();
    expect(screen.getByTestId('story-highlight')).toBeTruthy();
    if (id === 'topic-1-1') {
      expect(within(screen.getByTestId('story-image-column')).getByTestId('topic-intro-video-player')).toBeTruthy();
      expect(screen.getByText('Baybayin Song')).toBeTruthy();
      expect(screen.queryByText('Illustration not yet available.')).toBeNull();
    } else {
      expect(within(screen.getByTestId('story-image-column')).getByText('Illustration not yet available.')).toBeTruthy();
      expect(screen.queryByTestId('topic-intro-video-player')).toBeNull();
    }
    expect(screen.queryByTestId('lesson-slide-card')).toBeNull();
    expect(screen.queryByTestId('video-activity-card')).toBeNull();
    expect(screen.queryAllByTestId(/^topic-card-/)).toHaveLength(0);
  });

  it('shows the separate intro, then history with video creator credit and no source block', () => {
    render(<StorybookTopicScreen topicId="topic-1-1" />);
    expect(screen.getByText(english(baybayinVideoIntroduction.title))).toBeTruthy();
    expect(screen.getByText(english(baybayinVideoIntroduction.body))).toBeTruthy();
    expect(screen.queryByTestId('topic-intro-video-player')).toBeNull();
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    expect(screen.queryByTestId('lesson-video-introduction')).toBeNull();
    expect(screen.getByText(english(baybayinHistoryContent.content))).toBeTruthy();
    expect(screen.getByText(english(baybayinVideoCredit.label))).toBeTruthy();
    expect(screen.queryByTestId('lesson-source')).toBeNull();
    expect(screen.queryByText("View Source")).toBeNull();
    expect(screen.getAllByText("It is an important part of who we are.")).toHaveLength(1);
  });

  it('opens the GINHAWA website when the video credit is pressed', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    fireEvent(screen.getByTestId('storybook-page'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 1440, height: 700 } },
    });
    fireEvent.press(screen.getByRole('link', { name: english(baybayinVideoCredit.label) }));
    expect(open).toHaveBeenCalledWith('https://www.facebook.com/baybayincreativityworkshop');
    open.mockRestore();
  });

  it.each([360, 390, 430, 768, 1024, 1366, 1440])('shares the invitation/history/source at %ipx', width => {
    setViewport(width, 900);
    render(<StorybookTopicScreen topicId="topic-1-1" />);
    expect(screen.getByText(english(baybayinVideoIntroduction.body))).toBeTruthy();
    expect(screen.queryByTestId('topic-intro-video-player')).toBeNull();
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    expect(screen.queryByTestId('lesson-video-introduction')).toBeNull();
    expect(screen.getByText(english(baybayinHistoryContent.content))).toBeTruthy();
    expect(screen.getByText(english(baybayinVideoCredit.label))).toBeTruthy();
    expect(screen.getByTestId('topic-intro-video-player')).toBeTruthy();
  });

  it('shows only the supplied syllabary concept and examples on Topic 2', async () => {
    render(<StorybookTopicScreen topicId="topic-1-2" />);
    await waitFor(() => expect(screen.getByText('ᜊ = Ba\nᜃ = Ka\nᜆ = Ta')).toBeTruthy());
    expect(screen.getByText("One character, one syllable! That's how Baybayin works.")).toBeTruthy();
    expect(screen.getByText("Let's read:")).toBeTruthy();
    expect(screen.getByText(english(baybayinSyllabaryParagraphs[0]))).toBeTruthy();
    expect(screen.getByText(english(baybayinSyllabaryParagraphs[1]))).toBeTruthy();
  });

  it('navigates by approved topic order and ends at the module list', async () => {
    const view = render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    await waitFor(() => expect(screen.getByLabelText("Next topic")).toBeTruthy());
    fireEvent.press(screen.getByLabelText("Next topic"));
    await waitFor(() => expect(mockSetParams).toHaveBeenLastCalledWith({ topicId: 'topic-1-2', lessonPage: 'content' }));
    view.rerender(<StorybookTopicScreen topicId="topic-1-2" />);
    await waitFor(() => expect(screen.getAllByText("Baybayin: A Syllabary")).toBeTruthy());
    expect(screen.queryByText("Baybayin in History")).toBeNull();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockDismissTo).toHaveBeenLastCalledWith('/learner/lessons');
  });

  it('awaits progress persistence before triggering navigation', async () => {
    const { localLearnerService } = jest.requireMock('../../../../database/services/localLearnerService');
    let resolveSave!: () => void;
    jest.mocked(localLearnerService.completeTopic).mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveSave = () => resolve(); })
    );

    render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    await waitFor(() => expect(screen.getByLabelText("Next topic")).toBeTruthy());
    fireEvent.press(screen.getByLabelText("Next topic"));

    expect(localLearnerService.completeTopic).toHaveBeenCalledWith('topic-1-1');
    expect(mockSetParams).not.toHaveBeenCalled();

    expect(screen.getByLabelText("Back to the introduction").props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByLabelText("Back to the introduction"));
    expect(screen.getByTestId('topic-intro-video-player')).toBeTruthy();

    resolveSave();
    await waitFor(() => expect(mockSetParams).toHaveBeenCalledWith({ topicId: 'topic-1-2', lessonPage: 'content' }));
  });

  it('protects against rapid repeated Next clicks with single save and navigation', async () => {
    const { localLearnerService } = jest.requireMock('../../../../database/services/localLearnerService');
    jest.mocked(localLearnerService.completeTopic).mockClear();

    let resolveSave!: () => void;
    jest.mocked(localLearnerService.completeTopic).mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveSave = () => resolve(); })
    );

    render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    await waitFor(() => expect(screen.getByLabelText("Next topic")).toBeTruthy());

    fireEvent.press(screen.getByLabelText("Next topic"));
    fireEvent.press(screen.getByLabelText("Next topic"));

    expect(localLearnerService.completeTopic).toHaveBeenCalledTimes(1);

    resolveSave();
    await waitFor(() => expect(mockSetParams).toHaveBeenCalledTimes(1));
  });

  it('does not navigate if persistence fails', async () => {
    const { localLearnerService } = jest.requireMock('../../../../database/services/localLearnerService');
    jest.mocked(localLearnerService.completeTopic).mockRejectedValueOnce(new Error('Invalid VFS state'));

    render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    await waitFor(() => expect(screen.getByLabelText("Next topic")).toBeTruthy());
    fireEvent.press(screen.getByLabelText("Next topic"));

    await waitFor(() => expect(localLearnerService.completeTopic).toHaveBeenCalledWith('topic-1-1'));
    expect(mockSetParams).not.toHaveBeenCalled();
  });

  it('uses the shared learner header controls and opens Settings', () => {
    render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    expect(screen.getByTestId('activity-header')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Settings'));
    expect(mockPush).toHaveBeenCalledWith('/learner/settings');
  });

  it.each([
    [412, 915, 133],
    [1440, 900, 220],
  ])('keeps BAYA within the shared spread size at %s × %s', (width, height, expectedWidth) => {
    setViewport(width, height);
    render(<StoryGuide message="Ito ay mahalagang bahagi ng pagkatao natin." />);
    const mascotStyle = StyleSheet.flatten(screen.getByTestId('baya-mascot').props.style);
    expect(mascotStyle.width).toBe(expectedWidth);
  });

  it('allows a larger BAYA within a wide character spread', () => {
    setViewport(1440, 900);
    render(<StoryGuide message="Halimbawa" maxSpreadMascotWidth={320} fullBodyMascot />);
    const mascotStyle = StyleSheet.flatten(screen.getByTestId('baya-mascot').props.style);
    expect(mascotStyle.width).toBe(320);
    expect(mascotStyle.height).toBe(320);
  });

  it('sizes story media and type from their measured columns', async () => {
    render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    fireEvent(screen.getByTestId('story-image-column'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 420, height: 600 } },
    });
    fireEvent(screen.getByTestId('story-content'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 240 } },
    });
    await waitFor(() => {
      const videoStyle = StyleSheet.flatten(screen.getByTestId('story-visual-frame').props.style);
      const titleStyle = StyleSheet.flatten(screen.getByText("Baybayin in History").props.style);
      expect(videoStyle.width).toBeCloseTo(Math.min(760, 420, 600 * (16 / 9)));
      expect(videoStyle.aspectRatio).toBe(16 / 9);
      expect(titleStyle.fontSize).toBeCloseTo(Math.min(38, Math.max(24, Math.min(320, 240 * 1.65) * 0.052)));
    });
  });

  it('never substitutes a page for an unapproved topic', async () => {
    render(<StorybookTopicScreen topicId="topic-unapproved" />);
    await waitFor(() => expect(screen.getByTestId('story-unavailable')).toBeTruthy());
    expect(screen.queryByTestId('storybook-page')).toBeNull();
  });

  it.each([
    [390, 844], [667, 375], [726, 360], [844, 390], [872, 447], [915, 412], [1024, 768], [1366, 768], [768, 1024], [1440, 900],
  ])('uses the same template and visual sizing for every topic at %s × %s', (width, height) => {
    setViewport(width, height);
    const view = render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    const measureAndReadTemplate = () => {
      fireEvent(screen.getByTestId('storybook-page'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height: height - 152 } },
      });
      fireEvent(screen.getByTestId('story-image-column'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: Math.min(width - 32, 420), height: 200 } },
      });
      fireEvent(screen.getByTestId('story-content'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 240 } },
      });
      const constrained = height - 152 < 440 || width < 820;
      if (constrained) {
        expect(screen.getByTestId('story-mascot-button')).toBeTruthy();
        expect(within(screen.getByTestId('story-visual-column')).queryByTestId('story-mascot-button')).toBeNull();
        expect(within(screen.getByTestId('story-content-column')).getByTestId('story-mascot-button')).toBeTruthy();
        expect(screen.queryByText('Pindutin si BAYA')).toBeNull();
        const guideStyle = StyleSheet.flatten(screen.getByTestId('story-interactive-guide').props.style);
        expect(guideStyle.alignItems).toBe('flex-end');
        expect(guideStyle.height).toBeGreaterThanOrEqual(90);
        expect(guideStyle.height).toBeLessThanOrEqual(170);
        const mascotStyle = StyleSheet.flatten(screen.getByTestId('story-mascot-button').props.style);
        expect(mascotStyle.overflow).toBe('hidden');
        expect(mascotStyle.height).toBe(Math.round(mascotStyle.width * 0.65));
        expect(StyleSheet.flatten(screen.getByTestId('story-reading-scroll').props.contentContainerStyle).justifyContent).toBe('center');
        expect(screen.queryByTestId('story-highlight')).toBeNull();
      } else {
        expect(screen.getByTestId('story-highlight')).toBeTruthy();
      }
      return ['storybook-page', 'story-image-column', 'story-visual-frame', 'story-navigation']
        .map(id => StyleSheet.flatten(screen.getByTestId(id).props.style));
    };
    const topicOneTemplate = measureAndReadTemplate();
    view.rerender(<StorybookTopicScreen topicId="topic-1-2" />);
    expect(measureAndReadTemplate()).toEqual(topicOneTemplate);
    expect(screen.queryByText('ANG BAYBAYIN BILANG SILABARYO')).toBeNull();
    expect(screen.getByText(english(baybayinSyllabaryParagraphs[0]))).toBeTruthy();
    expect(screen.getByText('ᜊ = Ba\nᜃ = Ka\nᜆ = Ta')).toBeTruthy();
    expect(screen.getByText(english(baybayinSyllabaryParagraphs[1]))).toBeTruthy();
    expect(screen.queryByTestId('topic-intro-video-player')).toBeNull();
    expect(screen.getByTestId('story-image-placeholder')).toBeTruthy();
  });

  it('keeps a bounded, nonzero video frame while rotating through portrait and short landscape', () => {
    const view = render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    for (const [width, height, columnWidth, columnHeight] of [
      [390, 844, 358, 200],
      [844, 390, 379, 230],
      [726, 360, 325, 180],
      [768, 1024, 344, 850],
      [1440, 900, 644, 720],
      [390, 844, 358, 200],
    ]) {
      setViewport(width, height);
      view.rerender(<StorybookTopicScreen topicId="topic-1-1" />);
      fireEvent(screen.getByTestId('storybook-page'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height: height - 152 } },
      });
      fireEvent(screen.getByTestId('story-image-column'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: columnWidth, height: columnHeight } },
      });
      const frame = StyleSheet.flatten(screen.getByTestId('story-visual-frame').props.style);
      expect(frame.width).toBeGreaterThan(0);
      expect(frame.height).toBeGreaterThan(0);
      expect(frame.width).toBeLessThanOrEqual(columnWidth);
      expect(frame.height).toBeLessThanOrEqual(columnHeight);
      expect(frame.width / frame.height).toBeCloseTo(16 / 9);
      expect(frame.flex).toBeUndefined();
      expect(frame.flexShrink).toBe(0);
      expect(within(screen.getByTestId('story-visual-frame')).getByTestId('topic-intro-video-player')).toBeTruthy();
    }
  });

  it('keeps one story per topic and only the approved Topic 1 intro video', () => {
    const activities = getApprovedStorybookActivities();
    expect(activities.map(({ id }) => id)).toEqual(['topic-1-1', 'topic-1-2', 'topic-1-3', 'topic-1-4', 'topic-1-5']);
    for (const activity of activities) {
      expect(activity.steps.length).toBeGreaterThan(0);
      expect(['story', 'slide']).toContain(activity.steps[0].type);
      expect(activity.steps[0].content).not.toHaveProperty('illustration');
      expect(activity.steps[0].content).not.toHaveProperty('imageSource');
    }
    expect(activities[0].video).toEqual({
      title: 'Baybayin Song',
      introduction: baybayinVideoIntroduction,
      source: { type: 'asset', assetId: 'baybayin-song' },
      isAvailable: true,
    });
    expect(activities[1].video.source).toBeNull();
    expect(activities[1].video.isAvailable).toBe(false);
    expect(activities[2].video.source).toBeNull();
    expect(activities[2].video.isAvailable).toBe(false);
  });

  it.each([
    [360, 740, true],
    [390, 844, true],
    [412, 915, true],
    [590, 400, false],
    [640, 360, false],
    [726, 360, false],
    [844, 390, false],
    [768, 1024, false],
    [1024, 768, false],
    [900, 1200, false],
    [1440, 900, false],
    [1600, 900, false],
  ])('keeps the story spread whenever both columns fit at %s × %s', async (width, height, stacked) => {
    setViewport(width, height);
    render(<StorybookTopicScreen topicId="topic-1-1" />);
    fireEvent.press(screen.getByLabelText("Watch the Video"));
    await waitFor(() => expect(screen.getByTestId('story-content')).toBeTruthy());
    fireEvent(screen.getByTestId('storybook-page'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 92, width, height: Math.max(0, height - 152) } },
    });
    expect(screen.getByTestId('story-navigation')).toBeTruthy();
    const lessonColumn = within(screen.getByTestId('story-content-column'));
    expect(within(screen.getByTestId('activity-header')).getByText("History and Importance of Baybayin")).toBeTruthy();
    expect(lessonColumn.queryByText("History and Importance of Baybayin")).toBeNull();
    expect(lessonColumn.getByText("Baybayin in History")).toBeTruthy();
    if (stacked) {
      expect(screen.queryByTestId('topic-intro-video-player')).toBeTruthy();
    } else {
      expect(within(screen.getByTestId('story-image-column')).getByTestId('topic-intro-video-player')).toBeTruthy();
      expect(StyleSheet.flatten(screen.getByTestId('story-content-column').props.style).flex).toBe(0.5);
      expect(StyleSheet.flatten(screen.getByTestId('story-content').props.style).paddingRight).toBe(0);
    }
    await waitFor(() => {
      const style = StyleSheet.flatten(screen.getByTestId('storybook-page').props.style);
      expect(style.flexDirection).toBe((() => {
        if (stacked) {
          return 'column';
        } else {
          return 'row';
        }
      })());
    });
    const pageStyle = StyleSheet.flatten(screen.getByTestId('storybook-page').props.style);
    if (stacked) expect(pageStyle.paddingHorizontal).toBeGreaterThanOrEqual(16);
    expect(StyleSheet.flatten(screen.getByTestId('story-navigation').props.style).position).toBe('absolute');
    const headerStyle = StyleSheet.flatten(screen.getByTestId('activity-header').props.style);
    const compactHeader = mockLayout.isPhone || mockLayout.isCompactHeight;
    if (mockLayout.isPhonePortrait) {
      expect(headerStyle.minHeight).toBe(110);
    } else {
      expect(headerStyle.height).toBe(
        (() => {
          if (mockLayout.isPhoneLandscape) {
            return 52;
          } else {
            if (compactHeader) {
              return 68;
            } else {
              return 88;
            }
          }
        })(),
      );
    }
    const backButtonStyle = StyleSheet.flatten(screen.getByLabelText('Back').props.style);
    const settingsButtonStyle = StyleSheet.flatten(screen.getByLabelText('Settings').props.style);
    let backControlSize;
    if (mockLayout.isPhoneLandscape) {
      backControlSize = 32;
    } else {
      if (compactHeader) {
        backControlSize = 48;
      } else {
        backControlSize = 64;
      }
    }
    let settingsControlSize;
    if (mockLayout.isPhoneLandscape) {
      settingsControlSize = 30;
    } else {
      if (compactHeader) {
        settingsControlSize = 40;
      } else {
        settingsControlSize = 52;
      }
    }
    expect(backButtonStyle.width).toBe(backControlSize);
    expect(backButtonStyle.height).toBe(backControlSize);
    expect(settingsButtonStyle.width).toBe(settingsControlSize);
    expect(settingsButtonStyle.height).toBe(settingsControlSize);
    if (stacked) {
      expect(StyleSheet.flatten(screen.getByTestId('story-visual-column').props.style).maxHeight).toBe('40%');
      expect(StyleSheet.flatten(screen.getByTestId('story-content').props.style).flexDirection).toBe('column');
      expect(screen.getByTestId('story-interactive-guide')).toBeTruthy();
      expect(screen.queryByTestId('story-mascot-popover')).toBeNull();
      fireEvent.press(screen.getByTestId('story-mascot-button'));
      expect(screen.getByTestId('story-mascot-popover')).toBeTruthy();
    }
  });
});
