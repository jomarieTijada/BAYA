import React, { type ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { StorySpeechBubble } from "./StorySpeechBubble";
import { StoryMascot } from "./StoryMascot";
import { storyGuideStyles as styles } from "./storyGuideStyles";

const MASCOT_PROMINENCE_SCALE = 1.4;
const MAX_SPREAD_MASCOT_WIDTH = 220;

export type StoryGuideProps = {
  compact?: boolean;
  highlight?: string;
  highlightWords?: string[];
  stackGuide?: boolean;
  landscapeCompact?: boolean;
  message?: string;
  bubbleContent?: ReactNode;
  onMascotPress?: () => void;
  mascotAccessibilityLabel?: string;
  mascotSpeaking?: boolean;
  maxSpreadMascotWidth?: number;
  fullBodyMascot?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * BayaStoryGuide (StoryGuide):
 * Custom storybook learning companion presentation with:
 * - Half-body BAYA by default, with an optional full-body topic presentation.
 * - Custom storybook speech bubble card (warm cream paper #FFF9EE, soft apricot border #F5C799).
 * - Seamless curved dialogue tail pointing directly to BAYA's face.
 * - Shared responsive sizing across story and character topics.
 * - Large, child-friendly spoken message without artificial labels or headings.
 */
export function StoryGuide({
  compact = false,
  highlight,
  highlightWords,
  stackGuide = false,
  landscapeCompact = false,
  message,
  bubbleContent,
  onMascotPress,
  mascotAccessibilityLabel,
  mascotSpeaking = false,
  maxSpreadMascotWidth = MAX_SPREAD_MASCOT_WIDTH,
  fullBodyMascot = false,
  style,
}: StoryGuideProps) {
  const { isDesktop, isTablet, isPhoneLandscape, isPhonePortrait: layoutPhonePortrait, width } = useResponsiveLayout();
  const mobileStack = stackGuide || layoutPhonePortrait;
  const effectiveLandscape = landscapeCompact || isPhoneLandscape;

  const preferredMascotWidth = mobileStack
    ? (effectiveLandscape ? 84 : 108)
    : effectiveLandscape
    ? 96
    : isDesktop
      ? 360
      : isTablet
        ? 270
        : 190;

  const columnWidth = mobileStack ? width - 48 : (width - 64) * 0.57;
  const baseMascotWidth = Number.isFinite(columnWidth)
    ? Math.min(preferredMascotWidth, Math.max(mobileStack ? 72 : 100, Math.round(columnWidth * (mobileStack ? 0.26 : 0.48))))
    : preferredMascotWidth;
  const mascotWidth = Math.min(
    Math.round(baseMascotWidth * MASCOT_PROMINENCE_SCALE),
    isDesktop || isTablet ? maxSpreadMascotWidth : Infinity,
  );

  // Intentional half-body height: exactly 70% of mascot width
  // Shows salakot, face, glasses, beak, waving wing, and upper torso; conceals feet
  const halfBodyHeight = Math.round(mascotWidth * 0.7);

  const takeawayText = message || highlight || "";

  if (!takeawayText && !bubbleContent) return null;

  return (
    <View
      style={[
        styles.guideContainer,
        isDesktop && styles.guideContainerDesktop,
        compact && styles.guideContainerCompact,
        effectiveLandscape && styles.guideContainerLandscape,
        mobileStack && styles.guideContainerPhonePortrait,
        style,
      ]}
      testID="story-highlight"
    >
      {/* Custom Storybook Speech Bubble: Sits to the LEFT of BAYA */}
      <StorySpeechBubble
        takeawayText={takeawayText}
        highlightWords={highlightWords}
        compact={compact}
        effectiveLandscape={effectiveLandscape}
        isDesktop={isDesktop}
        isTablet={isTablet}
        stackGuide={mobileStack}
      >{bubbleContent}</StorySpeechBubble>
      <StoryMascot
        mascotWidth={mascotWidth}
        halfBodyHeight={halfBodyHeight}
        fullBody={fullBodyMascot}
        isDesktop={isDesktop}
        compact={compact}
        effectiveLandscape={effectiveLandscape}
        isPhonePortrait={mobileStack}
        onPress={onMascotPress}
        accessibilityLabel={mascotAccessibilityLabel}
        speaking={mascotSpeaking}
      />
    </View>
  );
}

export { StoryGuide as BayaStoryGuide };
