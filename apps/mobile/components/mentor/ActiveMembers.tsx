import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { failureMessage, useCloudServices, type Result, type WorkspaceMember } from '../../modules/cloud/services';
import { useOperation } from '../../modules/cloud/useOperation';
import { AppButton } from '../ui/AppButton';
import { AppIcon } from '../ui/AppIcon';
import { BaseCard } from '../ui/cards/BaseCard';
import { BayaDialog } from '../ui/BayaDialog';
import { useBayaToast } from '../ui/BayaNotifications';
import { Notice, TextAction } from './FeatureScreen';
import { WorkspaceSection, ws } from './WorkspaceSection';

export function ActiveMembers({ workspaceId, result, refresh }: {
  workspaceId: string; result?: Result<WorkspaceMember[]>; refresh: () => void;
}) {
  const active = result?.ok ? result.data.filter(member => member.active) : [];
  const removed = result?.ok ? result.data.filter(member => !member.active) : [];
  return <WorkspaceSection compact title="Active Members" icon="workspace" description="Manage access for learners in this workspace." badge={result?.ok ? `${active.length} Active` : undefined}>
    {!result ? <Notice busy text="Loading learners…" /> : !result.ok ? <><Notice text={failureMessage[result.code]} /><TextAction label="Retry learners" onPress={refresh} /></> : <>
      {active.length === 0 && <Text style={ws.description}>No active members. Approved learners will appear here.</Text>}
      {active.map(member => <MemberController key={member.profileId} member={member} workspaceId={workspaceId} refresh={refresh} />)}
      {removed.length > 0 && <Text accessibilityRole="header" style={ws.eyebrow}>Removed members</Text>}
      {removed.map(member => <MemberController key={member.profileId} member={member} workspaceId={workspaceId} refresh={refresh} />)}
    </>}
  </WorkspaceSection>;
}

function MemberController({ member, workspaceId, refresh }: { member: WorkspaceMember; workspaceId: string; refresh: () => void }) {
  const services = useCloudServices();
  const op = useOperation();
  const toast = useBayaToast();
  const [confirm, setConfirm] = useState(false);
  const name = member.displayName?.trim() || 'Unnamed learner';
  const changeAccess = () => {
    void op.run(() => services.workspaces.setMemberActive
      ? services.workspaces.setMemberActive(workspaceId, member.profileId, !member.active)
      : Promise.resolve({ ok: false as const, code: 'unavailable' as const }), () => {
      setConfirm(false);
      toast(member.active ? 'Workspace access removed.' : 'Workspace access restored.');
      refresh();
    });
  };
  return <>
    <MemberRow name={name} active={member.active} busy={op.busy} onPress={() => { op.setMessage(''); setConfirm(true); }} />
    <BayaDialog visible={confirm} variant="confirmation" icon="personFilled"
      title={member.active ? 'Remove learner?' : 'Restore access?'}
      description={member.active ? `Remove ${name} from this workspace?` : `Restore ${name}’s access to this workspace?`}
      detail={op.message || 'Their saved learning progress will be preserved.'}
      onDismiss={() => { if (!op.busy) setConfirm(false); }}
      primaryAction={{ label: member.active ? 'REMOVE ACCESS' : 'RESTORE ACCESS', loading: op.busy, onPress: changeAccess }}
      secondaryAction={{ label: 'CANCEL', onPress: () => setConfirm(false) }} />
  </>;
}

function MemberRow({ name, active, busy, onPress }: { name: string; active: boolean; busy: boolean; onPress: () => void }) {
  return <BaseCard style={[ws.compactRow, styles.row]}>
    <View style={styles.identity}><AppIcon name="personFilled" color="accent" size={22} /><Text style={[ws.name, ws.compactName, { flex: 1 }]}>{name}</Text></View>
    <View style={styles.actions}>
      <Text style={ws.badge}>{active ? 'Active' : 'Removed'}</Text>
      <AppButton compact fullWidth={false} tone="outlinePrimary" label={active ? 'Remove' : 'Restore'}
        accessibilityLabel={`${active ? 'Remove' : 'Restore'} workspace access for ${name}`} disabled={busy} onPress={onPress} style={ws.compactButton} />
    </View>
  </BaseCard>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 8, paddingVertical: 10 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8, flexGrow: 1, flexShrink: 1, flexBasis: 120, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginLeft: 'auto' },
});
