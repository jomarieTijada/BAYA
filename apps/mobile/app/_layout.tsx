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

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { getReadyDatabase } from '../database';
import { registerBayaPwa } from '../ml/registerBayaPwa';

let hasTriggeredMlSmoke = false;
let hasTriggeredMlBenchmark = false;

export default function RootLayout() {
  const { isPhoneLandscape } = useResponsiveLayout();

  useEffect(() => {
    // Non-blocking database initialization on startup
    getReadyDatabase().catch((err) => {
      console.warn('[BAYA Database] Initialization warning:', err);
    });
  }, []);

  useEffect(() => { registerBayaPwa(); }, []);

  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined'
      || hasTriggeredMlBenchmark || new URLSearchParams(window.location.search).get('bayaMlBenchmark') !== '1') return;

    hasTriggeredMlBenchmark = true;
    import('../ml/bayaModel')
      .then(({ runBayaBenchmark }) => runBayaBenchmark())
      .catch((error: unknown) => console.error('[BAYA ML] Browser benchmark failed:', error));
  }, []);

  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined'
      || hasTriggeredMlSmoke || new URLSearchParams(window.location.search).get('bayaMlSmoke') !== '1') return;

    hasTriggeredMlSmoke = true; // React Strict Mode may replay development effects.
    import('../ml/bayaModel')
      .then(({ runBayaSmokeTest }) => runBayaSmokeTest())
      .catch((error: unknown) => console.error(
        '[BAYA ML] Smoke test failed:', error,
        error instanceof Error && 'cause' in error ? error.cause : undefined,
      ));
  }, []);

  return (
    <SafeAreaProvider style={{ backgroundColor: Colors.background, flex: 1 }}>
      <StatusBar
        hidden={isPhoneLandscape}
        style="dark"
      />
      <Stack
        screenOptions={{
          animation: 'fade',
          contentStyle: { backgroundColor: Colors.background, flex: 1 },
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
