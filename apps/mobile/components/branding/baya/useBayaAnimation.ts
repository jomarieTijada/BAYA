import { useEffect, useMemo, useState } from 'react';
import { Asset } from 'expo-asset';
import { AccessibilityInfo, Platform } from 'react-native';
import {
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

// Keep decoded web frames alive so a 60 ms source change can paint immediately.
const webFrameLoads = new Map<number, Promise<void>>();
const webDecodedFrames = new Map<number, HTMLImageElement>();

function loadWebFrame(source: number): Promise<void> {
  const pending = webFrameLoads.get(source);
  if (pending) return pending;

  const image = new window.Image();
  image.decoding = 'sync';
  image.src = Asset.fromModule(source).uri;
  webDecodedFrames.set(source, image);
  const loaded = image.decode().catch(() => {
    webDecodedFrames.delete(source);
  });
  webFrameLoads.set(source, loaded);
  return loaded;
}

function useAnimationAssets(state: BayaMascotState) {
  const isTest = process.env.NODE_ENV === 'test';
  const [loadedState, setLoadedState] = useState<BayaMascotState | null>(
    isTest ? state : null
  );
  const sources = useMemo(
    () => [...new Set(BAYA_PLAYBACK_TIMELINES[state].map((step) => step.source))],
    [state],
  );

  useEffect(() => {
    if (isTest) {
      return;
    }
    let mounted = true;

    const preload = Platform.OS === 'web' && typeof window !== 'undefined'
      ? Promise.all(sources.map(loadWebFrame))
      : Asset.loadAsync(sources);

    preload
      .catch(() => [])
      .finally(() => {
        if (mounted) {
          setLoadedState(state);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isTest, sources, state]);

  return loadedState === state;
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
  const assetsReady = useAnimationAssets(state);
  const reduceMotion = useReducedMotion();
  const timeline = BAYA_PLAYBACK_TIMELINES[state];
  const [stepIndex, setStepIndex] = useState(0);
  const [prevState, setPrevState] = useState(state);

  if (prevState !== state) {
    setPrevState(state);
    setStepIndex(0);
  }

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
