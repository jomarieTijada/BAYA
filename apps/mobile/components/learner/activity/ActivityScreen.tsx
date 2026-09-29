import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { Colors, Spacing } from "../../../constants/theme";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { type TopicActivityData } from "../../../content/types";
import { MediaFallback } from "../../media/MediaFallback";
import { activityContentService } from "../../../database/services/activityContentService";
import {
  getActivityData,
  getActivitySteps,
  unavailableActivity,
} from "../../../content/activities";
import { LearnerAppShell } from "../LearnerAppShell";
import { ActivityHeader } from "./ActivityHeader";
import { ActivityNavigationControls } from "./ActivityNavigationControls";
import { ActivityRenderer } from "./ActivityRenderer";

export type ActivityScreenProps = {
  data?: TopicActivityData;
  onBack?: () => void;
  onComplete?: () => void;
  topicId?: string;
};

/**
 * Mobile Learning Activity Screen.
 * Layout Structure:
 * - Compact Header with Integrated Progress
 * - Fullscreen Learning Content Area (flex: 1)
 * - Mobile Floating Navigation Controls (Bottom-left circular back, Bottom-right circular next)
 */
export type VideoState = "not_started" | "playing" | "completed";

export function ActivityScreen(props: ActivityScreenProps) {
  const [loaded, setLoaded] = useState<TopicActivityData | null>(null);
  useEffect(() => {
    let active = true;
    if (!props.data && props.topicId)
      activityContentService.getByTopicId(props.topicId).then((value) => {
        if (active) setLoaded(value);
      });
    return () => {
      active = false;
    };
  }, [props.data, props.topicId]);
  const data =
    props.data ??
    (loaded?.id === props.topicId ? loaded : null) ??
    (props.topicId ? getActivityData(props.topicId) : null) ??
    unavailableActivity(props.topicId ?? "");
  return <ActivitySession key={JSON.stringify(data)} {...props} data={data} />;
}

function ActivitySession({
  data,
  onBack,
  onComplete,
  topicId = "topic-1-1",
}: ActivityScreenProps) {
  const router = useRouter();
  const { isCompactHeight, isDesktop, isPhone, isPhoneLandscape, isTablet } =
    useResponsiveLayout();
  const compact = isPhone || isCompactHeight;
  const landscapeCompact = isPhoneLandscape;

  // Responsive Content Container Width (Separated from full-width application shell header):
  // - Mobile: 100% width
  // - Tablet: max-width ~760px
  // - Desktop: max-width ~960px (900-1000px) centered
  const contentMaxWidth: number | `${number}%` = isDesktop
    ? 960
    : isTablet
      ? 760
      : "100%";

  // Retrieve data-driven activity content and sequential steps
  const activityData = data || unavailableActivity(topicId);
  const steps = getActivitySteps(activityData);
  const totalSteps = steps.length;

  // Track active step index (0 to totalSteps - 1)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Frontend-only video state: not_started -> playing -> completed

  // Track completion state per step
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {},
  );

  const currentStep = steps[currentStepIndex];
  const isFinalStep = currentStepIndex === totalSteps - 1;
  const isVideoStep = currentStep?.type === "video";
  const requiresCompletion =
    isVideoStep ||
    currentStep?.type === "audio" ||
    currentStep?.requiresCompletion;
  const isCurrentStepCompleted =
    !!currentStep &&
    (!requiresCompletion || Boolean(completedSteps[currentStep.id]));

  const handleStepComplete = () => {
    setCompletedSteps((prev) => ({
      ...prev,
      [currentStep.id]: true,
    }));
  };

  /**
   * Back Navigation Rule:
   * If current step > 0: Back goes to previous learning step.
   * If current step === 0: Exit activity.
   */
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/learner/lessons");
    }
  };

  const handleOpenSettings = () => {
    router.push("/learner/settings");
  };

  /**
   * Forward Navigation:
   * Advances step or completes the entire activity on final step.
   */
  const handleAdvance = () => {
    if (!isCurrentStepCompleted) return;

    if (isFinalStep) {
      if (onComplete) {
        onComplete();
      } else {
        router.replace("/learner/lessons");
      }
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  if (!currentStep)
    return (
      <LearnerAppShell
        activeRoute="/learner/lessons"
        header={(
          <ActivityHeader
            onBack={handleBack}
            onOpenSettings={handleOpenSettings}
            title={activityData.moduleTitle || "Aralin"}
            subtitle="Nilalaman ng aralin"
          />
        )}
        testID="activity-screen-root"
      >
        <MediaFallback
          title="Hindi pa available ang nilalaman ng araling ito."
          testID="activity-unavailable"
        />
      </LearnerAppShell>
    );

  return (
    <LearnerAppShell
      activeRoute="/learner/lessons"
      backgroundColor={!isVideoStep ? "#FFFDF7" : Colors.background}
      header={(
        <ActivityHeader
          currentStep={currentStepIndex + 1}
          onBack={handleBack}
          onOpenSettings={handleOpenSettings}
          subtitle={`Topic ${activityData.activityIndex} of ${activityData.totalActivitiesInModule}`}
          title={activityData.moduleTitle}
          totalSteps={totalSteps}
        />
      )}
      testID="activity-screen-root"
    >
      {/* 2. Main Fullscreen Learning Stage: Card container for Video; Fullscreen Storybook Spread for Concepts/Slides */}
      <View
        style={[
          styles.mainContainer,
          !isVideoStep && styles.mainContainerStory,
        ]}
        testID="activity-main-container"
      >
        <View
          style={[
            styles.learningCardContainer,
            isVideoStep
              ? { maxWidth: contentMaxWidth }
              : [
                  styles.storySpreadContainer,
                  isDesktop && styles.storySpreadContainerDesktop,
                ],
          ]}
          testID="activity-card-container"
        >
          <ActivityRenderer
            compact={compact}
            isStepCompleted={isCurrentStepCompleted}
            landscapeCompact={landscapeCompact}
            onStepComplete={handleStepComplete}
            step={currentStep}
          />

          {/* Floating Controls: Integrated in bottom corners */}
          <ActivityNavigationControls
            compact={compact}
            disabledHint="Tapusin muna ang video"
            isFinalStep={isFinalStep}
            isVideoStep={isVideoStep}
            landscapeCompact={landscapeCompact}
            nextEnabled={isCurrentStepCompleted}
            nextIcon={
              isVideoStep && isCurrentStepCompleted
                ? "check"
                : isFinalStep
                  ? "arrowRight"
                  : "arrowRight"
            }
            nextLabel={currentStep.ctaLabel}
            onBack={handleBack}
            onNext={handleAdvance}
            showBack={currentStepIndex > 0 || !isVideoStep}
            showNext={true}
          />
        </View>
      </View>
    </LearnerAppShell>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: "center",
    flex: 1,
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: "100%",
  },
  mainContainerStory: {
    backgroundColor: "#FFFDF7",
    paddingHorizontal: Spacing.md,
    paddingVertical: 0,
  },
  learningCardContainer: {
    alignItems: "stretch",
    alignSelf: "center",
    flex: 1,
    flexGrow: 1,
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },
  storySpreadContainer: {
    alignItems: "stretch",
    alignSelf: "center",
    flex: 1,
    flexGrow: 1,
    height: "100%",
    maxWidth: "100%",
    width: "100%",
  },
  storySpreadContainerDesktop: {
    maxWidth: 1200, // Generous full two-page spread on large screens
  },
});
