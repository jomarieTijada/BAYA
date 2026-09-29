import React from 'react';
import { useRouter } from 'expo-router';

import { LearnerPageHeader } from '../LearnerPageHeader';
import { SETTINGS_COPY } from './settingsCopy';

type SettingsHeaderProps = {
  onBack?: () => void;
};

/** Settings page adapter; layout sizing is shared with all learner pages. */
export function SettingsHeader({ onBack }: SettingsHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => {
    if (router.canGoBack()) router.back();
    else router.replace('/learner/home');
  });

  return <LearnerPageHeader onBack={handleBack} testID="settings-header" title={SETTINGS_COPY.title} />;
}
