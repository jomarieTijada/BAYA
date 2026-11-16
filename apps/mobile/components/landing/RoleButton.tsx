import { Pressable, Text } from '../../localization/components';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Colors, FontFamily, Radius } from '../../constants/theme';

type RoleButtonProps = {
  label: string;
  accessibilityLabel: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
  compact?: boolean;
  disabled?: boolean;
};

export function RoleButton({
  label,
  accessibilityLabel,
  variant,
  onPress,
  compact = false,
  disabled = false,
}: RoleButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        (() => {
          if (compact) {
            return styles.compact;
          } else {
            return styles.regular;
          }
        })(),
        (() => {
          if (primary) {
            return styles.primary;
          } else {
            return styles.secondary;
          }
        })(),
        hovered && !disabled && ((() => {
          if (primary) {
            return styles.primaryHovered;
          } else {
            return styles.secondaryHovered;
          }
        })()),
        pressed && !disabled && ((() => {
          if (primary) {
            return styles.primaryPressed;
          } else {
            return styles.secondaryPressed;
          }
        })()),
        focused && styles.focused,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          (() => {
            if (compact) {
              return styles.compactLabel;
            } else {
              return styles.regularLabel;
            }
          })(),
          (() => {
            if (primary) {
              return styles.primaryLabel;
            } else {
              return styles.secondaryLabel;
            }
          })(),
          disabled && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 4,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  regular: {
    minHeight: 76,
  },
  compact: {
    borderWidth: 3,
    minHeight: 52,
  },
  primary: {
    backgroundColor: Colors.rolePrimary,
    borderColor: Colors.rolePrimary,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderColor: Colors.rolePrimary,
  },
  primaryHovered: {
    backgroundColor: Colors.rolePrimaryHover,
    borderColor: Colors.rolePrimaryHover,
  },
  secondaryHovered: {
    backgroundColor: Colors.roleSecondaryHover,
  },
  primaryPressed: {
    backgroundColor: Colors.rolePrimaryPressed,
    borderColor: Colors.rolePrimaryPressed,
    transform: [{ scale: 0.99 }],
  },
  secondaryPressed: {
    backgroundColor: Colors.roleSecondaryHover,
    transform: [{ scale: 0.99 }],
  },
  focused: {
    borderColor: Colors.focus,
  },
  disabled: {
    backgroundColor: Colors.disabled,
    borderColor: Colors.disabled,
    opacity: 0.72,
  },
  label: {
    fontFamily: FontFamily.rounded,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  regularLabel: {
    fontSize: 26,
  },
  compactLabel: {
    fontSize: 18,
  },
  primaryLabel: {
    color: Colors.surface,
  },
  secondaryLabel: {
    color: Colors.rolePrimary,
  },
  disabledLabel: {
    color: Colors.surface,
  },
});
