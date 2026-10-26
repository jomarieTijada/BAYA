import React, { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { WorkspaceSyncCard } from './WorkspaceSyncCard';
import { ProgressPage, p } from '../../progress/ProgressPage';
import { Notice, TextAction } from '../../mentor/FeatureScreen';
import { useCloudServices, failureMessage } from '../../../modules/cloud/services';
import { useCloudRead } from '../../../modules/progress/useCloudRead';
import { useOperation } from '../../../modules/cloud/useOperation';
import { syncTime } from '../../../modules/progress/presentation';
import { AppButton } from '../../ui/AppButton';
import { BayaDialog } from '../../ui/BayaDialog';
import { JoinRequestStatus } from '../JoinRequestStatus';

export function SettingsScreen() {
  const services = useCloudServices();
  const { result, refresh } = useCloudRead(useCallback(() => services.workspaces.memberships(), [services]));
  const op = useOperation();
  const logout = useOperation();
  const account = useCloudRead(useCallback(() => services.learnerAuth ? services.learnerAuth.session() : Promise.resolve({ ok: true as const, data: null }), [services]));
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { width } = useWindowDimensions();
  const [showRequests, setShowRequests] = useState(true);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<string>();
  const active = result?.ok ? result.data.filter(m => m.membership.is_active && m.workspace.status === 'active') : [];
  const membership = active.find(m => m.workspace.workspace_id === selected) ?? active[0];
  return <ProgressPage title="Settings" onBack={() => router.replace('/learner/home')}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22, alignItems: 'flex-start' }}>
    <View style={{ display: showRequests ? 'flex' : 'none', width: width >= 1000 ? '48.5%' : '100%', gap: 16 }}>
      <JoinRequestStatus onApproved={refresh} onPendingChange={setPending} onVisibilityChange={setShowRequests} />
    </View>
    <View style={{ width: width >= 1000 && showRequests ? '48.5%' : '100%', gap: 16 }}>
    {!result ? <View style={p.card}><Notice busy text="Checking your workspace…" /></View> : !result.ok ? <View style={[p.card, { gap: 20 }]}>
      <Notice text={failureMessage[result.code]} />
      <AppButton label="TRY AGAIN" accessibilityLabel="Retry workspace connection" onPress={refresh} />
      <TextAction label="Join workspace" onPress={() => router.push('/learner/workspaces')} />
    </View> : <>
      {active.length > 1 && <View style={p.row}>{active.map(m => <TextAction key={m.membership.membership_id} label={m.workspace.workspace_name} onPress={() => setSelected(m.workspace.workspace_id)} />)}</View>}
      <WorkspaceSyncCard initialInfo={membership ? { status: 'connected', workspaceName: membership.workspace.workspace_name, workspaceCode: membership.workspace.workspace_code, lastSyncedText: syncTime(membership.membership.last_synced_at) } : { status: 'none' }}
        busy={op.busy} message={op.message} pending={pending}
        onJoinPress={() => router.push('/learner/workspaces')}
        onSyncPress={() => { void op.run(() => services.progress.sync(), () => { op.setMessage('Learning progress synchronized.'); refresh(); }); }} />
    </>}
    <Text style={[p.text, { fontSize: 14, lineHeight: 21 }]}>Keep using this device for your workspace access. Ask your mentor before clearing browser data or changing devices.</Text>
    </View>
    </View>
    {!!(account.result?.ok && account.result.data?.email) && <>
      <AppButton label="LOG OUT" accessibilityLabel="Log out learner" disabled={logout.busy} onPress={() => setConfirmLogout(true)} />
      <Notice text={logout.message} busy={logout.busy} />
      <BayaDialog visible={confirmLogout} title="Log out of your learner account?" description="Your learning progress will stay on this device. Use the same account to reconnect."
        detail={logout.message || undefined} onDismiss={() => setConfirmLogout(false)}
        primaryAction={{label:'YES, LOG OUT',loading:logout.busy,onPress:()=>{void logout.run(()=>services.learnerAuth!.signOut(),()=>{setConfirmLogout(false);account.refresh();refresh();});}}}
        secondaryAction={{label:'CANCEL',onPress:()=>setConfirmLogout(false)}} />
    </>}
  </ProgressPage>;
}
