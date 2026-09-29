import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Spacing } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

type Props = {
  children: ReactNode;
  maxWidth?: number;
  horizontalPadding?: number;
  verticalSpacing?: number;
  testID?: string;
};

/** Centers content when it fits; allows vertical reading when space runs out. */
export function LearnerScreenContainer({ children, maxWidth = 1200, horizontalPadding, verticalSpacing, testID }: Props) {
  const { width, height } = useResponsiveLayout();
  const spacing = Math.max(Spacing.sm, Math.min(Spacing.lg, Math.min(width, height) * 0.035));
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.viewport, {
      paddingHorizontal: horizontalPadding ?? spacing,
      paddingVertical: verticalSpacing ?? spacing,
    }]} testID={testID}>
      <View style={[styles.content, { maxWidth }]}>{children}</View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scroll: { flex: 1, minHeight: 0, width: '100%' },
  viewport: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', minWidth: 0, flexShrink: 0 },
});
