import type {
  ActivityStep,
  SlideItem,
  SlideStepContent,
  TopicActivityData,
} from "../types";

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
      subtitle: "Baybayin Bilang Sistemang Pantig",
      openingNarration: "Ang Baybayin ay hindi alpabeto, isa itong SILABARYO.",
      content:
        "Alam mo ba? Ang Baybayin ay hindi tulad ng ating alpabeto ngayon kung saan kailangan nating pagsamahin ang dalawang letra tulad ng B at A para mabuo ang 'Ba'.\n\nSa Baybayin, ito ay isang SILABARYO! Ang bawat isang simbolo tulad ng ᜊ ay buo na at may sarili nang tunog na 'Ba'. Bawat panimulang katinig ay may kasama na agad na tunog na 'A'!",
      storyHighlight: "Ang Baybayin ay isang SILABARYO, hindi alpabeto.",
      storyMessage: "Basa tayo ng pantig, hindi paisa-isang letra!",
      highlightWords: [
        "Baybayin",
        "SILABARYO",
        "silabaryo",
        "alpabeto",
        "pantig",
        "Ba",
        "Ka",
        "Ta",
      ],
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
