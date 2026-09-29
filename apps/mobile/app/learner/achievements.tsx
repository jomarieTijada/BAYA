import React from 'react';
import { Stack } from 'expo-router';

import { LearnerPlaceholderScreen } from '../../components/learner/LearnerPlaceholderScreen';

export default function LearnerAchievementsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'BAYA · Achievements' }} />
      <LearnerPlaceholderScreen
        activeRoute="/learner/achievements"
        description="Rewards and achievement details will be designed in a future step."
        title="Achievements are coming next."
      />
    </>
  );
}
