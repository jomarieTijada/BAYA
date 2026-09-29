import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { LearnerScreenContainer } from '../LearnerScreenContainer';
import { LearnerAppShell } from '../LearnerAppShell';
import { LessonHeader } from './LessonHeader';
import { LessonJourney } from './LessonJourney';
import { createApprovedModules, getLessonProgress, type LessonItem } from './lessonData';
import { curriculumService } from '../../../database/services/curriculumService';

/**
 * BAYA Learner Lessons Screen — Baybayin Basics Learning Journey Map.
 * Recreates the progression map from Basics.png with high fidelity,
 * full responsiveness, and accessibility.
 */
export function LessonScreen() {
  const router = useRouter();
  const [lessons, setLessons] = useState<readonly LessonItem[]>(createApprovedModules);

  useFocusEffect(useCallback(() => {
    let isMounted = true;
    async function hydrateLessonsFromDatabase() {
      try {
        const modules = await curriculumService.getCurriculumModules();
        if (isMounted && modules && modules.length > 0) {
          setLessons(modules);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[LessonScreen] Failed to hydrate lessons from database:', err);
        }
      }
    }
    hydrateLessonsFromDatabase();
    return () => {
      isMounted = false;
    };
  }, []));

  const progress = getLessonProgress(lessons);

  const handleContinueLesson = (lesson: LessonItem) => {
    if (lesson.status === 'locked') return;
    const topic = lesson.topics.find((item) => !item.completed && item.status !== 'locked' && item.contentAvailable)
      ?? lesson.topics.find((item) => item.status !== 'locked' && item.contentAvailable);
    if (topic) router.push({ pathname: '/learner/activities/[topicId]', params: { topicId: topic.id } });
  };

  const handleBack = () => {
    router.dismissTo('/learner/home');
  };

  const handleOpenSettings = () => {
    router.push('/learner/settings');
  };

  return (
    <LearnerAppShell
      activeRoute="/learner/lessons"
      header={(
        <LessonHeader
          onBack={handleBack}
          onOpenSettings={handleOpenSettings}
          progressPercentage={progress.percentage}
        />
      )}
      testID="learner-lessons-root"
    >
      {/* Friendly Organic Background Shapes */}
      <View
        accessibilityElementsHidden
        aria-hidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={styles.backgroundCanvas}
      >
        <View style={styles.organicBlob1} />
        <View style={styles.organicBlob2} />
        <View style={styles.organicBlob3} />
      </View>

      <LearnerScreenContainer testID="lesson-scroll">
        <LessonJourney
          lessons={lessons}
          onContinueLesson={handleContinueLesson}
        />
      </LearnerScreenContainer>

    </LearnerAppShell>
  );
}

const styles = StyleSheet.create({
  backgroundCanvas: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  organicBlob1: {
    backgroundColor: '#EAF4E7',
    borderRadius: 9999,
    height: 480,
    left: -120,
    opacity: 0.85,
    position: 'absolute',
    top: -100,
    width: 520,
  },
  organicBlob2: {
    backgroundColor: '#EDF6EB',
    borderRadius: 9999,
    height: 560,
    opacity: 0.9,
    position: 'absolute',
    right: -160,
    top: 60,
    width: 620,
  },
  organicBlob3: {
    backgroundColor: '#F3F9F1',
    borderRadius: 9999,
    bottom: -180,
    height: 420,
    left: '25%',
    opacity: 0.7,
    position: 'absolute',
    width: 580,
  },
});
