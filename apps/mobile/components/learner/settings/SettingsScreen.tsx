import React from 'react';

import { LearnerScreenContainer } from '../LearnerScreenContainer';
import { LearnerAppShell } from '../LearnerAppShell';
import { SettingsHeader } from './SettingsHeader';
import { WorkspaceSyncCard } from './WorkspaceSyncCard';

/**
 * Main BAYA Learner Settings Screen.
 * Presents the Settings header anchored at the top (matching Home and Lessons)
 * and the same centered workspace card at every viewport width.
 */
export function SettingsScreen() {

  return (
    <LearnerAppShell
      header={<SettingsHeader />}
      testID="settings-screen-root"
    >
      {/* Main Settings content area */}
      <LearnerScreenContainer maxWidth={680} testID="settings-scroll-view">
        <WorkspaceSyncCard />
      </LearnerScreenContainer>
    </LearnerAppShell>
  );
}
