import React from 'react';

import type { SlideStepContent } from './activityData';
import { StorySlideLayout } from './StorySlideLayout';

export type LessonSlideCardProps = {
  compact?: boolean;
  content: SlideStepContent;
  landscapeCompact?: boolean;
};

/**
 * Fullscreen Storybook Lesson Slide Card.
 * Delegates directly to StorySlideLayout for the approved two-page storybook spread experience.
 */
export function LessonSlideCard(props: LessonSlideCardProps) {
  return <StorySlideLayout {...props} />;
}
