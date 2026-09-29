import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';

export type ActivityProgressProps = {
  compact?: boolean;
  currentStep: number;
  landscapeCompact?: boolean;
  stepLabel?: string;
  topicTitle: string;
  totalSteps: number;
};

/**
 * Clean Single Activity Progress Indicator.
 * Displays the current step within the topic (e.g., "Hakbang 1 ng 5") and a single animated track.
 */
export function ActivityProgress({
  compact = false,
  currentStep,
  landscapeCompact = false,
  stepLabel,
  topicTitle,
  totalSteps,
}: ActivityProgressProps) {
  const percentage =
    totalSteps > 0 ? Math.min(100, Math.round((currentStep / totalSteps) * 100)) : 0;
  const stepText = stepLabel || `Hakbang ${currentStep} ng ${totalSteps}`;

  return (
    <View
      accessibilityLabel={`Progress: ${stepText}. Topic: ${topicTitle}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
      style={[
        styles.container,
        compact && styles.containerCompact,
        landscapeCompact && styles.containerLandscapeCompact,
      ]}
      testID="activity-progress"
    >
      <View style={styles.infoRow}>
        <Text
          numberOfLines={1}
          style={[
            styles.topicText,
            compact && styles.topicTextCompact,
            landscapeCompact && styles.topicTextLandscapeCompact,
          ]}
        >
          {topicTitle}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.stepCounterText,
            compact && styles.stepCounterTextCompact,
            landscapeCompact && styles.stepCounterTextLandscapeCompact,
          ]}
        >
          {stepText}
        </Text>
      </View>

      {/* Single Unified Visual Progress Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomColor: '#EFE7DA',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: 6,
    width: '100%',
  },
  containerCompact: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  containerLandscapeCompact: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 3,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topicText: {
    color: Colors.textSecondary,
    flex: 1,
    fontFamily: FontFamily.rounded,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginRight: 8,
  },
  topicTextCompact: {
    fontSize: 11,
  },
  topicTextLandscapeCompact: {
    fontSize: 10,
    includeFontPadding: false,
  },
  stepCounterText: {
    color: Colors.rolePrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 11.5,
    fontWeight: '800',
  },
  stepCounterTextCompact: {
    fontSize: 10.5,
  },
  stepCounterTextLandscapeCompact: {
    fontSize: 9.5,
    includeFontPadding: false,
  },
  track: {
    backgroundColor: '#EAE1D5',
    borderRadius: Radius.full,
    height: 5,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    backgroundColor: Colors.bayaGreen,
    borderRadius: Radius.full,
    height: '100%',
  },
});
