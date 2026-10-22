import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Colors, FontFamily } from '../../../constants/theme';
import { AppButton } from '../../ui/AppButton';
import { AppIcon } from '../../ui/AppIcon';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { SETTINGS_COPY } from './settingsCopy';
import { defaultWorkspaceInfo, type WorkspaceInfo } from './workspaceSettingsData';
import { p } from '../../progress/ProgressPage';

/** Presentation only: connection and sync time always come from the service. */
export function WorkspaceSyncCard({ initialInfo = defaultWorkspaceInfo, onJoinPress, onSyncPress, busy = false, message = '' }: {
  initialInfo?: WorkspaceInfo; onJoinPress?: () => void; onSyncPress?: () => void; busy?: boolean; message?: string;
}) {
  const { width, height } = useWindowDimensions();
  const compact = width < 750;
  const connected = initialInfo.status === 'connected';
  return <View testID="workspace-sync-card" style={[p.card, styles.card, { minHeight: Math.max(380, height - 180), padding: compact ? 20 : 28 }]}>
    <View style={[p.row, { justifyContent: 'space-between' }]}>
      <View style={[p.row, { flexShrink: 1, flexWrap: 'nowrap' }]}>
        <View style={styles.icon}><AppIcon name="cloud" color="accent" size={30} /></View>
        <View style={{ flexShrink: 1 }}><Text style={[p.name, { fontSize: compact ? 23 : 29 }]}>{SETTINGS_COPY.workspaceTitle}</Text><Text style={p.subtitle}>{SETTINGS_COPY.workspaceSubtitle}</Text></View>
      </View>
      <ConnectionStatusBadge connected={connected} landscapeCompact={compact} />
    </View>
    <View style={styles.inset}>
      {connected ? <>
        <View style={[p.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, minWidth: 150 }}><Text style={styles.label}>{SETTINGS_COPY.workspaceLabel}</Text><Text style={p.name}>{initialInfo.workspaceName}</Text></View>
          <View style={{ maxWidth: '100%' }}><Text style={[styles.label, { textAlign: 'right' }]}>{SETTINGS_COPY.workspaceCodeLabel}</Text><Text selectable style={styles.code}>{initialInfo.workspaceCode}</Text></View>
        </View>
        <View style={styles.divider} />
        <View style={[p.row, { justifyContent: 'space-between' }]}>
          <View style={[p.row, { gap: 8 }]}>{initialInfo.lastSyncedText && initialInfo.lastSyncedText !== 'Not synchronized yet' && <AppIcon name="circleCheck" color="goal" size={22} />}<Text style={p.text}>{SETTINGS_COPY.lastSynchronized}</Text></View>
          <Text style={[p.text, { fontWeight: '700' }]}>{initialInfo.lastSyncedText ?? 'Not synchronized yet'}</Text>
        </View>
      </> : <>
        <View style={[p.row, { flexWrap: 'nowrap' }]}><View style={styles.dot} /><Text style={[p.name, { fontSize: compact ? 20 : 23, flex: 1 }]}>{SETTINGS_COPY.independentHeadline}</Text></View>
        <Text style={[p.text, { marginTop: 22, marginLeft: 30 }]}>{SETTINGS_COPY.independentDescription}</Text>
      </>}
    </View>
    <View style={styles.actions}>
      {!!message && <Text accessibilityLiveRegion="polite" style={[p.text, { textAlign: 'center' }]}>{message}</Text>}
      <AppButton accessibilityLabel={connected ? SETTINGS_COPY.syncAccessibility : SETTINGS_COPY.joinAccessibility} label={busy ? 'SYNCHRONIZING…' : connected ? SETTINGS_COPY.syncNow : SETTINGS_COPY.joinWorkspace}
        icon={connected ? 'sync' : 'add'} iconPosition="leading" disabled={busy || (connected && !onSyncPress)}
        onPress={connected ? () => onSyncPress?.() : onJoinPress ?? (() => router.push('/learner/workspaces/join'))}
        style={{ width: '100%', maxWidth: 620, minHeight: 64, borderRadius: 22 }} />
      <Text style={[p.text, { color: Colors.textMuted, textAlign: 'center' }]}>{connected ? SETTINGS_COPY.connectedFooter : SETTINGS_COPY.independentFooter}</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  card: { width: '100%', gap: 24 },
  icon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#FFF4EB', borderWidth: 1.5, borderColor: '#FFD3B5', alignItems: 'center', justifyContent: 'center' },
  inset: { padding: 20, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#FAF7F1' },
  label: { fontFamily: FontFamily.body, fontSize: 17, color: Colors.textMuted, letterSpacing: 1, marginBottom: 6 },
  code: { fontFamily: FontFamily.rounded, color: Colors.accent, fontWeight: '800', fontSize: 20, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.surface, paddingVertical: 6, paddingHorizontal: 14 },
  divider: { height: 1.5, backgroundColor: Colors.border, marginVertical: 18 },
  dot: { width: 14, height: 14, backgroundColor: Colors.accent, borderRadius: 7 },
  actions: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: 14, paddingTop: 32 },
});
