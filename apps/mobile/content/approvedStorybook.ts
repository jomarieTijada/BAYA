import { approvedCurriculum } from './approvedCurriculum';
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
    title: 'Ang Pinagmulan ng Baybayin',
    content: 'Tara at balikan natin kung saan nagmula ang Baybayin.\n\nBago pa man dumating ang mga Kastila, may sarili nang sistema ng pagsusulat ang mga Pilipino.\n\nDahil wala pang papel noon, sa mga puno, kawayan, at dahon sila umuukit gamit ang matutulis na bagay para magsulat ng mga tula at mensahe.',
    storyMessage: 'Ito ay mahalagang bahagi ng pagkatao natin.',
  },
  'topic-1-2': {
    title: 'Ano Ba ang Silabaryo?',
    openingNarration: 'Ang Baybayin ay hindi alpabeto, isa itong SILABARYO.',
    content: `Sanay na tayo sa English alphabet kung saan bawat letra ay may iisang tunog (tulad ng "B" at "A").

Pero ang Baybayin ay hindi alpabeto, isa itong SILABARYO.

Ano'ng pinagkaiba?

Sa Baybayin, ang isang simbolo ay katumbas agad ng isang buong pantig (syllable).

Kaya hindi mo na kailangang paghiwalayin ang mga letra; binabasa agad ang isang simbolo bilang "Ba", "Ka", o "Ta".

Ang salitang Baybayin ay galing mismo sa salitang "baybay", na ang ibig sabihin ay i-spell o hatiin sa pantig ang mga salita.

Ganito na tayo magsulat noon pa man, at ginamit din ang sistemang ito sa mga sinaunang libro tulad ng Doctrina Christiana noong 1593.`,
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
      ? { title: 'Baybayin Song', source: { type: 'asset', assetId: 'baybayin-song' }, isAvailable: true }
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
