import React, { useState } from 'react';
import {
  Alert,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Colors,
  FontFamily,
  LayoutTokens,
  Radius,
  Spacing,
} from '../../../constants/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { AppIcon } from '../../ui/AppIcon';
import { XpProgress } from './XpProgress';
import type { LearnerHomeViewModel } from './learnerHomeDemo';

const LearnerHeaderMetrics = LayoutTokens.headerMetrics;

type LearnerHeaderProps = {
  learner: LearnerHomeViewModel['learner'];
  onOpenSettings: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function LearnerHeader({ learner, onOpenSettings, onLayout }: LearnerHeaderProps) {
  const { isCompactHeight, isPhone, isPhoneLandscape, isPhonePortrait } = useResponsiveLayout();
  const compact = isPhone || isCompactHeight;
  const landscapeCompact = isPhoneLandscape;
  const metrics = landscapeCompact
    ? LearnerHeaderMetrics.landscapeCompact
    : compact
      ? LearnerHeaderMetrics.compact
      : LearnerHeaderMetrics.regular;
  const [joinFocused, setJoinFocused] = useState(false);
  const [joinHovered, setJoinHovered] = useState(false);
  const [settingsFocused, setSettingsFocused] = useState(false);
  const [settingsHovered, setSettingsHovered] = useState(false);

  const showWorkspaceNotice = () => {
    Alert.alert('Join Workspace', 'Joining a workspace will be available in the next update.');
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.header,
        compact && styles.headerCompact,
        landscapeCompact && styles.headerLandscapeCompact,
        isPhonePortrait && styles.headerPhonePortrait,
      ]}
      testID="learner-header"
    >
      <View style={[styles.identityGroup, landscapeCompact && styles.identityGroupLandscape]}>
        <View
          style={[
            styles.avatar,
            compact && styles.avatarCompact,
            landscapeCompact && styles.avatarLandscapeCompact,
          ]}
        >
          <AppIcon
            color="avatarIcon"
            name="personFilled"
            size={metrics.avatarIcon}
          />
        </View>

        <View style={styles.identityText}>
          <View style={styles.nameRow}>
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={[
                styles.name,
                compact && styles.nameCompact,
                landscapeCompact && styles.nameLandscapeCompact,
              ]}
            >
              {learner.name || 'Learner'}
            </Text>
            <View
              style={[
                styles.modeBadge,
                landscapeCompact && styles.modeBadgeLandscape,
              ]}
            >
              <AppIcon
                color="accent"
                name="devicePortrait"
                size={landscapeCompact ? 10 : compact ? 13 : 15}
              />
              <Text
                style={[
                  styles.modeText,
                  compact && styles.modeTextCompact,
                  landscapeCompact && styles.modeTextLandscape,
                ]}
              >
                {learner.mode}
              </Text>
            </View>
          </View>

          <View style={[styles.metaRow, landscapeCompact && styles.metaRowLandscape]}>
            <View style={styles.titleRow}>
              <AppIcon
                color="achievement"
                name="bookmark"
                size={landscapeCompact ? 12 : compact ? 14 : 17}
              />
              <Text
                style={[
                  styles.learnerTitle,
                  compact && styles.learnerTitleCompact,
                  landscapeCompact && styles.learnerTitleLandscapeCompact,
                ]}
              >
                {learner.title || 'Baybayin Learner'}
              </Text>
            </View>
            <View accessibilityElementsHidden style={styles.dot} />
            <Pressable
              accessibilityHint="Shows when workspace joining will be available"
              accessibilityLabel="Join Workspace"
              accessibilityRole="link"
              onBlur={() => setJoinFocused(false)}
              onFocus={() => setJoinFocused(true)}
              onHoverIn={() => setJoinHovered(true)}
              onHoverOut={() => setJoinHovered(false)}
              onPress={showWorkspaceNotice}
              style={[styles.joinLink, (joinFocused || joinHovered) && styles.joinLinkActive]}
            >
              <Text
                style={[
                  styles.joinText,
                  compact && styles.joinTextCompact,
                  landscapeCompact && styles.joinTextLandscapeCompact,
                ]}
              >
                Join Workspace
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.statusGroup,
          compact && styles.statusGroupCompact,
          landscapeCompact && styles.statusGroupLandscape,
          isPhonePortrait && styles.statusGroupPhonePortrait,
        ]}
      >
        <XpProgress
          compact={compact}
          density={landscapeCompact ? 'landscapeCompact' : undefined}
          goal={learner.xpGoal}
          value={learner.xp}
        />
        <View
          accessibilityLabel={`Level ${learner.level}`}
          accessibilityRole="text"
          style={[
            styles.levelBadge,
            compact && styles.levelBadgeCompact,
            landscapeCompact && styles.levelBadgeLandscapeCompact,
          ]}
        >
          <Text
            style={[
              styles.levelText,
              compact && styles.levelTextCompact,
              landscapeCompact && styles.levelTextLandscapeCompact,
            ]}
          >
            LVL {learner.level}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Settings"
          accessibilityRole="button"
          hitSlop={8}
          onBlur={() => setSettingsFocused(false)}
          onFocus={() => setSettingsFocused(true)}
          onHoverIn={() => setSettingsHovered(true)}
          onHoverOut={() => setSettingsHovered(false)}
          onPress={onOpenSettings}
          style={({ pressed }) => [
            styles.settingsButton,
            compact && styles.settingsButtonCompact,
            landscapeCompact && styles.settingsButtonLandscapeCompact,
            (settingsFocused || settingsHovered) && styles.settingsButtonActive,
            pressed && styles.settingsButtonPressed,
          ]}
        >
          <AppIcon color="accent" name="settings" size={metrics.settingsIcon} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: Colors.background,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
    height: LearnerHeaderMetrics.regular.height,
    justifyContent: 'space-between',
    maxHeight: LearnerHeaderMetrics.regular.maxHeight,
    minHeight: LearnerHeaderMetrics.regular.minHeight,
    overflow: 'hidden',
    paddingHorizontal: LearnerHeaderMetrics.regular.paddingHorizontal,
    paddingVertical: LearnerHeaderMetrics.regular.paddingVertical,
    width: '100%',
  },
  headerCompact: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 0,
    gap: 8,
    height: LearnerHeaderMetrics.compact.height,
    maxHeight: LearnerHeaderMetrics.compact.maxHeight,
    minHeight: LearnerHeaderMetrics.compact.minHeight,
    overflow: 'hidden',
    paddingHorizontal: LearnerHeaderMetrics.compact.paddingHorizontal,
    paddingVertical: LearnerHeaderMetrics.compact.paddingVertical,
    width: '100%',
  },
  headerLandscapeCompact: {
    gap: 6,
    height: LearnerHeaderMetrics.landscapeCompact.height,
    maxHeight: LearnerHeaderMetrics.landscapeCompact.maxHeight,
    minHeight: LearnerHeaderMetrics.landscapeCompact.minHeight,
    paddingHorizontal: LearnerHeaderMetrics.landscapeCompact.paddingHorizontal,
    paddingVertical: LearnerHeaderMetrics.landscapeCompact.paddingVertical,
  },
  headerPhonePortrait: {
    alignItems: 'stretch',
    flexDirection: 'column',
    height: undefined,
    maxHeight: undefined,
    minHeight: LearnerHeaderMetrics.phonePortrait.minHeight,
    overflow: 'visible',
    paddingHorizontal: LearnerHeaderMetrics.phonePortrait.paddingHorizontal,
    paddingVertical: LearnerHeaderMetrics.phonePortrait.paddingVertical,
    width: '100%',
  },
  identityGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexShrink: 1,
    gap: 12,
    minWidth: 0,
  },
  identityGroupLandscape: {
    gap: 8,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#F7C244',
    borderColor: '#E5A118',
    borderRadius: Radius.full,
    borderWidth: 3,
    height: LearnerHeaderMetrics.regular.avatar,
    justifyContent: 'center',
    width: LearnerHeaderMetrics.regular.avatar,
  },
  avatarCompact: {
    borderWidth: 2,
    height: LearnerHeaderMetrics.compact.avatar,
    width: LearnerHeaderMetrics.compact.avatar,
  },
  avatarLandscapeCompact: {
    borderWidth: 2,
    height: LearnerHeaderMetrics.landscapeCompact.avatar,
    width: LearnerHeaderMetrics.landscapeCompact.avatar,
  },
  identityText: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  name: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: LearnerHeaderMetrics.regular.title,
    fontWeight: '900',
  },
  nameCompact: {
    fontSize: LearnerHeaderMetrics.compact.title,
  },
  nameLandscapeCompact: {
    fontSize: LearnerHeaderMetrics.landscapeCompact.title,
    includeFontPadding: false,
  },
  modeBadge: {
    alignItems: 'center',
    backgroundColor: Colors.optionalBackground,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 0,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  modeBadgeLandscape: {
    alignItems: 'center',
    backgroundColor: Colors.optionalBackground,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 0,
    gap: 3,
    height: 19,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  modeText: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: '700',
  },
  modeTextCompact: {
    fontSize: 11,
  },
  modeTextLandscape: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: 9.5,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 12,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 8,
    marginTop: 2,
  },
  metaRowLandscape: {
    marginTop: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 5,
  },
  learnerTitle: {
    color: Colors.rolePrimary,
    fontFamily: FontFamily.rounded,
    fontSize: LearnerHeaderMetrics.regular.learnerTitle,
    fontWeight: '900',
  },
  learnerTitleCompact: {
    fontSize: LearnerHeaderMetrics.compact.learnerTitle,
  },
  learnerTitleLandscapeCompact: {
    fontSize: LearnerHeaderMetrics.landscapeCompact.learnerTitle,
    includeFontPadding: false,
  },
  dot: {
    backgroundColor: Colors.textMuted,
    borderRadius: Radius.full,
    height: 4,
    width: 4,
  },
  joinLink: {
    borderBottomColor: Colors.textMuted,
    borderBottomWidth: 1,
    borderRadius: 3,
    paddingBottom: 1,
  },
  joinLinkActive: {
    backgroundColor: Colors.roleSecondaryHover,
    borderBottomColor: Colors.focus,
  },
  joinText: {
    color: Colors.textMuted,
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: '700',
  },
  joinTextCompact: {
    fontSize: 12,
  },
  joinTextLandscapeCompact: {
    fontSize: 11,
    includeFontPadding: false,
  },
  statusGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 14,
    marginLeft: Spacing.md,
  },
  statusGroupCompact: {
    flexShrink: 0,
    gap: 6,
    marginLeft: 6,
  },
  statusGroupLandscape: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 6,
    marginLeft: 8,
  },
  statusGroupPhonePortrait: {
    justifyContent: 'space-between',
    marginLeft: 0,
    width: '100%',
  },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: Colors.levelSurface,
    borderRadius: Radius.full,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 84,
    paddingHorizontal: 16,
  },
  levelText: {
    color: Colors.level,
    fontFamily: FontFamily.rounded,
    fontSize: 17,
    fontWeight: '900',
  },
  levelBadgeCompact: {
    minHeight: 36,
    minWidth: 64,
    paddingHorizontal: 10,
  },
  levelTextCompact: {
    fontSize: 14,
  },
  levelBadgeLandscapeCompact: {
    alignItems: 'center',
    backgroundColor: Colors.levelSurface,
    borderRadius: Radius.full,
    flexShrink: 0,
    height: 28,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 46,
    paddingHorizontal: 8,
  },
  levelTextLandscapeCompact: {
    color: Colors.level,
    fontFamily: FontFamily.rounded,
    fontSize: 11,
    fontWeight: '900',
    includeFontPadding: false,
  },
  settingsButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 2,
    height: LearnerHeaderMetrics.regular.settingsButton,
    justifyContent: 'center',
    width: LearnerHeaderMetrics.regular.settingsButton,
  },
  settingsButtonActive: {
    backgroundColor: Colors.roleSecondaryHover,
    borderColor: Colors.focus,
  },
  settingsButtonCompact: {
    height: LearnerHeaderMetrics.compact.settingsButton,
    width: LearnerHeaderMetrics.compact.settingsButton,
  },
  settingsButtonLandscapeCompact: {
    borderWidth: 1.5,
    flexShrink: 0,
    height: LearnerHeaderMetrics.landscapeCompact.settingsButton,
    width: LearnerHeaderMetrics.landscapeCompact.settingsButton,
  },
  settingsButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
});
