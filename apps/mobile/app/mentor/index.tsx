import React from 'react';
import { Stack } from 'expo-router';
import { RolePlaceholderScreen } from '../../components/landing/RolePlaceholderScreen';

export default function MentorScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'BAYA · Mentor' }} />
      <RolePlaceholderScreen role="Mentor" />
    </>
  );
}
