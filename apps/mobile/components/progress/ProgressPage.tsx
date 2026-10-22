import React from 'react';
import { ScrollView, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../ui/BackButton';
import { Colors, FontFamily, Shadows } from '../../constants/theme';

export function ProgressPage({ title, subtitle, onBack, action, children }: React.PropsWithChildren<{
  title: string; subtitle?: string; onBack: () => void; action?: React.ReactNode;
}>) {
  const { width } = useWindowDimensions();
  return <SafeAreaView style={p.screen}>
    <ScrollView contentContainerStyle={[p.page, width < 750 && { padding: 16 }]}>
      <View style={p.header}>
        <BackButton accessibilityLabel="Back" onPress={onBack} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text accessibilityRole="header" style={[p.title, width < 750 && { fontSize: 26 }]}>{title}</Text>
          {subtitle && <Text style={p.subtitle}>{subtitle}</Text>}
        </View>
        {action}
      </View>
      {children}
    </ScrollView>
  </SafeAreaView>;
}
export const p = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  page: { flexGrow: 1, padding: 28, gap: 22, width: '100%', maxWidth: 1700, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 26, marginBottom: 20 },
  title: { fontFamily: FontFamily.rounded, fontWeight: '800', fontSize: 32, color: Colors.textPrimary },
  subtitle: { fontFamily: FontFamily.body, fontSize: 20, color: Colors.textMuted, marginTop: 3 },
  card: { ...Shadows.card, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, borderRadius: 28, padding: 24 },
  text: { fontFamily: FontFamily.body, color: Colors.textSecondary, fontSize: 18 },
  name: { fontFamily: FontFamily.rounded, fontWeight: '800', color: Colors.textPrimary, fontSize: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 18, flexWrap: 'wrap' },
});
