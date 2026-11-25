import { Image, Text } from '../../../localization/components';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, FontFamily } from '../../../constants/theme';
import { displayPredictedClass, getConfidencePresentation, type TopPrediction } from './recognitionPresentation';
import { traditionalGroupForClass } from '../../../content/traditionalCharacters';

/** A single model prediction, distinct from the instructional target card. */
export function RecognitionMatchRow({ prediction, density = 'regular', showGlyph = true }: {
  prediction: TopPrediction;
  showGlyph?: boolean;
  density?: 'regular' | 'compact' | 'tight';
}) {
  const displayedLabel = displayPredictedClass(prediction.label);
  const percentage = getConfidencePresentation(prediction.probability).percentage;
  const compact = density !== 'regular';
  const tight = density === 'tight';
  return <View testID="baya-match-1">
    <Text style={[styles.heading, compact && styles.compactHeading]}>Recognized Character</Text>
    <View style={[styles.row, compact && styles.compactRow]}>
      {showGlyph && <Image accessible={false} source={prediction.glyphSource} resizeMode="contain"
        style={[styles.glyph, compact && styles.compactGlyph, tight && styles.tightGlyph]} testID="baya-predicted-glyph" />}
      <View style={[styles.details, !showGlyph && styles.textOnly]}>
        <Text verbatim accessibilityLabel={`Nabasa ni BAYA: ${displayedLabel}`} numberOfLines={1}
          style={[styles.label, compact && styles.compactLabel, tight && styles.tightLabel]} testID="baya-predicted-class">{displayedLabel}</Text>
        <Text verbatim accessibilityLabel={`Confidence: ${percentage}`}
          style={[styles.percentage, compact && styles.compactPercentage, tight && styles.tightPercentage]} testID="baya-confidence-percentage">{percentage}</Text>
        {traditionalGroupForClass(prediction.label) && <Text verbatim style={styles.percentage}>{traditionalGroupForClass(prediction.label)!.label}</Text>}
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  heading: { color: Colors.textSecondary, fontFamily: FontFamily.rounded, fontSize: 12, lineHeight: 16, textAlign: 'center', fontWeight: '800' },
  compactHeading: { fontSize: 10, lineHeight: 13 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8, minWidth: 0 },
  compactRow: { gap: 4 },
  glyph: { width: 64, height: 64 },
  compactGlyph: { width: 44, height: 44 },
  tightGlyph: { width: 38, height: 38 },
  textOnly: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  details: { flex: 1, minWidth: 0 },
  label: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 24, fontWeight: '900', lineHeight: 30 },
  compactLabel: { fontSize: 18, lineHeight: 23 },
  tightLabel: { fontSize: 15, lineHeight: 20 },
  percentage: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  compactPercentage: { fontSize: 14, lineHeight: 18 },
  tightPercentage: { fontSize: 13, lineHeight: 17 },
});
