/**
 * app/debug/_layout.tsx
 *
 * Layout for the debug route group. Uses a plain Stack with no header.
 * These routes are NOT linked from any learner navigation.
 */
import React from 'react';
import { Stack } from 'expo-router';

export default function DebugLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1e1e2e', flex: 1 },
      }}
    />
  );
}
