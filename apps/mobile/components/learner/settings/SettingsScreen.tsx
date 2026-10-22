import React, { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { WorkspaceSyncCard } from './WorkspaceSyncCard';
import { ProgressPage, p } from '../../progress/ProgressPage';
import { Notice, TextAction } from '../../mentor/FeatureScreen';
import { useCloudServices, failureMessage } from '../../../modules/cloud/services';
import { useCloudRead } from '../../../modules/progress/useCloudRead';
import { useOperation } from '../../../modules/cloud/useOperation';
import { syncTime } from '../../../modules/progress/presentation';
import { AppButton } from '../../ui/AppButton';

export function SettingsScreen() {
  const services = useCloudServices();
  const { result, refresh } = useCloudRead(useCallback(() => services.workspaces.memberships(), [services]));
  const op = useOperation();
  const [selected, setSelected] = useState<string>();
  const active = result?.ok ? result.data.filter(m => m.membership.is_active && m.workspace.status === 'active') : [];
  const membership = active.find(m => m.workspace.workspace_id === selected) ?? active[0];
  return <ProgressPage title="Settings" onBack={() => router.replace('/learner/home')}>
    {!result ? <View style={p.card}><Notice busy text="Checking your workspace…" /></View> : !result.ok ? <View style={[p.card, { gap: 20 }]}>
      <Notice text={failureMessage[result.code]} />
      <AppButton label="TRY AGAIN" accessibilityLabel="Retry workspace connection" onPress={refresh} />
      <TextAction label="Join workspace" onPress={() => router.push('/learner/workspaces/join')} />
    </View> : <>
      {active.length > 1 && <View style={p.row}>{active.map(m => <TextAction key={m.membership.membership_id} label={m.workspace.workspace_name} onPress={() => setSelected(m.workspace.workspace_id)} />)}</View>}
      <WorkspaceSyncCard initialInfo={membership ? { status: 'connected', workspaceName: membership.workspace.workspace_name, workspaceCode: membership.workspace.workspace_code, lastSyncedText: syncTime(membership.membership.last_synced_at) } : { status: 'none' }}
        busy={op.busy} message={op.message}
        onJoinPress={() => router.push('/learner/workspaces/join')}
        onSyncPress={() => { void op.run(() => services.progress.sync(), () => { op.setMessage('Learning progress synchronized.'); refresh(); }); }} />
    </>}
    <TextAction label="Learner cloud account" onPress={() => router.push('/learner/workspaces/account')} />
  </ProgressPage>;
}
