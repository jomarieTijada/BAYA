import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';

type LessonProgressProps = {
  compact?: boolean;
  density?: 'regular' | 'compact' | 'landscapeCompact';
  percentage: number;
};

/**
 * Top-right progress card showing overall Baybayin Basics progression.
 * Percentage and bar width are strictly derived from lesson data.
 */
export function LessonProgress({
  compact = false,
  density = 'regular',
  percentage,
}: LessonProgressProps) {
  const isLandscapeCompact = density === 'landscapeCompact';
  const isCompact = compact || density === 'compact' || isLandscapeCompact;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <View
      accessibilityLabel={`Overall Basics Progress: ${clampedPercentage}%`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        max: 100,
        min: 0,
        now: clampedPercentage,
        text: `${clampedPercentage}% complete`,
      }}
      style={[
        styles.card,
        isCompact && styles.cardCompact,
        isLandscapeCompact && styles.cardLandscapeCompact,
      ]}
      testID="lesson-overall-progress"
    >
      <Text
        style={[
          styles.label,
          isCompact && styles.labelCompact,
          isLandscapeCompact && styles.labelLandscapeCompact,
        ]}
      >
        OVERALL BASICS PROGRESS
      </Text>
      <View style={styles.metricRow}>
        <Text
          style={[
            styles.percentageText,
            isCompact && styles.percentageTextCompact,
            isLandscapeCompact && styles.percentageTextLandscapeCompact,
          ]}
        >
          {clampedPercentage}%
        </Text>
        <View
          style={[
            styles.track,
            isCompact && styles.trackCompact,
            isLandscapeCompact && styles.trackLandscapeCompact,
          ]}
        >
          <View
            style={[
              styles.fill,
              { width: `${clampedPercentage}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    shadowColor: '#55422A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardCompact: {
    borderRadius: Radius.md,
    minHeight: 46,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
  },
  cardLandscapeCompact: {
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    color: Colors.textMuted,
    fontFamily: FontFamily.rounded,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  labelCompact: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  labelLandscapeCompact: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 3,
  },
  percentageText: {
    color: Colors.goal,
    fontFamily: FontFamily.rounded,
    fontSize: 20,
    fontWeight: '900',
  },
  percentageTextCompact: {
    fontSize: 16,
  },
  percentageTextLandscapeCompact: {
    fontSize: 13,
  },
  track: {
    backgroundColor: '#EAE3D4',
    borderRadius: Radius.full,
    height: 12,
    overflow: 'hidden',
    width: 84,
  },
  trackCompact: {
    height: 10,
    width: 64,
  },
  trackLandscapeCompact: {
    height: 7,
    width: 48,
  },
  fill: {
    backgroundColor: Colors.goal,
    borderRadius: Radius.full,
    height: '100%',
  },
});
