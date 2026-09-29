import React, { type ReactNode } from "react";

import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import type { SlideStepContent } from "../../../content/types";
import { StoryContent } from "./StoryContent";
import { StoryIllustration } from "./StoryIllustration";
import { StorybookTopicLayout } from "./StorybookTopicLayout";

export type StoryPageProps = {
  compact?: boolean;
  content: SlideStepContent;
  landscapeCompact?: boolean;
  visual?: ReactNode;
};

/** Shared topic template: visual on the left, narrative and BAYA on the right.
 * Content and media may vary; sizing, typography and responsive flow do not.
 */
export function StoryPage({
  compact = false,
  content,
  landscapeCompact = false,
  visual,
}: StoryPageProps) {
  const { isCompactHeight, isPhone, isPhoneLandscape, isTablet } = useResponsiveLayout();
  const effectiveCompact = compact || isPhone || isTablet || isCompactHeight;
  const effectiveLandscape = landscapeCompact || isPhoneLandscape;

  return (
    <StorybookTopicLayout
      compactSpread={effectiveCompact}
      visual={visual ?? (
        <StoryIllustration
          source={content.illustration ?? content.imageSource}
          caption={content.illustrationPlaceholder}
          compact={effectiveCompact}
          landscapeCompact={effectiveLandscape}
          theme={content.illustrationTheme}
        />
      )}
      content={(isStacked) => (
        <StoryContent
          content={content}
          compact={effectiveCompact}
          landscapeCompact={effectiveLandscape}
          stackGuide={isStacked}
          stackLayout={isStacked}
          spreadLayout={!isStacked}
        />
      )}
    />
  );
}
