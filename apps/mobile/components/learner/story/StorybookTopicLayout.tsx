import React, { type ReactNode, useState } from "react";
import { StyleSheet, type LayoutChangeEvent, View } from "react-native";

import { Spacing } from "../../../constants/theme";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";

const STORY_CONTENT_MIN_WIDTH = 330;
const STORY_CONTENT_SHARE = 0.58;
const STORY_VISUAL_ASPECT_RATIO = 16 / 9;

export type StoryPageMeasurements = {
  constrained: boolean;
  width: number;
  height: number;
};

type StorybookTopicLayoutProps = {
  compactSpread?: boolean;
  visual: ReactNode;
  visualAspectRatio?: number;
  readingLayout?: boolean;
  hasIllustration?: boolean;
  contentFooter?: (measurements: StoryPageMeasurements) => ReactNode;
  content: (isStacked: boolean, measurements: StoryPageMeasurements) => ReactNode;
};

/** Places the visual and lesson in a spread until the measured page cannot fit both. */
export function StorybookTopicLayout({
  compactSpread = false,
  visual,
  visualAspectRatio = STORY_VISUAL_ASPECT_RATIO,
  content,
  readingLayout = false,
  hasIllustration = true,
  contentFooter,
}: StorybookTopicLayoutProps) {
  const viewport = useResponsiveLayout();
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const measured = pageSize.width > 0 && pageSize.height > 0;
  const availableWidth = pageSize.width || viewport.width;
  const constrained = readingLayout && (measured
    ? pageSize.height < 440 || pageSize.width < 820
    : viewport.isCompactHeight || viewport.width < 820);
  const measurements = { ...pageSize, constrained };
  const visualShare = constrained ? hasIllustration ? 0.32 : 0.23 : 0.42;
  const horizontalPadding = compactSpread ? Spacing.sm * 2 : Spacing.md * 2;
  const columnGap = compactSpread ? Spacing.xs : Spacing.sm;
  const panelPadding = compactSpread ? Spacing.xs * 2 : Spacing.md * 2;
  const minimumSpreadWidth = Math.ceil(
    (STORY_CONTENT_MIN_WIDTH + panelPadding) / STORY_CONTENT_SHARE +
      horizontalPadding +
      columnGap,
  );
  const isStacked = availableWidth !== null && availableWidth < (readingLayout ? 480 : minimumSpreadWidth);
  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    if (pageSize.width !== layout.width || pageSize.height !== layout.height) {
      setPageSize({ width: layout.width, height: layout.height });
    }
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        isStacked ? styles.stacked : styles.spread,
        compactSpread && !isStacked && styles.compactSpread,
        // A newly keyed topic must not paint the zero-measurement desktop
        // arrangement while Yoga is calculating its actual content rectangle.
        !measured && styles.measuring,
      ]}
      pointerEvents={measured ? 'auto' : 'none'}
      testID="storybook-page"
    >
      <StoryVisualColumn
        isStacked={isStacked}
        aspectRatio={visualAspectRatio}
        share={visualShare}
      >
        {visual}
      </StoryVisualColumn>
      <StoryContentColumn isStacked={isStacked} share={1 - visualShare}>
        {content(isStacked, measurements)}
        {constrained ? contentFooter?.(measurements) : null}
      </StoryContentColumn>
    </View>
  );
}

function StoryVisualColumn({
  children,
  isStacked,
  aspectRatio,
  share,
}: {
  children: ReactNode;
  isStacked: boolean;
  aspectRatio: number;
  share: number;
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
      testID="story-visual-column"
      style={[
        styles.visualColumn,
        { flex: share },
        isStacked && styles.visualColumnStacked,
        isStacked && { aspectRatio },
      ]}
    >
      <View onLayout={onLayout} style={styles.mediaSpace} testID="story-image-column">
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
    </View>
  );
}

function StoryContentColumn({
  children,
  isStacked,
  share,
}: {
  children: ReactNode;
  isStacked: boolean;
  share: number;
}) {
  return (
    <View
      style={[styles.contentColumn, { flex: share }, isStacked && styles.contentColumnStacked]}
      testID="story-content-column"
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  measuring: { opacity: 0 },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 1440,
    alignSelf: "center",
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
  mediaSpace: { flex: 1, minHeight: 0, width: "100%", alignItems: "center", justifyContent: "center" },
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
