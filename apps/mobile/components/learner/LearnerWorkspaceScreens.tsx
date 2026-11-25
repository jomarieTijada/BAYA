import { Text } from '../../localization/components';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { JoinRequestStatus } from './JoinRequestStatus';
import React, { useCallback, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View, useWindowDimensions } from 'react-native';
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
  return <Redirect href={(() => {
    if (typeof code === 'string') {
      return { pathname: '/learner/workspaces', params: { code } };
    } else {
      return '/learner/workspaces';
    }
  })()} />;
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
      void op.run(() => {
        if (services.workspaces.requestJoin) {
          return services.workspaces.requestJoin(normalizeCode(code));
        } else {
          return Promise.resolve({ ok: false as const, code: 'unavailable' as const });
        }
      }, result => {
        setConfirmation((() => {
          if (result.kind === 'already_member') {
            return 'member';
          } else {
            if (result.kind === 'already_pending') {
              return 'pending';
            } else {
              return 'sent';
            }
          }
        })());
        setCode(''); onSubmitted();
      });
  };
  return <BayaDialog visible={visible} variant={(() => {
    if (!confirmation) {
      return 'form';
    } else {
      if (confirmation === 'member') {
        return 'success';
      } else {
        return 'information';
      }
    }
  })()} icon="workspace"
    title={(() => {
      if (!confirmation) {
        return 'JOIN WORKSPACE';
      } else {
        if (confirmation === 'member') {
          return 'WORKSPACE JOINED!';
        } else {
          if (confirmation === 'pending') {
            return 'WAITING FOR APPROVAL';
          } else {
            return 'JOIN REQUEST SENT!';
          }
        }
      }
    })()}
    description={(() => {
      if (!confirmation) {
        return 'Enter the workspace code given by your mentor.';
      } else {
        if (confirmation === 'member') {
          return 'You are now connected to your mentor’s workspace.';
        } else {
          return 'Your mentor will review your request.';
        }
      }
    })()}
    detail={(() => {
      if (confirmation) {
        if (confirmation === 'member') {
          return 'Your workspace is available in My Workspaces.';
        } else {
          return 'You can keep learning while you wait.';
        }
      } else {
        return undefined;
      }
    })()}
    closeLabel={(() => {
      if (!confirmation) {
        return 'Close join workspace';
      } else {
        return undefined;
      }
    })()} onDismiss={close}
    primaryAction={(() => {
      if (confirmation) {
        return { label: (() => {
      if (confirmation === 'member') {
        return 'MY WORKSPACES';
      } else {
        return 'CONTINUE LEARNING';
      }
    })(), onPress: () => { close(); if (confirmation !== 'member') router.replace('/learner/home'); } };
      } else {
        return { label: 'JOIN WORKSPACE', loading: op.busy, onPress: submit };
      }
    })()}>
    {!confirmation && <View style={{ gap: 10 }}>
      <AppTextInput density={(() => {
        if (compact) {
          return 'compact';
        } else {
          return 'form';
        }
      })()} label="WORKSPACE CODE" required placeholder="Code from your mentor" autoCapitalize="characters" autoCorrect={false} returnKeyType="go" onSubmitEditing={submit} value={code} onChangeText={value => { setCode(value); setError(undefined); op.setMessage(''); }} error={error} editable={!op.busy} />
      <Notice busy={op.busy} text={(() => {
        if (op.busy) {
          return 'Sending your request…';
        } else {
          return op.message;
        }
      })()} />
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
        compact density="compact" fullWidth={false} style={{ minHeight: 36, height: 36, paddingVertical: 4, alignSelf: 'center' }} labelStyle={{ fontSize: 13 }}
        label="JOIN WORKSPACE"
        accessibilityLabel="Join workspace"
        icon="add"
        onPress={() => setJoining(true)}
      />
      <JoinRequestStatus revision={revision} onPendingChange={setPending} onApproved={refresh} suppressApprovedDialog={joining} />
      {(() => {
        if (!result) {
          return (
        <Notice busy text="Checking your workspaces…" />
      );
        } else {
          if (!result.ok) {
            return (
        <>
          <Notice text={failureMessage[result.code]} />
          <AppButton
            label="TRY AGAIN"
            accessibilityLabel="Retry memberships"
            onPress={refresh}
          />
        </>
      );
          } else {
            if (result.data.length === 0) {
              return (
        <Text style={s.notice}>
          {(() => {
            if (pending) {
              return 'Your request is waiting for mentor approval.';
            } else {
              return 'You haven’t joined a workspace yet. Ask your mentor for a code.';
            }
          })()}
        </Text>
      );
            } else {
              return (
        result.data.map(({ workspace, membership }) => (
          <BaseCard key={membership.membership_id}>
            <View>
              <Text style={[s.title, { fontSize: 24 }]} verbatim>
                {workspace.workspace_name}
              </Text>
              <Text selectable style={s.subtitle} verbatim>
                {workspace.workspace_code}
              </Text>
              <Text style={s.notice}>
                {(() => {
                  if (workspace.status !== 'active') {
                    return 'Workspace inactive';
                  } else {
                    if (membership.is_active) {
                      return 'Joined';
                    } else {
                      return 'Membership inactive';
                    }
                  }
                })()}
              </Text>
            </View>
          </BaseCard>
        ))
      );
            }
          }
        }
      })()}
      <JoinWorkspaceForm visible={joining} onClose={() => setJoining(false)} initialCode={(() => {
        if (typeof params.code === 'string') {
          return params.code;
        } else {
          return '';
        }
      })()} onSubmitted={() => { void refresh(); setRevision(value => value + 1); }} />
    </FeatureScreen>
  );
}
