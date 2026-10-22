import React, { useCallback, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  useCloudServices,
  failureMessage,
  type Result,
  type WorkspaceSummary,
} from '../../modules/cloud/services';
import { useOperation } from '../../modules/cloud/useOperation';
import { nameError } from '../../modules/cloud/validation';
import { AppButton } from '../ui/AppButton';
import { AppTextInput } from '../ui/AppTextInput';
import { AppIcon } from '../ui/AppIcon';
import { BaseCard } from '../ui/cards/BaseCard';
import { FeatureScreen, Notice, TextAction, s } from './FeatureScreen';
import { WorkspaceCard } from './WorkspaceCard';
/** Route guard is presentation only; adapters must separately authorize every operation. */
export function MentorBoundary({ children }: React.PropsWithChildren) {
  const services = useCloudServices();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      // A retry invalidates this focused request, including its stale response.
      void retry;
      let active = true;
      setState('loading');
      void services.auth
        .session()
        .then((result) => {
          if (!active) return;
          if (result.ok && result.data) setState('ready');
          else {
            setState('error');
            setMessage(
              result.ok
                ? 'Please log in to access your workspaces.'
                : failureMessage[result.code],
            );
          }
        })
        .catch(() => {
          if (active) {
            setState('error');
            setMessage(failureMessage.network);
          }
        });
      return () => {
        active = false;
      };
    }, [services, retry]),
  );
  if (state === 'ready') return <>{children}</>;
  return (
    <FeatureScreen
      title="MENTOR WORKSPACES"
      subtitle="Access your learner workspaces."
      onBack={() => router.replace('/')}
    >
      <Notice
        busy={state === 'loading'}
        text={state === 'loading' ? 'Checking your session…' : message}
      />
      {state === 'error' && (
        <>
          <AppButton
            label="TRY AGAIN"
            accessibilityLabel="Retry session"
            onPress={() => setRetry((n) => n + 1)}
          />
          <TextAction
            label="Go to Mentor Login"
            onPress={() => router.replace('/mentor')}
          />
        </>
      )}
    </FeatureScreen>
  );
}
function useWorkspaceLoad<T>(load: () => Promise<Result<T>>) {
  const [result, setResult] = useState<Result<T>>();
  const [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      // A retry invalidates this focused request, including its stale response.
      void retry;
      let active = true;
      setResult(undefined);
      void load()
        .then((value) => {
          if (active) setResult(value);
        })
        .catch(() => {
          if (active) setResult({ ok: false, code: 'network' });
        });
      return () => {
        active = false;
      };
    }, [load, retry]),
  );
  return { result, retry: () => setRetry((n) => n + 1) };
}
export function WorkspaceSelectionScreen() {
  const services = useCloudServices();
  const logout = useOperation();
  const { width } = useWindowDimensions();
  const { result, retry } = useWorkspaceLoad(
    useCallback(() => services.workspaces.listOwned(), [services]),
  );
  return (
    <FeatureScreen
      wide
      card={false}
      title="Choose Workspace"
      subtitle="Select a workspace to manage learner progress."
      onBack={() => router.replace('/')}
      footer={services.auth.signOut ? <>
        <Notice text={logout.message} busy={logout.busy} />
        <TextAction label="Log out" disabled={logout.busy} onPress={() => {
          void logout.run(() => services.auth.signOut!(), () => router.replace('/mentor'));
        }} />
      </> : undefined}
    >
      {!result ? (
        <Notice busy text="Loading your workspaces…" />
      ) : !result.ok ? (
        <>
          <Notice text={failureMessage[result.code]} />
          <AppButton
            label="TRY AGAIN"
            accessibilityLabel="Retry workspaces"
            onPress={retry}
          />
          <TextAction
            label="Go to Mentor Login"
            onPress={() => router.replace('/mentor')}
          />
        </>
      ) : result.data.length === 0 ? (
        <WorkspaceEmptyState
          onCreate={() => router.push('/mentor/workspaces/create')}
        />
      ) : (
        <>
          <View
            style={[
              s.row,
              {
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              },
            ]}
          >
            <Text style={s.notice}>
              MY WORKSPACES ·{' '}
              {result.data.filter((w) => w.status === 'active').length} Active
            </Text>
            <AppButton
              fullWidth={false}
              label="CREATE WORKSPACE"
              accessibilityLabel="Create workspace"
              icon="add"
              onPress={() => router.push('/mentor/workspaces/create')}
            />
          </View>
          <View style={s.row}>
            {result.data.map((workspace) => (
              <View
                key={workspace.workspace_id}
                style={{ width: width >= 1000 ? '48%' : '100%' }}
              >
                <WorkspaceCard
                  workspace={workspace}
                  onManage={() => router.push({ pathname: '/mentor/workspaces/manage', params: { id: workspace.workspace_id } })}
                  onEnter={() =>
                    router.push({
                      pathname: '/mentor/workspaces/[id]',
                      params: { id: workspace.workspace_id },
                    })
                  }
                />
              </View>
            ))}
          </View>
        </>
      )}
    </FeatureScreen>
  );
}
export function WorkspaceEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <BaseCard
      style={[
        s.card,
        {
          maxWidth: 850,
          width: '100%',
          alignSelf: 'center',
          alignItems: 'center',
          marginVertical: 30,
        },
      ]}
    >
      <AppIcon name="workspace" color="accent" size={48} />
      <Text style={[s.title, { fontSize: 28 }]}>No Workspace Created Yet</Text>
      <Text style={s.subtitle}>
        Create a workspace to start managing learner progress and activities.
      </Text>
      <AppButton
        label="CREATE WORKSPACE"
        accessibilityLabel="Create workspace"
        icon="add"
        style={s.action}
        onPress={onCreate}
      />
    </BaseCard>
  );
}
export function CreateWorkspaceScreen() {
  const services = useCloudServices();
  const op = useOperation();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  return (
    <FeatureScreen
      icon={<AppIcon name="workspace" color="accent" size={40} />}
      title="CREATE WORKSPACE"
      subtitle="Create a workspace for your learners."
      onBack={() => router.replace('/mentor/workspaces')}
    >
      <AppTextInput
        density="form"
        required
        label="WORKSPACE NAME"
        placeholder="e.g. Baybayin Workshop"
        value={name}
        onChangeText={setName}
        error={error}
        editable={!op.busy}
        autoCapitalize="words"
      />
      <AppTextInput
        density="form"
        label="WORKSPACE CODE"
        value="Generated when workspace is created"
        editable={false}
        helperText="Auto ID Generator · Share this code with your learners after creation."
      />
      <Notice busy={op.busy} text={op.message} />
      <AppButton
        label={op.busy ? 'CREATING…' : 'CREATE WORKSPACE'}
        accessibilityLabel="Create workspace"
        icon="arrowRight"
        disabled={op.busy}
        onPress={() => {
          const issue = nameError(name, services.policy);
          setError(issue);
          if (issue) return;
          void op.run(
            () => services.workspaces.create(name.trim()),
            (workspace) =>
              router.replace({
                pathname: '/mentor/workspaces/[id]',
                params: { id: workspace.workspace_id },
              }),
          );
        }}
      />
    </FeatureScreen>
  );
}
export function WorkspaceDetailsScreen({ id }: { id: string }) {
  const services = useCloudServices();
  const { result, retry } = useWorkspaceLoad<WorkspaceSummary>(
    useCallback(() => services.workspaces.details(id), [services, id]),
  );
  return (
    <FeatureScreen
      card={false}
      title="Workspace Details"
      subtitle="Share the workspace code with your learners."
      onBack={() => router.replace('/mentor/workspaces')}
    >
      {!result ? (
        <Notice busy text="Loading workspace…" />
      ) : !result.ok ? (
        <>
          <Notice text={failureMessage[result.code]} />
          <AppButton
            label="TRY AGAIN"
            accessibilityLabel="Retry workspace details"
            onPress={retry}
          />
        </>
      ) : (
        <WorkspaceCard workspace={result.data} />
      )}
    </FeatureScreen>
  );
}
