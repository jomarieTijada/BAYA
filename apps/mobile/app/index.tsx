import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { LandingHero } from '../components/landing/LandingHero';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'BAYA · Learn Baybayin' }} />
      <LandingHero
        onLearnerPress={() => router.push('/learner')}
        onMentorPress={() => router.push('/mentor')}
      />
    </>
  );
}
