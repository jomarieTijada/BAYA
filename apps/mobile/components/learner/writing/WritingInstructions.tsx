import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BAYA_WRITING_MASTERY_POLICY } from '../../../content/writingMastery';
import { Colors, FontFamily, Spacing } from '../../../constants/theme';

export function WritingInstructions({ count = 0, unsuccessful = false, compact = false, children }: {
  count?: number; unsuccessful?: boolean; compact?: boolean; children?: React.ReactNode;
}) {
  const { requiredValidAttempts } = BAYA_WRITING_MASTERY_POLICY;
  const remaining = Math.max(0, requiredValidAttempts - count);
  const message = remaining === 0 ? 'Mahusay! Maaari ka nang magpatuloy!'
    : unsuccessful ? 'Subukan muli! Isulat ulit ang simbolo.'
      : count === 0 ? 'Isulat ang simbolo at makakuha ng bituin!'
        : remaining === 1 ? 'Magaling! Isa pa para makapagpatuloy!'
          : `Magaling! ${remaining} pa para makapagpatuloy!`;
  return <View style={styles.container} testID="writing-instructions">
    <Text accessibilityLiveRegion="polite" style={[styles.instruction, compact && styles.compactInstruction]} testID="writing-mastery-message">{message}</Text>
    <View style={styles.actions}>
      {children}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  instruction: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 17, fontWeight: '800', lineHeight: 22, minHeight: 22 },
  compactInstruction: { fontSize: 14, lineHeight: 18, minHeight: 36 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.xs },
});
