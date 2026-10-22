import React, { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { ProgressPage, p } from './ProgressPage';
import { WorkspaceCode } from './WorkspaceCode';
import { LearnerProgressRow } from './LearnerProgressRow';
import { useCloudServices, failureMessage } from '../../modules/cloud/services';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { syncTime } from '../../modules/progress/presentation';
import { AppIcon } from '../ui/AppIcon';
import { AppButton } from '../ui/AppButton';
import { Notice, TextAction } from '../mentor/FeatureScreen';
import { Colors } from '../../constants/theme';

export function MentorDashboard({ id }: { id: string }) {
  const services = useCloudServices();
  const [offset, setOffset] = useState(0);
  const [settings, setSettings] = useState(false);
  const { result, refresh } = useCloudRead(useCallback(() => services.progress.dashboard(id, offset), [services, id, offset]));
  return <ProgressPage title="Mentor Dashboard" subtitle="Monitor your workspace and learner progress." onBack={() => router.replace('/mentor/workspaces')}
    action={<Pressable accessibilityRole="button" accessibilityLabel="Workspace options" onPress={() => setSettings(v => !v)} style={[p.card, { padding: 16, borderRadius: 40 }]}><AppIcon name="settings" color="accent" size={26} /></Pressable>}>
    {settings && <View style={[p.card, p.row]}><TextAction label="Manage workspace" onPress={() => router.push({ pathname: '/mentor/workspaces/manage', params: { id } })} /><TextAction label="Refresh progress" onPress={refresh} /><TextAction label="Choose another workspace" onPress={() => router.replace('/mentor/workspaces')} /></View>}
    {!result ? <Notice busy text="Loading synchronized progress…" /> : !result.ok ? <View style={[p.card, { gap: 20 }]}>
      <Notice text={failureMessage[result.code]} /><AppButton label="TRY AGAIN" accessibilityLabel="Retry progress dashboard" onPress={refresh} />
    </View> : <>
      <View style={[p.card, p.row, { justifyContent: 'space-between', paddingVertical: 18 }]}>
        <View style={[p.row, { flexShrink: 1, flexWrap: 'nowrap' }]}>
          <View style={{ backgroundColor: '#FFF5E8', borderWidth: 1.5, borderColor: '#FFE7CC', padding: 14, borderRadius: 22 }}><AppIcon name="workspace" color="accent" size={32} /></View>
          <View style={{ flexShrink: 1 }}><Text style={p.name}>{result.data.workspace.workspace_name}</Text><Text style={[p.text, { marginTop: 12 }]}>{result.data.learnerCount} Learners · {result.data.lastSyncedAt ? `Last sync: ${syncTime(result.data.lastSyncedAt)}` : 'Not synchronized yet'}</Text></View>
        </View>
        <WorkspaceCode code={result.data.workspace.workspace_code} />
      </View>
      <View style={[p.row, { marginTop: 42 }]}><Text style={[p.name, { fontSize: 22 }]}>LEARNER PROGRESS</Text><Text style={[p.text, { backgroundColor: Colors.optionalBackground, borderRadius: 25, paddingHorizontal: 16, paddingVertical: 8 }]}>{result.data.learnerCount} Active</Text></View>
      {result.data.learnerCount === 0 ? <View style={p.card}><Text style={p.name}>No learners yet</Text><Text style={[p.text, { marginTop: 12 }]}>Share your workspace code. Learners will appear here after joining, and their progress after synchronization.</Text></View> : <View style={{ gap: 14 }}>{result.data.learners.map((learner, index) => <LearnerProgressRow key={learner.profileId} learner={learner} index={index + offset} onView={() => router.push({ pathname: '/mentor/learner-progress', params: { workspaceId: id, profileId: learner.profileId } })} />)}</View>}
      <View style={p.row}>
        {offset > 0 && <TextAction label="Previous learners" onPress={() => setOffset(n => Math.max(0, n - 50))} />}
        {result.data.nextOffset !== null && <TextAction label="Next learners" onPress={() => setOffset(result.data.nextOffset!)} />}
        <TextAction label="Refresh progress" onPress={refresh} />
      </View>
    </>}
  </ProgressPage>;
}
