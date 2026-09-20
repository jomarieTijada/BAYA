import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
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
        compact ? styles.compact : styles.regular,
        primary ? styles.primary : styles.secondary,
        hovered && !disabled && (primary ? styles.primaryHovered : styles.secondaryHovered),
        pressed && !disabled && (primary ? styles.primaryPressed : styles.secondaryPressed),
        focused && styles.focused,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          compact ? styles.compactLabel : styles.regularLabel,
          primary ? styles.primaryLabel : styles.secondaryLabel,
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
    minHeight: 58,
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
    fontSize: 20,
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
