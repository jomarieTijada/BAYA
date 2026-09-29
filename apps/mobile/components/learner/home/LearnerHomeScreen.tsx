import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ResponsiveLayout, Spacing } from '../../../constants/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { LearnerAppShell } from '../LearnerAppShell';
import { ContinueLessonHero } from './ContinueLessonHero';
import { DashboardCards } from './DashboardCards';
import { LearnerHeader } from './LearnerHeader';
import { learnerHomeDemo } from './learnerHomeDemo';
import type { LearnerHomeViewModel } from './learnerHomeDemo';
import { buildLearnerHomeModel } from './learnerHomeModel';
import { curriculumService } from '../../../database/services/curriculumService';
import { localLearnerService } from '../../../database/services/localLearnerService';

export function LearnerHomeScreen() {
  const router = useRouter();
  const [data, setData] = useState<LearnerHomeViewModel>(learnerHomeDemo);
  const { isPhone, isPhoneLandscape } = useResponsiveLayout();

  useFocusEffect(useCallback(() => {
    let active = true;
    async function hydrate() {
      try {
        const [profile, modules, completedToday] = await Promise.all([
          localLearnerService.getActiveLearner(),
          curriculumService.getCurriculumModules(),
          localLearnerService.getTodayCompletedTopicCount(),
        ]);
        if (active) setData(buildLearnerHomeModel(profile, modules, completedToday));
      } catch (error) {
        if (__DEV__) console.warn('[LearnerHomeScreen] Could not read local learner data', error);
      }
    }
    void hydrate();
    return () => { active = false; };
  }, []));

  return (
    <LearnerAppShell
      activeRoute="/learner/home"
      header={(
        <LearnerHeader
          learner={data.learner}
          onOpenSettings={() => router.push('/learner/settings')}
        />
      )}
      testID="learner-home-root"
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          isPhone && styles.scrollContentPhone,
          isPhoneLandscape && styles.scrollContentLandscape,
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        testID="learner-home-scroll"
      >
        <View
          style={[
            styles.content,
            isPhoneLandscape && styles.contentLandscape,
          ]}
          testID="learner-home-content"
        >
          <ContinueLessonHero
            lesson={data.currentLesson}
            onContinue={() => data.currentLesson.topicId
              ? router.push({ pathname: '/learner/activities/[topicId]', params: { topicId: data.currentLesson.topicId } })
              : router.dismissTo('/learner/lessons')}
          />
          <DashboardCards
            adventure={data.adventure}
            dailyGoal={data.dailyGoal}
            onGoToLessons={() => router.dismissTo('/learner/lessons')}
            onViewRewards={() => router.dismissTo('/learner/achievements')}
            recentAchievement={data.recentAchievement}
          />
        </View>
      </ScrollView>
    </LearnerAppShell>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    alignSelf: 'stretch',
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'stretch',
    flexGrow: 1,
    padding: Spacing.lg,
    width: '100%',
  },
  scrollContentPhone: {
    alignItems: 'stretch',
    padding: 12,
    width: '100%',
  },
  scrollContentLandscape: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  content: {
    alignSelf: 'stretch',
    gap: ResponsiveLayout.heroToCardsGap.regular,
    maxWidth: 1740,
    minWidth: 0,
    width: '100%',
  },
  contentLandscape: {
    gap: ResponsiveLayout.heroToCardsGap.compact,
  },
});
