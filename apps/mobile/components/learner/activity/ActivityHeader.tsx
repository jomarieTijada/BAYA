import React from 'react';

import { LearnerPageHeader } from '../LearnerPageHeader';

export type ActivityHeaderProps = {
  currentStep?: number;
  onBack: () => void;
  onOpenSettings?: () => void;
  subtitle: string;
  title: string;
  totalSteps?: number;
};

/** Backwards-compatible activity API backed by the shared learner page header. */
export function ActivityHeader({
  currentStep,
  onBack,
  onOpenSettings,
  subtitle,
  title,
  totalSteps,
}: ActivityHeaderProps) {
  return (
    <LearnerPageHeader
      onBack={onBack}
      onOpenSettings={onOpenSettings}
      progress={totalSteps ? { current: currentStep ?? 1, total: totalSteps } : undefined}
      subtitle={subtitle}
      testID="activity-header"
      title={title}
    />
  );
}
