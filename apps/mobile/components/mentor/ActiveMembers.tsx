import { Text } from '../../localization/components';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { failureMessage, useCloudServices, type Result, type WorkspaceMember } from '../../modules/cloud/services';
import { useOperation } from '../../modules/cloud/useOperation';
import { AppButton } from './MentorButton';
import { AppIcon } from '../ui/AppIcon';
import { BaseCard } from '../ui/cards/BaseCard';
import { BayaDialog } from '../ui/BayaDialog';
import { useBayaToast } from '../ui/BayaNotifications';
import { Notice, TextAction } from './FeatureScreen';
import { WorkspaceSection, ws } from './WorkspaceSection';

export function ActiveMembers({ workspaceId, result, refresh }: {
  workspaceId: string; result?: Result<WorkspaceMember[]>; refresh: () => void;
}) {
  let active: WorkspaceMember[];
  if (result?.ok) {
    active = result.data.filter(member => member.active);
  } else {
    active = [];
  }
  let removed: WorkspaceMember[];
  if (result?.ok) {
    removed = result.data.filter(member => !member.active);
  } else {
    removed = [];
  }
  return <WorkspaceSection compact title="Active Members" icon="workspace" description="Manage access for learners in this workspace." badge={(() => {
    if (result?.ok) {
      return `${active.length} Active`;
    } else {
      return undefined;
    }
  })()}>
    {(() => {
      if (!result) {
        return <Notice busy text="Loading learners…" />;
      } else {
        if (!result.ok) {
          return <><Notice text={failureMessage[result.code]} /><TextAction label="Retry learners" onPress={refresh} /></>;
        } else {
          return <>
      {active.length === 0 && <Text style={ws.description}>No active members. Approved learners will appear here.</Text>}
      {active.map(member => <MemberController key={member.profileId} member={member} workspaceId={workspaceId} refresh={refresh} />)}
      {removed.length > 0 && <Text accessibilityRole="header" style={ws.eyebrow}>Removed members</Text>}
      {removed.map(member => <MemberController key={member.profileId} member={member} workspaceId={workspaceId} refresh={refresh} />)}
    </>;
        }
      }
    })()}
  </WorkspaceSection>;
}

function MemberController({ member, workspaceId, refresh }: { member: WorkspaceMember; workspaceId: string; refresh: () => void }) {
  const services = useCloudServices();
  const op = useOperation();
  const toast = useBayaToast();
  const [confirm, setConfirm] = useState(false);
  const name = member.displayName?.trim() || 'Unnamed learner';
  const changeAccess = () => {
    void op.run(() => {
      if (services.workspaces.setMemberActive) {
        return services.workspaces.setMemberActive(workspaceId, member.profileId, !member.active);
      } else {
        return Promise.resolve({ ok: false as const, code: 'unavailable' as const });
      }
    }, () => {
      setConfirm(false);
      toast((() => {
        if (member.active) {
          return 'Workspace access removed.';
        } else {
          return 'Workspace access restored.';
        }
      })());
      refresh();
    });
  };
  return <>
    <MemberRow name={name} active={member.active} busy={op.busy} onPress={() => { op.setMessage(''); setConfirm(true); }} />
    <BayaDialog visible={confirm} variant="confirmation" icon="personFilled"
      title={(() => {
        if (member.active) {
          return 'Remove learner?';
        } else {
          return 'Restore access?';
        }
      })()}
      description={(() => {
        if (member.active) {
          return `Remove ${name} from this workspace?`;
        } else {
          return `Restore ${name}’s access to this workspace?`;
        }
      })()}
      detail={op.message || 'Their saved learning progress will be preserved.'}
      onDismiss={() => { if (!op.busy) setConfirm(false); }}
      primaryAction={{ label: (() => {
        if (member.active) {
          return 'REMOVE ACCESS';
        } else {
          return 'RESTORE ACCESS';
        }
      })(), loading: op.busy, onPress: changeAccess }}
      secondaryAction={{ label: 'CANCEL', onPress: () => setConfirm(false) }} />
  </>;
}

function MemberRow({ name, active, busy, onPress }: { name: string; active: boolean; busy: boolean; onPress: () => void }) {
  return <BaseCard style={[ws.compactRow, styles.row]}>
    <View style={styles.identity}><AppIcon name="personFilled" color="accent" size={22} /><Text style={[ws.name, ws.compactName, { flex: 1 }]} verbatim>{name}</Text></View>
    <View style={styles.actions}>
      <Text style={ws.badge}>{(() => {
        if (active) {
          return 'Active';
        } else {
          return 'Removed';
        }
      })()}</Text>
      <AppButton density="landscapeCompact" compact fullWidth={false} tone="outlinePrimary" label={(() => {
        if (active) {
          return 'Remove';
        } else {
          return 'Restore';
        }
      })()}
        accessibilityLabel={`${(() => {
          if (active) {
            return 'Remove';
          } else {
            return 'Restore';
          }
        })()} workspace access for ${name}`} disabled={busy} onPress={onPress} style={ws.compactButton} />
    </View>
  </BaseCard>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 8, paddingVertical: 10 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8, flexGrow: 1, flexShrink: 1, flexBasis: 120, minWidth: 0 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginLeft: 'auto' },
});
