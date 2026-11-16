import { Text } from '../../../localization/components';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Colors, FontFamily } from '../../../constants/theme';
import { AppButton } from '../../ui/AppButton';
import { AppIcon } from '../../ui/AppIcon';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { SETTINGS_COPY } from './settingsCopy';
import { defaultWorkspaceInfo, type WorkspaceInfo } from './workspaceSettingsData';
import { p } from '../../progress/ProgressPage';

/** Presentation only: connection and sync time always come from the service. */
export function WorkspaceSyncCard({ initialInfo = defaultWorkspaceInfo, onJoinPress, onSyncPress, busy = false, message = '', pending = false }: {
  initialInfo?: WorkspaceInfo; onJoinPress?: () => void; onSyncPress?: () => void; busy?: boolean; message?: string; pending?: boolean;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 750;
  const connected = initialInfo.status === 'connected';
  return <View testID="workspace-sync-card" style={[p.card, styles.card, { padding: (() => {
    if (compact) {
      return 20;
    } else {
      return 24;
    }
  })() }]}>
    <View style={[p.row, { justifyContent: 'space-between' }]}>
      <View style={[p.row, { flexShrink: 1, flexWrap: 'nowrap' }]}>
        <View style={styles.icon}><AppIcon name="cloud" color="accent" size={30} /></View>
        <View style={{ flexShrink: 1 }}><Text style={[p.name, { fontSize: (() => {
          if (compact) {
            return 23;
          } else {
            return 29;
          }
        })() }]}>{SETTINGS_COPY.workspaceTitle}</Text><Text style={p.subtitle}>{SETTINGS_COPY.workspaceSubtitle}</Text></View>
      </View>
      <ConnectionStatusBadge connected={connected} landscapeCompact={compact} />
    </View>
    <View style={styles.inset}>
      {(() => {
        if (connected) {
          return <>
        <View style={[p.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, minWidth: 150 }}><Text style={styles.label}>{SETTINGS_COPY.workspaceLabel}</Text><Text style={p.name} verbatim>{initialInfo.workspaceName}</Text></View>
          <View style={{ maxWidth: '100%' }}><Text style={[styles.label, { textAlign: 'right' }]}>{SETTINGS_COPY.workspaceCodeLabel}</Text><Text selectable style={styles.code} verbatim>{initialInfo.workspaceCode}</Text></View>
        </View>
        <View style={styles.divider} />
        <View style={[p.row, { justifyContent: 'space-between' }]}>
          <View style={[p.row, { gap: 8 }]}>{initialInfo.lastSyncedText && initialInfo.lastSyncedText !== 'Not synchronized yet' && <AppIcon name="circleCheck" color="goal" size={22} />}<Text style={p.text}>{SETTINGS_COPY.lastSynchronized}</Text></View>
          <Text style={[p.text, { fontWeight: '700' }]}>{initialInfo.lastSyncedText ?? 'Not synchronized yet'}</Text>
        </View>
      </>;
        } else {
          return <>
        <View style={[p.row, { flexWrap: 'nowrap' }]}><View style={styles.dot} /><Text style={[p.name, { fontSize: (() => {
          if (compact) {
            return 20;
          } else {
            return 23;
          }
        })(), flex: 1 }]}>{(() => {
          if (pending) {
            return 'Your request is with your mentor.';
          } else {
            return SETTINGS_COPY.independentHeadline;
          }
        })()}</Text></View>
        <Text style={[p.text, { marginTop: 16 }]}>{(() => {
          if (pending) {
            return 'You can keep learning while you wait. Sync becomes available after approval.';
          } else {
            return SETTINGS_COPY.independentDescription;
          }
        })()}</Text>
      </>;
        }
      })()}
    </View>
    <View style={styles.actions}>
      {!!message && <Text accessibilityLiveRegion="polite" style={[p.text, { textAlign: 'center' }]}>{message}</Text>}
      {(connected || !pending) && <AppButton accessibilityLabel={(() => {
        if (connected) {
          return SETTINGS_COPY.syncAccessibility;
        } else {
          return SETTINGS_COPY.joinAccessibility;
        }
      })()} label={(() => {
        if (busy) {
          return 'SYNCHRONIZING…';
        } else {
          if (connected) {
            return SETTINGS_COPY.syncNow;
          } else {
            return SETTINGS_COPY.joinWorkspace;
          }
        }
      })()}
        icon={(() => {
          if (connected) {
            return 'sync';
          } else {
            return 'add';
          }
        })()} iconPosition="leading" disabled={busy || (connected && !onSyncPress)}
        onPress={(() => {
          if (connected) {
            return () => onSyncPress?.();
          } else {
            return onJoinPress ?? (() => router.push('/learner/workspaces'));
          }
        })()}
        style={{ width: '100%', maxWidth: 620, minHeight: 64, borderRadius: 22 }} />}
      <Text style={[p.text, { color: Colors.textMuted, textAlign: 'center' }]}>{(() => {
        if (connected) {
          return SETTINGS_COPY.connectedFooter;
        } else {
          return 'Your learning stays saved on this device.';
        }
      })()}</Text>
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
  actions: { alignItems: 'center', gap: 14, paddingTop: 4 },
});
