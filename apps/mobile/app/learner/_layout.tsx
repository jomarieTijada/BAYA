import React from 'react';
import { Stack } from 'expo-router';

import { Colors } from '../../constants/theme';

/**
 * Learner route boundary only.
 *
 * Onboarding screens such as `setup` own only onboarding navigation. Main
 * learner screens compose their dashboard chrome explicitly, so it can never
 * leak into onboarding through a shared layout wrapper.
 */
export default function LearnerLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'fade',
        contentStyle: { backgroundColor: Colors.background, flex: 1 },
        headerShown: false,
      }}
    />
  );
}
