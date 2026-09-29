import React from 'react';
import { type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';

import { LearnerPageHeader } from '../LearnerPageHeader';

type LessonHeaderProps = {
  onBack?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onOpenSettings?: () => void;
  progressPercentage: number;
  subtitle?: string;
  title?: string;
};

/** Lessons page adapter; all sizing and controls live in LearnerPageHeader. */
export function LessonHeader({
  onBack,
  onLayout,
  onOpenSettings,
  progressPercentage,
  subtitle = 'Learn the foundation before starting your adventures.',
  title = 'Baybayin Basics',
}: LessonHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.dismissTo('/learner/home'));

  return (
    <LearnerPageHeader
      onBack={handleBack}
      onLayout={onLayout}
      onOpenSettings={onOpenSettings ?? (() => router.push('/learner/settings'))}
      progressPercentage={progressPercentage}
      subtitle={subtitle}
      testID="lesson-header"
      title={title}
    />
  );
}
