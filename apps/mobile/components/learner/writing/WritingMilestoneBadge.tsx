import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { AppIcon } from '../../ui/AppIcon';
import { Colors } from '../../../constants/theme';

/** Presentation only: this component cannot award progress or write records. */
export function WritingMilestoneBadge({ step, completed, reducedMotion, compact = false, next = false, final = false }: {
  step: number; completed: boolean; reducedMotion: boolean; compact?: boolean; next?: boolean; final?: boolean;
}) {
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
          Animated.sequence([Animated.timing(scale, { toValue: final ? 1.16 : 1.1, duration: 140, ...driver }), Animated.spring(scale, { toValue: 1, stiffness: 260, damping: 18, mass: 0.5, ...driver })]),
          Animated.sequence([Animated.timing(glow, { toValue: 1, duration: 180, ...driver }), Animated.timing(glow, { toValue: 0, duration: final ? 500 : 320, ...driver })]),
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
  return <Animated.View accessible accessibilityLabel={`Bituin ${step}: ${completed ? 'natanggap' : 'hindi pa natatanggap'}`} style={[styles.star, { transform: [{ scale }] }]} testID={`writing-milestone-${step}-${completed ? 'complete' : 'pending'}`}>
    <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glow }]} testID={`writing-star-glow-${step}`} />
    <AppIcon name={completed ? 'star' : 'starOutline'} size={compact ? 34 : 40} color={completed ? 'achievement' : 'secondaryText'} />
    {completed && <View pointerEvents="none" style={styles.check}><AppIcon name="check" size={compact ? 13 : 15} color="primaryText" /></View>}
  </Animated.View>;
}
const styles = StyleSheet.create({
  star: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, backgroundColor: Colors.achievementSurface, borderWidth: 3, borderColor: Colors.bayaOrange },
  check: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 16, left: 0, right: 0 },
});
