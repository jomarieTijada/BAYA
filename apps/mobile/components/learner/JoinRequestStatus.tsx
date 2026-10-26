import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useCloudServices, failureMessage } from '../../modules/cloud/services';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { BaseCard } from '../ui/cards/BaseCard';
import { BayaDialog } from '../ui/BayaDialog';
import { Notice } from '../mentor/FeatureScreen';
import { AppButton } from '../ui/AppButton';
import { ws } from '../mentor/WorkspaceSection';
import { AppIcon } from '../ui/AppIcon';

// Presentation acknowledgement only; never used to authorize membership or sync.
const acknowledged = new Set<string>();
export function JoinRequestStatus({ revision = 0, onApproved, onPendingChange, onVisibilityChange, quietEmpty = false, suppressApprovedDialog = false }: { revision?: number; onApproved?: () => void; onPendingChange?: (pending: boolean) => void; onVisibilityChange?: (visible: boolean) => void; quietEmpty?: boolean; suppressApprovedDialog?: boolean }) {
  const services = useCloudServices();
  const [dismissed, setDismissed] = useState('');
  const { result, refresh, refreshing } = useCloudRead(useCallback(async () => {
    void revision;
    if (!services.workspaces.myRequests) return { ok: true as const, data: { requests: [], approved: [] as string[] } };
    const requests = await services.workspaces.myRequests();
    if (!requests.ok) return requests;
    // Show the newest lifecycle per workspace; retain full history on the server.
    requests.data = requests.data.filter((r, i, rows) => rows.findIndex(other => other.workspace_id === r.workspace_id) === i);
    const memberships = requests.data.some(r => r.status === 'approved') ? await services.workspaces.memberships() : { ok: true as const, data: [] };
    if (!memberships.ok) return memberships;
    return { ok: true as const, data: { requests: requests.data, approved: requests.data.filter(r => r.status === 'approved' && memberships.data.some(m => m.workspace.workspace_id === r.workspace_id && m.workspace.status === 'active' && m.membership.is_active)).map(r => r.request_id) } };
  }, [services, revision]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => subscription.remove();
  }, [refresh]);
  const approvedId = result?.ok ? result.data.approved.find(id => !acknowledged.has(id) && id !== dismissed) : undefined;
  useEffect(() => {
    if (result?.ok) onPendingChange?.(result.data.requests.some(r => r.status === 'pending'));
  }, [result, onPendingChange]);
  useEffect(() => {
    onVisibilityChange?.(!result || !result.ok || result.data.requests.length > 0);
  }, [result, onVisibilityChange]);
  useEffect(() => { if (approvedId) onApproved?.(); }, [approvedId, onApproved]);
  const dismiss = () => { if (approvedId) { acknowledged.add(approvedId); setDismissed(approvedId); } };
  return <>
    {!result ? !quietEmpty && <Notice busy text="Checking join requests…" /> : !result.ok ? !quietEmpty && <Notice text={failureMessage[result.code]} /> : result.data.requests.map(request => <BaseCard key={request.request_id} style={ws.section}>
      <View style={ws.headingRow}><View style={ws.icon}><AppIcon name={result.data.approved.includes(request.request_id) ? 'circleCheck' : 'workspace'} color="accent" size={26} /></View><View style={ws.headingCopy}><Text style={ws.eyebrow}>YOUR WORKSPACE</Text><Text style={ws.name}>{request.workspace_name}</Text></View></View>
      <Text accessibilityRole="header" style={ws.heading}>{request.status === 'pending' ? 'WAITING FOR APPROVAL' : request.status === 'rejected' ? 'REQUEST REJECTED' : result.data.approved.includes(request.request_id) ? 'WORKSPACE MEMBER' : 'MEMBERSHIP INACTIVE'}</Text>
      <Text style={ws.description}>{request.status === 'pending' ? 'Your mentor hasn’t reviewed your request yet. You can keep learning.' : request.status === 'rejected' ? 'Ask your mentor for help. You may request again. Your learning is still saved on this device.' : 'Check Workspace & Sync for your current connection.'}</Text>
      <View style={ws.inset}><Text style={ws.eyebrow}>REQUEST REFERENCE</Text><Text selectable style={ws.reference}>{request.request_id}</Text></View>
    </BaseCard>)}
    {((result?.ok && result.data.requests.length > 0) || (!quietEmpty && result && !result.ok)) && <AppButton label={refreshing ? 'REFRESHING…' : 'REFRESH'} accessibilityLabel="Refresh workspace status" icon="sync" iconPosition="leading" tone="outlinePrimary" compact fullWidth={false} style={{ alignSelf: 'center' }} disabled={refreshing} onPress={() => { void refresh(); }} />}
    <BayaDialog visible={!!approvedId && !suppressApprovedDialog} variant="success" title="WORKSPACE JOINED!" description="You are now connected to your mentor’s workspace."
      detail="Your eligible learning progress can now synchronize with the workspace." onDismiss={dismiss}
      primaryAction={{ label: 'CONTINUE', onPress: () => { dismiss(); router.replace('/learner/home'); } }} />
  </>;
}
