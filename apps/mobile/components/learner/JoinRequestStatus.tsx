import { Text } from '../../localization/components';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
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
export function JoinRequestStatus({ revision = 0, onApproved, onPendingChange, onVisibilityChange, hideJoined = false, quietEmpty = false, suppressApprovedDialog = false }: { revision?: number; onApproved?: () => void; onPendingChange?: (pending: boolean) => void; onVisibilityChange?: (visible: boolean) => void; hideJoined?: boolean; quietEmpty?: boolean; suppressApprovedDialog?: boolean }) {
  const services = useCloudServices();
  const [dismissed, setDismissed] = useState('');
  const { result, refresh, refreshing } = useCloudRead(useCallback(async () => {
    void revision;
    if (!services.workspaces.myRequests) return { ok: true as const, data: { requests: [], approved: [] as string[] } };
    const requests = await services.workspaces.myRequests();
    if (!requests.ok) return requests;
    // Show the newest lifecycle per workspace; retain full history on the server.
    requests.data = requests.data.filter((r, i, rows) => rows.findIndex(other => other.workspace_id === r.workspace_id) === i);
    let memberships;
    if (requests.data.some(r => r.status === 'approved')) {
      memberships = await services.workspaces.memberships();
    } else {
      memberships = { ok: true as const, data: [] };
    }
    if (!memberships.ok) return memberships;
    return { ok: true as const, data: { requests: requests.data, approved: requests.data.filter(r => r.status === 'approved' && memberships.data.some(m => m.workspace.workspace_id === r.workspace_id && m.workspace.status === 'active' && m.membership.is_active)).map(r => r.request_id) } };
  }, [services, revision]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => subscription.remove();
  }, [refresh]);
  let approvedId;
  if (result?.ok) {
    approvedId = result.data.approved.find(id => !acknowledged.has(id) && id !== dismissed);
  } else {
    approvedId = undefined;
  }
  useEffect(() => {
    if (result?.ok) onPendingChange?.(result.data.requests.some(r => r.status === 'pending'));
  }, [result, onPendingChange]);
  useEffect(() => {
    onVisibilityChange?.(!result || !result.ok || result.data.requests.some(r => !hideJoined || !result.data.approved.includes(r.request_id)));
  }, [result, onVisibilityChange, hideJoined]);
  useEffect(() => { if (approvedId) onApproved?.(); }, [approvedId, onApproved]);
  const dismiss = () => { if (approvedId) { acknowledged.add(approvedId); setDismissed(approvedId); } };
  return <>
    {(() => {
      if (!result) {
        return !quietEmpty && <Notice busy text="Checking join requests…" />;
      } else {
        if (!result.ok) {
          return !quietEmpty && <Notice text={failureMessage[result.code]} />;
        } else {
          return result.data.requests.filter(r => !hideJoined || !result.data.approved.includes(r.request_id)).map(request => <BaseCard key={request.request_id} style={ws.section}>
      <View style={ws.headingRow}><View style={ws.icon}><AppIcon name={(() => {
        if (result.data.approved.includes(request.request_id)) {
          return 'circleCheck';
        } else {
          return 'workspace';
        }
      })()} color="accent" size={26} /></View><View style={ws.headingCopy}><Text style={ws.eyebrow}>YOUR WORKSPACE</Text><Text style={ws.name} verbatim>{request.workspace_name}</Text></View></View>
      <Text accessibilityRole="header" style={ws.heading}>{(() => {
        if (request.status === 'pending') {
          return 'WAITING FOR APPROVAL';
        } else {
          if (request.status === 'rejected') {
            return 'REQUEST REJECTED';
          } else {
            if (result.data.approved.includes(request.request_id)) {
              return 'WORKSPACE MEMBER';
            } else {
              return 'MEMBERSHIP INACTIVE';
            }
          }
        }
      })()}</Text>
      <Text style={ws.description}>{(() => {
        if (request.status === 'pending') {
          return 'Your mentor hasn’t reviewed your request yet. You can keep learning.';
        } else {
          if (request.status === 'rejected') {
            return 'Ask your mentor for help. You may request again. Your learning is still saved on this device.';
          } else {
            return 'Check Workspace & Sync for your current connection.';
          }
        }
      })()}</Text>
      <View style={[ws.inset, { padding: 6, gap: 2 }]}><Text style={ws.eyebrow}>REQUEST REFERENCE</Text><Text selectable style={ws.reference} verbatim>{request.request_id}</Text></View>
    </BaseCard>);
        }
      }
    })()}
    {((result?.ok && result.data.requests.some(r => !hideJoined || !result.data.approved.includes(r.request_id))) || (!quietEmpty && result && !result.ok)) && <AppButton label={(() => {
      if (refreshing) {
        return 'REFRESHING…';
      } else {
        return 'REFRESH';
      }
    })()} accessibilityLabel="Refresh workspace status" icon="sync" iconPosition="leading" tone="outlinePrimary" compact fullWidth={false} density="compact" labelStyle={{ fontSize: 12 }} style={{ alignSelf: 'center', height: 32, minHeight: 32, paddingVertical: 2 }} disabled={refreshing} onPress={() => { void refresh(); }} />}
    <BayaDialog visible={!!approvedId && !suppressApprovedDialog} variant="success" title="WORKSPACE JOINED!" description="You are now connected to your mentor’s workspace."
      detail="Your eligible learning progress can now synchronize with the workspace." onDismiss={dismiss}
      primaryAction={{ label: 'CONTINUE', onPress: () => { dismiss(); router.replace('/learner/home'); } }} />
  </>;
}
