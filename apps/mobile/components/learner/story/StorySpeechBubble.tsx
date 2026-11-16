import { storyTextSegments } from './storyText';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { Text, Pressable } from '../../../localization/components';
import React, { type ReactNode } from "react";
import { SpeechBubbleTail } from "../../ui/SpeechBubbleTail";
import { View, ScrollView } from 'react-native';
import { AppIcon } from "../../ui/AppIcon";
import { storyGuideStyles as styles } from "./storyGuideStyles";
function renderHighlightedText(text: string, highlightWords: string[] = []) {
  return storyTextSegments(text, highlightWords).map((part, index) => part.highlighted
    ? <Text key={index} verbatim style={styles.highlightKeyword}>{part.text}</Text>
    : part.text);
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
  const { text: localized } = useLocalization();
  const message = children ?? <Text verbatim style={[
    styles.bubbleText,
    isDesktop && styles.bubbleTextDesktop,
    isTablet && styles.bubbleTextTablet,
    compact && styles.bubbleTextCompact,
    effectiveLandscape && styles.bubbleTextLandscape,
    stackGuide && styles.bubbleTextPhonePortrait,
    floating && { fontSize: 16, lineHeight: 22, textAlign: 'left' },
  ]}>{renderHighlightedText(localized(takeawayText), highlightWords?.map(localized))}</Text>;
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
      {(() => {
        if (floating) {
          return <>
        <Pressable accessibilityRole="button" accessibilityLabel="Isara ang mensahe ni BAYA" onPress={onClose}
          style={({ pressed }) => ({ position: 'absolute', right: 0, top: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: (() => {
            if (pressed) {
              return 0.6;
            } else {
              return 1;
            }
          })() })}>
          <AppIcon name="close" color="accent" size={22} />
        </Pressable>
        <ScrollView style={{ flexShrink: 1 }} testID="story-message-scroll">{message}</ScrollView>
      </>;
        } else {
          return message;
        }
      })()}

      {!floating && !stackGuide && <SpeechBubbleTail position="right" size={(() => {
        if (effectiveLandscape) {
          return 'landscape';
        } else {
          if (compact) {
            return 'compact';
          } else {
            if (isTablet) {
              return 'tablet';
            } else {
              return 'regular';
            }
          }
        }
      })()} />}
    </View>
  );
}
