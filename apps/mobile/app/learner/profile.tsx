import React from 'react';
import { Stack } from 'expo-router';

import { LearnerPlaceholderScreen } from '../../components/learner/LearnerPlaceholderScreen';

export default function LearnerProfileRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'BAYA · Profile' }} />
      <LearnerPlaceholderScreen
        activeRoute="/learner/profile"
        description="Profile details will be designed in a future step."
        title="Profile is coming next."
      />
    </>
  );
}
