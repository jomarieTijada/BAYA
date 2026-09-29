import React, { useEffect, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Colors,
  FontFamily,
  LayoutTokens,
  Radius,
  Spacing,
} from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { AppIcon } from '../ui/AppIcon';
import { BackButton } from '../ui/BackButton';

const LearnerHeaderMetrics = LayoutTokens.headerMetrics;

export type LearnerPageHeaderProps = {
  onBack: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  onOpenSettings?: () => void;
  progress?: { current: number; total: number };
  progressPercentage?: number;
  subtitle?: string;
  testID?: string;
  title: string;
};

/** Fixed-height shared top bar for learner pages, with an optional progress track. */
export function LearnerPageHeader({
  onBack,
  onLayout,
  onOpenSettings,
  progress,
  progressPercentage,
  subtitle,
  testID = 'learner-page-header',
  title,
}: LearnerPageHeaderProps) {
  const { isCompactHeight, isPhone, isPhoneLandscape, isPhonePortrait } = useResponsiveLayout();
  const compact = isPhone || isCompactHeight;
  const landscapeCompact = isPhoneLandscape;
  const metrics = landscapeCompact
    ? LearnerHeaderMetrics.landscapeCompact
    : compact
      ? LearnerHeaderMetrics.compact
      : LearnerHeaderMetrics.regular;
  const [settingsFocused, setSettingsFocused] = useState(false);
  const [settingsHovered, setSettingsHovered] = useState(false);
  const percentage = progress?.total
    ? Math.min(100, Math.max(0, Math.round((progress.current / progress.total) * 100)))
    : progressPercentage == null
      ? null
      : Math.min(100, Math.max(0, progressPercentage));
  const progressLabel = progress
    ? `Progress: Step ${progress.current} of ${progress.total}`
    : `Progress: ${Math.round(percentage ?? 0)} percent`;
  const [animatedProgress] = useState(() => new Animated.Value(percentage ?? 0));

  useEffect(() => {
    if (percentage == null) return;
    const animation = Animated.timing(animatedProgress, {
      toValue: percentage,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      // Scale the fill on the native/compositor thread; animating width forces
      // a layout pass every frame and can stutter during topic transitions.
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animatedProgress, percentage]);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.header,
        compact && styles.headerCompact,
        landscapeCompact && styles.headerLandscapeCompact,
        isPhonePortrait && styles.headerPhonePortrait,
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.topRow,
          compact && styles.topRowCompact,
          landscapeCompact && styles.topRowLandscapeCompact,
          isPhonePortrait && styles.topRowPhonePortrait,
        ]}
      >
        <View
          style={[
            styles.headerLeft,
            compact && styles.headerLeftCompact,
            landscapeCompact && styles.headerLeftLandscapeCompact,
          ]}
        >
          <BackButton
            accessibilityLabel="Back"
            onPress={onBack}
            size={landscapeCompact ? 'landscape' : compact ? 'compact' : 'header'}
          />
          <View style={styles.titleColumn}>
            <Text
              accessibilityRole="header"
              ellipsizeMode="tail"
              numberOfLines={1}
              style={[
                styles.title,
                compact && styles.titleCompact,
                landscapeCompact && styles.titleLandscapeCompact,
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                ellipsizeMode="tail"
                numberOfLines={1}
                style={[
                  styles.subtitle,
                  compact && styles.subtitleCompact,
                  landscapeCompact && styles.subtitleLandscapeCompact,
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {onOpenSettings ? (
          <View style={[styles.headerRight, compact && styles.headerRightCompact]}>
            <Pressable
              accessibilityLabel="Settings"
              accessibilityRole="button"
              hitSlop={8}
              onBlur={() => setSettingsFocused(false)}
              onFocus={() => setSettingsFocused(true)}
              onHoverIn={() => setSettingsHovered(true)}
              onHoverOut={() => setSettingsHovered(false)}
              onPress={onOpenSettings}
              style={({ pressed }) => [
                styles.settingsButton,
                compact && styles.settingsButtonCompact,
                landscapeCompact && styles.settingsButtonLandscapeCompact,
                (settingsFocused || settingsHovered) && styles.settingsButtonActive,
                pressed && styles.settingsButtonPressed,
              ]}
            >
              <AppIcon color="accent" name="settings" size={metrics.settingsIcon} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {percentage != null ? (
        <View
          accessibilityLabel={progressLabel}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percentage }}
          style={[
            styles.progressTrack,
            compact && styles.progressTrackCompact,
            landscapeCompact && styles.progressTrackLandscapeCompact,
          ]}
          testID={`${testID}-progress`}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                transform: [{
                  scaleX: animatedProgress.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 1],
                  }),
                }],
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignSelf: 'stretch',
    backgroundColor: Colors.background,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'column',
    flexShrink: 0,
    height: LearnerHeaderMetrics.regular.height,
    maxHeight: LearnerHeaderMetrics.regular.maxHeight,
    minHeight: LearnerHeaderMetrics.regular.minHeight,
    justifyContent: 'space-between',
    overflow: 'hidden',
    width: '100%',
    zIndex: 10,
  },
  headerCompact: {
    height: LearnerHeaderMetrics.compact.height,
    maxHeight: LearnerHeaderMetrics.compact.maxHeight,
    minHeight: LearnerHeaderMetrics.compact.minHeight,
  },
  headerLandscapeCompact: {
    height: LearnerHeaderMetrics.landscapeCompact.height,
    maxHeight: LearnerHeaderMetrics.landscapeCompact.maxHeight,
    minHeight: LearnerHeaderMetrics.landscapeCompact.minHeight,
  },
  headerPhonePortrait: {
    height: undefined,
    maxHeight: undefined,
    minHeight: LearnerHeaderMetrics.phonePortrait.minHeight,
    overflow: 'visible',
  },
  topRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    paddingHorizontal: LearnerHeaderMetrics.regular.paddingHorizontal,
    paddingTop: 8,
    width: '100%',
  },
  topRowCompact: {
    paddingHorizontal: LearnerHeaderMetrics.compact.paddingHorizontal,
    paddingTop: LearnerHeaderMetrics.compact.paddingVertical,
  },
  topRowLandscapeCompact: {
    paddingHorizontal: LearnerHeaderMetrics.landscapeCompact.paddingHorizontal,
    paddingBottom: 2,
    paddingTop: 2,
  },
  topRowPhonePortrait: {
    paddingHorizontal: LearnerHeaderMetrics.phonePortrait.paddingHorizontal,
    paddingTop: LearnerHeaderMetrics.phonePortrait.paddingVertical,
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    minWidth: 0,
  },
  headerLeftCompact: { gap: Spacing.sm },
  headerLeftLandscapeCompact: { gap: 6 },
  titleColumn: { flex: 1, justifyContent: 'center', minWidth: 0 },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: LearnerHeaderMetrics.regular.title,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 29,
  },
  titleCompact: { fontSize: LearnerHeaderMetrics.compact.title, lineHeight: 22 },
  titleLandscapeCompact: {
    fontSize: LearnerHeaderMetrics.landscapeCompact.title,
    includeFontPadding: false,
    lineHeight: 18,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: LearnerHeaderMetrics.regular.subtitle,
    fontWeight: '600',
    marginTop: 2,
  },
  subtitleCompact: { fontSize: LearnerHeaderMetrics.compact.subtitle, marginTop: 1 },
  subtitleLandscapeCompact: {
    fontSize: LearnerHeaderMetrics.landscapeCompact.subtitle,
    includeFontPadding: false,
    lineHeight: 14,
    marginTop: 0,
  },
  headerRight: { alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.md },
  headerRightCompact: { marginLeft: Spacing.sm },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 2,
    height: LearnerHeaderMetrics.regular.settingsButton,
    justifyContent: 'center',
    width: LearnerHeaderMetrics.regular.settingsButton,
  },
  settingsButtonCompact: {
    height: LearnerHeaderMetrics.compact.settingsButton,
    width: LearnerHeaderMetrics.compact.settingsButton,
  },
  settingsButtonLandscapeCompact: {
    borderWidth: 1.5,
    height: LearnerHeaderMetrics.landscapeCompact.settingsButton,
    width: LearnerHeaderMetrics.landscapeCompact.settingsButton,
  },
  settingsButtonActive: { backgroundColor: Colors.roleSecondaryHover, borderColor: Colors.focus },
  settingsButtonPressed: { transform: [{ scale: 0.96 }] },
  progressTrack: {
    backgroundColor: '#EAE1D5',
    borderRadius: Radius.full,
    height: 4,
    marginBottom: 4,
    marginHorizontal: LearnerHeaderMetrics.regular.paddingHorizontal,
    overflow: 'hidden',
  },
  progressTrackCompact: { marginHorizontal: LearnerHeaderMetrics.compact.paddingHorizontal },
  progressTrackLandscapeCompact: {
    height: 3,
    marginBottom: 3,
    marginHorizontal: LearnerHeaderMetrics.landscapeCompact.paddingHorizontal,
  },
  progressFill: {
    backgroundColor: Colors.bayaGreen,
    borderRadius: Radius.full,
    height: '100%',
    transformOrigin: 'left center',
    width: '100%',
  },
});
