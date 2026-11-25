import { useLocalization } from '../../localization/LocalizationProvider';
import { localeFor } from '../../localization/core';
import { Pressable, Text } from '../../localization/components';
import { useBayaToast } from '../ui/BayaNotifications';
import React, { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { BaseCard } from '../ui/cards/BaseCard';
import { AppButton } from './MentorButton';
import { AppIcon } from '../ui/AppIcon';
import { Colors, FontFamily } from '../../constants/theme';
import type { WorkspaceSummary } from '../../modules/cloud/services';
import { Notice, TextAction, s } from './FeatureScreen';
export function WorkspaceCard({
  workspace,
  onEnter,
  onManage,
}: {
  workspace: WorkspaceSummary;
  onEnter?: () => void;
  onManage?: () => void;
}) {
  const { language } = useLocalization();
  const toast = useBayaToast();
  const [feedback, setFeedback] = useState('');
  const copy = async () => {
    try {
      if (Platform.OS === 'web') {
        if (!globalThis.navigator?.clipboard) {
          setFeedback('Select and copy the code below.');
          return;
        }
        await navigator.clipboard.writeText(workspace.workspace_code);
        toast('Workspace code copied.');
      } else {
        await Share.share({ message: workspace.workspace_code });
      }
    } catch {
      setFeedback('Couldn’t copy the code. Select it below to copy.');
    }
  };
  return (
    <BaseCard
      style={[s.card, { padding: 10, borderRadius: 16, gap: 4 }]}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <AppIcon name="workspace" color="accent" size={22} />
        <Text
          accessibilityRole="header"
          style={[s.title, { fontSize: 13, textAlign: 'left', flex: 1 }]}
         verbatim>
          {workspace.workspace_name}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: FontFamily.body,
          color:
            (() => {
              if (workspace.status === 'active') {
                return Colors.success;
              } else {
                return Colors.textSecondary;
              }
            })(),
          fontSize: 13,
        }}
      >
        {(() => {
          if (workspace.status === 'active') {
            return '● Active';
          } else {
            return workspace.status;
          }
        })()}
      </Text>
      {workspace.learner_capacity !== undefined && <Text style={s.notice}>{workspace.learnerCount ?? 0} / {workspace.learner_capacity} learners</Text>}
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: 6,
          backgroundColor: Colors.background,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text
          selectable
          style={{
            fontFamily: FontFamily.rounded,
            flex: 1,
            fontSize: 13,
            fontWeight: '700',
            color: Colors.textPrimary,
          }}
         verbatim>
          CODE: {workspace.workspace_code}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            (() => {
              if (Platform.OS === 'web') {
                return 'Copy code';
              } else {
                return 'Share code';
              }
            })()
          }
          onPress={() => {
            void copy();
          }}
          style={{
            minWidth: 32,
            minHeight: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="copy" color="accent" />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {workspace.learner_capacity === undefined && workspace.learnerCount !== undefined && (
        <Text style={s.notice}>{workspace.learnerCount} Learners</Text>
      )}
      {workspace.pendingCount !== undefined && <Text style={s.notice}>{workspace.pendingCount} Pending Requests</Text>}
      </View>
      {workspace.lastSyncedAt &&
        !Number.isNaN(Date.parse(workspace.lastSyncedAt)) && (
          <Text style={s.notice}>
            Last synced: {new Date(workspace.lastSyncedAt).toLocaleString(localeFor(language))}
          </Text>
        )}
      <Notice text={feedback} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      {onManage && <TextAction label="Manage workspace" onPress={onManage} />}
      {onEnter && workspace.status === 'active' && (
        <AppButton density="landscapeCompact" compact
          fullWidth={false}
          label="ENTER"
          accessibilityLabel={`Enter ${workspace.workspace_name}`}
          icon="arrowRight"
          onPress={onEnter}
        />
      )}
      </View>
    </BaseCard>
  );
}
