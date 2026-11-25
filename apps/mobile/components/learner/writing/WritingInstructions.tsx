import { Text } from '../../../localization/components';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BAYA_WRITING_MASTERY_POLICY } from '../../../content/writingMastery';
import { Colors, FontFamily, Spacing } from '../../../constants/theme';

export function WritingInstructions({ count = 0, unsuccessful = false, compact = false, children, message: contextMessage }: {
  count?: number; unsuccessful?: boolean; compact?: boolean; children?: React.ReactNode; message?: string;
}) {
  const { requiredValidAttempts } = BAYA_WRITING_MASTERY_POLICY;
  const remaining = Math.max(0, requiredValidAttempts - count);
  let message;
  if (remaining === 0) {
    message = 'Mahusay! Maaari ka nang magpatuloy!';
  } else {
    if (unsuccessful) {
      message = 'Subukan muli! Isulat ulit ang simbolo.';
    } else {
      if (count === 0) {
        message = 'Isulat ang simbolo at makakuha ng bituin!';
      } else {
        if (remaining === 1) {
          message = 'Magaling! Isa pa para makapagpatuloy!';
        } else {
          message = `Magaling! ${remaining} pa para makapagpatuloy!`;
        }
      }
    }
  }
  return <View style={styles.container} testID="writing-instructions">
    <Text accessibilityLiveRegion="polite" style={[styles.instruction, compact && styles.compactInstruction]} testID="writing-mastery-message">{contextMessage ?? message}</Text>
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
