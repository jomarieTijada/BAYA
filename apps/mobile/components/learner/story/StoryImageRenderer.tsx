import React from "react";

import type { SlideStepContent } from "../../../content/types";
import {
  StoryImagePlaceholder,
  type StoryImagePlaceholderProps,
} from "./StoryImagePlaceholder";

export type StoryImageRendererProps = StoryImagePlaceholderProps & {
  imageSource?: SlideStepContent["imageSource"];
};

/**
 * Single entry point for topic artwork. All sources intentionally resolve to the
 * placeholder until validator-approved artwork and StoryIllustration are ready.
 * Switch the component here when that happens; page layout stays unchanged.
 */
export function StoryImageRenderer({
  compact,
  landscapeCompact,
  style,
}: StoryImageRendererProps) {
  return (
    <StoryImagePlaceholder
      compact={compact}
      landscapeCompact={landscapeCompact}
      style={style}
    />
  );
}
