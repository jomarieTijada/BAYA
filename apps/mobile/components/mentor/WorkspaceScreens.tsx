import { MentorSessionRevisionContext } from '../../modules/cloud/mentorSessionRevision';
import { Text } from '../../localization/components';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { useBayaToast } from '../ui/BayaNotifications';
import React, { useCallback, useContext, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  useCloudServices,
  failureMessage,
  type WorkspaceSummary,
} from '../../modules/cloud/services';
import { useOperation } from '../../modules/cloud/useOperation';
import { nameError, capacityError } from '../../modules/cloud/validation';
import { AppButton } from './MentorButton';
import { AppTextInput } from '../ui/AppTextInput';
import { AppIcon } from '../ui/AppIcon';
import { BaseCard } from '../ui/cards/BaseCard';
import { FeatureScreen, Notice, TextAction, s } from './FeatureScreen';
import { WorkspaceCard } from './WorkspaceCard';
import { MentorActionMenu } from './MentorActionMenu';
/** Route guard is presentation only; adapters must separately authorize every operation. */
export function MentorBoundary({ children }: React.PropsWithChildren) {
  const services = useCloudServices();
  const sessionRevision = useContext(MentorSessionRevisionContext);
  const [authorizedRevision, setAuthorizedRevision] = useState(-1);
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
          if (result.ok && result.data) { setAuthorizedRevision(sessionRevision); setState('ready'); }
          else {
            setState('error');
            setMessage(
              (() => {
                if (result.ok) {
                  return 'Please log in to access your workspaces.';
                } else {
                  return failureMessage[result.code];
                }
              })(),
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
        setState('loading');
      };
    }, [services, retry, sessionRevision]),
  );
  if (state === 'ready' && authorizedRevision === sessionRevision) return <>{children}</>;
  return (
    <FeatureScreen
      title="MENTOR WORKSPACES"
      subtitle="Access your learner workspaces."
      onBack={() => router.replace('/')}
    >
      <Notice
        busy={state === 'loading'}
        text={(() => {
          if (state === 'loading') {
            return 'Checking your session…';
          } else {
            return message;
          }
        })()}
      />
      {state === 'error' && (
        <>
          <AppButton density="landscapeCompact" compact
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
export function WorkspaceSelectionScreen() {
  const services = useCloudServices();
  const { width } = useWindowDimensions();
  const { result, refresh: retry } = useCloudRead(
    useCallback(() => services.workspaces.listOwned(), [services]),
  );
  return (
    <FeatureScreen
      wide
      card={false}
      title="Choose Workspace"
      subtitle="Select a workspace to manage learner progress."
      action={<MentorActionMenu />}
    >
      {(() => {
        if (!result) {
          return (
        <Notice busy text="Loading your workspaces…" />
      );
        } else {
          if (!result.ok) {
            return (
        <>
          <Notice text={failureMessage[result.code]} />
          <AppButton density="landscapeCompact" compact
            label="TRY AGAIN"
            accessibilityLabel="Retry workspaces"
            onPress={retry}
          />
          <TextAction
            label="Go to Mentor Login"
            onPress={() => router.replace('/mentor')}
          />
        </>
      );
          } else {
            if (result.data.length === 0) {
              return (
        <WorkspaceEmptyState
          onCreate={() => router.push('/mentor/workspaces/create')}
        />
      );
            } else {
              return (
        <>
          <View
            style={[
              s.row,
              {
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              },
            ]}
          >
            <Text style={s.notice}>
              MY WORKSPACES ·{' '}
              {result.data.filter((w) => w.status === 'active').length} Active
            </Text>
            <AppButton density="landscapeCompact" compact
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
                style={{ width: (() => {
                  if (width >= 600) {
                    return '48%';
                  } else {
                    return '100%';
                  }
                })() }}
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
      );
            }
          }
        }
      })()}
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
          marginVertical: 8,
        },
      ]}
    >
      <AppIcon name="workspace" color="accent" size={28} />
      <Text style={[s.title, { fontSize: 20 }]}>No Workspace Created Yet</Text>
      <Text style={s.subtitle}>
        Create a workspace to start managing learner progress and activities.
      </Text>
      <AppButton density="landscapeCompact" compact
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
  const toast = useBayaToast();
  const services = useCloudServices();
  const op = useOperation();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('30');
  const [capacityIssue, setCapacityIssue] = useState<string>();
  const [error, setError] = useState<string>();
  return (
    <FeatureScreen
      title="CREATE WORKSPACE"
      subtitle="Create a workspace for your learners."
      onBack={() => router.replace('/mentor/workspaces')}
    >
      <AppTextInput
        density="landscapeCompact"
        required
        label="WORKSPACE NAME"
        placeholder="e.g. Baybayin Workshop"
        value={name}
        onChangeText={setName}
        error={error}
        editable={!op.busy}
        autoCapitalize="words"
      />
      <AppTextInput density="landscapeCompact" label="LEARNER CAPACITY" required value={capacity} onChangeText={setCapacity} keyboardType="number-pad" error={capacityIssue} editable={!op.busy} helperText="Maximum number of active learners." />
      <Text style={s.notice}>A workspace code is generated after creation.</Text>
      <Notice busy={op.busy} text={op.message} />
      <AppButton density="landscapeCompact" compact
        label={(() => {
          if (op.busy) {
            return 'CREATING…';
          } else {
            return 'CREATE WORKSPACE';
          }
        })()}
        accessibilityLabel="Create workspace"
        icon="arrowRight"
        disabled={op.busy}
        onPress={() => {
          const issue = nameError(name, services.policy);
          setError(issue);
          const capacityProblem = capacityError(capacity); setCapacityIssue(capacityProblem);
          if (issue || capacityProblem) return;
          void op.run(
            () => services.workspaces.create(name.trim(), Number(capacity)),
            (workspace) => {
              toast('Workspace created.');
              router.replace({
                pathname: '/mentor/workspaces/[id]',
                params: { id: workspace.workspace_id },
              }); },
          );
        }}
      />
    </FeatureScreen>
  );
}
export function WorkspaceDetailsScreen({ id }: { id: string }) {
  const services = useCloudServices();
  const { result, refresh: retry } = useCloudRead<WorkspaceSummary>(
    useCallback(() => services.workspaces.details(id), [services, id]),
  );
  return (
    <FeatureScreen
      card={false}
      title="Workspace Details"
      subtitle="Share the workspace code with your learners."
      onBack={() => router.replace('/mentor/workspaces')}
    >
      {(() => {
        if (!result) {
          return (
        <Notice busy text="Loading workspace…" />
      );
        } else {
          if (!result.ok) {
            return (
        <>
          <Notice text={failureMessage[result.code]} />
          <AppButton density="landscapeCompact" compact
            label="TRY AGAIN"
            accessibilityLabel="Retry workspace details"
            onPress={retry}
          />
        </>
      );
          } else {
            return (
        <WorkspaceCard workspace={result.data} />
      );
          }
        }
      })()}
    </FeatureScreen>
  );
}
