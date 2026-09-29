import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';

export function ConfidenceCard({ embedded = false, dense = false }: { embedded?: boolean; dense?: boolean }) {
  return <View style={[styles.card, embedded && styles.embedded, dense && styles.denseCard]} testID="writing-confidence-card">
    <Text style={[styles.heading, dense && styles.denseHeading]}>Pagsusuri</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.md, minWidth: 0, padding: Spacing.md, width: '100%' },
  embedded: { borderWidth: 0, padding: 0 },
  denseCard: { gap: Spacing.xs },
  heading: { borderBottomColor: Colors.border, borderBottomWidth: 1, color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 20, fontWeight: '900', paddingBottom: Spacing.sm, textAlign: 'center' },
  denseHeading: { fontSize: 16, lineHeight: 19, paddingBottom: Spacing.xs },
});
