import { approvedCurriculum } from './approvedCurriculum';
import { baybayinHistoryContent, baybayinVideoIntroduction } from './baybayinIntroduction';
import { baybayinSyllabaryHighlights, baybayinSyllabaryText } from './baybayinSyllabary';
import {
  topic13ActivityData,
  topic14ActivityData,
  topic15ActivityData,
} from './topics/topic-1-3';
import type { SlideStepContent, TopicActivityData } from './types';

const approvedTopicActivities: Readonly<Record<string, TopicActivityData>> = {
  [topic13ActivityData.id]: topic13ActivityData,
  [topic14ActivityData.id]: topic14ActivityData,
  [topic15ActivityData.id]: topic15ActivityData,
};

const approvedStories: Readonly<Record<string, Omit<SlideStepContent, 'number' | 'totalInDeck'>>> = {
  'topic-1-1': {
    ...baybayinHistoryContent,
  },
  'topic-1-2': {
    title: 'Ano Ba ang Silabaryo?',
    content: baybayinSyllabaryText,
    highlightWords: baybayinSyllabaryHighlights,
    examplesLabel: 'Basahin natin:',
    examples: 'ᜊ = Ba\nᜃ = Ka\nᜆ = Ta',
    storyMessage: 'Isang simbolo, isang pantig! Ganoon kadali ang Baybayin.',
  },
};

export function getApprovedStorybookActivity(id: string): TopicActivityData | null {
  const splitTopicActivity = approvedTopicActivities[id];
  if (splitTopicActivity) return splitTopicActivity;
  const module = approvedCurriculum.find((item) => item.topics.some((topic) => topic.id === id));
  const story = Object.prototype.hasOwnProperty.call(approvedStories, id) ? approvedStories[id] : undefined;
  if (!module || !story) return null;
  const index = module.topics.findIndex((topic) => topic.id === id);
  const topic = module.topics[index];
  return {
    id, moduleId: module.id, moduleTitle: module.title, title: topic.title,
    activityIndex: index + 1, totalActivitiesInModule: module.topics.length,
    type: 'story', slides: [],
    video: id === 'topic-1-1'
      ? { title: 'Baybayin Song', introduction: baybayinVideoIntroduction, source: { type: 'asset', assetId: 'baybayin-song' }, isAvailable: true }
      : { title: '', source: null, isAvailable: false },
    steps: [{ id: `${id}-story`, type: 'story', title: story.title,
      content: { ...story, badge: topic.title, number: 1, totalInDeck: 1 } }],
  };
}
export function getApprovedStorybookActivities(): TopicActivityData[] {
  return approvedCurriculum.flatMap((module) => module.topics.flatMap((topic) => {
    const activity = getApprovedStorybookActivity(topic.id);
    return activity ? [activity] : [];
  }));
}
