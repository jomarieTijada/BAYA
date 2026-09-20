import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { AccessibilityInfo } from 'react-native';
import {
  BAYA_ALL_FRAMES,
  BAYA_PLAYBACK_TIMELINES,
  BAYA_RESTING_FRAME,
  type BayaAnimationPhase,
  type BayaMascotState,
} from './animationAssets';

type UseBayaAnimationOptions = {
  state: BayaMascotState;
  autoplay: boolean;
  loop: boolean;
};

type BayaAnimationSnapshot = {
  source: number;
  phase: BayaAnimationPhase;
  frameIndex: number | null;
  assetsReady: boolean;
};

function useAnimationAssets() {
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    Asset.loadAsync([...BAYA_ALL_FRAMES])
      .catch(() => [])
      .finally(() => {
        if (mounted) {
          setAssetsReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return assetsReady;
}

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

export function useBayaAnimation({
  state,
  autoplay,
  loop,
}: UseBayaAnimationOptions): BayaAnimationSnapshot {
  const assetsReady = useAnimationAssets();
  const reduceMotion = useReducedMotion();
  const timeline = BAYA_PLAYBACK_TIMELINES[state];
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
  }, [state]);

  useEffect(() => {
    if (!assetsReady || !autoplay || reduceMotion) {
      return;
    }

    const isFinalStep = stepIndex >= timeline.length - 1;
    if (isFinalStep && !loop) {
      return;
    }

    const currentStep = timeline[stepIndex] ?? timeline[0];
    const timer = setTimeout(() => {
      setStepIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;
        return nextIndex < timeline.length ? nextIndex : 0;
      });
    }, currentStep.durationMs);

    return () => clearTimeout(timer);
  }, [assetsReady, autoplay, loop, reduceMotion, stepIndex, timeline]);

  if (reduceMotion) {
    return {
      source: BAYA_RESTING_FRAME,
      phase: 'rest',
      frameIndex: null,
      assetsReady,
    };
  }

  const currentStep = timeline[stepIndex] ?? timeline[0];

  return {
    source: currentStep.source,
    phase: currentStep.phase,
    frameIndex: currentStep.frameIndex,
    assetsReady,
  };
}
