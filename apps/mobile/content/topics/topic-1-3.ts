import type {
  ActivityStep,
  SlideItem,
  SlideStepContent,
  TopicActivityData,
} from "../types";
import { approvedCurriculum } from "../approvedCurriculum";

function getModuleOne() {
  const approvedModule = approvedCurriculum.find((item) => item.id === "module-1");
  if (!approvedModule) throw new Error("Approved Module 1 curriculum is missing.");
  return approvedModule;
}

const module = getModuleOne();

type StoryBody = Omit<SlideStepContent, "title" | "number" | "totalInDeck">;

const storyBodies: Readonly<Record<string, StoryBody>> = Object.freeze({
  "topic-1-3": {
    subtitle: "Maligayang pagdating sa mundo ng mga simbolo!",
    openingNarration: "Maligayang pagdating sa mundo ng mga simbolo!",
    content:
      "Ang Baybayin ay binubuo ng labimpitong (17) payak na simbolo.\n\nMay tatlong (3) patinig at labing-apat (14) na katinig.",
    storyHighlight: "17 simbolo lang ang kailangan mong matutunan!",
    storyMessage: "17 simbolo lang ang kailangan mong matutunan!",
    highlightWords: [
      "17 simbolo",
      "labimpitong (17)",
      "17",
      "patinig",
      "katinig",
      "tatlong (3)",
      "labing-apat (14)",
      "Patinig",
      "Katinig",
      "Baybayin",
      "simbolo",
    ],
  },
  "topic-1-4": {
    subtitle: "Napansin mo ba?",
    openingNarration: "Napansin mo ba?",
    content:
      "Sa Baybayin, iisa lang ang simbolo para sa E at I (ᜁ), at iisa rin para sa O at U (ᜂ).\n\nBakit kaya? Noong unang panahon, malayang nagpapalitan ang tunog ng E at I, pati na rin ng O at U, nang hindi nagbabago ang kahulugan ng salita!",
    storyHighlight: "Isang simbolo lang dahil magkalapit ang tunog nila!",
    storyMessage: "Isang simbolo lang dahil magkalapit ang tunog nila!",
    highlightWords: [
      "E at I",
      "O at U",
      "nagpapalitan",
      "kahulugan",
      "ᜁ",
      "ᜂ",
      "iisa lang",
      "simbolo",
    ],
  },
  "topic-1-5": {
    subtitle: "Isa pang sorpresa!",
    openingNarration: "Isa pang sorpresa!",
    content:
      "Ang tunog ng Da at Ra ay iisa lang din ang simbolo sa Baybayin (ᜇ).\n\nSa ating wika, ang titik D ay madalas maging R kapag napagigitnaan ng mga patinig. Kaya sa sinaunang pagsulat, iisang simbolo lang ang kailangan para sa dalawang tunog na ito!",
    storyHighlight: "Handa ka na bang kilalanin ang mga simbolo?",
    storyMessage: "Handa ka na bang kilalanin ang mga simbolo?",
    highlightWords: [
      "Da at Ra",
      "iisang simbolo",
      "patinig",
      "nagiging R",
      "ᜇ",
      "titik D",
      "R",
      "D",
    ],
  },
});

function createStoryStep(topicId: string): ActivityStep {
  const topic = module.topics.find((item) => item.id === topicId);
  const body = storyBodies[topicId];
  if (!topic || !body) throw new Error(`Approved story content is missing for ${topicId}.`);

  return {
    id: `${topicId}-story`,
    type: "story",
    title: topic.title,
    content: {
      ...body,
      title: topic.title,
      number: 1,
      totalInDeck: 1,
    } satisfies SlideStepContent,
  };
}

function createTopicActivityData(topicId: string): TopicActivityData {
  const index = module.topics.findIndex((topic) => topic.id === topicId);
  const topic = module.topics[index];
  if (!topic || !storyBodies[topicId]) throw new Error(`Topic ${topicId} is not in the approved curriculum.`);
  const steps = [createStoryStep(topicId)];
  const content = steps[0].content as SlideStepContent;

  return {
    id: topic.id,
    moduleId: module.id,
    moduleTitle: module.title,
    title: topic.title,
    type: "story",
    activityIndex: index + 1,
    totalActivitiesInModule: module.topics.length,
    steps,
    slides: [{ ...content, id: steps[0].id }],
    video: { title: topic.title, source: null, isAvailable: false },
  };
}

export const topic13Steps: ActivityStep[] = [createStoryStep("topic-1-3")];
export const topic14Steps: ActivityStep[] = [createStoryStep("topic-1-4")];
export const topic15Steps: ActivityStep[] = [createStoryStep("topic-1-5")];

export const topic13Slides: SlideItem[] = topic13Steps.map((step) => ({
  ...(step.content as SlideStepContent),
  id: step.id,
}));
export const topic14Slides: SlideItem[] = topic14Steps.map((step) => ({
  ...(step.content as SlideStepContent),
  id: step.id,
}));
export const topic15Slides: SlideItem[] = topic15Steps.map((step) => ({
  ...(step.content as SlideStepContent),
  id: step.id,
}));

export const topic13ActivityData = createTopicActivityData("topic-1-3");
export const topic14ActivityData = createTopicActivityData("topic-1-4");
export const topic15ActivityData = createTopicActivityData("topic-1-5");
