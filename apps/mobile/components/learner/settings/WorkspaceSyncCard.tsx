import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Colors,
  FontFamily,
  Radius,
  Shadows,
  Spacing,
} from '../../../constants/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { AppButton } from '../../ui/AppButton';
import { AppIcon } from '../../ui/AppIcon';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { SETTINGS_COPY } from './settingsCopy';
import {
  connectedWorkspaceInfo,
  defaultWorkspaceInfo,
  type WorkspaceInfo,
} from './workspaceSettingsData';

type WorkspaceSyncCardProps = {
  initialInfo?: WorkspaceInfo;
  onJoinPress?: () => void;
  onSyncPress?: () => void;
};

/**
 * Shared workspace management card for BAYA Learner Settings.
 * Supports State A (Independent / No Workspace) and State B (Connected).
 * State A is the initial application state.
 * Status pill acts as a dev/QA toggle for previewing both states.
 */
export function WorkspaceSyncCard({
  initialInfo = defaultWorkspaceInfo,
  onJoinPress,
  onSyncPress,
}: WorkspaceSyncCardProps) {
  const { height, isPhone, isPhoneLandscape } = useResponsiveLayout();
  const isLandscapeCompact = isPhoneLandscape && height <= 500;
  const compact = isPhone || isLandscapeCompact;

  const [workspace, setWorkspace] = useState<WorkspaceInfo>(initialInfo);
  const isConnected = workspace.status === 'connected';

  // Temporary QA switcher: toggle state between none and connected
  const toggleWorkspaceState = () => {
    setWorkspace((prev) =>
      prev.status === 'none' ? connectedWorkspaceInfo : defaultWorkspaceInfo
    );
  };

  const handleJoin = () => {
    if (onJoinPress) {
      onJoinPress();
    } else {
      Alert.alert(
        SETTINGS_COPY.joinDialogTitle,
        SETTINGS_COPY.joinDialogBody
      );
    }
  };

  const handleSync = () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      setWorkspace((prev) => ({
        ...prev,
        lastSyncedText: SETTINGS_COPY.justNow,
      }));
      Alert.alert(SETTINGS_COPY.syncDialogTitle, SETTINGS_COPY.syncDialogBody);
    }
  };

  return (
    <View
      style={[
        styles.card,
        Shadows.card,
        compact && styles.cardCompact,
        isLandscapeCompact && styles.cardLandscapeCompact,
      ]}
      testID="workspace-sync-card"
    >
      {/* ── CARD HEADER ── */}
      <View
        style={[
          styles.cardHeader,
          compact && styles.cardHeaderCompact,
          isLandscapeCompact && styles.cardHeaderLandscapeCompact,
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.avatarContainer,
              compact && styles.avatarContainerCompact,
              isLandscapeCompact && styles.avatarContainerLandscapeCompact,
            ]}
          >
            <AppIcon
              color="accent"
              name="cloud"
              size={isLandscapeCompact ? 'sm' : compact ? 'md' : 'lg'}
            />
          </View>
          <View style={styles.titleColumn}>
            <Text
              style={[
                styles.title,
                compact && styles.titleCompact,
                isLandscapeCompact && styles.titleLandscapeCompact,
              ]}
            >
              {SETTINGS_COPY.workspaceTitle}
            </Text>
            <Text
              style={[
                styles.subtitle,
                compact && styles.subtitleCompact,
                isLandscapeCompact && styles.subtitleLandscapeCompact,
              ]}
            >
              {SETTINGS_COPY.workspaceSubtitle}
            </Text>
          </View>
        </View>

        <ConnectionStatusBadge
          connected={isConnected}
          landscapeCompact={isLandscapeCompact}
          onPress={toggleWorkspaceState}
        />
      </View>

      {/* ── INSET DETAILS BOX ── */}
      <View
        style={[
          styles.detailsBox,
          compact && styles.detailsBoxCompact,
          isLandscapeCompact && styles.detailsBoxLandscapeCompact,
        ]}
      >
        {isConnected ? (
          /* STATE B: CONNECTED WORKSPACE DETAILS */
          <View style={styles.connectedDetails}>
            <View
              style={[
                styles.workspaceInfoRow,
                isLandscapeCompact && styles.workspaceInfoRowLandscapeCompact,
              ]}
            >
              <View style={styles.workspaceNameCol}>
                <Text style={styles.sectionLabel}>{SETTINGS_COPY.workspaceLabel}</Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.workspaceName,
                    isLandscapeCompact && styles.workspaceNameLandscapeCompact,
                  ]}
                >
                  {workspace.workspaceName ?? 'Baybayin Workshop A'}
                </Text>
              </View>

              <View style={styles.workspaceCodeCol}>
                <Text style={[styles.sectionLabel, styles.sectionLabelRight]}>
                  {SETTINGS_COPY.workspaceCodeLabel}
                </Text>
                <View
                  style={[
                    styles.codeBadge,
                    isLandscapeCompact && styles.codeBadgeLandscapeCompact,
                  ]}
                >
                  <Text
                    style={[
                      styles.codeBadgeText,
                      isLandscapeCompact && styles.codeBadgeTextLandscapeCompact,
                    ]}
                  >
                    {workspace.workspaceCode ?? 'BAYA-7K2P'}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.divider,
                isLandscapeCompact && styles.dividerLandscapeCompact,
              ]}
            />

            <View
              style={[
                styles.syncRow,
                isLandscapeCompact && styles.syncRowLandscapeCompact,
              ]}
            >
              <View style={styles.syncStatusLeft}>
                <AppIcon
                  color="success"
                  name="circleCheck"
                  size={isLandscapeCompact ? 14 : 16}
                />
                <Text
                  style={[
                    styles.syncLabel,
                    isLandscapeCompact && styles.syncLabelLandscapeCompact,
                  ]}
                >
                  {SETTINGS_COPY.lastSynchronized}
                </Text>
              </View>
              <Text
                style={[
                  styles.syncValue,
                  isLandscapeCompact && styles.syncValueLandscapeCompact,
                ]}
              >
                {workspace.lastSyncedText ?? SETTINGS_COPY.justNow}
              </Text>
            </View>
          </View>
        ) : (
          /* STATE A: NO WORKSPACE / INDEPENDENT LEARNER */
          <View style={styles.independentDetails}>
            <View style={styles.independentRow}>
              <View style={styles.orangeDot} />
              <Text
                style={[
                  styles.independentHeadline,
                  isLandscapeCompact && styles.independentHeadlineLandscapeCompact,
                ]}
              >
                {SETTINGS_COPY.independentHeadline}
              </Text>
            </View>
            <Text
              style={[
                styles.independentDescription,
                isLandscapeCompact && styles.independentDescriptionLandscapeCompact,
              ]}
            >
              {SETTINGS_COPY.independentDescription}
            </Text>
          </View>
        )}
      </View>

      {/* ── ACTION BUTTON & FOOTER ── */}
      <View
        style={[
          styles.actionArea,
          compact && styles.actionAreaCompact,
          isLandscapeCompact && styles.actionAreaLandscapeCompact,
        ]}
      >
        <AppButton
          accessibilityLabel={isConnected ? SETTINGS_COPY.syncAccessibility : SETTINGS_COPY.joinAccessibility}
          compact
          fullWidth={false}
          icon={isConnected ? 'sync' : 'add'}
          iconPosition="leading"
          label={isConnected ? SETTINGS_COPY.syncNow : SETTINGS_COPY.joinWorkspace}
          onPress={isConnected ? handleSync : handleJoin}
          pill
          style={[
            styles.actionButton,
            compact && styles.actionButtonCompact,
            isLandscapeCompact && styles.actionButtonLandscapeCompact,
          ]}
          tone="primary"
        />

        <Text
          style={[
            styles.footerText,
            isLandscapeCompact && styles.footerTextLandscapeCompact,
          ]}
        >
          {isConnected
            ? SETTINGS_COPY.connectedFooter
            : SETTINGS_COPY.independentFooter}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    maxWidth: 680,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    width: '100%',
  },
  cardCompact: {
    maxWidth: '100%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  cardLandscapeCompact: {
    borderRadius: Radius.lg,
    maxWidth: 540,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    width: '100%',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardHeaderCompact: {
    gap: Spacing.sm,
  },
  cardHeaderLandscapeCompact: {
    gap: Spacing.xs,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: Spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: Colors.roleSecondaryHover,
    borderColor: '#FFD3B5',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarContainerCompact: {
    borderRadius: 10,
    height: 38,
    width: 38,
  },
  avatarContainerLandscapeCompact: {
    borderRadius: 8,
    height: 30,
    width: 30,
  },
  titleColumn: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 19,
    fontWeight: '800',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
  titleCompact: {
    fontSize: 16,
  },
  titleLandscapeCompact: {
    fontSize: 14,
  },
  subtitle: {
    color: Colors.textMuted,
    fontFamily: FontFamily.body,
    fontSize: 13,
    marginTop: 2,
  },
  subtitleCompact: {
    fontSize: 12,
  },
  subtitleLandscapeCompact: {
    fontSize: 10,
    marginTop: 0,
  },
  detailsBox: {
    backgroundColor: '#FAF5EA',
    borderColor: '#EBDDC5',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    width: '100%',
  },
  detailsBoxCompact: {
    marginVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailsBoxLandscapeCompact: {
    borderRadius: Radius.md,
    marginVertical: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  independentDetails: {
    width: '100%',
  },
  independentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  orangeDot: {
    backgroundColor: Colors.rolePrimary,
    borderRadius: Radius.full,
    height: 8,
    width: 8,
  },
  independentHeadline: {
    color: Colors.textPrimary,
    flexShrink: 1,
    fontFamily: FontFamily.rounded,
    fontSize: 15,
    fontWeight: '800',
    includeFontPadding: false,
  },
  independentHeadlineLandscapeCompact: {
    fontSize: 12,
  },
  independentDescription: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    paddingLeft: 16,
  },
  independentDescriptionLandscapeCompact: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
    paddingLeft: 16,
  },
  connectedDetails: {
    width: '100%',
  },
  workspaceInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  workspaceInfoRowLandscapeCompact: {
    alignItems: 'center',
  },
  workspaceNameCol: {
    flexShrink: 1,
    paddingRight: Spacing.sm,
  },
  workspaceCodeCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontFamily: FontFamily.rounded,
    fontSize: 11,
    fontWeight: '800',
    includeFontPadding: false,
    letterSpacing: 0.8,
  },
  sectionLabelRight: {
    textAlign: 'right',
  },
  workspaceName: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 16,
    fontWeight: '800',
    includeFontPadding: false,
    marginTop: 4,
  },
  workspaceNameLandscapeCompact: {
    fontSize: 13,
    marginTop: 2,
  },
  codeBadge: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFD3B5',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  codeBadgeLandscapeCompact: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  codeBadgeText: {
    color: Colors.rolePrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 14,
    fontWeight: '900',
    includeFontPadding: false,
    letterSpacing: 0.8,
  },
  codeBadgeTextLandscapeCompact: {
    fontSize: 11,
  },
  divider: {
    backgroundColor: '#EBDDC5',
    height: 1,
    marginVertical: 12,
    width: '100%',
  },
  dividerLandscapeCompact: {
    marginVertical: 6,
  },
  syncRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  syncRowLandscapeCompact: {
    alignItems: 'center',
  },
  syncStatusLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  syncLabel: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  syncLabelLandscapeCompact: {
    fontSize: 11,
  },
  syncValue: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: '800',
    includeFontPadding: false,
  },
  syncValueLandscapeCompact: {
    fontSize: 11,
  },
  actionArea: {
    alignItems: 'center',
    width: '100%',
  },
  actionAreaCompact: {
    marginTop: Spacing.xs,
  },
  actionAreaLandscapeCompact: {
    marginTop: 2,
  },
  actionButton: {
    alignSelf: 'center',
    height: 52,
    maxHeight: 54,
    maxWidth: 360,
    minHeight: 48,
    minWidth: 0,
    width: '100%',
  },
  actionButtonCompact: {
    height: 50,
    maxHeight: 52,
    maxWidth: 300,
    minHeight: 48,
    minWidth: 0,
    width: '100%',
  },
  actionButtonLandscapeCompact: {
    height: 48,
    maxHeight: 50,
    maxWidth: 290,
    minHeight: 46,
    minWidth: 240,
    width: '65%',
  },
  footerText: {
    alignSelf: 'center',
    color: Colors.textMuted,
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    maxWidth: 340,
    marginTop: 10,
    textAlign: 'center',
  },
  footerTextLandscapeCompact: {
    fontSize: 10,
    lineHeight: 13,
    maxWidth: 320,
    marginTop: 4,
  },
});
