import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useCloudServices, failureMessage, type JoinRequest } from '../../modules/cloud/services';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { useOperation } from '../../modules/cloud/useOperation';
import { Colors } from '../../constants/theme';
import { BaseCard } from '../ui/cards/BaseCard';
import { AppButton } from '../ui/AppButton';
import { AppIcon } from '../ui/AppIcon';
import { BayaDialog } from '../ui/BayaDialog';
import { useBayaToast } from '../ui/BayaNotifications';
import { Notice } from './FeatureScreen';
import { WorkspaceSection, ws } from './WorkspaceSection';

export function PendingJoinRequests({ workspaceId, onReviewed }: { workspaceId: string; onReviewed: () => void }) {
  const services = useCloudServices();
  const { result, refresh, refreshing } = useCloudRead(useCallback(() => services.workspaces.pendingRequests ? services.workspaces.pendingRequests(workspaceId) : Promise.resolve({ ok: false as const, code: 'unavailable' as const }), [services, workspaceId]), true);
  const [refreshError, setRefreshError] = useState('');
  const refreshLock = useRef(false);
  const reload = async () => {
    if (refreshLock.current) return;
    refreshLock.current = true; setRefreshError('');
    try {
      const response = await refresh();
      if (response && !response.ok) setRefreshError(failureMessage[response.code]);
    } finally { refreshLock.current = false; }
  };
  return <WorkspaceSection compact title="PENDING JOIN REQUESTS" icon="personFilled" description="Review learners requesting access." badge={result?.ok ? `${result.data.length} Pending` : undefined}
    action={<View style={styles.refresh}>
      <AppButton compact label="" icon="sync" tone="outlinePrimary" fullWidth={false} accessibilityLabel="Refresh pending join requests" disabled={refreshing} onPress={() => { void reload(); }} style={styles.iconButton} />
      {refreshing && <ActivityIndicator accessibilityLabel="Refreshing pending join requests" size="small" color={Colors.rolePrimary} />}
    </View>}>
    <View style={styles.reminder}><AppIcon name="help" color="muted" size={18} /><Text style={[ws.reference, { flex: 1 }]}>Verify the learner and their request reference before approving.</Text></View>
    {!result ? <Notice busy text="Loading join requests…" /> : !result.ok ? <Notice text={failureMessage[result.code]} /> : <>
      {!!refreshError && <Notice text={refreshError} />}
      {result.data.length === 0 ? <Text style={ws.description}>No pending join requests.</Text> : result.data.map(request => <RequestController key={request.request_id} request={request} onReviewed={() => { void reload(); onReviewed(); }} />)}
    </>}
  </WorkspaceSection>;
}

// Each operation retains its own lock; presentation receives data and callbacks only.
function RequestController({ request, onReviewed }: { request: JoinRequest; onReviewed: () => void }) {
  const services = useCloudServices(); const op = useOperation(); const toast = useBayaToast();
  const review = (decision: 'approved' | 'rejected') => {
    void op.run(() => services.workspaces.reviewRequest ? services.workspaces.reviewRequest(request.request_id, decision) : Promise.resolve({ ok: false as const, code: 'unavailable' as const }), () => {
      toast(decision === 'approved' ? 'Request approved.' : 'Request rejected.'); onReviewed();
    });
  };
  return <RequestRow request={request} busy={op.busy} message={op.message} onReview={review} />;
}

function RequestRow({ request, busy, message, onReview }: { request: JoinRequest; busy: boolean; message: string; onReview: (decision: 'approved' | 'rejected') => void }) {
  const [details, setDetails] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState('');
  const toast = useBayaToast();
  const name = request.display_name?.trim() || 'Learner';
  const date = new Date(request.requested_at);
  const timestamp = Number.isNaN(date.getTime()) ? 'Request time unavailable' : date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const copy = async () => {
    setCopying(true); setCopyError('');
    try {
      if (!await Clipboard.setStringAsync(request.request_id)) throw new Error('Clipboard unavailable');
      toast('Request reference copied.');
    } catch { setCopyError('Couldn’t copy. Select the full reference below to copy it.'); }
    finally { setCopying(false); }
  };
  return <BaseCard style={ws.compactRow}>
    <View style={styles.main}>
      <View style={styles.identity}>
        <AppIcon name="personFilled" color="accent" size={22} />
        <View style={styles.copy}>
          <Text style={[ws.name, ws.compactName]}>{name}</Text>
          <Text style={ws.reference}>{timestamp}</Text>
          <View style={styles.reference}>
            <Text style={ws.reference}>Ref: {request.request_id.slice(0, 8)}…</Text>
            <AppButton compact fullWidth={false} tone="outlinePrimary" label="View reference" accessibilityLabel={`View reference for ${name}`} onPress={() => { setCopyError(''); setDetails(true); }} style={styles.detailButton} />
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton compact label="Approve" icon="check" iconPosition="leading" accessibilityLabel={`Approve ${name}`} fullWidth={false} disabled={busy} onPress={() => onReview('approved')} style={ws.compactButton} />
        <AppButton compact label="Reject" accessibilityLabel={`Reject ${name}`} tone="outlinePrimary" fullWidth={false} disabled={busy} onPress={() => onReview('rejected')} style={ws.compactButton} />
      </View>
    </View>
    <Notice busy={busy} text={message} />
    <BayaDialog visible={details} variant="information" icon="personFilled" title="REQUEST REFERENCE"
      description={`${name}: compare this full reference with the learner’s screen. A matching reference or display name alone is not proof of identity.`}
      detail={`${copyError ? `${copyError}\n\n` : ''}${request.request_id}`} detailSelectable
      onDismiss={() => { if (!copying) setDetails(false); }}
      primaryAction={{ label: 'COPY REFERENCE', loading: copying, onPress: () => { void copy(); } }}
      secondaryAction={{ label: 'CLOSE', onPress: () => setDetails(false) }} />
  </BaseCard>;
}

const styles = StyleSheet.create({
  main: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexGrow: 1, flexShrink: 1, flexBasis: 200, minWidth: 0 },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  reference: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 'auto' },
  detailButton: { minHeight: 44, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  iconButton: { minWidth: 44, minHeight: 44, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12 },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reminder: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
});
