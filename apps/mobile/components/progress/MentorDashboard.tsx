import { useLocalization } from '../../localization/LocalizationProvider';
import { Text } from '../../localization/components';
import React, { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { ProgressPage, p } from './ProgressPage';
import { WorkspaceCode } from './WorkspaceCode';
import { ResultsSummaryTable } from './ResultsSummaryTable';
import { useCloudServices, failureMessage } from '../../modules/cloud/services';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { syncTime } from '../../modules/progress/presentation';
import { AppIcon } from '../ui/AppIcon';
import { AppButton } from '../ui/AppButton';
import { Notice, TextAction } from '../mentor/FeatureScreen';
import { MentorActionMenu } from '../mentor/MentorActionMenu';
import { useBayaToast } from '../ui/BayaNotifications';

export function MentorDashboard({ id }: { id: string }) {
  return <WorkspaceResults key={id} id={id} />;
}

function WorkspaceResults({ id }: { id: string }) {
  const { language, learners } = useLocalization();
  const services = useCloudServices();
  const [offset, setOffset] = useState(0);
  const toast = useBayaToast();
  const refreshingRequest = useRef(false);
  const { result, refresh, refreshing, refreshError } = useCloudRead(useCallback(() => services.progress.dashboard(id, offset), [services, id, offset]), true);
  const refreshProgress = async () => {
    if (refreshingRequest.current || refreshing) return;
    refreshingRequest.current = true;
    try {
      const response = await refresh();
      if (response) toast((() => {
        if (response.ok) {
          return 'Progress refreshed.';
        } else {
          return failureMessage[response.code];
        }
      })(), (() => {
        if (response.ok) {
          return 'success';
        } else {
          return 'error';
        }
      })());
    } finally { refreshingRequest.current = false; }
  };
  return <ProgressPage title="Mentor Dashboard" subtitle="Monitor your workspace and learner progress." onBack={() => router.replace('/mentor/workspaces')}
    action={<MentorActionMenu label="Workspace options" groups={[
      { label: 'Workspace', actions: [
        { label: 'Manage Workspace', icon: 'workspace', onPress: () => router.push({ pathname: '/mentor/workspaces/manage', params: { id } }) },
        { label: 'Refresh Progress', icon: 'sync', onPress: () => { void refreshProgress(); }, busy: refreshing, disabled: refreshing, keepOpen: true },
        { label: 'Switch Workspace', icon: 'layers', onPress: () => router.replace('/mentor/workspaces') },
      ] },
    ]} />}>
    {(() => {
      if (!result) {
        return <Notice busy text="Loading synchronized progress…" />;
      } else {
        if (!result.ok) {
          return <View style={[p.card, { gap: 20 }]}>
      <Notice text={failureMessage[result.code]} /><AppButton label="TRY AGAIN" accessibilityLabel="Retry progress dashboard" onPress={refresh} />
    </View>;
        } else {
          return <>
      <View style={[p.card, p.row, { padding: 12, borderRadius: 18 }, { justifyContent: 'space-between', paddingVertical: 10 }]}>
        <View style={[p.row, { flexShrink: 1, flexWrap: 'nowrap' }]}>
          <View style={{ backgroundColor: '#FFF5E8', borderWidth: 1.5, borderColor: '#FFE7CC', padding: 8, borderRadius: 22 }}><AppIcon name="workspace" color="accent" size={24} /></View>
          <View style={{ flexShrink: 1 }}><Text style={[p.name, { fontSize: 18 }]} verbatim>{result.data.workspace.workspace_name}</Text><Text style={[p.text, { marginTop: 4, fontSize: 13 }]}>{learners(result.data.learnerCount)} · {(() => {
            if (result.data.lastSyncedAt) {
              return `Last sync: ${syncTime(result.data.lastSyncedAt, new Date(), language)}`;
            } else {
              return 'Not synchronized yet';
            }
          })()}</Text></View>
        </View>
        <WorkspaceCode code={result.data.workspace.workspace_code} />
      </View>
      {refreshError && <Text accessibilityRole="alert" style={p.text}>Could not refresh. Showing the previously loaded results.</Text>}
      {result.data.learnerCount === 0 ? <View style={[p.card, { padding: 12, borderRadius: 18 }]}>
        <Text accessibilityRole="header" style={[p.name, { fontSize: 18 }]}>No approved learners yet</Text>
        <Text style={[p.text, { marginTop: 4, fontSize: 13 }]}>Approved learners will appear here. Results appear after they synchronize their learning.</Text>
      </View> : <ResultsSummaryTable learners={result.data.learners} onView={profileId => router.push({ pathname: '/mentor/learner-progress', params: { workspaceId: id, profileId } })} />}
      <View style={p.row}>
        {offset > 0 && <TextAction label="Previous learners" onPress={() => setOffset(n => Math.max(0, n - 50))} />}
        {result.data.nextOffset !== null && <TextAction label="Next learners" onPress={() => setOffset(result.data.nextOffset!)} />}
      </View>
    </>;
        }
      }
    })()}
  </ProgressPage>;
}
