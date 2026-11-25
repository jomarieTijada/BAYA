import { Text } from '../../localization/components';
import React, { useCallback, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useCloudServices, failureMessage, type WorkspaceSummary } from '../../modules/cloud/services';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { useOperation } from '../../modules/cloud/useOperation';
import { nameError, capacityError } from '../../modules/cloud/validation';
import { FeatureScreen, Notice, TextAction, s } from './FeatureScreen';
import { AppButton } from './MentorButton';
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
    {(() => {
      if (!result) {
        return <Notice busy text="Loading workspace…" />;
      } else {
        if (!result.ok) {
          return <><Notice text={failureMessage[result.code]} /><TextAction label="Try again" onPress={refresh} /></>;
        } else {
          return <WorkspaceEditor key={`${id}-${result.data.status}-${result.data.workspace_name}`} workspace={result.data} refresh={refresh} />;
        }
      }
    })()}
  </FeatureScreen>;
}
function WorkspaceEditor({ workspace, refresh }: { workspace: WorkspaceSummary; refresh: () => void }) {
  const { width } = useWindowDimensions();
  const columns = width >= 650;
  const cell = { width: (() => {
    if (columns) {
      return '48.5%' as const;
    } else {
      return '100%' as const;
    }
  })() };
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
  const [capacity, setCapacity] = useState(String(workspace.learner_capacity ?? 30));
  const [capacityIssue, setCapacityIssue] = useState<string>();
  const [name, setName] = useState(workspace.workspace_name);
  const [issue, setIssue] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const members = useCloudRead(useCallback(() => {
    if (services.workspaces.members) {
      return services.workspaces.members(workspace.workspace_id);
    } else {
      return Promise.resolve({ ok: false as const, code: 'unavailable' as const });
    }
  }, [services, workspace.workspace_id]));
  const archived = workspace.status === 'archived';
  const update = (status: 'active' | 'archived') => {
    const error = nameError(name, services.policy); setIssue(error);
    const capacityProblem = capacityError(capacity); setCapacityIssue(capacityProblem);
    if (error || capacityProblem || !services.workspaces.update) return;
    void op.run(() => services.workspaces.update!(workspace.workspace_id, name, status, Number(capacity)), refresh);
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
      <View style={ws.headingRow}><Text accessibilityRole="header" style={[ws.name, { flex: 1 }]} verbatim>{workspace.workspace_name}</Text><Text style={ws.badge}>{(() => {
        if (archived) {
          return 'Archived';
        } else {
          return 'Active';
        }
      })()}</Text></View>
      <View style={{ gap: 6 }}><Text style={ws.eyebrow}>WORKSPACE CODE</Text>
        <View style={ws.actions}><Text selectable style={ws.name} verbatim>{workspace.workspace_code}</Text><AppButton density="landscapeCompact" compact fullWidth={false} tone="outlinePrimary" icon="copy" label="COPY" accessibilityLabel="Copy workspace code" disabled={copying} onPress={() => { void copyCode(); }} /></View>
        <Text style={ws.description}>Share this code with your learners, then review their requests below.</Text>
        <Notice text={copyIssue} />
      </View>
    </BaseCard>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, alignItems: 'flex-start' }}>
    <View style={cell}>
    <PendingJoinRequests workspaceId={workspace.workspace_id} onReviewed={() => { void members.refresh(); refresh(); }} />
    </View>
    <View style={cell}>
    <ActiveMembers workspaceId={workspace.workspace_id} result={members.result} refresh={members.refresh} />
    </View>
    {(op.busy || !!op.message) && <View style={{ width: '100%' }}><Notice busy={op.busy} text={op.message} /></View>}
    <View style={cell}>
    <WorkspaceSection title="Workspace details" icon="pencil" description="Choose a name your learners will recognize.">
    <AppTextInput density="landscapeCompact" label="WORKSPACE NAME" value={name} onChangeText={setName} editable={!op.busy} error={issue} />
    <AppTextInput density="landscapeCompact" label="LEARNER CAPACITY" required value={capacity} onChangeText={setCapacity} keyboardType="number-pad" editable={!op.busy} error={capacityIssue} />
    <AppButton density="landscapeCompact" compact label="SAVE CHANGES" accessibilityLabel="Save workspace name" disabled={op.busy || !services.workspaces.update} onPress={() => update((() => {
      if (archived) {
        return 'archived';
      } else {
        return 'active';
      }
    })())} />
    </WorkspaceSection>
    </View>
    <View style={cell}>
    <WorkspaceSection title={(() => {
      if (archived) {
        return 'Resume this workspace';
      } else {
        return 'Pause this workspace';
      }
    })()} icon="layers">
    <Text style={s.notice}>{(() => {
      if (archived) {
        return 'Archived: joining and progress access are paused. Restore to resume.';
      } else {
        return 'Archiving pauses joining and progress access. Existing progress is retained.';
      }
    })()}</Text>
    <TextAction label={(() => {
      if (archived) {
        return 'Restore workspace';
      } else {
        return 'Archive workspace';
      }
    })()} disabled={op.busy || archiveOp.busy || !services.workspaces.update} onPress={() => {
      if (archived) {
        return update('active');
      } else {
        return setConfirm(true);
      }
    }} />
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
