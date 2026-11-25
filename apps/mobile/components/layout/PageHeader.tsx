import { Text } from '../../localization/components';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';
import { BackButton } from '../ui/BackButton';

/** Main title and navigation share a centerline; subtitles occupy a separate row. */
export function PageHeader({ title, subtitle, onBack, action, compact = false }: { title: string; subtitle?: string; onBack?: () => void; action?: React.ReactNode; compact?: boolean }) {
  const { width } = useWindowDimensions();
  return <View style={[styles.header, compact && { marginBottom: 0, gap: 4 }]}>
    <View style={[styles.row, compact && { minHeight: 32, gap: 8 }]}>
      {onBack && <BackButton accessibilityLabel="Back" onPress={onBack} compact size={compact ? "landscape" : "compact"} />}
      <Text accessibilityRole="header" style={[styles.title, width < 750 && { fontSize: 25 }, compact && { fontSize: 18 }]}>{title}</Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
    {!!subtitle && <Text style={[styles.subtitle, compact && { fontSize: 13, lineHeight: 18 }]}>{subtitle}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  header: { gap: 10, marginBottom: 20, width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 48 },
  title: { flex: 1, minWidth: 0, fontFamily: FontFamily.rounded, fontWeight: '800', fontSize: 32, color: Colors.textPrimary },
  subtitle: { fontFamily: FontFamily.body, fontSize: 19, lineHeight: 27, color: Colors.textSecondary },
  action: { flexShrink: 1, maxWidth: '35%' },
});
