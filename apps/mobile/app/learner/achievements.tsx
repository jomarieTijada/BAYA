import React from 'react';
import { Stack } from 'expo-router';

import { AchievementsScreen } from '../../components/learner/achievements/AchievementsScreen';

export default function LearnerAchievementsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'BAYA · Achievements' }} />
      <AchievementsScreen />
    </>
  );
}
