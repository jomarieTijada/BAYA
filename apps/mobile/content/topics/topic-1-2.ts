import type {
  ActivityStep,
  SlideItem,
  SlideStepContent,
  TopicActivityData,
} from "../types";
import { baybayinSyllabaryHighlights, baybayinSyllabaryText } from '../baybayinSyllabary';

export const topic12Steps: ActivityStep[] = [
  {
    id: "topic-1-2-step-1",
    type: "slide",
    title: "Paano ba gumagana ang Baybayin?",
    ctaLabel: "Tapusin ang Aralin",
    content: {
      badge: "KASAYSAYAN AT KAHALAGAHAN",
      number: 1,
      totalInDeck: 1,
      title: "Paano ba gumagana ang Baybayin?",
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
  moduleTitle: "Pagkilala sa Baybayin",
  title: "Paano ba gumagana ang Baybayin?",
  type: "concept",
  activityIndex: 2,
  totalActivitiesInModule: 3,
  steps: topic12Steps,
  slides: topic12Slides,
  video: {
    title: "Paano ba gumagana ang Baybayin?",
    source: null,
    isAvailable: false,
  },
};
