import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontFamily, Spacing } from '../../../constants/theme';
import { AppButton } from '../../ui/AppButton';

export type ActivityActionButtonProps = {
  accessibilityLabel?: string;
  compact?: boolean;
  density?: 'regular' | 'mobile' | 'compact' | 'heroCompact' | 'landscapeCompact';
  disabledHint?: string;
  isEnabled: boolean;
  label?: string;
  landscapeCompact?: boolean;
  onPress: () => void;
};

/**
 * Large Centered Child-Friendly CTA Button.
 * Redesigned from a full-width flat strip into a prominent pill-shaped action button.
 */
export function ActivityActionButton({
  accessibilityLabel = 'Ituloy ang aralin',
  compact = false,
  density,
  disabledHint = 'Panoorin ang video upang magpatuloy.',
  isEnabled,
  label = 'Susunod',
  landscapeCompact = false,
  onPress,
}: ActivityActionButtonProps) {
  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        landscapeCompact && styles.containerLandscapeCompact,
      ]}
      testID="activity-action-button-container"
    >
      <AppButton
        accessibilityLabel={accessibilityLabel}
        compact={compact}
        density={landscapeCompact ? 'compact' : density}
        disabled={!isEnabled}
        fullWidth={false}
        icon="chevronRight"
        iconPosition="trailing"
        label={label}
        onPress={onPress}
        pill
        style={[
          styles.ctaButton,
          compact && styles.ctaButtonCompact,
          landscapeCompact && styles.ctaButtonLandscapeCompact,
        ]}
        tone="primary"
      />

      {!isEnabled && disabledHint ? (
        <Text
          style={[
            styles.hintText,
            compact && styles.hintTextCompact,
            landscapeCompact && styles.hintTextLandscapeCompact,
          ]}
        >
          {disabledHint}
        </Text>
      ) : null}
    </View>
  );
}

// Re-export alias ActivityButton as requested
export const ActivityButton = ActivityActionButton;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    width: '100%',
  },
  containerCompact: {
    marginTop: Spacing.xs + 2,
    paddingBottom: 2,
  },
  containerLandscapeCompact: {
    marginTop: 4,
    paddingBottom: 2,
  },
  ctaButton: {
    height: 56,
    maxWidth: 380,
    minHeight: 56,
    minWidth: 280,
    paddingHorizontal: 32,
  },
  ctaButtonCompact: {
    height: 52,
    maxWidth: 340,
    minHeight: 52,
    minWidth: 260,
    paddingHorizontal: 28,
  },
  ctaButtonLandscapeCompact: {
    height: 44,
    maxWidth: 300,
    minHeight: 44,
    minWidth: 220,
    paddingHorizontal: 20,
  },
  hintText: {
    color: '#8A7B6E',
    fontFamily: FontFamily.body,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  hintTextCompact: {
    fontSize: 11,
    marginTop: 3,
  },
  hintTextLandscapeCompact: {
    fontSize: 9.5,
    includeFontPadding: false,
    marginTop: 2,
  },
});
