import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BAYA_WRITING_MASTERY_POLICY } from '../../../content/writingMastery';
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference';
import { WritingMilestoneBadge } from './WritingMilestoneBadge';

export function WritingMasteryIndicator({ count, required = BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts, compact = false, targetRef }: {
  count: number; required?: number; compact?: boolean; targetRef?: React.RefObject<View | null>;
}) {
  const reducedMotion = useReducedMotionPreference();
  const completed = Math.max(0, Math.min(required, count));
  const announcement = required === 2 ? ['Wala pang bituin ang nakuha. Kailangan ng dalawang bituin.', 'Isa sa dalawang bituin ang nakuha.', 'Nakuha na ang dalawang bituin. Maaari nang magpatuloy.'][completed] : `${completed} sa ${required} bituin ang nakuha.`;
  return <View ref={targetRef} collapsable={false} style={styles.root} accessible accessibilityLabel={announcement} accessibilityValue={{ min: 0, max: required, now: completed, text: announcement }} accessibilityRole="progressbar" accessibilityLiveRegion="polite" aria-valuemin={0} aria-valuemax={required} aria-valuenow={completed} aria-valuetext={announcement} testID="writing-mastery">
    <View style={styles.stars}>
      {Array.from({ length: required }, (_, index) => <WritingMilestoneBadge key={index} step={index + 1} completed={index < completed} next={index === completed} final={index === required - 1} compact={compact} reducedMotion={reducedMotion} />)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', minWidth: 0, flexShrink: 0, alignSelf: 'flex-start' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
