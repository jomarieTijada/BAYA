import React from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Radius, Spacing } from '../../constants/theme';

type RolePlaceholderScreenProps = {
  role: 'Learner' | 'Mentor';
};

export function RolePlaceholderScreen({ role }: RolePlaceholderScreenProps) {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.eyebrow}>
          {role.toUpperCase()} AREA
        </Text>
        <Text style={styles.title}>{role} application coming next.</Text>
        <Text style={styles.description}>
          This route is ready. The full {role.toLowerCase()} experience will be added in a
          future step.
        </Text>
        <Pressable
          accessibilityLabel="Return to role selection"
          accessibilityRole="button"
          onPress={goBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Text style={styles.backButtonLabel}>← BACK TO BAYA</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  eyebrow: {
    color: Colors.rolePrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: 17,
    lineHeight: 26,
    marginTop: Spacing.md,
    maxWidth: 520,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.rolePrimary,
    borderRadius: Radius.full,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  backButtonPressed: {
    backgroundColor: Colors.rolePrimaryPressed,
    transform: [{ scale: 0.98 }],
  },
  backButtonLabel: {
    color: Colors.surface,
    fontFamily: FontFamily.rounded,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
