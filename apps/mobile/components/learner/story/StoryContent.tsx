import React, { useEffect, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  type ViewStyle,
} from "react-native";

import { FontFamily, FontSize, Spacing } from "../../../constants/theme";
import type { SlideStepContent } from "../../../content/types";
import { StoryGuide } from "./StoryGuide";
import { LessonSource } from './LessonSource';
import { VideoCreditLink } from './VideoCreditLink';

export type StoryContentProps = {
  compact?: boolean;
  content: SlideStepContent;
  stackLayout?: boolean;
  spreadLayout?: boolean;
  stackGuide?: boolean;
  landscapeCompact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Highlights culturally significant keywords in warm terracotta/orange.
 */
function renderHighlightedStoryText(
  text: string,
  highlightWords: string[] = [],
  highlightStyle?: TextStyle,
) {
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
        <Text key={index} style={highlightStyle}>
          {part}
        </Text>
      );
    }
    return part;
  });
}

/**
 * StoryContent:
 * Right-side story reading panel for the single topic storybook screen.
 *
 * Every topic uses the same hierarchy: title, readable paragraphs, optional
 * approved examples, then BAYA's takeaway. Topic data never selects a layout.
 */
export function StoryContent({
  compact = false,
  content,
  stackLayout = false,
  spreadLayout = false,
  stackGuide = false,
  landscapeCompact = false,
  style,
}: StoryContentProps) {
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const storyScrollRef = useRef<ScrollView | null>(null);
  const openingLead = content.openingNarration || content.subtitle || "";
  const highlightWords = content.highlightWords || [];
  const onPanelLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setPanelSize((previous) =>
      previous.width === layout.width && previous.height === layout.height
        ? previous
        : { width: layout.width, height: layout.height },
    );
  };
  useEffect(() => {
    // The StoryContent instance is reused across topic routes. Reset its native
    // scroll offset before the incoming page fades in, or the new story can
    // appear halfway down at the previous topic's offset.
    storyScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [content.title]);
  const readableWidth = panelSize.height > 0
    ? Math.min(panelSize.width, panelSize.height * 1.65)
    : 0;
  const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(maximum, Math.max(minimum, value));
  const titleFontSize = clamp(
    readableWidth * 0.052,
    landscapeCompact ? FontSize.md : compact ? FontSize.lg : FontSize.xl,
    landscapeCompact ? FontSize.xxl - 2 : compact ? FontSize.xxl : 38,
  );
  const bodyFontSize = clamp(
    readableWidth * 0.028,
    landscapeCompact ? FontSize.sm : compact ? FontSize.md : FontSize.md + 1,
    landscapeCompact ? FontSize.md : compact ? FontSize.lg : 22,
  );
  // Split narrative content into clean paragraphs
  const bodyParagraphs = (content.content || "")
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);
  const paragraphs = openingLead
    ? [
        openingLead,
        ...bodyParagraphs.filter((paragraph) => paragraph !== openingLead),
      ]
    : bodyParagraphs;
  const storyGuide = (
    <StoryGuide
      compact={compact}
      stackGuide={stackGuide}
      highlight={content.storyHighlight}
      highlightWords={highlightWords}
      landscapeCompact={landscapeCompact}
      message={content.storyMessage}
      style={spreadLayout ? compact ? styles.storyGuideSpreadCompact : styles.storyGuideSpread : undefined}
    />
  );

  return (
    <View
      style={[
        styles.panel,
        compact && styles.panelCompact,
        landscapeCompact && styles.panelLandscapeCompact,
        spreadLayout && styles.panelSpread,
        style,
      ]}
      onLayout={onPanelLayout}
      testID="story-content"
    >
      <ScrollView
        ref={storyScrollRef}
        bounces={false}
        style={styles.storyScroll}
        contentContainerStyle={[
          styles.scrollContent,
          spreadLayout && styles.scrollContentSpread,
          compact && styles.scrollContentCompact,
          landscapeCompact && styles.scrollContentLandscapeCompact,
          stackLayout && styles.scrollContentStacked,
        ]}
        showsVerticalScrollIndicator
      >
        <View style={styles.storyHeaderAndBody}>
          {/* Big title begins the body directly; topic identity lives in the app header. */}
          <Text
            accessibilityRole="header"
            testID="story-title"
            style={[
              styles.title,
              compact && styles.titleCompact,
              landscapeCompact && styles.titleLandscapeCompact,
              { fontSize: titleFontSize, lineHeight: titleFontSize * 1.2 },
            ]}
          >
            {content.title}
          </Text>

          {/* Story body paragraphs */}
          <View
            style={[
              styles.paragraphsWrap,
              compact && styles.paragraphsWrapCompact,
              landscapeCompact && styles.paragraphsWrapLandscapeCompact,
            ]}
          >
            {paragraphs.map((paragraph, index) => (
              <Text
                key={index}
                testID={`story-paragraph-${index}`}
                style={[
                  styles.bodyParagraph,
                  { fontSize: bodyFontSize, lineHeight: bodyFontSize * 1.5 },
                ]}
              >
                {renderHighlightedStoryText(
                  paragraph,
                  highlightWords,
                  styles.highlightKeyword,
                )}
              </Text>
            ))}
          </View>
          {content.videoCredit ? <VideoCreditLink credit={content.videoCredit} /> : content.reference ? <LessonSource reference={content.reference} /> : null}
          {content.examples ? (
            <View style={styles.examples}>
              <Text style={[styles.bodyParagraph, { fontSize: bodyFontSize }]}>{content.examplesLabel}</Text>
              <Text style={styles.exampleSymbols}>{content.examples}</Text>
            </View>
          ) : null}
        </View>

        {/* BAYA mascot learning companion and speech bubble */}
        {!spreadLayout ? storyGuide : null}
      </ScrollView>
      {spreadLayout ? storyGuide : null}

      {/* Accessible subtitle fallback if different from opening lead */}
      {content.subtitle && content.subtitle !== openingLead ? (
        <View style={styles.accessibleSummaryText}>
          <Text>{content.subtitle}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  examples: { gap: Spacing.sm, marginVertical: Spacing.md },
  exampleSymbols: { color: "#342214", fontSize: 30, lineHeight: 44, fontWeight: "600" },
  panel: {
    flex: 1,
    flexDirection: "column",
    height: "100%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    width: "100%",
  },
  panelSpread: { paddingRight: 0 },
  panelCompact: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  panelLandscapeCompact: {
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  scrollContent: {
    flexDirection: "column",
    flexGrow: 0,
    justifyContent: "flex-start",
    paddingBottom: 4,
    gap: Spacing.sm,
  },
  storyScroll: { flex: 1, minHeight: 0 },
  scrollContentCompact: { paddingBottom: 2, gap: Spacing.xs },
  scrollContentLandscapeCompact: { paddingBottom: 0, gap: 2 },
  scrollContentSpread: { flexGrow: 1, justifyContent: "flex-start" },
  scrollContentStacked: { flexGrow: 1, justifyContent: "flex-start" },
  storyGuideSpread: { marginTop: "auto" },
  storyGuideSpreadCompact: { marginTop: Spacing.xs },
  storyHeaderAndBody: {
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  title: {
    color: "#26180D", // Rich storybook headline ink
    fontFamily: FontFamily.rounded,
    fontSize: 38, // Significantly enlarged
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 46,
    marginBottom: Spacing.xs + 4,
  },
  titleCompact: { marginBottom: Spacing.xs },
  titleLandscapeCompact: { marginBottom: 2 },
  paragraphsWrap: {
    flexDirection: "column",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  paragraphsWrapCompact: { gap: Spacing.xs, marginBottom: 0 },
  paragraphsWrapLandscapeCompact: { gap: 2, marginBottom: 0 },
  bodyParagraph: {
    color: "#342214", // Legible child-friendly text
    fontFamily: FontFamily.body,
    fontSize: 22, // +30% size increase for relaxed reading
    fontWeight: "600",
    lineHeight: 35,
  },
  highlightKeyword: {
    color: "#D8540B", // BAYA Accent
    fontFamily: FontFamily.rounded,
    fontWeight: "900",
  } as TextStyle,
  accessibleSummaryText: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    position: "absolute",
    width: 0,
  },
});
