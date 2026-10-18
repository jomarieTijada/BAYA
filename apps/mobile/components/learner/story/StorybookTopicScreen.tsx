import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { approvedCurriculum } from '../../../content/approvedCurriculum';
import { getApprovedStorybookActivity } from '../../../content/approvedStorybook';
import type { TopicActivityData } from '../../../content/types';
import { activityContentService } from '../../../database/services/activityContentService';
import { localLearnerService } from '../../../database/services/localLearnerService';
import { LearnerAppShell } from '../LearnerAppShell';
import { LearnerPageHeader } from '../LearnerPageHeader';
import { ActivityHeader } from '../activity/ActivityHeader';
import { VideoPlayer } from '../../media/VideoPlayer';
import { BAYBAYIN_VIDEO_START_SECONDS } from '../../../content/baybayinIntroduction';
import { StoryPage } from './StoryPage';
import { StoryNavigation } from './StoryNavigation';
import { LessonVideoIntroduction } from './LessonVideoIntroduction';

/** Renders every approved topic section inside one shared storybook shell. */
export function StorybookTopicScreen({ topicId, initialPage = 'introduction' }: { topicId: string; initialPage?: 'introduction' | 'content' }) {
  return <StorybookTopicSession key={`${topicId}:${initialPage}`} topicId={topicId} initialPage={initialPage} />;
}

function StorybookTopicSession({ topicId, initialPage }: { topicId: string; initialPage: 'introduction' | 'content' }) {
  const router = useRouter();
  const { isCompactHeight, isPhone, isPhoneLandscape, isTablet } = useResponsiveLayout();
  const compact = isPhone || isTablet || isCompactHeight;
  const [loaded, setLoaded] = useState<TopicActivityData | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [videoTopic, setVideoTopic] = useState<string | null>(initialPage === 'content' ? topicId : null);
  const advancing = useRef(false);
  const data = getApprovedStorybookActivity(topicId) ?? (loaded?.id === topicId ? loaded : null);
  const module = approvedCurriculum.find((item) => item.topics.some((topic) => topic.id === topicId));
  const index = module?.topics.findIndex((topic) => topic.id === topicId) ?? -1;
  const hasIntroduction = Boolean(data?.video.introduction && data.video.isAvailable && data.video.source);
  const showIntroduction = hasIntroduction && videoTopic !== topicId;

  useEffect(() => {
    // Approved story content is already available synchronously. Avoid starting
    // a database read on every topic change while the transition is running.
    if (getApprovedStorybookActivity(topicId)) return;

    let active = true;
    activityContentService.getByTopicId(topicId).then((value) => { if (active) setLoaded(value); });
    return () => { active = false; };
  }, [topicId]);

  const backToTopics = () => router.dismissTo('/learner/lessons');
  const openTopic = (id: string) => {
    // Update the dynamic route in place so the stack does not add a second
    // screen-level transition or remount the story screen.
    // Topic navigation returns to that topic's content, including the video,
    // instead of replaying its welcome slide.
    router.setParams({ topicId: id, lessonPage: 'content' });
  };
  const completeAndNext = async () => {
    if (advancing.current || !module) return;
    advancing.current = true;
    setIsAdvancing(true);
    const target = index < module.topics.length - 1 ? module.topics[index + 1].id : '/learner/lessons';
    try {
      if (__DEV__) console.info('[BAYA Progress] request topicId=%s source=story_next target=%s', topicId, target);
      await localLearnerService.completeTopic(topicId);
      if (__DEV__) console.info('[BAYA Progress] navigate topicId=%s target=%s', topicId, target);
      if (index < module.topics.length - 1) openTopic(module.topics[index + 1].id);
      else backToTopics();
    } catch (error) {
      if (__DEV__) console.warn('[BAYA Progress] request topicId=%s status=failed', topicId, { error, stack: error instanceof Error ? error.stack : undefined });
      Alert.alert('Could not save progress', 'Please try again.');
    } finally {
      advancing.current = false;
      setIsAdvancing(false);
    }
  };

  const step = data?.steps[0] ?? null;
  const content = step && ['story', 'slide', 'concept'].includes(step.type) && step.content && 'content' in step.content
    ? step.content
    : null;
  if (!module || !data || !content) {
    return (
      <LearnerAppShell
        showBottomNavigation={false}
        activeRoute="/learner/lessons"
        backgroundColor="#FFFDF7"
        header={(
          <LearnerPageHeader
            onBack={backToTopics}
            onOpenSettings={() => router.push('/learner/settings')}
            testID="topic-unavailable-header"
            title="Aralin"
          />
        )}
        testID="storybook-topic-screen"
      >
        <View style={styles.unavailable}>
          <Text testID="story-unavailable">Hindi available ang araling ito.</Text>
        </View>
      </LearnerAppShell>
    );
  }

  return (
    <LearnerAppShell
      showBottomNavigation={false}
      activeRoute="/learner/lessons"
      backgroundColor="#FFFDF7"
      footer={(
        <StoryNavigation
          disabled={isAdvancing}
          onPrevious={!showIntroduction && hasIntroduction
            ? () => setVideoTopic(null)
            : index > 0 ? () => openTopic(module.topics[index - 1].id) : undefined}
          previousAccessibilityLabel={!showIntroduction && hasIntroduction ? 'Bumalik sa panimula' : undefined}
          onNext={showIntroduction ? () => setVideoTopic(topicId) : completeAndNext}
          nextLabel={showIntroduction ? 'Panoorin ang Video' : undefined}
          nextAccessibilityLabel={showIntroduction ? 'Panoorin ang Video' : undefined}
          isLast={index === module.topics.length - 1}
        />
      )}
      header={(
        <ActivityHeader
          currentStep={index + 1}
          onBack={backToTopics}
          onOpenSettings={() => router.push('/learner/settings')}
          subtitle={data.title}
          title={module.title}
          totalSteps={module.topics.length}
        />
      )}
      testID="storybook-topic-screen"
    >
      {showIntroduction && data.video.introduction ? (
        <LessonVideoIntroduction introduction={data.video.introduction} compact={compact} landscapeCompact={isPhoneLandscape} />
      ) : <StoryPage
        content={content}
        compact={compact}
        landscapeCompact={isPhoneLandscape}
        visual={data.video.isAvailable && data.video.source ? (
          <VideoPlayer
            compact={compact}
            isLandscapeCompact={isPhoneLandscape}
            source={data.video.source}
            startAtSeconds={data.id === 'topic-1-1' ? BAYBAYIN_VIDEO_START_SECONDS : 0}
            title={data.video.title}
            testID="topic-intro-video-player"
          />
        ) : undefined}
      />}
    </LearnerAppShell>
  );
}

const styles = StyleSheet.create({
  unavailable: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
});
