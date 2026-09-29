import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, FontFamily, Radius, Spacing } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { LearnerScreenContainer } from './LearnerScreenContainer';
import { LearnerAppShell } from './LearnerAppShell';
import { LearnerPageHeader } from './LearnerPageHeader';
import { AppButton } from '../ui/AppButton';
import { type LearnerNavRoute } from './home/LearnerBottomNav';

type LearnerPlaceholderScreenProps = {
  activeRoute?: LearnerNavRoute;
  description: string;
  title: string;
};

/** Lightweight destination used only until its dedicated learner feature is designed. */
export function LearnerPlaceholderScreen({
  activeRoute,
  description,
  title,
}: LearnerPlaceholderScreenProps) {
  const router = useRouter();
  const { width, height } = useResponsiveLayout();
  const scale = Math.min(1, Math.max(0.65, Math.min(width, height) / 700));
  const gap = Math.max(Spacing.sm, Spacing.md * scale);


  return (
    <LearnerAppShell
      activeRoute={activeRoute}
      header={(
        <LearnerPageHeader
          onBack={() => router.dismissTo('/learner/home')}
          onOpenSettings={() => router.push('/learner/settings')}
          title={title}
        />
      )}
    >
      <LearnerScreenContainer maxWidth={620} testID="learner-empty-state-scroll">
        <View style={[styles.card, { padding: Spacing.xl * scale, gap }]}>
          <Text style={styles.eyebrow}>LEARNER AREA</Text>
          <Text accessibilityRole="header" style={[styles.title, { fontSize: Math.max(20, 32 * scale), marginTop: 0 }]}>{title}</Text>
          <Text style={[styles.description, { fontSize: Math.max(15, 17 * scale), lineHeight: Math.max(21, 26 * scale), marginTop: 0 }]}>{description}</Text>
          <View style={{ maxWidth: "100%" }}>
            <AppButton
              accessibilityLabel="Bumalik sa bahay ng mag-aaral"
              compact
              fullWidth={false}
              icon="back"
              iconPosition="leading"
              label="Bumalik sa Tahanan"
              onPress={() => router.dismissTo('/learner/home')}
            />
          </View>
        </View>
      </LearnerScreenContainer>
    </LearnerAppShell>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    maxWidth: 620,
    padding: Spacing.xxl,
    width: '100%',
  },
  eyebrow: {
    color: Colors.rolePrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 32,
    fontWeight: '900',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  description: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: 17,
    lineHeight: 26,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
