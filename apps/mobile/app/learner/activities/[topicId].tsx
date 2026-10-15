import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StorybookTopicScreen } from '../../../components/learner/story/StorybookTopicScreen';
import { Topic2_1Screen, Topic2_2Screen } from '../../../components/learner/characters/CharacterTopicScreen';
import { WritingPracticeScreen } from '../../../components/learner/writing/WritingPracticeScreen';

export default function TopicActivityRoute() {
  const { topicId, lessonPage } = useLocalSearchParams<{ topicId: string; lessonPage?: string }>();
  if (topicId === 'topic-2-1') return <Topic2_1Screen />;
  if (topicId === 'topic-2-2') return <Topic2_2Screen />;
  if (topicId === 'topic-3-1' || topicId === 'topic-3-2') return <WritingPracticeScreen topicId={topicId} />;
  return <StorybookTopicScreen topicId={topicId ?? ''} initialPage={lessonPage === 'content' ? 'content' : 'introduction'} />;
}
