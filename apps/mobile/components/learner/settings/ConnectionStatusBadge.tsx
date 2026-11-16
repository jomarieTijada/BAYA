import { Pressable, Text } from '../../../localization/components';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, FontFamily, Radius } from '../../../constants/theme';
import { SETTINGS_COPY } from './settingsCopy';

type ConnectionStatusBadgeProps = {
  connected: boolean;
  landscapeCompact: boolean;
  onPress?: () => void;
};

/** One status control and label for independent and connected workspace states. */
export function ConnectionStatusBadge({ connected, landscapeCompact, onPress }: ConnectionStatusBadgeProps) {
  return (
    <Pressable
      accessibilityHint={undefined}
      accessibilityLabel={(() => {
        if (connected) {
          return SETTINGS_COPY.connectedAccessibility;
        } else {
          return SETTINGS_COPY.disconnectedAccessibility;
        }
      })()}
      accessibilityRole={(() => {
        if (onPress) {
          return "button";
        } else {
          return "text";
        }
      })()}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        (() => {
          if (connected) {
            return styles.pillConnected;
          } else {
            return styles.pillNone;
          }
        })(),
        landscapeCompact && styles.pillLandscapeCompact,
        pressed && styles.pillPressed,
      ]}
      testID="workspace-status-pill"
    >
      <View style={[styles.dot, (() => {
        if (connected) {
          return styles.dotConnected;
        } else {
          return styles.dotNone;
        }
      })()]} />
      <Text
        style={[
          styles.text,
          (() => {
            if (connected) {
              return styles.textConnected;
            } else {
              return styles.textNone;
            }
          })(),
          landscapeCompact && styles.textLandscapeCompact,
        ]}
      >
        {(() => {
          if (connected) {
            return SETTINGS_COPY.connected;
          } else {
            return SETTINGS_COPY.disconnected;
          }
        })()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: Radius.full,
    flexDirection: 'row',
    flexShrink: 1,
    maxWidth: '100%',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    height: 10,
    width: 10,
  },
  dotNone: {
    backgroundColor: Colors.textMuted,
  },
  dotConnected: {
    backgroundColor: Colors.success,
  },
  text: {
    fontFamily: FontFamily.rounded,
    fontSize: 18,
    flexShrink: 1,
    fontWeight: '700',
    includeFontPadding: false,
  },
  textLandscapeCompact: {
    fontSize: 13,
  },
  textNone: {
    color: Colors.textSecondary,
  },
  textConnected: {
    color: Colors.success,
  },
});
