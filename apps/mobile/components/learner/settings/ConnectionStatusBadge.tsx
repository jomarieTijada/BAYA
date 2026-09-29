import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily, Radius } from '../../../constants/theme';
import { SETTINGS_COPY } from './settingsCopy';

type ConnectionStatusBadgeProps = {
  connected: boolean;
  landscapeCompact: boolean;
  onPress: () => void;
};

/** One status control and label for independent and connected workspace states. */
export function ConnectionStatusBadge({ connected, landscapeCompact, onPress }: ConnectionStatusBadgeProps) {
  return (
    <Pressable
      accessibilityHint={SETTINGS_COPY.statusTestHint}
      accessibilityLabel={connected ? SETTINGS_COPY.connectedAccessibility : SETTINGS_COPY.disconnectedAccessibility}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        connected ? styles.pillConnected : styles.pillNone,
        landscapeCompact && styles.pillLandscapeCompact,
        pressed && styles.pillPressed,
      ]}
      testID="workspace-status-pill"
    >
      <View style={[styles.dot, connected ? styles.dotConnected : styles.dotNone]} />
      <Text
        style={[
          styles.text,
          connected ? styles.textConnected : styles.textNone,
          landscapeCompact && styles.textLandscapeCompact,
        ]}
      >
        {connected ? SETTINGS_COPY.connected : SETTINGS_COPY.disconnected}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: Radius.full,
    flexDirection: 'row',
    flexShrink: 0,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillLandscapeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillNone: {
    backgroundColor: Colors.optionalBackground,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  pillConnected: {
    backgroundColor: Colors.heroBackground,
    borderColor: '#C5E5BF',
    borderWidth: 1,
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  dot: {
    borderRadius: Radius.full,
    height: 7,
    width: 7,
  },
  dotNone: {
    backgroundColor: Colors.textMuted,
  },
  dotConnected: {
    backgroundColor: Colors.success,
  },
  text: {
    fontFamily: FontFamily.rounded,
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  textLandscapeCompact: {
    fontSize: 11,
  },
  textNone: {
    color: Colors.textSecondary,
  },
  textConnected: {
    color: Colors.success,
  },
});
