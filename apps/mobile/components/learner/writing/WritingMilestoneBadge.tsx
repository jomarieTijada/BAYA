import { useLocalization } from '../../../localization/LocalizationProvider';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { AppIcon } from '../../ui/AppIcon';
import { Colors } from '../../../constants/theme';

/** Presentation only: this component cannot award progress or write records. */
export function WritingMilestoneBadge({ step, completed, reducedMotion, compact = false, next = false, final = false }: {
  step: number; completed: boolean; reducedMotion: boolean; compact?: boolean; next?: boolean; final?: boolean;
}) {
  const { text } = useLocalization();
  const [scale] = useState(() => new Animated.Value(1));
  const [glow] = useState(() => new Animated.Value(0));
  const previous = useRef(completed);
  useEffect(() => {
    const newlyCompleted = completed && !previous.current;
    previous.current = completed;
    scale.stopAnimation();
    scale.setValue(1);
    glow.stopAnimation(); glow.setValue(0);
    if (reducedMotion || (!newlyCompleted && (completed || !next))) return;
    let animation: Animated.CompositeAnimation | undefined;
    try {
      const driver = { useNativeDriver: Platform.OS !== 'web', isInteraction: false };
      if (newlyCompleted) {
        scale.setValue(0.85);
        animation = Animated.parallel([
          Animated.sequence([Animated.timing(scale, { toValue: (() => {
            if (final) {
              return 1.16;
            } else {
              return 1.1;
            }
          })(), duration: 140, ...driver }), Animated.spring(scale, { toValue: 1, stiffness: 260, damping: 18, mass: 0.5, ...driver })]),
          Animated.sequence([Animated.timing(glow, { toValue: 1, duration: 180, ...driver }), Animated.timing(glow, { toValue: 0, duration: (() => {
            if (final) {
              return 500;
            } else {
              return 320;
            }
          })(), ...driver })]),
        ]);
      } else {
        // One quiet breathing cycle for the next available star; no endless timer.
        animation = Animated.sequence([Animated.delay(700), Animated.parallel([
          Animated.sequence([Animated.timing(scale, { toValue: 1.04, duration: 450, ...driver }), Animated.timing(scale, { toValue: 1, duration: 550, ...driver })]),
          Animated.sequence([Animated.timing(glow, { toValue: 0.45, duration: 450, ...driver }), Animated.timing(glow, { toValue: 0, duration: 550, ...driver })]),
        ])]);
      }
      animation.start();
    } catch { scale.setValue(1); glow.setValue(0); }
    return () => { animation?.stop(); scale.setValue(1); glow.setValue(0); };
  }, [completed, reducedMotion, scale, glow, next, final]);
  return <Animated.View accessible accessibilityLabel={text(`Bituin ${step}: ${(() => {
    if (completed) {
      return 'natanggap';
    } else {
      return 'hindi pa natatanggap';
    }
  })()}`)} style={[styles.star, { transform: [{ scale }] }]} testID={`writing-milestone-${step}-${(() => {
    if (completed) {
      return 'complete';
    } else {
      return 'pending';
    }
  })()}`}>
    <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} testID={`writing-star-glow-${step}`} />
    <AppIcon name={(() => {
      if (completed) {
        return 'star';
      } else {
        return 'starOutline';
      }
    })()} size={(() => {
      if (compact) {
        return 34;
      } else {
        return 40;
      }
    })()} color={(() => {
      if (completed) {
        return 'achievement';
      } else {
        return 'secondaryText';
      }
    })()} />
    {completed && <View pointerEvents="none" style={styles.check}><AppIcon name="check" size={(() => {
      if (compact) {
        return 13;
      } else {
        return 15;
      }
    })()} color="primaryText" /></View>}
  </Animated.View>;
}
const styles = StyleSheet.create({
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, backgroundColor: Colors.achievementSurface, borderWidth: 3, borderColor: Colors.bayaOrange },
  check: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 16, left: 0, right: 0 },
});
