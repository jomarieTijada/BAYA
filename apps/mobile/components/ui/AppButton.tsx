import { useKeyboardFocus } from '../../hooks/useKeyboardFocus';
import { Pressable, Text } from '../../localization/components';
import React, { useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle, type TextStyle } from 'react-native';

import { Colors, FontFamily, Radius } from '../../constants/theme';
import { AppIcon, type AppIconName } from './AppIcon';

type AppButtonProps = {
  accessibilityLabel: string;
  compact?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: AppIconName;
  iconPosition?: 'leading' | 'trailing';
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'success' | 'achievement' | 'muted' | 'outlinePrimary';
  density?: 'regular' | 'mobile' | 'compact' | 'heroCompact' | 'landscapeCompact';
  pill?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

/** Shared primary action with consistent pointer, touch, focus, and disabled states. */
export function AppButton({
  accessibilityLabel,
  compact = false,
  density,
  disabled = false,
  fullWidth = true,
  icon,
  iconPosition = 'trailing',
  label,
  onPress,
  pill = false,
  style,
  labelStyle,
  tone = 'primary',
}: AppButtonProps) {
  const { focused, onFocus, onBlur, onPressIn } = useKeyboardFocus();
  const [hovered, setHovered] = useState(false);
  const isHeroCompact = density === 'heroCompact';
  const isLandscapeCompact = density === 'landscapeCompact';
  const isCompact = compact || density === 'compact' || isHeroCompact || isLandscapeCompact;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onBlur={onBlur}
      onFocus={onFocus} onPressIn={onPressIn}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[tone],
        fullWidth && styles.fullWidth,
        isCompact && styles.compactButton,
        isHeroCompact && styles.heroCompactButton,
        isLandscapeCompact && styles.landscapeCompactButton,
        pill && styles.pillButton,
        hovered && !disabled && styles[`${tone}Hovered`],
        pressed && !disabled && styles[`${tone}Pressed`],
        focused && ((() => {
          if (tone === 'outlinePrimary') {
            return styles.outlinePrimaryFocused;
          } else {
            return styles.focused;
          }
        })()),
        disabled && tone !== 'muted' && tone !== 'outlinePrimary' && styles.disabledSolid,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {(() => {
          if (icon && iconPosition === 'leading') {
            return (
          <AppIcon
            name={icon}
            size={(() => {
              if (isLandscapeCompact) {
                return 12;
              } else {
                if (isHeroCompact) {
                  return 16;
                } else {
                  if (isCompact) {
                    return 'md';
                  } else {
                    return 'lg';
                  }
                }
              }
            })()}
            color={(() => {
              if (tone === 'muted') {
                return 'secondaryText';
              } else {
                if (tone === 'outlinePrimary') {
                  return 'accent';
                } else {
                  return 'onPrimary';
                }
              }
            })()}
          />
        );
          } else {
            return null;
          }
        })()}
        {!!label && <Text
          style={[
            styles.label,
            isCompact && styles.compactLabel,
            isHeroCompact && styles.heroCompactLabel,
            isLandscapeCompact && styles.landscapeCompactLabel,
            tone === 'muted' && styles.mutedLabel,
            tone === 'outlinePrimary' && styles.outlinePrimaryLabel,
            disabled && styles.disabledLabel,
            labelStyle,
          ]}
        >
          {label}
        </Text>}
        {(() => {
          if (icon && iconPosition === 'trailing') {
            return (
          <AppIcon
            name={icon}
            size={(() => {
              if (isLandscapeCompact) {
                return 12;
              } else {
                if (isHeroCompact) {
                  return 16;
                } else {
                  if (isCompact) {
                    return 'md';
                  } else {
                    return 'lg';
                  }
                }
              }
            })()}
            color={(() => {
              if (tone === 'muted') {
                return 'secondaryText';
              } else {
                if (tone === 'outlinePrimary') {
                  return 'accent';
                } else {
                  return 'onPrimary';
                }
              }
            })()}
          />
        );
          } else {
            return null;
          }
        })()}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    outlineWidth: 0,
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 3,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  pillButton: {
    borderRadius: Radius.full,
  },
  compactButton: {
    borderRadius: Radius.full,
    minHeight: 48,
    paddingHorizontal: 22,
  },
  heroCompactButton: {
    borderRadius: Radius.full,
    borderWidth: 2,
    height: 38,
    minHeight: 38,
    paddingHorizontal: 18,
    paddingVertical: 3,
  },
  landscapeCompactButton: {
    borderRadius: Radius.full,
    borderWidth: 1.5,
    height: 24,
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.rolePrimary,
    borderColor: Colors.rolePrimary,
  },
  primaryHovered: {
    backgroundColor: Colors.rolePrimaryHover,
    borderColor: Colors.rolePrimaryHover,
  },
  primaryPressed: {
    backgroundColor: Colors.rolePrimaryPressed,
    borderColor: Colors.rolePrimaryPressed,
    transform: [{ scale: 0.995 }],
  },
  success: {
    backgroundColor: Colors.goal,
    borderColor: Colors.goal,
  },
  successHovered: {
    backgroundColor: Colors.goalHover,
    borderColor: Colors.goalHover,
  },
  successPressed: {
    backgroundColor: Colors.goalPressed,
    borderColor: Colors.goalPressed,
    transform: [{ scale: 0.995 }],
  },
  achievement: {
    backgroundColor: Colors.achievement,
    borderColor: Colors.achievement,
  },
  achievementHovered: {
    backgroundColor: Colors.achievementHover,
    borderColor: Colors.achievementHover,
  },
  achievementPressed: {
    backgroundColor: Colors.achievementPressed,
    borderColor: Colors.achievementPressed,
    transform: [{ scale: 0.995 }],
  },
  muted: {
    backgroundColor: Colors.adventureControl,
    borderColor: Colors.adventure,
  },
  mutedHovered: {
    backgroundColor: Colors.adventureControl,
    borderColor: Colors.adventure,
  },
  mutedPressed: {
    backgroundColor: Colors.adventureControl,
    borderColor: Colors.adventure,
  },
  outlinePrimary: {
    backgroundColor: Colors.surface,
    borderColor: Colors.rolePrimary,
  },
  outlinePrimaryHovered: {
    backgroundColor: '#FFF4E8',
    borderColor: Colors.rolePrimaryHover,
  },
  outlinePrimaryPressed: {
    backgroundColor: '#FFE8D9',
    borderColor: Colors.rolePrimaryPressed,
  },
  outlinePrimaryFocused: {
    borderColor: Colors.rolePrimaryPressed,
  },
  focused: {
    borderColor: Colors.focus,
  },
  disabled: {
    opacity: 0.72,
  },
  disabledSolid: {
    backgroundColor: Colors.disabled,
    borderColor: Colors.disabled,
  },
  label: {
    color: Colors.surface,
    fontFamily: FontFamily.rounded,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  compactLabel: {
    fontSize: 15,
    letterSpacing: 0.8,
  },
  heroCompactLabel: {
    fontSize: 14,
    fontWeight: '900',
    includeFontPadding: false,
    letterSpacing: 0.6,
    lineHeight: 18,
  },
  landscapeCompactLabel: {
    fontSize: 10,
    includeFontPadding: false,
    letterSpacing: 0.4,
    lineHeight: 12,
  },
  disabledLabel: {
    opacity: 0.9,
  },
  mutedLabel: {
    color: Colors.textSecondary,
  },
  outlinePrimaryLabel: {
    color: Colors.rolePrimary,
  },
});
