import React, { type ReactNode } from "react";
import { SpeechBubbleTail } from "../../ui/SpeechBubbleTail";
import { View, Text, ScrollView, Pressable } from "react-native";
import { AppIcon } from "../../ui/AppIcon";
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
  floating = false,
  maxHeight,
  onClose,
}: {
  takeawayText: string;
  children?: ReactNode;
  highlightWords?: string[];
  compact: boolean;
  effectiveLandscape: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  stackGuide: boolean;
  floating?: boolean;
  maxHeight?: number;
  onClose?: () => void;
}) {
  const message = children ?? <Text style={[
    styles.bubbleText,
    isDesktop && styles.bubbleTextDesktop,
    isTablet && styles.bubbleTextTablet,
    compact && styles.bubbleTextCompact,
    effectiveLandscape && styles.bubbleTextLandscape,
    stackGuide && styles.bubbleTextPhonePortrait,
    floating && { fontSize: 16, lineHeight: 22, textAlign: 'left' },
  ]}>{renderHighlightedText(takeawayText, highlightWords)}</Text>;
  return (
    <View
      style={[
        styles.bubbleCard,
        isDesktop && styles.bubbleCardDesktop,
        isTablet && styles.bubbleCardTablet,
        compact && styles.bubbleCardCompact,
        effectiveLandscape && styles.bubbleCardLandscape,
        stackGuide && styles.bubbleCardPhonePortrait,
        floating && { flex: 0, flexShrink: 1, minHeight: 44, maxHeight, paddingLeft: 12, paddingRight: 44, paddingVertical: 8, justifyContent: 'center' },
      ]}
      testID="story-speech-bubble"
    >
      {floating ? <>
        <Pressable accessibilityRole="button" accessibilityLabel="Isara ang mensahe ni BAYA" onPress={onClose}
          style={({ pressed }) => ({ position: 'absolute', right: 0, top: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <AppIcon name="close" color="accent" size={22} />
        </Pressable>
        <ScrollView style={{ flexShrink: 1 }} testID="story-message-scroll">{message}</ScrollView>
      </> : message}

      {!floating && !stackGuide && <SpeechBubbleTail position="right" size={effectiveLandscape ? 'landscape' : compact ? 'compact' : isTablet ? 'tablet' : 'regular'} />}
    </View>
  );
}
