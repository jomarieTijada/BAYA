import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useCloudServices, failureMessage, type WorkspaceSummary } from '../../modules/cloud/services';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { useOperation } from '../../modules/cloud/useOperation';
import { nameError } from '../../modules/cloud/validation';
import { FeatureScreen, Notice, TextAction, s } from './FeatureScreen';
import { AppButton } from '../ui/AppButton';
import { AppTextInput } from '../ui/AppTextInput';
import { BaseCard } from '../ui/cards/BaseCard';

export function WorkspaceManageScreen({ id }: { id: string }) {
  const services = useCloudServices();
  const { result, refresh } = useCloudRead(useCallback(() => services.workspaces.details(id), [services, id]));
  return <FeatureScreen title="WORKSPACE SETTINGS" subtitle="Manage your workspace and learner access." onBack={() => router.replace('/mentor/workspaces')}>
    {!result ? <Notice busy text="Loading workspace…" /> : !result.ok ? <><Notice text={failureMessage[result.code]} /><TextAction label="Try again" onPress={refresh} /></> : <WorkspaceEditor key={`${id}-${result.data.status}-${result.data.workspace_name}`} workspace={result.data} refresh={refresh} />}
  </FeatureScreen>;
}
function WorkspaceEditor({ workspace, refresh }: { workspace: WorkspaceSummary; refresh: () => void }) {
  const services = useCloudServices();
  const op = useOperation();
  const [name, setName] = useState(workspace.workspace_name);
  const [issue, setIssue] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const members = useCloudRead(useCallback(() => services.workspaces.members ? services.workspaces.members(workspace.workspace_id) : Promise.resolve({ ok: false as const, code: 'unavailable' as const }), [services, workspace.workspace_id]));
  const archived = workspace.status === 'archived';
  const update = (status: 'active' | 'archived') => {
    const error = nameError(name, services.policy); setIssue(error);
    if (error || !services.workspaces.update) return;
    void op.run(() => services.workspaces.update!(workspace.workspace_id, name, status), refresh);
  };
  return <>
    <AppTextInput density="form" label="WORKSPACE NAME" value={name} onChangeText={setName} editable={!op.busy} error={issue} />
    <Notice busy={op.busy} text={op.message} />
    <AppButton label="SAVE NAME" accessibilityLabel="Save workspace name" disabled={op.busy || !services.workspaces.update} onPress={() => update(archived ? 'archived' : 'active')} />
    <Text style={s.notice}>{archived ? 'Archived: joining and progress access are paused. Restore to resume.' : 'Archiving pauses joining and progress access. Existing progress is retained.'}</Text>
    {confirm ? <View style={{ gap: 12 }}><Text style={s.notice}>Archive this workspace?</Text><AppButton label="CONFIRM ARCHIVE" accessibilityLabel="Confirm archive" disabled={op.busy} onPress={() => update('archived')} /><TextAction label="Cancel" disabled={op.busy} onPress={() => setConfirm(false)} /></View> : <TextAction label={archived ? 'Restore workspace' : 'Archive workspace'} disabled={op.busy || !services.workspaces.update} onPress={() => archived ? update('active') : setConfirm(true)} />}
    <Text style={s.title}>Learner access</Text>
    {!members.result ? <Notice busy text="Loading learners…" /> : !members.result.ok ? <><Notice text={failureMessage[members.result.code]} /><TextAction label="Retry learners" onPress={members.refresh} /></> : members.result.data.length === 0 ? <Text style={s.notice}>No learners have joined yet.</Text> : members.result.data.map(member => <BaseCard key={member.profileId} style={{ padding: 16, gap: 12 }}><Text style={s.notice}>{member.displayName} · {member.active ? 'Active' : 'Removed'}</Text><TextAction disabled={op.busy} label={member.active ? `Remove access for ${member.displayName}` : `Restore access for ${member.displayName}`} onPress={() => {
      if (!services.workspaces.setMemberActive) return;
      void op.run(() => services.workspaces.setMemberActive!(workspace.workspace_id, member.profileId, !member.active), members.refresh);
    }} /></BaseCard>)}
  </>;
}
