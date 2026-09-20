/**
 * apps/mobile/App.tsx
 *
 * Root screen -- Slice 2: Handwriting Data-Collection Pipeline.
 *
 * Safe area: wrapped in SafeAreaProvider (react-native-safe-area-context) so
 * all child screens can access insets via useSafeAreaInsets(). Required for
 * correct edge handling on notch/cutout/gesture-navigation Android devices
 * in landscape mode.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PracticeScreen } from './src/screens/PracticeScreen';

// ---------------------------------------------------------------------------
// Root app component
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <PracticeScreen />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BG = '#FAF5E5'; // Light cream background

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
});
