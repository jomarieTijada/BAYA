/**
 * app/_layout.tsx
 *
 * Root Expo Router layout for the BAYA PWA.
 *
 * Responsibilities:
 *   - Wraps all screens in SafeAreaProvider for correct edge inset handling
 *     on both mobile and web (no-op on desktop browsers).
 *   - Configures the Stack navigator shell with a hidden header so each
 *     screen owns its own header presentation.
 *   - Keeps the status bar consistent across platforms.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FAF5E5' },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
