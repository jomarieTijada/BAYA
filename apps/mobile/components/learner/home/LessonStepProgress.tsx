import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

import { Colors, Radius } from '../../../constants/theme';
import { AppIcon } from '../../ui/AppIcon';
import type { LearnerHomeViewModel, LessonStepStatus } from './learnerHomeDemo';

type LessonStepProgressProps = {
  compact?: boolean;
  currentStep: number;
  density?: 'regular' | 'landscapeCompact';
  steps: LearnerHomeViewModel['currentLesson']['steps'];
  totalSteps: number;
};

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (AccessibilityInfo?.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((enabled) => {
          if (mounted) {
            setReduceMotion(enabled);
          }
        })
        .catch(() => undefined);
    }

    const subscription = AccessibilityInfo?.addEventListener?.(
      'reduceMotionChanged',
      (enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduceMotion;
}

type StepCircleProps = {
  compact: boolean;
  density?: 'regular' | 'landscapeCompact';
  isCompleted: boolean;
  isCurrent: boolean;
  isReduceMotion: boolean;
  status: LessonStepStatus;
};

function StepCircle({
  compact,
  density,
  isCompleted,
  isCurrent,
  isReduceMotion,
  status,
}: StepCircleProps) {
  const isLandscapeCompact = density === 'landscapeCompact';
  const reached = isCompleted || isCurrent;

  // Single persistent master driver for the gentle breathing pulse (0 -> 1 -> 0)
  const [pulseAnim] = useState(() => new Animated.Value(0));

  // Dedicated persistent driver for the one-time completion confirmation pop
  const [completeAnim] = useState(() => new Animated.Value(isCompleted ? 1 : 0));
  const prevStatusRef = useRef(status);

  // Looping pulse animation for current step
  useEffect(() => {
    if (!isCurrent || isReduceMotion) {
      pulseAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isCurrent, isReduceMotion, pulseAnim]);

  // One-time completion pop animation
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prevStatus !== 'completed' && status === 'completed') {
      if (!isReduceMotion) {
        completeAnim.setValue(0);
        Animated.timing(completeAnim, {
          duration: 350,
          easing: Easing.out(Easing.back(1.5)),
          toValue: 1,
          useNativeDriver: true,
        }).start();
      } else {
        completeAnim.setValue(1);
      }
    }
  }, [status, isReduceMotion, completeAnim]);

  // Interpolations from master pulse driver
  const circleScale = isCurrent
    ? pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1.0, 1.06],
      })
    : 1.0;

  const haloScale = isCurrent
    ? pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1.0, 1.18],
      })
    : 1.0;

  const haloOpacity = isCurrent
    ? pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.10, 0.35],
      })
    : 0;

  // Completion pop interpolations
  const completionScale = completeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 1.08, 1.0],
  });

  const checkScale = completeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.0],
  });

  const checkOpacity = completeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const activeHaloOpacity = isReduceMotion ? 0.25 : haloOpacity;
  const activeHaloScale = isReduceMotion ? 1.12 : haloScale;

  return (
    <View style={styles.stepWrapper}>
      {isCurrent ? (
        <Animated.View
          accessibilityElementsHidden
          style={[
            StyleSheet.absoluteFill,
            styles.halo,
            {
              opacity: activeHaloOpacity,
              transform: [{ scale: activeHaloScale }],
            },
          ]}
        />
      ) : null}
      <Animated.View
        accessibilityElementsHidden
        style={[
          styles.step,
          compact && styles.stepCompact,
          isLandscapeCompact && styles.stepLandscapeCompact,
          reached ? styles.stepReached : styles.stepUpcoming,
          isCurrent && (
            isLandscapeCompact
              ? styles.stepCurrentLandscapeCompact
              : compact
                ? styles.stepCurrentCompact
                : styles.stepCurrent
          ),
          {
            transform: [{ scale: isCurrent ? circleScale : isCompleted ? completionScale : 1.0 }],
          },
        ]}
      >
        {isCompleted ? (
          <Animated.View
            style={{
              opacity: checkOpacity,
              transform: [{ scale: checkScale }],
            }}
          >
            <AppIcon
              color="onPrimary"
              name="check"
              size={isLandscapeCompact ? 12 : compact ? 18 : 22}
            />
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}

type StepConnectorProps = {
  compact: boolean;
  isCompleted: boolean;
  isLandscapeCompact: boolean;
  isReduceMotion: boolean;
};

function StepConnector({
  compact,
  isCompleted,
  isLandscapeCompact,
  isReduceMotion,
}: StepConnectorProps) {
  const [fillOpacityAnim] = useState(() => new Animated.Value(isCompleted ? 1 : 0));
  const prevCompletedRef = useRef(isCompleted);

  useEffect(() => {
    const prevCompleted = prevCompletedRef.current;
    prevCompletedRef.current = isCompleted;

    if (!prevCompleted && isCompleted) {
      if (!isReduceMotion) {
        Animated.timing(fillOpacityAnim, {
          duration: 350,
          easing: Easing.out(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }).start();
      } else {
        fillOpacityAnim.setValue(1);
      }
    } else if (prevCompleted && !isCompleted) {
      fillOpacityAnim.setValue(0);
    }
  }, [isCompleted, isReduceMotion, fillOpacityAnim]);

  return (
    <View
      accessibilityElementsHidden
      style={[
        styles.connector,
        compact && styles.connectorCompact,
        isLandscapeCompact && styles.connectorLandscapeCompact,
        styles.connectorUpcoming,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.connectorReached,
          {
            opacity: fillOpacityAnim,
          },
        ]}
      />
    </View>
  );
}

export function LessonStepProgress({
  compact = false,
  currentStep,
  density,
  steps,
  totalSteps,
}: LessonStepProgressProps) {
  const isLandscapeCompact = density === 'landscapeCompact';
  const isReduceMotion = useReducedMotion();

  return (
    <View
      accessibilityLabel={`Lesson step ${currentStep} of ${totalSteps}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ max: totalSteps, min: 1, now: currentStep }}
      style={[
        styles.row,
        compact && styles.rowCompact,
        isLandscapeCompact && styles.rowLandscapeCompact,
      ]}
    >
      {steps.map((step, index) => {
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';

        return (
          <React.Fragment key={step.id}>
            <StepCircle
              compact={compact}
              density={density}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isReduceMotion={isReduceMotion}
              status={step.status}
            />
            {index < steps.length - 1 ? (
              <StepConnector
                compact={compact}
                isCompleted={isCompleted}
                isLandscapeCompact={isLandscapeCompact}
                isReduceMotion={isReduceMotion}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 18,
    maxWidth: 510,
    width: '100%',
  },
  rowCompact: {
    marginTop: 10,
    maxWidth: 380,
  },
  rowLandscapeCompact: {
    marginTop: 1,
    maxWidth: 260,
  },
  stepWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    backgroundColor: '#FFA20A',
    borderRadius: Radius.full,
  },
  step: {
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 3,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  stepCompact: {
    borderWidth: 2.5,
    height: 34,
    width: 34,
  },
  stepLandscapeCompact: {
    borderWidth: 1.5,
    height: 24,
    width: 24,
  },
  stepReached: {
    backgroundColor: Colors.rolePrimary,
    borderColor: Colors.surface,
  },
  stepUpcoming: {
    backgroundColor: '#D0DCEB',
    borderColor: Colors.surface,
  },
  stepCurrent: {
    backgroundColor: Colors.rolePrimary,
    borderColor: '#FFBA66',
    borderWidth: 5,
  },
  stepCurrentCompact: {
    backgroundColor: Colors.rolePrimary,
    borderColor: '#FFBA66',
    borderWidth: 4,
  },
  stepCurrentLandscapeCompact: {
    backgroundColor: Colors.rolePrimary,
    borderColor: '#FFBA66',
    borderWidth: 2.5,
    height: 28,
    width: 28,
  },
  connector: {
    borderRadius: Radius.full,
    flex: 1,
    height: 8,
    marginHorizontal: 7,
    minWidth: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  connectorCompact: {
    height: 6,
    marginHorizontal: 4,
    minWidth: 8,
  },
  connectorLandscapeCompact: {
    height: 4,
    marginHorizontal: 2,
    minWidth: 6,
  },
  connectorReached: {
    backgroundColor: Colors.rolePrimary,
  },
  connectorUpcoming: {
    backgroundColor: '#D0DCEB',
  },
});
