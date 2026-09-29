import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';
import { AppIcon } from '../../ui/AppIcon';

type XpProgressProps = {
  compact?: boolean;
  density?: 'regular' | 'landscapeCompact';
  goal: number;
  value: number;
};

export function XpProgress({ compact = false, density, goal, value }: XpProgressProps) {
  const safeGoal = Math.max(goal, 1);
  const safeValue = Math.max(0, value);
  const percentage = Math.min(100, (safeValue / safeGoal) * 100);
  const isLandscapeCompact = density === 'landscapeCompact';

  return (
    <View
      accessibilityLabel={`${safeValue} of ${goal} experience points`}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: goal, min: 0, now: safeValue }}
      style={[
        styles.container,
        compact && styles.containerCompact,
        isLandscapeCompact && styles.containerLandscapeCompact,
      ]}
    >
      <AppIcon
        color="achievement"
        name="star"
        size={isLandscapeCompact ? 14 : compact ? 22 : 27}
      />
      <View
        style={[
          styles.content,
          compact && styles.contentCompact,
          isLandscapeCompact && styles.contentLandscapeCompact,
        ]}
      >
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.value,
              compact && styles.valueCompact,
              isLandscapeCompact && styles.valueLandscapeCompact,
            ]}
          >
            {safeValue}/{goal}
          </Text>
          <Text
            style={[
              styles.unit,
              compact && styles.unitCompact,
              isLandscapeCompact && styles.unitLandscapeCompact,
            ]}
          >
            EXP
          </Text>
        </View>
        <View
          style={[
            styles.track,
            isLandscapeCompact && styles.trackLandscapeCompact,
          ]}
        >
          <View style={[styles.fill, { width: `${percentage}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.progressTrack,
    borderRadius: Radius.full,
    borderWidth: 2,
    flexDirection: 'row',
    gap: Spacing.sm,
    minWidth: 180,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  containerCompact: {
    minWidth: 128,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  containerLandscapeCompact: {
    alignItems: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
    gap: 4,
    height: 28,
    maxWidth: 96,
    minWidth: 84,
    paddingHorizontal: 6,
    paddingVertical: 2,
    width: 90,
  },
  content: {
    flex: 1,
    minWidth: 105,
  },
  contentCompact: {
    minWidth: 78,
  },
  contentLandscapeCompact: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  value: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 17,
    fontWeight: '900',
  },
  valueCompact: {
    fontSize: 15,
  },
  valueLandscapeCompact: {
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 13,
  },
  unit: {
    color: Colors.textMuted,
    fontFamily: FontFamily.rounded,
    fontSize: 12,
    fontWeight: '800',
  },
  unitCompact: {
    fontSize: 10,
  },
  unitLandscapeCompact: {
    color: Colors.textMuted,
    fontFamily: FontFamily.rounded,
    fontSize: 8.5,
    fontWeight: '800',
    includeFontPadding: false,
    lineHeight: 11,
  },
  track: {
    backgroundColor: Colors.progressTrack,
    borderRadius: Radius.full,
    height: 10,
    marginTop: 4,
    overflow: 'hidden',
    width: '100%',
  },
  trackLandscapeCompact: {
    height: 3,
    marginTop: 2,
  },
  fill: {
    backgroundColor: Colors.rolePrimary,
    borderRadius: Radius.full,
    height: '100%',
  },
});
