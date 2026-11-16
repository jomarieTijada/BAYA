import { Pressable } from '../../localization/components';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Colors, LearnerHeaderMetrics, Radius, Shadows } from '../../constants/theme';
import { AppIcon } from './AppIcon';
import { FilipinoLabels } from '../../constants/filipinoLabels';

type BackButtonProps = {
  accessibilityLabel?: string;
  compact?: boolean;
  onPress: () => void;
  size?: 'regular' | 'header' | 'compact' | 'landscape';
};

/** Accessible circular navigation control shared by standalone screens. */
export function BackButton({
  accessibilityLabel = FilipinoLabels.back,
  compact = false,
  onPress,
  size,
}: BackButtonProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const resolvedSize = size ?? ((() => {
    if (compact) {
      return 'compact';
    } else {
      return 'regular';
    }
  })());

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        Shadows.card,
        (() => {
          if (resolvedSize === 'landscape') {
            return styles.landscape;
          } else {
            if (resolvedSize === 'header') {
              return styles.header;
            } else {
              if (resolvedSize === 'compact') {
                return styles.compact;
              } else {
                return styles.regular;
              }
            }
          }
        })(),
        hovered && styles.hovered,
        pressed && styles.pressed,
        focused && styles.focused,
      ]}
    >
      <AppIcon
        name="back"
        size={(() => {
          if (resolvedSize === 'landscape') {
            return 'md';
          } else {
            if (resolvedSize === 'compact') {
              return 'lg';
            } else {
              return 'xl';
            }
          }
        })()}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 2,
    justifyContent: 'center',
  },
  regular: {
    height: 72,
    width: 72,
  },
  header: {
    height: LearnerHeaderMetrics.regular.backButton,
    width: LearnerHeaderMetrics.regular.backButton,
  },
  compact: {
    height: LearnerHeaderMetrics.compact.backButton,
    width: LearnerHeaderMetrics.compact.backButton,
  },
  landscape: {
    height: LearnerHeaderMetrics.landscapeCompact.backButton,
    width: LearnerHeaderMetrics.landscapeCompact.backButton,
  },
  hovered: {
    backgroundColor: Colors.roleSecondaryHover,
    borderColor: Colors.rolePrimary,
  },
  pressed: {
    backgroundColor: Colors.optionalBackground,
    transform: [{ scale: 0.96 }],
  },
  focused: {
    borderColor: Colors.focus,
    borderWidth: 3,
  },
});
