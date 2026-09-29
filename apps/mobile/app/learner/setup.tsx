import React from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileSetupForm } from '../../components/learner/ProfileSetupForm';
import { BackButton } from '../../components/ui/BackButton';
import { Colors, FontFamily, Shadows, Spacing } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

export default function LearnerSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    height,
    isPhone,
    isPhoneLandscape,
    isPhonePortrait,
  } = useResponsiveLayout();
  const isLandscapeCompact = isPhoneLandscape && height <= 500;
  const density = isLandscapeCompact
    ? 'landscapeCompact'
    : isPhonePortrait
      ? 'mobile'
      : 'regular';
  const compact = density !== 'regular';

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  return (
    <SafeAreaView
      edges={isLandscapeCompact ? ['left', 'right', 'bottom'] : ['top', 'bottom', 'left', 'right']}
      style={styles.safeArea}
      testID="setup-screen-root"
    >
      <Stack.Screen options={{ title: 'BAYA · Set Up Your Profile' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
        testID="setup-screen-wrapper"
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            isPhone && styles.scrollContentPhone,
            isLandscapeCompact && styles.scrollContentLandscapeCompact,
            !isLandscapeCompact && { paddingBottom: Math.max(insets.bottom + Spacing.md, Spacing.lg) },
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          testID="setup-scroll-view"
        >
          <View
            style={[
              styles.navRow,
              isPhone && styles.navRowPhone,
              isLandscapeCompact && styles.navRowLandscapeCompact,
            ]}
            testID="setup-page-header"
          >
            <BackButton
              accessibilityLabel="Back"
              compact={compact}
              onPress={goBack}
              size={isLandscapeCompact ? 'landscape' : compact ? 'compact' : 'regular'}
            />
          </View>

          <View
            style={[
              styles.card,
              Shadows.card,
              isPhone && styles.cardPhone,
              isLandscapeCompact && styles.cardLandscapeCompact,
            ]}
            testID="setup-card"
          >
            <View
              style={[
                styles.header,
                compact && styles.headerCompact,
                isLandscapeCompact && styles.headerLandscapeCompact,
              ]}
            >
              <Text
                accessibilityRole="header"
                style={[
                  styles.title,
                  compact && styles.titleCompact,
                  isLandscapeCompact && styles.titleLandscapeCompact,
                ]}
              >
                SET UP YOUR PROFILE
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  compact && styles.subtitleCompact,
                  isLandscapeCompact && styles.subtitleLandscapeCompact,
                ]}
              >
                Start your Baybayin journey.
              </Text>
            </View>

            <ProfileSetupForm
              density={density}
              onContinue={() => router.replace('/learner/home')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  keyboardArea: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    width: '100%',
  },
  scrollContentPhone: {
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  scrollContentLandscapeCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    width: '100%',
  },
  navRow: {
    alignItems: 'flex-start',
    alignSelf: 'center',
    marginBottom: Spacing.md,
    maxWidth: 940,
    width: '100%',
  },
  navRowPhone: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBottom: Spacing.sm,
    maxWidth: '100%',
  },
  navRowLandscapeCompact: {
    alignItems: 'flex-start',
    alignSelf: 'center',
    marginBottom: 6,
    maxWidth: 630,
    width: '100%',
  },
  card: {
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 40,
    borderWidth: 1,
    maxWidth: 940,
    minWidth: 0,
    paddingHorizontal: 52,
    paddingVertical: 42,
    width: '100%',
  },
  cardPhone: {
    borderRadius: 22,
    maxWidth: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardLandscapeCompact: {
    alignSelf: 'center',
    borderRadius: 20,
    maxWidth: 630,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerCompact: {
    marginBottom: 12,
  },
  headerLandscapeCompact: {
    marginBottom: 6,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.8,
    lineHeight: 42,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 24,
    letterSpacing: 1.2,
    lineHeight: 30,
  },
  titleLandscapeCompact: {
    fontSize: 20,
    letterSpacing: 1.0,
    lineHeight: 24,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: 20,
    lineHeight: 28,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: 17,
    lineHeight: 23,
    marginTop: Spacing.xs,
  },
  subtitleLandscapeCompact: {
    fontSize: 13,
    lineHeight: 16,
    marginTop: 2,
  },
});
