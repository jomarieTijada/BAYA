import React from 'react';
import { Stack } from 'expo-router';

import { LessonScreen } from '../../components/learner/lessons/LessonScreen';

export default function LearnerLessonsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'BAYA · Baybayin Basics Lessons' }} />
      <LessonScreen />
    </>
  );
}
