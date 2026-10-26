import { useBayaToast } from '../ui/BayaNotifications';
import React, { useState } from 'react';
import { Platform, Pressable, Share, Text, View } from 'react-native';
import { BaseCard } from '../ui/cards/BaseCard';
import { AppButton } from '../ui/AppButton';
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
      style={[s.card, { padding: 24, borderRadius: 28, flex: 1, gap: 18 }]}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <AppIcon name="workspace" color="accent" size={30} />
        <Text
          accessibilityRole="header"
          style={[s.title, { fontSize: 25, textAlign: 'left', flex: 1 }]}
        >
          {workspace.workspace_name}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: FontFamily.body,
          color:
            workspace.status === 'active'
              ? Colors.success
              : Colors.textSecondary,
          fontSize: 18,
        }}
      >
        {workspace.status === 'active' ? '● Active' : workspace.status}
      </Text>
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: 12,
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
            fontSize: 20,
            fontWeight: '700',
            color: Colors.textPrimary,
          }}
        >
          CODE: {workspace.workspace_code}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            Platform.OS === 'web' ? 'Copy code' : 'Share code'
          }
          onPress={() => {
            void copy();
          }}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="copy" color="accent" />
        </Pressable>
      </View>
      {workspace.learnerCount !== undefined && (
        <Text style={s.notice}>{workspace.learnerCount} Learners</Text>
      )}
      {workspace.pendingCount !== undefined && <Text style={s.notice}>{workspace.pendingCount} Pending Requests</Text>}
      {workspace.lastSyncedAt &&
        !Number.isNaN(Date.parse(workspace.lastSyncedAt)) && (
          <Text style={s.notice}>
            Last synced: {new Date(workspace.lastSyncedAt).toLocaleString()}
          </Text>
        )}
      <Notice text={feedback} />
      {onManage && <TextAction label="Manage workspace" onPress={onManage} />}
      {onEnter && workspace.status === 'active' && (
        <AppButton
          label="ENTER"
          accessibilityLabel={`Enter ${workspace.workspace_name}`}
          icon="arrowRight"
          onPress={onEnter}
        />
      )}
    </BaseCard>
  );
}
