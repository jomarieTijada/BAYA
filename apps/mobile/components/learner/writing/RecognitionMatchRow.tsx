import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Radius } from '../../../constants/theme';
import { displayPredictedClass, getConfidencePresentation } from './recognitionPresentation';

type RecognitionMatchRowProps = {
  rank: number;
  label: string;
  probability: number;
  primary?: boolean;
  density?: 'regular' | 'compact' | 'tight';
};

export function RecognitionMatchRow({ rank, label, probability, primary = false, density = 'regular' }: RecognitionMatchRowProps) {
  const displayedLabel = displayPredictedClass(label);
  const percentage = getConfidencePresentation(probability).percentage;
  const compact = density !== 'regular';
  const tight = density === 'tight';

  return <View style={[styles.row, compact && styles.compactRow, tight && styles.tightRow, primary ? styles.primaryRow : styles.secondaryRow, primary && compact && styles.compactPrimaryRow, primary && tight && styles.tightPrimaryRow, !primary && compact && styles.compactSecondaryRow]} testID={`baya-match-${rank}`}>
    <Text style={[styles.rank, primary && styles.primaryRank, compact && styles.compactRank, primary && compact && styles.compactPrimaryRank, tight && styles.tightRank]}>{rank}</Text>
    <Text
      accessibilityLabel={primary ? `Nabasa ni BAYA: ${displayedLabel}` : undefined}
      numberOfLines={1}
      style={[styles.label, primary && styles.primaryLabel, compact && styles.compactLabel, primary && compact && styles.compactPrimaryLabel, tight && styles.tightLabel, primary && tight && styles.tightPrimaryLabel]}
      testID={primary ? 'baya-predicted-class' : undefined}
    >{displayedLabel}</Text>
    <Text style={[styles.percentage, primary && styles.primaryPercentage, compact && styles.compactPercentage, primary && compact && styles.compactPrimaryPercentage, tight && styles.tightPercentage, primary && tight && styles.tightPrimaryPercentage]} testID={primary ? 'baya-confidence-percentage' : undefined}>{percentage}</Text>
  </View>;
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 6, minWidth: 0 },
  compactRow: { gap: 4 },
  tightRow: { gap: 3 },
  primaryRow: { minHeight: 36 },
  compactPrimaryRow: { minHeight: 24 },
  tightPrimaryRow: { minHeight: 23 },
  secondaryRow: { minHeight: 22 },
  compactSecondaryRow: { minHeight: 16 },
  rank: { color: Colors.textMuted, fontFamily: FontFamily.rounded, fontSize: 12, fontWeight: '800', textAlign: 'center', width: 20 },
  primaryRank: { backgroundColor: '#FFFFFF', borderRadius: Radius.full, color: Colors.textSecondary, overflow: 'hidden', paddingVertical: 3, width: 24 },
  compactRank: { fontSize: 11, width: 16 },
  compactPrimaryRank: { paddingVertical: 2, width: 20 },
  tightRank: { fontSize: 10, width: 15 },
  label: { color: Colors.textPrimary, flex: 1, fontFamily: FontFamily.rounded, fontSize: 14, fontWeight: '800', minWidth: 0 },
  primaryLabel: { fontSize: 30, fontWeight: '900', lineHeight: 36 },
  compactLabel: { fontSize: 12 },
  compactPrimaryLabel: { fontSize: 18, lineHeight: 21 },
  tightLabel: { fontSize: 11 },
  tightPrimaryLabel: { fontSize: 15, lineHeight: 19 },
  percentage: { color: Colors.textSecondary, fontFamily: FontFamily.rounded, fontSize: 13, fontWeight: '800' },
  primaryPercentage: { color: Colors.textPrimary, fontSize: 20, fontWeight: '900', lineHeight: 26 },
  compactPercentage: { fontSize: 11 },
  compactPrimaryPercentage: { fontSize: 14, lineHeight: 18 },
  tightPercentage: { fontSize: 10 },
  tightPrimaryPercentage: { fontSize: 13, lineHeight: 17 },
});
