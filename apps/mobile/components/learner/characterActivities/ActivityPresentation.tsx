import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BayaMascot } from '../../branding/BayaMascot';
import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';

/** The topic screens' companion + framed explanation, compact enough for a quiz. */
export function BayaHelper({ message, title, milestone = false }: { message: string; title?: string; milestone?: boolean }) {
  const { width, height } = useWindowDimensions();
  const compact = width < 600 || height < 500;
  return <View style={[presentation.helper, milestone && presentation.milestone]} testID="character-baya-helper">
    <View accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" style={presentation.mascot}>
      <BayaMascot size={compact ? 64 : milestone ? 116 : 88} state={milestone ? 'wave' : 'idle'} autoplay={false} decorative />
    </View>
    <View style={presentation.message}>
      {title && <Text style={presentation.helperTitle}>{title}</Text>}
      <Text style={presentation.helperText}>{message}</Text>
    </View>
  </View>;
}

export function ActivityGrid({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  return <View style={presentation.grid}>{React.Children.map(children, child => child && <View style={{ width: width >= 900 ? '48.8%' : '100%' }}>{child}</View>)}</View>;
}

export function ResultMetric({ value, label }: { value: string; label: string }) {
  return <View style={presentation.metric}><Text style={presentation.metricValue}>{value}</Text><Text style={presentation.helperText}>{label}</Text></View>;
}

export const presentation = StyleSheet.create({
  helper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, backgroundColor: '#FFF7E9', borderColor: '#EBD8B5', borderWidth: 1, borderRadius: Radius.lg },
  milestone: { backgroundColor: '#FFF5DA', paddingVertical: Spacing.md },
  mascot: { flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  message: { flex: 1, minWidth: 0, gap: 5, paddingRight: Spacing.sm },
  helperTitle: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 20, fontWeight: '800' },
  helperText: { color: Colors.textSecondary, fontFamily: FontFamily.rounded, fontSize: 15, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.md },
  metric: { flexGrow: 1, flexBasis: 120, backgroundColor: '#FFF9EF', borderRadius: Radius.md, borderColor: Colors.border, borderWidth: 1, padding: Spacing.md, gap: 5 },
  metricValue: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 32, fontWeight: '900' },
  reviewRow: { paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#FFF9EF', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  number: { color: Colors.accent, fontFamily: FontFamily.rounded, fontWeight: '900', fontSize: 24 },
});
