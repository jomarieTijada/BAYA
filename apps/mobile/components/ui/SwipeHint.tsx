import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Spacing } from '../../constants/theme';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { AppIcon } from './AppIcon';

/** Finger direction (opposite the direction in which the content is revealed). */
export function swipeDirection(viewport: number, content: number, offset: number): 'left' | 'right' | null {
  if (viewport <= 0 || content <= viewport + 1) return null;
  return offset < content - viewport - 1 ? 'left' : 'right';
}

export function SwipeHint({ direction }: { direction: 'left' | 'right' | null }) {
  const reducedMotion = useReducedMotionPreference();
  const [translation] = useState(() => new Animated.Value(0));
  const demonstrated = useRef(false);
  useEffect(() => {
    translation.setValue(0);
    if (!direction || reducedMotion || demonstrated.current) return;
    demonstrated.current = true;
    let animation: Animated.CompositeAnimation | undefined;
    try {
      const move = () => Animated.sequence([
        Animated.timing(translation, { toValue: direction === 'left' ? -7 : 7, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(translation, { toValue: 0, duration: 400, useNativeDriver: Platform.OS !== 'web' }),
      ]);
      animation = Animated.sequence([move(), Animated.delay(160), move()]);
      animation.start();
    } catch { translation.setValue(0); }
    return () => { animation?.stop(); translation.setValue(0); };
  }, [direction, reducedMotion, translation]);
  if (!direction) return null;
  const label = direction === 'left' ? 'I-swipe pakaliwa' : 'I-swipe pakanan';
  return <View accessible accessibilityLabel={label} pointerEvents="none" style={styles.hint} testID="lesson-swipe-hint">
    <Animated.View style={{ transform: [{ translateX: translation }] }} testID="swipe-hint-motion"><AppIcon name={direction === 'left' ? 'arrowLeft' : 'arrowRight'} color="accent" size={18} /></Animated.View>
    <Text style={styles.text}>{label}</Text>
  </View>;
}
const styles = StyleSheet.create({
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.sm, minHeight: 24, flexShrink: 1 },
  text: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textSecondary, flexShrink: 1, textAlign: 'center' },
});
