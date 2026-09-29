import React, { type ReactNode, useState } from "react";
import { StyleSheet, type LayoutChangeEvent, View } from "react-native";

import { Spacing } from "../../../constants/theme";

const STORY_CONTENT_MIN_WIDTH = 330;
const STORY_CONTENT_SHARE = 0.58;
const STORY_VISUAL_ASPECT_RATIO = 16 / 9;

type StorybookTopicLayoutProps = {
  compactSpread?: boolean;
  visual: ReactNode;
  visualAspectRatio?: number;
  content: (isStacked: boolean) => ReactNode;
};

/** Places the visual and lesson in a spread until the measured page cannot fit both. */
export function StorybookTopicLayout({
  compactSpread = false,
  visual,
  visualAspectRatio = STORY_VISUAL_ASPECT_RATIO,
  content,
}: StorybookTopicLayoutProps) {
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const horizontalPadding = compactSpread ? Spacing.sm * 2 : Spacing.md * 2;
  const columnGap = compactSpread ? Spacing.xs : Spacing.sm;
  const panelPadding = compactSpread ? Spacing.xs * 2 : Spacing.md * 2;
  const minimumSpreadWidth = Math.ceil(
    (STORY_CONTENT_MIN_WIDTH + panelPadding) / STORY_CONTENT_SHARE +
      horizontalPadding +
      columnGap,
  );
  const isStacked = availableWidth !== null && availableWidth < minimumSpreadWidth;
  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setAvailableWidth((previous) => previous === layout.width ? previous : layout.width);
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        isStacked ? styles.stacked : styles.spread,
        compactSpread && !isStacked && styles.compactSpread,
      ]}
      testID="storybook-page"
    >
      <StoryVisualColumn
        isStacked={isStacked}
        aspectRatio={visualAspectRatio}
      >
        {visual}
      </StoryVisualColumn>
      <StoryContentColumn isStacked={isStacked}>
        {content(isStacked)}
      </StoryContentColumn>
    </View>
  );
}

function StoryVisualColumn({
  children,
  isStacked,
  aspectRatio,
}: {
  children: ReactNode;
  isStacked: boolean;
  aspectRatio: number;
}) {
  const [columnSize, setColumnSize] = useState({ width: 0, height: 0 });
  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setColumnSize((previous) =>
      previous.width === layout.width && previous.height === layout.height
        ? previous
        : { width: layout.width, height: layout.height },
    );
  };
  const visualWidth = columnSize.width > 0 && columnSize.height > 0
    ? Math.min(760, columnSize.width, columnSize.height * aspectRatio)
    : undefined;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.visualColumn,
        isStacked && styles.visualColumnStacked,
        isStacked && { aspectRatio },
      ]}
      testID="story-image-column"
    >
      <View
        style={[
          styles.visualFrame,
          { aspectRatio },
          // Explicit measured dimensions avoid a flex/percentage-height cycle in Yoga.
          visualWidth != null && {
            width: visualWidth,
            height: visualWidth / aspectRatio,
          },
        ]}
        testID="story-visual-frame"
      >
        {children}
      </View>
    </View>
  );
}

function StoryContentColumn({
  children,
  isStacked,
}: {
  children: ReactNode;
  isStacked: boolean;
}) {
  return (
    <View
      style={[styles.contentColumn, isStacked && styles.contentColumnStacked]}
      testID="story-content-column"
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: Spacing.md,
  },
  spread: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  compactSpread: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  stacked: {
    flexDirection: "column",
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  visualColumn: {
    alignItems: "center",
    flex: 0.42,
    justifyContent: "center",
    minHeight: 0,
    minWidth: 0,
  },
  visualColumnStacked: {
    alignSelf: "stretch",
    flex: 0,
    flexBasis: "auto",
    maxHeight: "40%",
    minHeight: 0,
    width: "100%",
  },
  visualFrame: {
    alignSelf: "center",
    flexGrow: 0,
    flexShrink: 0,
    width: "100%",
    maxWidth: 760,
    minHeight: 0,
  },
  contentColumn: {
    alignItems: "stretch",
    flex: STORY_CONTENT_SHARE,
    minHeight: 0,
    minWidth: 0,
  },
  contentColumnStacked: {
    flex: 1,
    width: "100%",
  },
});
