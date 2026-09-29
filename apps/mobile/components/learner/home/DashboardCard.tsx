import React, { type PropsWithChildren } from 'react';
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Colors, FontFamily, Radius } from '../../../constants/theme';

type DashboardCardTone = 'goal' | 'adventure' | 'achievement';

type DashboardCardProps = PropsWithChildren<{
  action?: React.ReactNode;
  compact?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  tone: DashboardCardTone;
}>;

export function DashboardCard({ action, children, compact = false, label, style, tone }: DashboardCardProps) {
  return (
    <View
      style={[
        styles.card,
        styles[`${tone}Card`],
        compact && styles.cardCompact,
        style,
      ]}
      testID={`dashboard-card-${tone}`}
    >
      <View
        style={[
          styles.label,
          styles[`${tone}Label`],
          compact && styles.labelCompact,
        ]}
      >
        <Text style={[styles.labelText, compact && styles.labelTextCompact]}>{label}</Text>
      </View>
      <View style={[styles.body, compact && styles.bodyCompact]}>
        {children}
      </View>
      {action ? (
        <View style={[styles.action, compact && styles.actionCompact]}>
          {action}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 4,
    justifyContent: 'space-between',
    minHeight: 250,
    minWidth: 0,
    overflow: 'visible',
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 36,
    position: 'relative',
  },
  cardCompact: {
    borderRadius: 16,
    borderWidth: 2.5,
    height: 114,
    maxHeight: 116,
    minHeight: 112,
    paddingBottom: 6,
    paddingHorizontal: 8,
    paddingTop: 14,
  },
  body: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  bodyCompact: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
    width: '100%',
  },
  action: {
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
  },
  actionCompact: {
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
    width: '100%',
  },
  goalCard: {
    backgroundColor: Colors.goalSurface,
    borderColor: Colors.goal,
  },
  adventureCard: {
    backgroundColor: Colors.adventureSurface,
    borderColor: Colors.adventure,
  },
  achievementCard: {
    backgroundColor: Colors.achievementSurface,
    borderColor: Colors.achievement,
  },
  label: {
    alignItems: 'center',
    borderRadius: Radius.full,
    justifyContent: 'center',
    minWidth: 170,
    paddingHorizontal: 18,
    paddingVertical: 7,
    position: 'absolute',
    top: -16,
    zIndex: 10,
  },
  labelCompact: {
    height: 18,
    minWidth: 0,
    paddingHorizontal: 9,
    paddingVertical: 1,
    top: -9,
  },
  goalLabel: {
    backgroundColor: Colors.goal,
  },
  adventureLabel: {
    backgroundColor: Colors.adventure,
  },
  achievementLabel: {
    backgroundColor: Colors.achievement,
  },
  labelText: {
    color: Colors.surface,
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  labelTextCompact: {
    fontSize: 9.5,
    includeFontPadding: false,
    letterSpacing: 0.5,
    lineHeight: 12,
  },
});
