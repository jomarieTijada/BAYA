import { activityResumeService } from '../../../database/services/activityResumeService';
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
        const model = buildLearnerHomeModel(profile, modules, completedToday);
        const checkpoint = profile ? await activityResumeService.read(profile.profile_id).catch(() => null) : null;
        const savedModule = modules.find(m => m.topics.some(t => t.id === checkpoint?.topicId));
        const savedTopic = savedModule?.topics.find(t => t.id === checkpoint?.topicId);
        if (savedModule && savedTopic && !savedTopic.completed) model.currentLesson = {
          ...model.currentLesson, moduleId: savedModule.id, topicId: savedTopic.id, course: savedModule.title, title: savedTopic.title,
          currentStep: savedModule.topics.indexOf(savedTopic) + 1, totalSteps: savedModule.topics.length, status: 'in_progress',
          steps: savedModule.topics.map((t, i) => ({ id: i + 1, status: t.completed ? 'completed' : t.id === savedTopic.id ? 'current' : 'upcoming' })),
        };
        if (active) setData(model);
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
            onContinue={() => {
              if (data.currentLesson.topicId) {
                return router.push({ pathname: '/learner/activities/[topicId]', params: { topicId: data.currentLesson.topicId } });
              } else {
                return router.dismissTo('/learner/lessons');
              }
            }}
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
