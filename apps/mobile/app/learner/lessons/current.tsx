import React from 'react';
import { Redirect } from 'expo-router';

export default function CurrentLessonRoute() {
  return <Redirect href="/learner/lessons" />;
}
