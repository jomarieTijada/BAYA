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
  nextLabel,
  disabled = false,
}: {
  onPrevious?: () => void;
  onNext: () => void;
  isLast: boolean;
  previousAccessibilityLabel?: string;
  nextAccessibilityLabel?: string;
  nextLabel?: string;
  disabled?: boolean;
}) {
  const { isCompactHeight, isDesktop, isPhone, isPhoneLandscape, isTablet } = useResponsiveLayout();
  const compact = isPhone || isCompactHeight;
  const landscapeCompact = isPhoneLandscape;
  let pagePadding;
  if (landscapeCompact) {
    pagePadding = ResponsiveLayout.pagePadding.landscapePhone;
  } else {
    if (isPhone) {
      pagePadding = ResponsiveLayout.pagePadding.phone;
    } else {
      if (isTablet) {
        pagePadding = ResponsiveLayout.pagePadding.tablet;
      } else {
        if (isDesktop) {
          pagePadding = ResponsiveLayout.pagePadding.desktop;
        } else {
          pagePadding = ResponsiveLayout.pagePadding.tablet;
        }
      }
    }
  }

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
        density={(() => {
          if (landscapeCompact) {
            return 'heroCompact';
          } else {
            return undefined;
          }
        })()}
        disabled={disabled || !onPrevious}
        fullWidth={false}
        label={FilipinoLabels.back}
        onPress={() => onPrevious?.()}
        pill
        style={[styles.button, landscapeCompact && { minHeight: 44 }]}
      />
      <AppButton
        accessibilityLabel={nextAccessibilityLabel ?? ((() => {
          if (isLast) {
            return 'Bumalik sa mga paksa';
          } else {
            return 'Susunod na paksa';
          }
        })())}
        compact={compact}
        density={(() => {
          if (landscapeCompact) {
            return 'heroCompact';
          } else {
            return undefined;
          }
        })()}
        disabled={disabled}
        fullWidth={false}
        label={nextLabel ?? ((() => {
          if (isLast) {
            return FilipinoLabels.topics;
          } else {
            return FilipinoLabels.next;
          }
        })())}
        onPress={onNext}
        pill
        style={[styles.button, landscapeCompact && { minHeight: 44 }]}
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
  navigationLandscapeCompact: { paddingVertical: 2 },
  button: { flexShrink: 0, minWidth: 112 },
});
