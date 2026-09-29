import React from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Spacing } from '../../constants/theme';
import { AppButton } from '../ui/AppButton';

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
        <View style={styles.backButtonArea}>
          <AppButton
            accessibilityLabel="Return to role selection"
            compact
            fullWidth={false}
            icon="back"
            iconPosition="leading"
            label="BACK TO BAYA"
            onPress={goBack}
          />
        </View>
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
  backButtonArea: {
    marginTop: Spacing.xl,
  },
});
