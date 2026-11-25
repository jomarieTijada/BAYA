import React, { type ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { StorySpeechBubble } from "./StorySpeechBubble";
import { StoryMascot } from "./StoryMascot";
import { storyGuideStyles as styles } from "./storyGuideStyles";

const MASCOT_PROMINENCE_SCALE = 1.4;
const MAX_SPREAD_MASCOT_WIDTH = 220;

export type StoryGuideProps = {
  mascotSize?: number;
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
  mascotDisabled?: boolean;
  mascotLoading?: boolean;
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
  mascotSize,
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
  mascotDisabled = false,
  mascotLoading = false,
  maxSpreadMascotWidth = MAX_SPREAD_MASCOT_WIDTH,
  fullBodyMascot = false,
  style,
}: StoryGuideProps) {
  const { isDesktop, isTablet, isPhoneLandscape, isPhonePortrait: layoutPhonePortrait, width } = useResponsiveLayout();
  const mobileStack = stackGuide || layoutPhonePortrait;
  const effectiveLandscape = landscapeCompact || isPhoneLandscape;

  let preferredMascotWidth;
  if (mobileStack) {
    if (effectiveLandscape) {
      preferredMascotWidth = 84;
    } else {
      preferredMascotWidth = 108;
    }
  } else {
    if (effectiveLandscape) {
      preferredMascotWidth = 96;
    } else {
      if (isDesktop) {
        preferredMascotWidth = 360;
      } else {
        if (isTablet) {
          preferredMascotWidth = 270;
        } else {
          preferredMascotWidth = 190;
        }
      }
    }
  }

  let columnWidth;
  if (mobileStack) {
    columnWidth = width - 48;
  } else {
    columnWidth = (width - 64) * 0.57;
  }
  let baseMascotWidth;
  if (Number.isFinite(columnWidth)) {
    baseMascotWidth = Math.min(preferredMascotWidth, Math.max((() => {
      if (mobileStack) {
        return 72;
      } else {
        return 100;
      }
    })(), Math.round(columnWidth * ((() => {
      if (mobileStack) {
        return 0.26;
      } else {
        return 0.48;
      }
    })()))));
  } else {
    baseMascotWidth = preferredMascotWidth;
  }
  const mascotWidth = mascotSize ?? Math.min(
    Math.round(baseMascotWidth * MASCOT_PROMINENCE_SCALE),
    (() => {
      if (isDesktop || isTablet) {
        return maxSpreadMascotWidth;
      } else {
        return Infinity;
      }
    })(),
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
        disabled={mascotDisabled}
        loading={mascotLoading}
      />
    </View>
  );
}

export { StoryGuide as BayaStoryGuide };
