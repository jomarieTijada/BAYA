import React from 'react';
import { ActivityResumeBoundary } from '../../../modules/resume/ActivityResumeBoundary';
import { useLocalSearchParams } from 'expo-router';
import { StorybookTopicScreen } from '../../../components/learner/story/StorybookTopicScreen';
import { Topic2_1Screen, Topic2_2Screen } from '../../../components/learner/characters/CharacterTopicScreen';
import { WritingPracticeScreen } from '../../../components/learner/writing/WritingPracticeScreen';

function ActivityContent() {
  const { topicId, lessonPage } = useLocalSearchParams<{ topicId: string; lessonPage?: string }>();
  if (topicId === 'topic-2-1') return <Topic2_1Screen />;
  if (topicId === 'topic-2-2') return <Topic2_2Screen />;
  if (topicId === 'topic-3-1' || topicId === 'topic-3-2') return <WritingPracticeScreen topicId={topicId} />;
  return <StorybookTopicScreen topicId={topicId ?? ''} initialPage={(() => {
    if (lessonPage === 'content') {
      return 'content';
    } else {
      return 'introduction';
    }
  })()} />;
}

export default function TopicActivityRoute() {
  const { topicId, lessonPage, writingIndex } = useLocalSearchParams<{ topicId: string; lessonPage?: string; writingIndex?: string }>();
  return <ActivityResumeBoundary initialWritingIndex={writingIndex} initialPage={lessonPage} key={topicId} topicId={topicId ?? ""}><ActivityContent /></ActivityResumeBoundary>;
}
