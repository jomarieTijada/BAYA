import React, { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import {
  useCloudServices,
  failureMessage,
  type JoinedWorkspace,
  type Result,
} from '../../modules/cloud/services';
import { useOperation } from '../../modules/cloud/useOperation';
import { codeError, normalizeCode } from '../../modules/cloud/validation';
import { AppTextInput } from '../ui/AppTextInput';
import { AppButton } from '../ui/AppButton';
import { FeatureScreen, Notice, s } from '../mentor/FeatureScreen';
import { BaseCard } from '../ui/cards/BaseCard';
import { LearnerCloudAccount } from './LearnerCloudAccount';
export function LearnerJoinWorkspaceScreen() {
  return <LearnerCloudAccount><JoinWorkspaceForm /></LearnerCloudAccount>;
}
function JoinWorkspaceForm() {
  const services = useCloudServices();
  const op = useOperation();
  const sync = useOperation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [joined, setJoined] = useState<JoinedWorkspace>();
  return (
    <FeatureScreen
      title={joined ? 'YOU’RE CONNECTED!' : 'JOIN WORKSPACE'}
      subtitle={
        joined
          ? joined.alreadyJoined
            ? 'You already belong to this workspace.'
            : 'Your mentor’s workspace is ready for you.'
          : 'Ask your mentor for a workspace code. Enter it below.'
      }
      onBack={() => router.replace('/learner/workspaces')}
    >
      {joined ? (
        <>
          <Text style={s.title}>{joined.workspace.workspace_name}</Text>
          <Text selectable style={s.subtitle}>
            {joined.workspace.workspace_code}
          </Text>
          <Notice busy={sync.busy} text={sync.message} />
          <AppButton label="WORKSPACE & SYNC" accessibilityLabel="Open workspace sync settings" onPress={() => router.push('/learner/settings')} />
          <AppButton
            label="MY WORKSPACES"
            accessibilityLabel="My workspaces"
            onPress={() => router.replace('/learner/workspaces')}
          />
        </>
      ) : (
        <>
          <AppTextInput
            density="form"
            label="WORKSPACE CODE"
            required
            placeholder="Code from your mentor"
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
            error={error}
            editable={!op.busy}
          />
          <Notice busy={op.busy} text={op.message} />
          <AppButton
            label={op.busy ? 'JOINING…' : 'JOIN WORKSPACE'}
            accessibilityLabel="Join workspace"
            icon="arrowRight"
            disabled={op.busy}
            onPress={() => {
              const issue = codeError(code, services.policy);
              setError(issue);
              if (issue) return;
              void op.run(
                () => services.workspaces.join(normalizeCode(code)),
                (membership) => {
                  setJoined(membership);
                  void sync.run(() => services.progress.sync(), () => sync.setMessage('Learning progress synchronized.'));
                },
              );
            }}
          />
        </>
      )}
    </FeatureScreen>
  );
}
export function LearnerMembershipScreen() {
  const services = useCloudServices();
  const [result, setResult] = useState<Result<JoinedWorkspace[]>>();
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      // A retry invalidates this focused request, including its stale response.
      void retry;
      let active = true;
      setResult(undefined);
      void services.workspaces
        .memberships()
        .then((data) => {
          if (active) setResult(data);
        })
        .catch(() => {
          if (active) setResult({ ok: false, code: 'network' });
        });
      return () => {
        active = false;
      };
    }, [services, retry]),
  );
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
        onPress={() => router.push('/learner/workspaces/join')}
      />
      {!result ? (
        <Notice busy text="Checking your workspaces…" />
      ) : !result.ok ? (
        <>
          <Notice text={failureMessage[result.code]} />
          <AppButton
            label="TRY AGAIN"
            accessibilityLabel="Retry memberships"
            onPress={() => setRetry((n) => n + 1)}
          />
        </>
      ) : result.data.length === 0 ? (
        <Text style={s.notice}>
          You haven’t joined a workspace yet. Ask your mentor for a code.
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
    </FeatureScreen>
  );
}
