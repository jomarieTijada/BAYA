import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { LearnerBottomNav, type LearnerNavRoute } from './home/LearnerBottomNav';

type LearnerAppShellProps = {
  activeRoute?: LearnerNavRoute;
  backgroundColor?: string;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  showBottomNavigation?: boolean;
  testID?: string;
};

/** Shared safe-area, header, content, footer, and learner navigation frame. */
export function LearnerAppShell({
  activeRoute,
  backgroundColor = Colors.background,
  children,
  footer,
  header,
  showBottomNavigation = true,
  testID,
}: LearnerAppShellProps) {
  const { isPhoneLandscape } = useResponsiveLayout();

  return (
    <SafeAreaView
      edges={isPhoneLandscape ? ['left', 'right', 'bottom'] : ['top', 'bottom', 'left', 'right']}
      style={[styles.root, { backgroundColor }]}
      testID={testID}
    >
      {header}
      <View style={styles.content}>{children}</View>
      {footer}
      {showBottomNavigation ? <LearnerBottomNav activeRoute={activeRoute} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  content: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    position: 'relative',
    width: '100%',
  },
});
