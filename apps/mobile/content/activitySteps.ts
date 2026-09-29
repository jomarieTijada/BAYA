import type {
  ActivityStep,
  SlideStepContent,
  TopicActivityData,
  VideoStepContent,
} from "./types";

/**
 * Resolves the array of ActivityStep for a topic, converting legacy data if steps array is missing.
 */
export function getActivitySteps(data: TopicActivityData): ActivityStep[] {
  if (data.steps && data.steps.length > 0) {
    return data.steps;
  }

  // Fallback conversion for legacy data structures
  const generatedSteps: ActivityStep[] = [];
  if (data.video?.source && data.video.isAvailable !== false) {
    generatedSteps.push({
      id: `${data.id}-video`,
      type: "video",
      title: data.video.title,
      requiresCompletion: true,
      ctaLabel: "Susunod",
      content: {
        badge: "PANOORIN",
        title: data.video.title,
        durationText: data.video.durationText || "2:15",
        source: data.video.source,
        metadata: data.video.metadata,
        isAvailable: data.video.isAvailable ?? true,
      } satisfies VideoStepContent,
    });
  }

  if (data.slides) {
    const total = data.slides.length;
    data.slides.forEach((s, idx) => {
      generatedSteps.push({
        id: `${data.id}-${s.id}`,
        type: "slide",
        title: s.title,
        ctaLabel: idx === total - 1 ? "Tapusin ang Aralin" : "Susunod na Slide",
        content: {
          ...s,
          badge: data.moduleTitle,
          number: s.number,
          totalInDeck: total,
          title: s.title,
          subtitle: s.subtitle,
          content: s.content,
          illustrationPlaceholder: s.illustrationPlaceholder,
          illustrationTheme: s.illustrationTheme,
          storyCards: s.storyCards,
        } satisfies SlideStepContent,
      });
    });
  }

  return generatedSteps;
}

export function unavailableActivity(id: string): TopicActivityData {
  return {
    id,
    moduleId: "",
    moduleTitle: "Aralin",
    title: "Hindi pa available ang nilalaman.",
    type: "unavailable",
    activityIndex: 0,
    totalActivitiesInModule: 0,
    steps: [],
    slides: [],
    video: { title: "", source: null, isAvailable: false },
  };
}
