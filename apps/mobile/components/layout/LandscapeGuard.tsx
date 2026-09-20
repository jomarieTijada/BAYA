import type { PropsWithChildren } from 'react';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Colors, FontFamily, FontSize, Spacing } from '../../constants/theme';

/** Prevents the web experience from being used when a browser ignores PWA orientation. */
export function LandscapeGuard({ children }: PropsWithChildren) {
  const { height, width } = useWindowDimensions();
  const isPortrait = height > width;

  if (!isPortrait) {
    return <>{children}</>;
  }

  return (
    <View
      accessibilityRole="alert"
      style={styles.container}
      testID="landscape-orientation-guard"
    >
      <View style={styles.phone}>
        <View style={styles.phoneScreen} />
      </View>
      <Text style={styles.title}>Landscape view required</Text>
      <Text style={styles.message}>
        {Platform.OS === 'web'
          ? 'Rotate your device or widen the browser window to continue.'
          : 'Rotate your device to continue.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  phone: {
    alignItems: 'center',
    borderColor: Colors.primary,
    borderRadius: 14,
    borderWidth: 6,
    height: 86,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    transform: [{ rotate: '90deg' }],
    width: 52,
  },
  phoneScreen: {
    backgroundColor: Colors.rolePrimary,
    borderRadius: 3,
    height: 54,
    width: 30,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: FontSize.xl,
    textAlign: 'center',
  },
  message: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.sm,
    maxWidth: 360,
    textAlign: 'center',
  },
});
