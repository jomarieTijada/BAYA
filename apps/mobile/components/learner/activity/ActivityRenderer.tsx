import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, FontFamily, Radius, Spacing } from "../../../constants/theme";
import type {
  ActivityStep,
  SlideStepContent,
  VideoStepContent,
} from "./activityData";
import { StoryPage } from "../story/StoryPage";
import { StoryCard } from "../cards/StoryCard";
import { ActivityCard } from "../cards/ActivityCard";
import { AudioPlayer } from "../../media/AudioPlayer";
import { VideoActivityCard } from "./VideoActivityCard";

export type ActivityRendererProps = {
  compact?: boolean;
  isStepCompleted?: boolean;
  landscapeCompact?: boolean;
  onStepComplete?: () => void;
  step: ActivityStep;
};

/**
 * Data-Driven Activity Renderer.
 * Dispatches and renders ONLY THE SINGLE ACTIVE STEP.
 * Video: Card experience.
 * Slide / Concept: Fullscreen two-page storybook spread experience.
 */
export function ActivityRenderer({
  compact = false,
  isStepCompleted = false,
  landscapeCompact = false,
  onStepComplete,
  step,
}: ActivityRendererProps) {
  switch (step.type) {
    case "video": {
      const videoContent = (step.content || {}) as VideoStepContent;
      return (
        <View style={styles.cardWrapper} testID="activity-renderer-video">
          <VideoActivityCard
            compact={compact}
            content={videoContent}
            isWatched={isStepCompleted}
            landscapeCompact={landscapeCompact}
            onWatch={onStepComplete}
            title={step.title}
          />
        </View>
      );
    }

    case "audio":
      return (
        <ActivityCard type="audio">
          <AudioPlayer
            source={(step.content as VideoStepContent)?.source}
            title={step.title}
            onEnd={onStepComplete}
          />
        </ActivityCard>
      );
    case "story":
    case "slide":
    case "concept": {
      const slideContent = (step.content || {}) as SlideStepContent;
      return (
        <StoryCard
          icon={null}
          style={[styles.slideWrapper, { padding: 0, borderWidth: 0 }]}
          testID="activity-renderer-slide"
        >
          <StoryPage
            compact={compact}
            content={slideContent}
            landscapeCompact={landscapeCompact}
          />
        </StoryCard>
      );
    }
    case "quiz":
    case "writing":
    case "practice":
    default: {
      // Clean fallback container ready for future activity modules
      return (
        <ActivityCard
          icon={null}
          style={[styles.cardWrapper, styles.placeholderCard]}
          testID="activity-renderer-default"
        >
          <Text style={styles.placeholderTitle}>{step.title}</Text>
          <Text style={styles.placeholderText}>
            Hindi pa available ang pagsasanay para sa bahaging ito.
          </Text>
        </ActivityCard>
      );
    }
  }
}

const styles = StyleSheet.create({
  cardWrapper: {
    alignItems: "center",
    flex: 1,
    flexGrow: 1,
    width: "100%",
  },
  slideWrapper: {
    alignItems: "stretch",
    flex: 1,
    flexGrow: 1,
    height: "100%",
    width: "100%",
  },
  placeholderCard: {
    backgroundColor: "#FFFDF9",
    borderColor: "#EFE7DA",
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
  },
  placeholderTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
});
