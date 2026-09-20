import React from 'react';
import { Stack } from 'expo-router';
import { RolePlaceholderScreen } from '../../components/landing/RolePlaceholderScreen';

export default function LearnerScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'BAYA · Learner' }} />
      <RolePlaceholderScreen role="Learner" />
    </>
  );
}
