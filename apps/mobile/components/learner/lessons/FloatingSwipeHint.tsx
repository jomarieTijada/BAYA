import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference';
import { AppIcon } from '../../ui/AppIcon';

/** Memory only: revisiting the journey must not replay its onboarding. */
export const lessonJourneyHintSession = new Set<string>();

export function FloatingSwipeHint({ left, top, size = 28, travel = 28, onDismiss }: { left: number; top: number; size?: number; travel?: number; onDismiss: () => void }) {
  const reduced = useReducedMotionPreference();
  const [opacity] = useState(() => new Animated.Value(0));
  const [translation] = useState(() => new Animated.Value(0));
  useEffect(() => {
    opacity.setValue(0);
    translation.setValue(0);
    const timer = setTimeout(onDismiss, 3600);
    let animation: Animated.CompositeAnimation | undefined;
    if (!reduced) {
      const timing = (value: Animated.Value, toValue: number, duration: number) => Animated.timing(value, { toValue, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' });
      try {
        const gesture = () => Animated.sequence([
          timing(translation, 0, 0), timing(opacity, 1, 180),
          timing(translation, -travel, 750), timing(opacity, 0, 220),
        ]);
        animation = Animated.sequence([Animated.delay(700), gesture(), Animated.delay(200), gesture()]);
        animation.start();
      } catch { /* The natural card peek and accessible scrolling remain available. */ }
    }
    return () => { clearTimeout(timer); animation?.stop(); };
  }, [onDismiss, opacity, reduced, translation, travel]);
  // The partial next card is the static affordance for reduced-motion users.
  if (reduced) return null;
  return <Animated.View accessible accessibilityLabel="I-swipe pakaliwa para makita ang kasunod na modyul." pointerEvents="none" style={[styles.gesture, { left, top, width: size, height: size, opacity, transform: [{ translateX: translation }] }]} testID="floating-swipe-hint">
    <AppIcon name="swipeHand" size={size} color="accent" />
  </Animated.View>;
}
const styles = StyleSheet.create({
  gesture: { position: 'absolute', width: 28, height: 28, backgroundColor: 'transparent', zIndex: 2 },
});
