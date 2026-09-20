import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Spacing } from '../../constants/theme';
import { RoleButton } from './RoleButton';

type RoleSelectorProps = {
  onLearnerPress: () => void;
  onMentorPress: () => void;
  compact?: boolean;
};

export function RoleSelector({
  onLearnerPress,
  onMentorPress,
  compact = false,
}: RoleSelectorProps) {
  return (
    <View
      accessible={false}
      accessibilityLabel="Choose a role"
      style={[styles.container, compact && styles.compact]}
    >
      <RoleButton
        accessibilityLabel="Continue as learner"
        compact={compact}
        label="LEARNER"
        onPress={onLearnerPress}
        variant="primary"
      />
      <RoleButton
        accessibilityLabel="Continue as mentor"
        compact={compact}
        label="MENTOR"
        onPress={onMentorPress}
        variant="secondary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    maxWidth: 500,
    width: '100%',
  },
  compact: {
    gap: 12,
  },
});
