import { approvedCurriculum } from '../approvedCurriculum';
import type {
  ActivityStep,
  SlideItem,
  SlideStepContent,
  TopicActivityData,
} from "../types";
import { baybayinSyllabaryHighlights, baybayinSyllabaryText } from '../baybayinSyllabary';

const moduleOne = approvedCurriculum.find(item => item.id === 'module-1')!;
const topic = moduleOne.topics.find(item => item.id === 'topic-1-2')!;

export const topic12Steps: ActivityStep[] = [
  {
    id: "topic-1-2-step-1",
    type: "slide",
    title: topic.title,
    ctaLabel: "Tapusin ang Aralin",
    content: {
      badge: "KASAYSAYAN AT KAHALAGAHAN",
      number: 1,
      totalInDeck: 1,
      title: topic.title,
      content: baybayinSyllabaryText,
      storyHighlight: "Ang Baybayin ay isang SILABARYO, hindi alpabeto.",
      storyMessage: "Basa tayo ng pantig, hindi paisa-isang letra!",
      highlightWords: baybayinSyllabaryHighlights,
      illustrationPlaceholder: "Paano Gumagana ang Baybayin (Silabaryo)",
      illustrationTheme: "syllabary",
    } satisfies SlideStepContent,
  },
];

/**
 * Existing activity preview data for Module 1 Topic 1.2: Paano ba gumagana ang Baybayin?
 */
export const topic12Slides: SlideItem[] = topic12Steps
  .filter((step) => step.type === "slide")
  .map((step) => ({ ...(step.content as SlideStepContent), id: step.id }));

export const topic12ActivityData: TopicActivityData = {
  id: "topic-1-2",
  moduleId: "module-1",
  moduleTitle: moduleOne.title,
  title: topic.title,
  type: "concept",
  activityIndex: 2,
  totalActivitiesInModule: moduleOne.topics.length,
  steps: topic12Steps,
  slides: topic12Slides,
  video: {
    title: topic.title,
    source: null,
    isAvailable: false,
  },
};
