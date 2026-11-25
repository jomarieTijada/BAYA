import { StorybookSettings } from '../../landing/StorybookSettings';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { LanguageSelector } from '../../../localization/LanguageSelector';
import { OfflinePreparation } from './OfflinePreparation';
import { Text } from '../../../localization/components';
import React, { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
import { WorkspaceSyncCard } from './WorkspaceSyncCard';
import { ProgressPage, p } from '../../progress/ProgressPage';
import { Notice, TextAction } from '../../mentor/FeatureScreen';
import { useCloudServices, failureMessage, type JoinedWorkspace } from '../../../modules/cloud/services';
import { useCloudRead } from '../../../modules/progress/useCloudRead';
import { useOperation } from '../../../modules/cloud/useOperation';
import { syncTime } from '../../../modules/progress/presentation';
import { AppButton } from '../../ui/AppButton';
import { BayaDialog } from '../../ui/BayaDialog';
import { JoinRequestStatus } from '../JoinRequestStatus';

export function SettingsScreen({ onClose }: { onClose?: () => void } = {}) {
  const { language } = useLocalization();
  const services = useCloudServices();
  const { result, refresh } = useCloudRead(useCallback(() => services.workspaces.memberships(), [services]));
  const op = useOperation();
  const logout = useOperation();
  const account = useCloudRead(useCallback(() => {
    if (services.learnerAuth) {
      return services.learnerAuth.session();
    } else {
      return Promise.resolve({ ok: true as const, data: null });
    }
  }, [services]));
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { width, height } = useWindowDimensions();
  const compact = width > height && height < 600;
  const columns = compact || width >= 1000;
  const [showRequests, setShowRequests] = useState(true);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<string>();
  let active: JoinedWorkspace[];
  if (result?.ok) {
    active = result.data.filter(m => m.membership.is_active && m.workspace.status === 'active');
  } else {
    active = [];
  }
  const membership = active.find(m => m.workspace.workspace_id === selected) ?? active[0];
  return <ProgressPage compact={compact} title="Settings" onBack={onClose ?? (() => { if (router.canGoBack()) router.back(); else router.replace('/learner/home'); })}>
    <View style={columns ? { flexDirection: 'row', gap: 12, alignItems: 'flex-start' } : undefined}>
    <View style={columns ? { width: '42%', gap: compact ? 4 : 8 } : undefined}>
    <LanguageSelector compact={compact} />
    <StorybookSettings compact={compact} />
    <OfflinePreparation compact={compact} />
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: compact ? 6 : 22, alignItems: 'flex-start', ...(columns ? { flex: 1 } : {}) }}>
    <View style={{ display: (() => {
      if (showRequests) {
        return 'flex';
      } else {
        return 'none';
      }
    })(), width: (() => {
      if (width >= 1000) {
        return '48.5%';
      } else {
        return '100%';
      }
    })(), gap: compact ? 6 : 16 }}>
      <JoinRequestStatus hideJoined quietEmpty onApproved={refresh} onPendingChange={setPending} onVisibilityChange={setShowRequests} />
    </View>
    <View style={{ width: (() => {
      if (width >= 1000 && showRequests) {
        return '48.5%';
      } else {
        return '100%';
      }
    })(), gap: compact ? 6 : 16 }}>
    {(() => {
      if (!result) {
        return <View style={p.card}><Notice busy text="Checking your workspace…" /></View>;
      } else {
        if (!result.ok) {
          return <View style={[p.card, { gap: 20 }]}>
      <Notice text={failureMessage[result.code]} />
      <AppButton label="TRY AGAIN" accessibilityLabel="Retry workspace connection" onPress={refresh} />
      <TextAction label="Join workspace" onPress={() => router.push('/learner/workspaces')} />
    </View>;
        } else {
          return <>
      {active.length > 1 && <View style={p.row}>{active.map(m => <TextAction verbatim key={m.membership.membership_id} label={m.workspace.workspace_name} onPress={() => setSelected(m.workspace.workspace_id)} />)}</View>}
      <WorkspaceSyncCard landscapeCompact={compact} initialInfo={(() => {
        if (membership) {
          return { status: 'connected', workspaceName: membership.workspace.workspace_name, workspaceCode: membership.workspace.workspace_code, lastSyncedText: syncTime(membership.membership.last_synced_at, new Date(), language) };
        } else {
          return { status: 'none' };
        }
      })()}
        busy={op.busy} message={op.message} pending={pending}
        onJoinPress={() => router.push('/learner/workspaces')}
        onSyncPress={() => { void op.run(() => services.progress.sync(), () => { op.setMessage('Learning progress synchronized.'); refresh(); }); }} />
    </>;
        }
      }
    })()}
    <Text style={[p.text, { fontSize: compact ? 11 : 14, lineHeight: compact ? 14 : 21 }]}>Keep using this device for your workspace access. Ask your mentor before clearing browser data or changing devices.</Text>
    </View>
    </View>
    </View>
    {!!(account.result?.ok && account.result.data?.email) && <>
      <AppButton compact density="compact" fullWidth={false} style={{ minHeight: 32, height: 32, paddingVertical: 2, alignSelf: 'center' }} labelStyle={{ fontSize: 12 }} label="LOG OUT" accessibilityLabel="Log out learner" disabled={logout.busy} onPress={() => setConfirmLogout(true)} />
      <Notice text={logout.message} busy={logout.busy} />
      <BayaDialog visible={confirmLogout} title="Log out of your learner account?" description="Your learning progress will stay on this device. Use the same account to reconnect."
        detail={logout.message || undefined} onDismiss={() => setConfirmLogout(false)}
        primaryAction={{label:'YES, LOG OUT',loading:logout.busy,onPress:()=>{void logout.run(()=>services.learnerAuth!.signOut(),()=>{setConfirmLogout(false);account.refresh();refresh();});}}}
        secondaryAction={{label:'CANCEL',onPress:()=>setConfirmLogout(false)}} />
    </>}
  </ProgressPage>;
}
