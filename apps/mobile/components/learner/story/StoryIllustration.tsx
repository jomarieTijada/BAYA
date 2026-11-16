import React from "react";
import { ImageViewer } from "../../media/ImageViewer";
import type { MediaSource } from "../../media/MediaSource";
import {
  StoryImagePlaceholder,
  type StoryImagePlaceholderProps,
} from "./StoryImagePlaceholder";
export type StoryIllustrationProps = StoryImagePlaceholderProps & {
  source?: MediaSource;
  caption?: string;
  theme?: string;
};
export function StoryIllustration({
  source,
  caption = "Larawan ng aralin",
  ...props
}: StoryIllustrationProps) {
  if (source) {
    return (
    <ImageViewer source={source} label={caption} />
  );
  } else {
    return (
    <StoryImagePlaceholder {...props} />
  );
  }
}
