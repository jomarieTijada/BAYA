import React from 'react';
import { Redirect } from 'expo-router';

/** Preserves old development links while the former placeholder route is retired. */
export default function LearnerWelcomeRedirect() {
  return <Redirect href="/learner/home" />;
}
