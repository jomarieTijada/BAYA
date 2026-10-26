import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';
import { AppIcon, type AppIconName } from '../ui/AppIcon';
import { BaseCard } from '../ui/cards/BaseCard';

export function WorkspaceSection({ title, description, icon, badge, children, compact = false, action }: React.PropsWithChildren<{
  title: string; description?: string; icon: AppIconName; badge?: string; compact?: boolean; action?: React.ReactNode;
}>) {
  return <BaseCard style={[ws.section, compact && { padding: 16, gap: 12 }]}>
    <View style={ws.headingRow}>
      <View style={[ws.icon, compact && { width: 36, height: 36, borderRadius: 12 }]}><AppIcon name={icon} color="accent" size={compact ? 20 : 24} /></View>
      <View style={ws.headingCopy}>
        <Text accessibilityRole="header" style={[ws.heading, compact && { fontSize: 18 }]}>{title}</Text>
        {description && <Text style={ws.description}>{description}</Text>}
      </View>
      {badge !== undefined && <Text style={ws.badge}>{badge}</Text>}
      {action}
    </View>
    {children}
  </BaseCard>;
}

export const ws = StyleSheet.create({
  compactRow: { padding: 12, gap: 4, borderRadius: 16 },
  compactName: { fontSize: 17 },
  compactButton: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  section: { padding: 22, gap: 18, borderRadius: 24, backgroundColor: Colors.surface },
  stack: { gap: 20 },
  headingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  headingCopy: { flex: 1, minWidth: 150, gap: 4 },
  icon: { width: 46, height: 46, borderRadius: 16, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  heading: { fontFamily: FontFamily.rounded, fontSize: 21, fontWeight: '800', color: Colors.textPrimary },
  description: { fontFamily: FontFamily.body, fontSize: 15, lineHeight: 22, color: Colors.textSecondary },
  badge: { overflow: 'hidden', borderRadius: 12, backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 7, color: Colors.textPrimary, fontFamily: FontFamily.body, fontSize: 14, fontWeight: '700' },
  inset: { padding: 16, borderRadius: 16, backgroundColor: Colors.background, gap: 6 },
  eyebrow: { fontFamily: FontFamily.body, fontSize: 12, fontWeight: '700', letterSpacing: 1, color: Colors.textSecondary },
  name: { fontFamily: FontFamily.rounded, fontSize: 20, fontWeight: '700', color: Colors.textPrimary, flexShrink: 1 },
  reference: { fontFamily: FontFamily.body, fontSize: 13, lineHeight: 20, color: Colors.textSecondary, flexShrink: 1 },
  item: { padding: 16, gap: 12, borderRadius: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
});
