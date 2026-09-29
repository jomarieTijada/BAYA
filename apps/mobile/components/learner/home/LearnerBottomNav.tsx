import React, { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { AppIcon, type AppIconName } from '../../ui/AppIcon';

export type LearnerNavRoute =
  | '/learner/home'
  | '/learner/lessons'
  | '/learner/achievements'
  | '/learner/profile';

type LearnerBottomNavProps = {
  activeRoute?: LearnerNavRoute;
  onLayout?: (event: LayoutChangeEvent) => void;
};

type NavItemDefinition = {
  activeIcon: AppIconName;
  href: LearnerNavRoute;
  inactiveIcon: AppIconName;
  label: string;
};

const navItems: readonly NavItemDefinition[] = [
  { activeIcon: 'home', href: '/learner/home', inactiveIcon: 'home', label: 'Home' },
  { activeIcon: 'lessons', href: '/learner/lessons', inactiveIcon: 'lessons', label: 'Lessons' },
  { activeIcon: 'star', href: '/learner/achievements', inactiveIcon: 'starOutline', label: 'Achievements' },
  { activeIcon: 'profile', href: '/learner/profile', inactiveIcon: 'profile', label: 'Profile' },
];

function LearnerNavItem({
  active,
  compact,
  landscapeCompact,
  href,
  activeIcon,
  inactiveIcon,
  label,
}: {
  active: boolean;
  activeIcon: AppIconName;
  compact: boolean;
  href: LearnerNavRoute;
  inactiveIcon: AppIconName;
  label: string;
  landscapeCompact: boolean;
}) {
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const icon = active ? activeIcon : inactiveIcon;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => {
        if (!active) {
          router.dismissTo(href);
        }
      }}
      style={({ pressed }) => [
        styles.item,
        compact && styles.itemCompact,
        landscapeCompact && styles.itemLandscapeCompact,
        (focused || hovered) && styles.itemActive,
        pressed && styles.itemPressed,
      ]}
    >
      <AppIcon
        color={active ? 'accent' : 'muted'}
        name={icon}
        size={landscapeCompact ? 20 : compact ? 21 : 26}
      />
      <Text
        style={[
          styles.label,
          compact && styles.labelCompact,
          landscapeCompact && styles.labelLandscapeCompact,
          active && styles.activeLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function LearnerBottomNav({ activeRoute, onLayout }: LearnerBottomNavProps) {
  const { isCompactHeight, isPhone, isPhoneLandscape } = useResponsiveLayout();
  const compact = isPhone || isCompactHeight;
  const landscapeCompact = isPhoneLandscape;

  return (
    <View
      accessibilityRole="tablist"
      onLayout={onLayout}
      style={[
        styles.nav,
        compact && styles.navCompact,
        landscapeCompact && styles.navLandscapeCompact,
      ]}
      testID="learner-bottom-nav"
    >
      {navItems.map((item) => (
        <LearnerNavItem
          active={item.href === activeRoute}
          activeIcon={item.activeIcon}
          compact={compact}
          href={item.href}
          inactiveIcon={item.inactiveIcon}
          key={item.href}
          label={item.label}
          landscapeCompact={landscapeCompact}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
    height: 72,
    maxHeight: 78,
    minHeight: 64,
    minWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    width: '100%',
  },
  navCompact: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
    height: 56,
    maxHeight: 60,
    minHeight: 50,
    paddingVertical: 4,
    width: '100%',
  },
  navLandscapeCompact: {
    height: 48,
    maxHeight: 52,
    minHeight: 44,
    paddingVertical: 2,
  },
  item: {
    alignItems: 'center',
    borderColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 56,
  },
  itemCompact: {
    minHeight: 46,
  },
  itemLandscapeCompact: {
    gap: 1,
    minHeight: 40,
  },
  itemActive: {
    backgroundColor: Colors.roleSecondaryHover,
    borderColor: Colors.focus,
  },
  itemPressed: {
    opacity: 0.76,
  },
  label: {
    color: Colors.textMuted,
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: '800',
  },
  labelCompact: {
    fontSize: 11,
  },
  labelLandscapeCompact: {
    fontSize: 10,
  },
  activeLabel: {
    color: Colors.rolePrimary,
  },
});
