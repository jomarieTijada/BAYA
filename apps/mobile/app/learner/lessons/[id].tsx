import React from 'react';
import { Redirect } from 'expo-router';

export default function LessonDetailRoute() {
  // Keep existing links valid without showing a second topic-list screen.
  return <Redirect href="/learner/lessons" />;
}
