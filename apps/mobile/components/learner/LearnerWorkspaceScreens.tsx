import { useCloudRead } from '../../modules/progress/useCloudRead';
import { JoinRequestStatus } from './JoinRequestStatus';
import React, { useCallback, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import {
  useCloudServices,
  failureMessage,
} from '../../modules/cloud/services';
import { useOperation } from '../../modules/cloud/useOperation';
import { codeError, normalizeCode } from '../../modules/cloud/validation';
import { AppTextInput } from '../ui/AppTextInput';
import { AppButton } from '../ui/AppButton';
import { FeatureScreen, Notice, s } from '../mentor/FeatureScreen';
import { BaseCard } from '../ui/cards/BaseCard';
import { BayaDialog } from '../ui/BayaDialog';
const joinMessages = {
  ...failureMessage,
  network: "Can't connect right now. Please try again.",
  offline: "Can't connect right now. Please try again.",
  unavailable: 'Joining is not ready yet. Ask your mentor for help. You can keep learning.',
  invalid_code: 'Workspace not found. Check the code and try again.',
  not_found: 'Workspace not found. Check the code and try again.',
};
export function LearnerJoinWorkspaceScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  return <Redirect href={typeof code === 'string' ? { pathname: '/learner/workspaces', params: { code } } : '/learner/workspaces'} />;
}
function JoinWorkspaceForm({ visible, onClose, onSubmitted, initialCode }: {
  visible: boolean; onClose: () => void; onSubmitted: () => void; initialCode: string;
}) {
  const { height } = useWindowDimensions();
  const compact = height < 500;
  const services = useCloudServices();
  const op = useOperation(joinMessages);
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string>();
  const [confirmation, setConfirmation] = useState<'sent' | 'pending' | 'member'>();
  const close = () => { if (!op.busy) { setConfirmation(undefined); onClose(); } };
  const submit = () => {
      const issue = codeError(code, services.policy); setError(issue); if (issue) return;
      void op.run(() => services.workspaces.requestJoin ? services.workspaces.requestJoin(normalizeCode(code)) : Promise.resolve({ ok: false as const, code: 'unavailable' as const }), result => {
        setConfirmation(result.kind === 'already_member' ? 'member' : result.kind === 'already_pending' ? 'pending' : 'sent');
        setCode(''); onSubmitted();
      });
  };
  return <BayaDialog visible={visible} variant={!confirmation ? 'form' : confirmation === 'member' ? 'success' : 'information'} icon="workspace"
    title={!confirmation ? 'JOIN WORKSPACE' : confirmation === 'member' ? 'WORKSPACE JOINED!' : confirmation === 'pending' ? 'WAITING FOR APPROVAL' : 'JOIN REQUEST SENT!'}
    description={!confirmation ? 'Enter the workspace code given by your mentor.' : confirmation === 'member' ? 'You are now connected to your mentor’s workspace.' : 'Your mentor will review your request.'}
    detail={confirmation ? confirmation === 'member' ? 'Your workspace is available in My Workspaces.' : 'You can keep learning while you wait.' : undefined}
    closeLabel={!confirmation ? 'Close join workspace' : undefined} onDismiss={close}
    primaryAction={confirmation ? { label: confirmation === 'member' ? 'MY WORKSPACES' : 'CONTINUE LEARNING', onPress: () => { close(); if (confirmation !== 'member') router.replace('/learner/home'); } } : { label: 'JOIN WORKSPACE', loading: op.busy, onPress: submit }}>
    {!confirmation && <View style={{ gap: 10 }}>
      <AppTextInput density={compact ? 'compact' : 'form'} label="WORKSPACE CODE" required placeholder="Code from your mentor" autoCapitalize="characters" autoCorrect={false} returnKeyType="go" onSubmitEditing={submit} value={code} onChangeText={value => { setCode(value); setError(undefined); op.setMessage(''); }} error={error} editable={!op.busy} />
      <Notice busy={op.busy} text={op.busy ? 'Sending your request…' : op.message} />
    </View>}
  </BayaDialog>;
}
export function LearnerMembershipScreen() {
  const services = useCloudServices();
  const { result, refresh } = useCloudRead(useCallback(() => services.workspaces.memberships(), [services]), true);
  const params = useLocalSearchParams<{ code?: string }>();
  const [joining, setJoining] = useState(false);
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState(false);
  return (
    <FeatureScreen
      title="MY WORKSPACES"
      subtitle="Learn together with your mentor."
      onBack={() => router.replace('/learner/home')}
    >
      <AppButton
        label="JOIN WORKSPACE"
        accessibilityLabel="Join workspace"
        icon="add"
        onPress={() => setJoining(true)}
      />
      <JoinRequestStatus revision={revision} onPendingChange={setPending} onApproved={refresh} suppressApprovedDialog={joining} />
      {!result ? (
        <Notice busy text="Checking your workspaces…" />
      ) : !result.ok ? (
        <>
          <Notice text={failureMessage[result.code]} />
          <AppButton
            label="TRY AGAIN"
            accessibilityLabel="Retry memberships"
            onPress={refresh}
          />
        </>
      ) : result.data.length === 0 ? (
        <Text style={s.notice}>
          {pending ? 'Your request is waiting for mentor approval.' : 'You haven’t joined a workspace yet. Ask your mentor for a code.'}
        </Text>
      ) : (
        result.data.map(({ workspace, membership }) => (
          <BaseCard key={membership.membership_id}>
            <View>
              <Text style={[s.title, { fontSize: 24 }]}>
                {workspace.workspace_name}
              </Text>
              <Text selectable style={s.subtitle}>
                {workspace.workspace_code}
              </Text>
              <Text style={s.notice}>
                {workspace.status !== 'active' ? 'Workspace inactive' : membership.is_active ? 'Joined' : 'Membership inactive'}
              </Text>
            </View>
          </BaseCard>
        ))
      )}
      <JoinWorkspaceForm visible={joining} onClose={() => setJoining(false)} initialCode={typeof params.code === 'string' ? params.code : ''} onSubmitted={() => { void refresh(); setRevision(value => value + 1); }} />
    </FeatureScreen>
  );
}
