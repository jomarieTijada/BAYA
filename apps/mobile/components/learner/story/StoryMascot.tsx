import React from "react";
import { Pressable, View } from "react-native";
import { BayaMascot } from "../../branding/BayaMascot";
import { AppIcon } from "../../ui/AppIcon";
import { storyGuideStyles as styles } from "./storyGuideStyles";
export function StoryMascot({
  mascotWidth,
  halfBodyHeight,
  fullBody,
  isDesktop,
  compact,
  effectiveLandscape,
  isPhonePortrait,
  onPress,
  accessibilityLabel,
  speaking = false,
}: {
  mascotWidth: number;
  halfBodyHeight: number;
  fullBody: boolean;
  isDesktop: boolean;
  compact: boolean;
  effectiveLandscape: boolean;
  isPhonePortrait: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  speaking?: boolean;
}) {
  const mascot = <BayaMascot
    autoplay={process.env.NODE_ENV !== "test"}
    crop="default"
    decorative
    size={mascotWidth}
    state={onPress ? "idle" : "wave"}
  />;
  return (
    <View
      style={[
        styles.mascotContainer,
        {
          height: fullBody ? mascotWidth : halfBodyHeight,
          width: mascotWidth,
        },
        isDesktop && styles.mascotContainerDesktop,
        compact && styles.mascotContainerCompact,
        effectiveLandscape && styles.mascotContainerLandscape,
        isPhonePortrait && styles.mascotContainerPhonePortrait,
      ]}
      testID="baya-mascot"
    >
      {onPress ? <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ selected: speaking }}
        onPress={onPress}
        style={styles.mascotButton}
        testID="baya-pronunciation-button"
      >
        {mascot}
        <View style={[styles.mascotSoundIcon, fullBody && { bottom: Math.round(mascotWidth * 0.17), right: Math.round(mascotWidth * 0.21) }]}><AppIcon name="sound" color="onPrimary" size={16} /></View>
      </Pressable> : mascot}
    </View>
  );
}
