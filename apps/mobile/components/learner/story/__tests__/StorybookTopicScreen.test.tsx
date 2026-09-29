import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { StorybookTopicScreen } from '../StorybookTopicScreen';
import { StoryGuide } from '../StoryGuide';
import { getApprovedStorybookActivities } from '../../../../content/approvedStorybook';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSetParams = jest.fn();
const mockDismissTo = jest.fn();
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
  VideoPlayer: ({ testID, title }: { testID: string; title: string }) => {
    const { Text, View } = jest.requireActual('react-native');
    return <View testID={testID}><Text>{title}</Text></View>;
  },
}));

describe('Restored single-page approved storybooks', () => {
  beforeEach(() => { mockReplace.mockClear(); mockPush.mockClear(); mockSetParams.mockClear(); mockDismissTo.mockClear(); setViewport(1440, 900); });

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
    ['topic-1-1', 'Ang Kasaysayan at Kahalagahan', 'Ang Pinagmulan ng Baybayin'],
    ['topic-1-2', 'Ano Ba ang Silabaryo?', 'Ano Ba ang Silabaryo?'],
  ])('renders %s with exact topic and story titles, visual and BAYA', async (id, topic, title) => {
    render(<StorybookTopicScreen topicId={id} />);
    await waitFor(() => expect(screen.getAllByText(title)).toBeTruthy());
    expect(screen.getAllByText(topic)).toBeTruthy();
    expect(within(screen.getByTestId('activity-header')).getByText(topic)).toBeTruthy();
    expect(screen.getAllByText(topic)).toHaveLength(id === "topic-1-2" ? 2 : 1);
    expect(screen.queryByTestId('story-header')).toBeNull();
    expect(screen.getAllByTestId('storybook-page')).toHaveLength(1);
    expect(screen.getByTestId('baya-mascot')).toBeTruthy();
    expect(screen.getByTestId('story-highlight')).toBeTruthy();
    if (id === 'topic-1-1') {
      expect(within(screen.getByTestId('story-image-column')).getByTestId('topic-intro-video-player')).toBeTruthy();
      expect(screen.getByText('Baybayin Song')).toBeTruthy();
      expect(screen.queryByText('Add Image Here')).toBeNull();
    } else {
      expect(within(screen.getByTestId('story-image-column')).getByText('Add Image Here')).toBeTruthy();
      expect(screen.queryByTestId('topic-intro-video-player')).toBeNull();
    }
    expect(screen.queryByTestId('lesson-slide-card')).toBeNull();
    expect(screen.queryByTestId('video-activity-card')).toBeNull();
    expect(screen.queryAllByTestId(/^topic-card-/)).toHaveLength(0);
  });

  it('keeps the supplied story ending in the BAYA message instead of repeating it in the text', async () => {
    render(<StorybookTopicScreen topicId="topic-1-1" />);
    await waitFor(() => expect(screen.getByText('Tara at balikan natin kung saan nagmula ang Baybayin.')).toBeTruthy());
    expect(screen.getByText('Bago pa man dumating ang mga Kastila, may sarili nang sistema ng pagsusulat ang mga Pilipino.')).toBeTruthy();
    expect(screen.getByText('Dahil wala pang papel noon, sa mga puno, kawayan, at dahon sila umuukit gamit ang matutulis na bagay para magsulat ng mga tula at mensahe.')).toBeTruthy();
    expect(screen.getAllByText('Ito ay mahalagang bahagi ng pagkatao natin.')).toHaveLength(1);
    expect(screen.queryByText('Tara at balikan natin kung saan nagmula ang Baybayin.', { exact: true })).toBeTruthy();
    const activity = getApprovedStorybookActivities()[0];
    const storyContent = activity.steps[0].content;
    const storyText = storyContent && 'content' in storyContent ? storyContent.content : '';
    expect(storyText.endsWith('Dahil wala pang papel noon, sa mga puno, kawayan, at dahon sila umuukit gamit ang matutulis na bagay para magsulat ng mga tula at mensahe.')).toBe(true);
    expect(storyText).not.toContain('Ito ay mahalagang bahagi ng pagkatao natin.');
  });

  it('shows only the supplied syllabary concept and examples on Topic 2', async () => {
    render(<StorybookTopicScreen topicId="topic-1-2" />);
    await waitFor(() => expect(screen.getByText('ᜊ = Ba\nᜃ = Ka\nᜆ = Ta')).toBeTruthy());
    expect(screen.getByText('Isang simbolo, isang pantig! Ganoon kadali ang Baybayin.')).toBeTruthy();
    expect(screen.getByText('Basahin natin:')).toBeTruthy();
    expect(screen.getByText(/Doctrina Christiana noong 1593/)).toBeTruthy();
  });

  it('navigates by approved topic order and ends at the module list', async () => {
    const view = render(<StorybookTopicScreen topicId="topic-1-1" />);
    await waitFor(() => expect(screen.getByLabelText('Susunod na paksa')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Susunod na paksa'));
    await waitFor(() => expect(mockSetParams).toHaveBeenLastCalledWith({ topicId: 'topic-1-2' }));
    view.rerender(<StorybookTopicScreen topicId="topic-1-2" />);
    await waitFor(() => expect(screen.getAllByText('Ano Ba ang Silabaryo?')).toBeTruthy());
    expect(screen.queryByText('Ang Pinagmulan ng Baybayin')).toBeNull();
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
    await waitFor(() => expect(screen.getByLabelText('Susunod na paksa')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Susunod na paksa'));

    expect(localLearnerService.completeTopic).toHaveBeenCalledWith('topic-1-1');
    expect(mockSetParams).not.toHaveBeenCalled();

    resolveSave();
    await waitFor(() => expect(mockSetParams).toHaveBeenCalledWith({ topicId: 'topic-1-2' }));
  });

  it('protects against rapid repeated Next clicks with single save and navigation', async () => {
    const { localLearnerService } = jest.requireMock('../../../../database/services/localLearnerService');
    jest.mocked(localLearnerService.completeTopic).mockClear();

    let resolveSave!: () => void;
    jest.mocked(localLearnerService.completeTopic).mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveSave = () => resolve(); })
    );

    render(<StorybookTopicScreen topicId="topic-1-1" />);
    await waitFor(() => expect(screen.getByLabelText('Susunod na paksa')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Susunod na paksa'));
    fireEvent.press(screen.getByLabelText('Susunod na paksa'));

    expect(localLearnerService.completeTopic).toHaveBeenCalledTimes(1);

    resolveSave();
    await waitFor(() => expect(mockSetParams).toHaveBeenCalledTimes(1));
  });

  it('does not navigate if persistence fails', async () => {
    const { localLearnerService } = jest.requireMock('../../../../database/services/localLearnerService');
    jest.mocked(localLearnerService.completeTopic).mockRejectedValueOnce(new Error('Invalid VFS state'));

    render(<StorybookTopicScreen topicId="topic-1-1" />);
    await waitFor(() => expect(screen.getByLabelText('Susunod na paksa')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Susunod na paksa'));

    await waitFor(() => expect(localLearnerService.completeTopic).toHaveBeenCalledWith('topic-1-1'));
    expect(mockSetParams).not.toHaveBeenCalled();
  });

  it('uses the shared learner header controls and opens Settings', () => {
    render(<StorybookTopicScreen topicId="topic-1-1" />);
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
    fireEvent(screen.getByTestId('story-image-column'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 420, height: 600 } },
    });
    fireEvent(screen.getByTestId('story-content'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 240 } },
    });
    await waitFor(() => {
      const videoStyle = StyleSheet.flatten(screen.getByTestId('story-visual-frame').props.style);
      const titleStyle = StyleSheet.flatten(screen.getByText('Ang Pinagmulan ng Baybayin').props.style);
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
    [390, 844], [726, 360], [844, 390], [768, 1024], [1440, 900],
  ])('uses the same template and visual sizing for every topic at %s × %s', (width, height) => {
    setViewport(width, height);
    const view = render(<StorybookTopicScreen topicId="topic-1-1" />);
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
      return [
        'storybook-page', 'story-image-column', 'story-visual-frame',
        'story-content-column', 'story-title', 'story-paragraph-0',
        'story-highlight', 'story-speech-bubble', 'baya-mascot', 'story-navigation',
      ].map((id) => StyleSheet.flatten(screen.getByTestId(id).props.style));
    };
    const topicOneTemplate = measureAndReadTemplate();
    view.rerender(<StorybookTopicScreen topicId="topic-1-2" />);
    expect(measureAndReadTemplate()).toEqual(topicOneTemplate);
    expect(screen.queryByText('ANG BAYBAYIN BILANG SILABARYO')).toBeNull();
    expect(screen.getByText('Ang Baybayin ay hindi alpabeto, isa itong SILABARYO.')).toBeTruthy();
    expect(screen.getByText('ᜊ = Ba\nᜃ = Ka\nᜆ = Ta')).toBeTruthy();
    expect(screen.getByText(/Doctrina Christiana noong 1593/)).toBeTruthy();
    expect(screen.queryByTestId('topic-intro-video-player')).toBeNull();
    expect(screen.getByTestId('story-image-placeholder')).toBeTruthy();
  });

  it('keeps a bounded, nonzero video frame while rotating through portrait and short landscape', () => {
    const view = render(<StorybookTopicScreen topicId="topic-1-1" />);
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
    [590, 400, true],
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
    await waitFor(() => expect(screen.getByTestId('story-content')).toBeTruthy());
    fireEvent(screen.getByTestId('storybook-page'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 92, width, height: Math.max(0, height - 152) } },
    });
    expect(screen.getByTestId('story-navigation')).toBeTruthy();
    const lessonColumn = within(screen.getByTestId('story-content-column'));
    expect(within(screen.getByTestId('activity-header')).getByText('Ang Kasaysayan at Kahalagahan')).toBeTruthy();
    expect(lessonColumn.queryByText('Ang Kasaysayan at Kahalagahan')).toBeNull();
    expect(lessonColumn.getByText('Ang Pinagmulan ng Baybayin')).toBeTruthy();
    if (stacked) {
      expect(screen.queryByTestId('topic-intro-video-player')).toBeTruthy();
    } else {
      expect(within(screen.getByTestId('story-image-column')).getByTestId('topic-intro-video-player')).toBeTruthy();
      expect(StyleSheet.flatten(screen.getByTestId('story-content-column').props.style).flex).toBeGreaterThan(0.5);
      expect(StyleSheet.flatten(screen.getByTestId('story-content').props.style).paddingRight).toBe(0);
    }
    await waitFor(() => {
      const style = StyleSheet.flatten(screen.getByTestId('storybook-page').props.style);
      expect(style.flexDirection).toBe(stacked ? 'column' : 'row');
    });
    const pageStyle = StyleSheet.flatten(screen.getByTestId('storybook-page').props.style);
    if (stacked) expect(pageStyle.paddingHorizontal).toBeGreaterThanOrEqual(16);
    expect(StyleSheet.flatten(screen.getByTestId('story-navigation').props.style).flexShrink).toBe(0);
    const headerStyle = StyleSheet.flatten(screen.getByTestId('activity-header').props.style);
    const compactHeader = mockLayout.isPhone || mockLayout.isCompactHeight;
    if (mockLayout.isPhonePortrait) {
      expect(headerStyle.minHeight).toBe(110);
    } else {
      expect(headerStyle.height).toBe(
        mockLayout.isPhoneLandscape ? 52 : compactHeader ? 68 : 88,
      );
    }
    const backButtonStyle = StyleSheet.flatten(screen.getByLabelText('Back').props.style);
    const settingsButtonStyle = StyleSheet.flatten(screen.getByLabelText('Settings').props.style);
    const backControlSize = mockLayout.isPhoneLandscape ? 32 : compactHeader ? 48 : 64;
    const settingsControlSize = mockLayout.isPhoneLandscape ? 30 : compactHeader ? 40 : 52;
    expect(backButtonStyle.width).toBe(backControlSize);
    expect(backButtonStyle.height).toBe(backControlSize);
    expect(settingsButtonStyle.width).toBe(settingsControlSize);
    expect(settingsButtonStyle.height).toBe(settingsControlSize);
    if (stacked) {
      const imageStyle = StyleSheet.flatten(screen.getByTestId('story-image-column').props.style);
      expect(imageStyle.maxHeight).toBe('40%');
      expect(StyleSheet.flatten(screen.getByTestId('story-content').props.style).flexDirection).toBe('column');
      const guideStyle = StyleSheet.flatten(screen.getByTestId('story-highlight').props.style);
      expect(guideStyle.flexDirection).toBe('column');
      expect(guideStyle.alignItems).toBe('flex-end');
      const bubbleStyle = StyleSheet.flatten(screen.getByTestId('story-speech-bubble').props.style);
      expect(bubbleStyle.flexShrink).toBe(0);
      expect(bubbleStyle.flexBasis).toBe('auto');
    }
  });
});
