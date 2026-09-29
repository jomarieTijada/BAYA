import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { ResponsiveLayout } from '../../../constants/theme';
import { AppButton } from '../../ui/AppButton';
import { FilipinoLabels } from '../../../constants/filipinoLabels';

export function StoryNavigation({
  onPrevious,
  onNext,
  isLast,
  previousAccessibilityLabel,
  nextAccessibilityLabel,
  disabled = false,
}: {
  onPrevious?: () => void;
  onNext: () => void;
  isLast: boolean;
  previousAccessibilityLabel?: string;
  nextAccessibilityLabel?: string;
  disabled?: boolean;
}) {
  const { isCompactHeight, isDesktop, isPhone, isPhoneLandscape, isTablet } = useResponsiveLayout();
  const compact = isPhone || isCompactHeight;
  const landscapeCompact = isPhoneLandscape;
  const pagePadding = landscapeCompact
    ? ResponsiveLayout.pagePadding.landscapePhone
    : isPhone
      ? ResponsiveLayout.pagePadding.phone
      : isTablet
        ? ResponsiveLayout.pagePadding.tablet
        : isDesktop
          ? ResponsiveLayout.pagePadding.desktop
          : ResponsiveLayout.pagePadding.tablet;

  return (
    <View
      style={[
        styles.navigation,
        compact && styles.navigationCompact,
        landscapeCompact && styles.navigationLandscapeCompact,
        { paddingHorizontal: pagePadding },
      ]}
      testID="story-navigation"
    >
      <AppButton
        accessibilityLabel={previousAccessibilityLabel ?? 'Bumalik sa nakaraang paksa'}
        compact={compact}
        density={landscapeCompact ? 'heroCompact' : undefined}
        disabled={!onPrevious}
        fullWidth={false}
        label={FilipinoLabels.back}
        onPress={() => onPrevious?.()}
        pill
        style={styles.button}
      />
      <AppButton
        accessibilityLabel={nextAccessibilityLabel ?? (isLast ? 'Bumalik sa mga paksa' : 'Susunod na paksa')}
        compact={compact}
        density={landscapeCompact ? 'heroCompact' : undefined}
        disabled={disabled}
        fullWidth={false}
        label={isLast ? FilipinoLabels.topics : FilipinoLabels.next}
        onPress={onNext}
        pill
        style={styles.button}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  navigation: {
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    flexDirection: 'row',
    flexShrink: 0,
    justifyContent: 'space-between',
    paddingVertical: 4,
    zIndex: 1,
  },
  navigationCompact: { paddingVertical: 4 },
  navigationLandscapeCompact: { paddingVertical: 5 },
  button: { flexShrink: 0, minWidth: 112 },
});
