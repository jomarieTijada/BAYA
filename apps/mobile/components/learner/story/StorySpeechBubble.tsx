import React, { type ReactNode } from "react";
import { Image } from "expo-image";
import { View, Text } from "react-native";
import { storyGuideStyles as styles } from "./storyGuideStyles";
function renderHighlightedText(text: string, highlightWords: string[] = []) {
  if (!highlightWords || highlightWords.length === 0) {
    return text;
  }
  const escaped = highlightWords.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isHighlight = highlightWords.some(
      (w) => w.toLowerCase() === part.toLowerCase(),
    );
    if (isHighlight) {
      return (
        <Text key={index} style={styles.highlightKeyword}>
          {part}
        </Text>
      );
    }
    return part;
  });
}

export function StorySpeechBubble({
  takeawayText,
  children,
  highlightWords,
  compact,
  effectiveLandscape,
  isDesktop,
  isTablet,
  stackGuide,
}: {
  takeawayText: string;
  children?: ReactNode;
  highlightWords?: string[];
  compact: boolean;
  effectiveLandscape: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  stackGuide: boolean;
}) {
  return (
    <View
      style={[
        styles.bubbleCard,
        isDesktop && styles.bubbleCardDesktop,
        isTablet && styles.bubbleCardTablet,
        compact && styles.bubbleCardCompact,
        effectiveLandscape && styles.bubbleCardLandscape,
        stackGuide && styles.bubbleCardPhonePortrait,
      ]}
      testID="story-speech-bubble"
    >
      {/* Spoken message text in large, legible storybook typography */}
      {children ?? <Text
        style={[
          styles.bubbleText,
          isDesktop && styles.bubbleTextDesktop,
          isTablet && styles.bubbleTextTablet,
          compact && styles.bubbleTextCompact,
          effectiveLandscape && styles.bubbleTextLandscape,
          stackGuide && styles.bubbleTextPhonePortrait,
        ]}
      >
        {renderHighlightedText(takeawayText, highlightWords)}
      </Text>}

      {/* Custom smooth curved pointer tail pointing toward BAYA's face */}
      <View
        pointerEvents="none"
        style={[
          styles.tailWrapper,
          isTablet && styles.tailWrapperTablet,
          compact && styles.tailWrapperCompact,
          effectiveLandscape && styles.tailWrapperLandscape,
          stackGuide && styles.tailHidden,
        ]}
      >
        <Image
          accessible={false}
          aria-hidden
          contentFit="contain"
          source={require("../../../assets/icons/lesson/baya_speech_tail.svg")}
          style={[
            styles.tailImage,
            isTablet && styles.tailImageTablet,
            compact && styles.tailImageCompact,
            effectiveLandscape && styles.tailImageLandscape,
          ]}
          transition={0}
        />
      </View>
    </View>
  );
}
