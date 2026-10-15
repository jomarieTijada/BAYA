import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BAYA_WRITING_MASTERY_POLICY } from '../../../content/writingMastery';
import { Colors, FontFamily } from '../../../constants/theme';

export function WritingMasteryIndicator({ count }: { count: number }) {
  const required = BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts;
  return <View accessible accessibilityLabel={`${count} of ${required} valid attempts completed`} accessibilityLiveRegion="polite" style={styles.row} testID="writing-mastery">
    <Text style={styles.text}>Pagsubok</Text>
    <Text style={styles.text}>{Array.from({ length: required }, (_, i) => i < count ? '●' : '○').join(' ')}</Text>
    <Text style={styles.text}>{count} / {required}</Text>
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' },
  text: { fontFamily: FontFamily.rounded, color: Colors.textPrimary, fontSize: 12, fontWeight: '700' },
});
