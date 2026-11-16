import { storyParagraphs, storyTextSegments } from './storyText';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { Text } from '../../../localization/components';
import React, { useEffect, useRef, useState } from "react";
import { type LayoutChangeEvent, ScrollView, type StyleProp, StyleSheet, TextStyle, View, type ViewStyle } from 'react-native';

import { FontFamily, FontSize, Spacing } from "../../../constants/theme";
import type { SlideStepContent } from "../../../content/types";
import { StoryGuide } from "./StoryGuide";
import { LessonSource } from './LessonSource';
import { VideoCreditLink } from './VideoCreditLink';

export type StoryContentProps = {
  compact?: boolean;
  constrained?: boolean;
  hideTitle?: boolean;
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
  return storyTextSegments(text, highlightWords).map((part, index) => part.highlighted
    ? <Text key={index} verbatim style={highlightStyle}>{part.text}</Text>
    : part.text);
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
  constrained = false,
  hideTitle = false,
  content,
  stackLayout = false,
  spreadLayout = false,
  stackGuide = false,
  landscapeCompact = false,
  style,
}: StoryContentProps) {
  const { text: localized } = useLocalization();
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const storyScrollRef = useRef<ScrollView | null>(null);
  const openingLead = localized(content.openingNarration || content.subtitle || "");
  const highlightWords = (content.highlightWords || []).map(localized);
  const onPanelLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setPanelSize((previous) =>
      {
      if (previous.width === layout.width && previous.height === layout.height) {
        return previous;
      } else {
        return { width: layout.width, height: layout.height };
      }
    },
    );
  };
  useEffect(() => {
    // The StoryContent instance is reused across topic routes. Reset its native
    // scroll offset before the incoming page fades in, or the new story can
    // appear halfway down at the previous topic's offset.
    storyScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, [content.title]);
  let readableWidth;
  if (panelSize.height > 0) {
    readableWidth = Math.min(panelSize.width, panelSize.height * 1.65);
  } else {
    readableWidth = 0;
  }
  const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(maximum, Math.max(minimum, value));
  let titleFontSize;
  if (constrained) {
    titleFontSize = 20;
  } else {
    titleFontSize = clamp(
    readableWidth * 0.052,
    (() => {
      if (landscapeCompact) {
        return FontSize.md;
      } else {
        if (compact) {
          return FontSize.lg;
        } else {
          return FontSize.xl;
        }
      }
    })(),
    (() => {
      if (landscapeCompact) {
        return FontSize.xxl - 2;
      } else {
        if (compact) {
          return FontSize.xxl;
        } else {
          return 38;
        }
      }
    })(),
  );
  }
  let bodyFontSize;
  if (constrained) {
    bodyFontSize = 16;
  } else {
    bodyFontSize = clamp(
    readableWidth * 0.028,
    (() => {
      if (landscapeCompact) {
        return FontSize.sm;
      } else {
        if (compact) {
          return FontSize.md;
        } else {
          return FontSize.md + 1;
        }
      }
    })(),
    (() => {
      if (landscapeCompact) {
        return FontSize.md;
      } else {
        if (compact) {
          return FontSize.lg;
        } else {
          return 22;
        }
      }
    })(),
  );
  }
  // Split narrative content into clean paragraphs
  const bodyParagraphs = storyParagraphs(content.content || '', localized);
  let paragraphs;
  if (openingLead) {
    paragraphs = [
        openingLead,
        ...bodyParagraphs.filter((paragraph) => paragraph !== openingLead),
      ];
  } else {
    paragraphs = bodyParagraphs;
  }
  const storyGuide = (
    <StoryGuide
      compact={compact}
      stackGuide={stackGuide}
      highlight={content.storyHighlight}
      highlightWords={highlightWords}
      landscapeCompact={landscapeCompact}
      message={content.storyMessage}
      style={(() => {
        if (spreadLayout) {
          if (compact) {
            return styles.storyGuideSpreadCompact;
          } else {
            return styles.storyGuideSpread;
          }
        } else {
          return undefined;
        }
      })()}
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
        testID="story-reading-scroll"
        bounces={false}
        style={styles.storyScroll}
        contentContainerStyle={[
          styles.scrollContent,
          spreadLayout && styles.scrollContentSpread,
          compact && styles.scrollContentCompact,
          landscapeCompact && styles.scrollContentLandscapeCompact,
          stackLayout && styles.scrollContentStacked,
          constrained && styles.scrollContentCentered,
        ]}
        showsVerticalScrollIndicator
      >
        <View style={styles.storyHeaderAndBody}>
          {/* Big title begins the body directly; topic identity lives in the app header. */}
          {!hideTitle && <Text
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
          </Text>}

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
                verbatim
                style={[
                  styles.bodyParagraph,
                  { fontSize: bodyFontSize, lineHeight: bodyFontSize * ((() => {
                    if (constrained) {
                      return 1.4;
                    } else {
                      return 1.5;
                    }
                  })()) },
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
          {(() => {
            if (content.videoCredit) {
              return <VideoCreditLink credit={content.videoCredit} />;
            } else {
              if (content.reference) {
                return <LessonSource reference={content.reference} />;
              } else {
                return null;
              }
            }
          })()}
          {(() => {
            if (content.examples) {
              return (
            <View style={[styles.examples, constrained && styles.examplesConstrained]}>
              <Text style={[styles.bodyParagraph, { fontSize: bodyFontSize }]}>{content.examplesLabel}</Text>
              <Text verbatim testID="story-examples" style={[styles.exampleSymbols, constrained && styles.exampleSymbolsConstrained]}>{content.examples}</Text>
            </View>
          );
            } else {
              return null;
            }
          })()}
        </View>

        {/* BAYA mascot learning companion and speech bubble */}
        {(() => {
          if (!constrained && !spreadLayout) {
            return storyGuide;
          } else {
            return null;
          }
        })()}
      </ScrollView>
      {(() => {
        if (!constrained && spreadLayout) {
          return storyGuide;
        } else {
          return null;
        }
      })()}

      {/* Accessible subtitle fallback if different from opening lead */}
      {(() => {
        if (content.subtitle && content.subtitle !== openingLead) {
          return (
        <View style={styles.accessibleSummaryText}>
          <Text>{content.subtitle}</Text>
        </View>
      );
        } else {
          return null;
        }
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  examplesConstrained: { gap: 2, marginVertical: 4 },
  exampleSymbolsConstrained: { fontSize: 20, lineHeight: 26 },
  examples: { gap: Spacing.sm, marginVertical: Spacing.md },
  exampleSymbols: { color: "#342214", fontSize: 30, lineHeight: 44, fontWeight: "600" },
  panel: {
    flex: 1,
    flexDirection: "column",
    minHeight: 0,
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
  scrollContentCentered: { flexGrow: 1, justifyContent: "center" },
  scrollContentCompact: { paddingBottom: 2, gap: Spacing.xs },
  scrollContentLandscapeCompact: { paddingBottom: 0, gap: 2 },
  scrollContentSpread: { flexGrow: 1, justifyContent: "center" },
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
