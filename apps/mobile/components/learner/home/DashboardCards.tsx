import React from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';
import { FilipinoLabels } from '../../../constants/filipinoLabels';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { AppButton } from '../../ui/AppButton';
import { AppIcon } from '../../ui/AppIcon';
import { DashboardCard } from './DashboardCard';
import type { LearnerHomeViewModel } from './learnerHomeDemo';

type DashboardCardsProps = {
  adventure: LearnerHomeViewModel['adventure'];
  dailyGoal: LearnerHomeViewModel['dailyGoal'];
  onGoToLessons: () => void;
  onViewRewards: () => void;
  recentAchievement: LearnerHomeViewModel['recentAchievement'];
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function DashboardCards({
  adventure,
  dailyGoal,
  onGoToLessons,
  onViewRewards,
  recentAchievement,
  onLayout,
}: DashboardCardsProps) {
  const { isPhoneLandscape, isPhonePortrait } = useResponsiveLayout();
  const singleColumn = isPhonePortrait;
  const landscapeCompact = isPhoneLandscape;
  const completed = Math.min(Math.max(dailyGoal.completed, 0), dailyGoal.target);
  const remaining = Math.max(dailyGoal.target - completed, 0);
  const goalMessage = dailyGoal.target === 0
    ? 'All approved topics complete!'
    : remaining === 0
    ? 'Daily goal complete!'
    : completed === 0
      ? `Complete ${dailyGoal.target} ${dailyGoal.target === 1 ? 'activity' : 'activities'}`
      : `Complete ${remaining} more ${remaining === 1 ? 'activity' : 'activities'}`;

  const hasAchievement = Boolean(recentAchievement);
  const achievementTitle = recentAchievement?.title ?? 'No achievements yet';
  const achievementDescription =
    recentAchievement?.description ?? 'Complete lessons to earn your first achievement.';

  const cardLayoutStyle = singleColumn ? styles.cardSingle : landscapeCompact ? styles.cardThirdCompact : styles.cardThird;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.grid,
        singleColumn && styles.gridSingle,
        landscapeCompact && styles.gridLandscapeCompact,
      ]}
      testID="dashboard-cards-wrapper"
    >
      <DashboardCard
        action={
          <AppButton
            accessibilityLabel="Go to lessons"
            compact
            density={landscapeCompact ? 'landscapeCompact' : 'compact'}
            fullWidth
            label={FilipinoLabels.lessons}
            onPress={onGoToLessons}
            pill
            tone="success"
          />
        }
        compact={landscapeCompact}
        label="TODAY'S GOAL"
        style={cardLayoutStyle}
        tone="goal"
      >
        <Text style={[styles.title, landscapeCompact && styles.titleCompact]}>Daily Progress</Text>
        <Text
          numberOfLines={landscapeCompact ? 1 : undefined}
          style={[styles.description, styles.goalDescription, landscapeCompact && styles.descriptionCompact]}
        >
          {goalMessage}
        </Text>
        {dailyGoal.target > 0 ? (
          <View
            accessibilityLabel={`${completed} of ${dailyGoal.target} daily goal activities completed`}
            accessibilityRole="progressbar"
            accessibilityValue={{ max: dailyGoal.target, min: 0, now: completed }}
            style={[styles.goalStars, landscapeCompact && styles.goalStarsCompact]}
          >
            {Array.from({ length: dailyGoal.target }, (_, index) => (
              <AppIcon
                color={index < completed ? 'achievement' : 'starMuted'}
                key={index}
                name="star"
                size={landscapeCompact ? 14 : 35}
              />
            ))}
          </View>
        ) : null}
      </DashboardCard>

      <DashboardCard
        action={
          <AppButton
            accessibilityLabel="Adventure is locked"
            compact
            density={landscapeCompact ? 'landscapeCompact' : 'compact'}
            disabled
            fullWidth
            icon="lock"
            iconPosition="leading"
            label={FilipinoLabels.locked}
            onPress={() => undefined}
            pill
            tone="muted"
          />
        }
        compact={landscapeCompact}
        label="VALUES ADVENTURE"
        style={cardLayoutStyle}
        tone="adventure"
      >
        <View style={landscapeCompact ? styles.horizontalHeader : styles.verticalHeader}>
          <View
            style={[
              styles.featureIcon,
              styles.adventureIcon,
              landscapeCompact && styles.featureIconCompact,
            ]}
          >
            <AppIcon color="adventure" name="lock" size={landscapeCompact ? 11 : 26} />
          </View>
          <Text style={[styles.title, landscapeCompact && styles.titleCompact]}>{adventure.title}</Text>
        </View>
        <Text
          numberOfLines={landscapeCompact ? 2 : undefined}
          style={[styles.description, styles.adventureDescription, landscapeCompact && styles.descriptionCompact]}
        >
          {adventure.description}
        </Text>
      </DashboardCard>

      <DashboardCard
        action={
          <AppButton
            accessibilityLabel={hasAchievement ? 'View rewards' : 'No rewards yet'}
            compact
            density={landscapeCompact ? 'landscapeCompact' : 'compact'}
            disabled={!hasAchievement}
            fullWidth
            label={hasAchievement ? 'Rewards' : 'None Yet'}
            onPress={hasAchievement ? onViewRewards : () => undefined}
            pill
            tone={hasAchievement ? 'achievement' : 'muted'}
          />
        }
        compact={landscapeCompact}
        label="RECENT ACHIEVEMENT"
        style={cardLayoutStyle}
        tone="achievement"
      >
        <View style={landscapeCompact ? styles.horizontalHeader : styles.verticalHeader}>
          <View
            style={[
              styles.featureIcon,
              hasAchievement ? styles.achievementIcon : styles.achievementIconEmpty,
              landscapeCompact && styles.featureIconCompact,
            ]}
          >
            <AppIcon
              color={hasAchievement ? 'achievement' : 'starMuted'}
              name={hasAchievement ? 'star' : 'starOutline'}
              size={landscapeCompact ? 12 : 29}
            />
          </View>
          <Text style={[styles.title, landscapeCompact && styles.titleCompact]}>{achievementTitle}</Text>
        </View>
        <Text
          numberOfLines={landscapeCompact ? 2 : undefined}
          style={[
            styles.description,
            hasAchievement ? styles.achievementDescription : styles.achievementDescriptionEmpty,
            landscapeCompact && styles.descriptionCompact,
          ]}
        >
          {achievementDescription}
        </Text>
      </DashboardCard>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: Spacing.lg,
    minWidth: 0,
    width: '100%',
  },
  gridSingle: {
    flexDirection: 'column',
  },
  gridLandscapeCompact: {
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 8,
    width: '97%',
  },
  cardSingle: {
    minHeight: 224,
    width: '100%',
  },
  cardThird: {
    flex: 1,
    minHeight: 250,
    minWidth: 0,
  },
  cardThirdCompact: {
    flex: 1,
    height: 114,
    maxHeight: 116,
    minHeight: 112,
    minWidth: 0,
  },
  horizontalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  verticalHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardContentCompact: {
    alignItems: 'center',
    flex: 1,
    gap: 1,
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 14,
  },
  description: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 6,
    textAlign: 'center',
  },
  descriptionCompact: {
    fontSize: 9,
    includeFontPadding: false,
    lineHeight: 11,
    marginTop: 1,
    textAlign: 'center',
  },
  goalDescription: {
    color: Colors.goalText,
  },
  adventureDescription: {
    color: Colors.adventureText,
  },
  achievementDescription: {
    color: Colors.achievementText,
  },
  goalStars: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 14,
  },
  goalStarsCompact: {
    gap: 3,
    marginTop: 1,
  },
  featureIcon: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 2,
    height: 52,
    justifyContent: 'center',
    marginBottom: 8,
    width: 52,
  },
  featureIconCompact: {
    alignItems: 'center',
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    marginBottom: 0,
    width: 18,
  },
  adventureIcon: {
    borderColor: Colors.adventure,
  },
  achievementIcon: {
    borderColor: Colors.achievement,
  },
  achievementIconEmpty: {
    borderColor: '#DED0B9',
  },
  achievementDescriptionEmpty: {
    color: Colors.textMuted,
  },
});
