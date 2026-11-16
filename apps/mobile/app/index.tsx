import React, { useRef } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { LandingHero } from '../components/landing/LandingHero';
import { localLearnerService } from '../database/services/localLearnerService';

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const openingLearner = useRef(false);

  const openLearner = async () => {
    if (openingLearner.current) return;
    openingLearner.current = true;
    try {
      const profile = await localLearnerService.getActiveLearner();
      router.push((() => {
        if (profile) {
          return '/learner/home';
        } else {
          return '/learner/setup';
        }
      })());
    } catch (error) {
      if (__DEV__) console.warn('[HomeScreen] Could not read saved learner', error);
      router.push('/learner/setup');
    } finally {
      openingLearner.current = false;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'BAYA · Learn Baybayin' }} />
      <LandingHero
        introductionEligible={pathname === '/'}
        onLearnerPress={() => { void openLearner(); }}
        onMentorPress={() => router.push('/mentor')}
      />
    </>
  );
}
