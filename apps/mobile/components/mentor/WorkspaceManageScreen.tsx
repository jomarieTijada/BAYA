import React, { useCallback, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useCloudServices, failureMessage, type WorkspaceSummary } from '../../modules/cloud/services';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { useOperation } from '../../modules/cloud/useOperation';
import { nameError } from '../../modules/cloud/validation';
import { FeatureScreen, Notice, TextAction, s } from './FeatureScreen';
import { AppButton } from '../ui/AppButton';
import { AppTextInput } from '../ui/AppTextInput';
import { BaseCard } from '../ui/cards/BaseCard';
import { PendingJoinRequests } from './PendingJoinRequests';
import { ActiveMembers } from './ActiveMembers';
import { WorkspaceSection, ws } from './WorkspaceSection';
import { useBayaToast } from '../ui/BayaNotifications';
import { BayaDialog } from '../ui/BayaDialog';

export function WorkspaceManageScreen({ id }: { id: string }) {
  const services = useCloudServices();
  const { result, refresh } = useCloudRead(useCallback(() => services.workspaces.details(id), [services, id]));
  return <FeatureScreen wide card={false} title="WORKSPACE SETTINGS" subtitle="Manage your workspace and learner access." onBack={() => router.replace('/mentor/workspaces')}>
    {!result ? <Notice busy text="Loading workspace…" /> : !result.ok ? <><Notice text={failureMessage[result.code]} /><TextAction label="Try again" onPress={refresh} /></> : <WorkspaceEditor key={`${id}-${result.data.status}-${result.data.workspace_name}`} workspace={result.data} refresh={refresh} />}
  </FeatureScreen>;
}
function WorkspaceEditor({ workspace, refresh }: { workspace: WorkspaceSummary; refresh: () => void }) {
  const { width } = useWindowDimensions();
  const columns = width >= 960;
  const cell = { width: columns ? '48.5%' as const : '100%' as const };
  const toast = useBayaToast();
  const [copying, setCopying] = useState(false);
  const [copyIssue, setCopyIssue] = useState('');
  const copyCode = async () => {
    if (copying) return;
    setCopying(true); setCopyIssue('');
    try {
      const copied = await Clipboard.setStringAsync(workspace.workspace_code);
      if (!copied) throw new Error('Clipboard unavailable');
      toast('Workspace code copied.');
    } catch {
      setCopyIssue('Couldn’t copy the code. Select the code to copy it manually.');
    } finally { setCopying(false); }
  };
  const services = useCloudServices();
  const op = useOperation();
  const archiveOp = useOperation();
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
  const archive = () => {
    if (!services.workspaces.update) return;
    void archiveOp.run(() => services.workspaces.update!(workspace.workspace_id, workspace.workspace_name, 'archived'), () => {
      setConfirm(false);
      toast('Workspace archived. Existing progress is saved.');
      refresh();
    });
  };
  return <View style={ws.stack}>
    <BaseCard theme="warm" style={ws.section}>
      <View style={ws.headingRow}><Text accessibilityRole="header" style={[ws.name, { flex: 1 }]}>{workspace.workspace_name}</Text><Text style={ws.badge}>{archived ? 'Archived' : 'Active'}</Text></View>
      <View style={{ gap: 6 }}><Text style={ws.eyebrow}>WORKSPACE CODE</Text>
        <View style={ws.actions}><Text selectable style={ws.name}>{workspace.workspace_code}</Text><AppButton compact fullWidth={false} tone="outlinePrimary" icon="copy" label="COPY" accessibilityLabel="Copy workspace code" disabled={copying} onPress={() => { void copyCode(); }} /></View>
        <Text style={ws.description}>Share this code with your learners, then review their requests below.</Text>
        <Notice text={copyIssue} />
      </View>
    </BaseCard>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 20, alignItems: 'flex-start' }}>
    <View style={cell}>
    <PendingJoinRequests workspaceId={workspace.workspace_id} onReviewed={() => { void members.refresh(); refresh(); }} />
    </View>
    <View style={cell}>
    <ActiveMembers workspaceId={workspace.workspace_id} result={members.result} refresh={members.refresh} />
    </View>
    {(op.busy || !!op.message) && <View style={{ width: '100%' }}><Notice busy={op.busy} text={op.message} /></View>}
    <View style={cell}>
    <WorkspaceSection title="Workspace details" icon="pencil" description="Choose a name your learners will recognize.">
    <AppTextInput density="form" label="WORKSPACE NAME" value={name} onChangeText={setName} editable={!op.busy} error={issue} />
    <AppButton label="SAVE NAME" accessibilityLabel="Save workspace name" disabled={op.busy || !services.workspaces.update} onPress={() => update(archived ? 'archived' : 'active')} />
    </WorkspaceSection>
    </View>
    <View style={cell}>
    <WorkspaceSection title={archived ? 'Resume this workspace' : 'Pause this workspace'} icon="layers">
    <Text style={s.notice}>{archived ? 'Archived: joining and progress access are paused. Restore to resume.' : 'Archiving pauses joining and progress access. Existing progress is retained.'}</Text>
    <TextAction label={archived ? 'Restore workspace' : 'Archive workspace'} disabled={op.busy || archiveOp.busy || !services.workspaces.update} onPress={() => archived ? update('active') : setConfirm(true)} />
    </WorkspaceSection>
    </View>
    </View>
    <BayaDialog visible={confirm} title="ARCHIVE WORKSPACE?" variant="confirmation" icon="layers"
      description={`Archive “${workspace.workspace_name}”? Joining and progress access will pause.`}
      detail={archiveOp.message || 'Existing progress stays saved. You can restore this workspace anytime.'}
      onDismiss={() => { if (!archiveOp.busy) setConfirm(false); }}
      primaryAction={{ label: 'CONFIRM ARCHIVE', onPress: archive, loading: archiveOp.busy }}
      secondaryAction={{ label: 'CANCEL', onPress: () => setConfirm(false) }} />
  </View>;
}
