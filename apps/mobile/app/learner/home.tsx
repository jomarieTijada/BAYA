import React from 'react';
import { Stack } from 'expo-router';

import { LearnerHomeScreen } from '../../components/learner/home/LearnerHomeScreen';

export default function LearnerHomeRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'BAYA · Learner Home' }} />
      <LearnerHomeScreen />
    </>
  );
}
