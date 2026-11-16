import { Text } from '../../localization/components';
import type { PropsWithChildren } from 'react';
import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Colors, FontFamily, FontSize, Spacing } from '../../constants/theme';
import { AppIcon } from '../ui/AppIcon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { installLandscapeLock, isMobileBrowser } from './orientationPolicy';

const subscribeToDevice = () => () => {};
const getDevice = () => Platform.OS !== 'web' || (typeof window !== 'undefined' && isMobileBrowser(window.navigator));
const getServerDevice = () => Platform.OS !== 'web';

/** Overlay, never replace, the lesson so rotation retains the learner's work. */
export function LandscapeGuard({ children, allowPortrait = false }: PropsWithChildren<{ allowPortrait?: boolean }>) {
  const { height, width } = useWindowDimensions();
  const mobile = useSyncExternalStore(subscribeToDevice, getDevice, getServerDevice);
  const content = useRef<View>(null);
  const blocked = !allowPortrait && mobile && height > width;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (allowPortrait) {
      window.screen.orientation?.unlock?.();
      return;
    }
    return installLandscapeLock(window);
  }, [allowPortrait]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = content.current as unknown as HTMLElement | null;
    if (blocked) element?.setAttribute?.('inert', '');
    else element?.removeAttribute?.('inert');
  }, [blocked]);

  return (
    <View style={styles.root}>
    <View ref={content} style={[styles.root, blocked && styles.hidden]} pointerEvents={(() => {
      if (blocked) {
        return 'none';
      } else {
        return 'auto';
      }
    })()} accessibilityElementsHidden={blocked} importantForAccessibility={(() => {
      if (blocked) {
        return 'no-hide-descendants';
      } else {
        return 'auto';
      }
    })()}>
      {children}
    </View>
    {blocked && <SafeAreaView
      accessibilityRole="alert"
      style={styles.container}
      testID="landscape-orientation-guard"
    >
      <View style={styles.iconArea}>
        <AppIcon name="phoneLandscape" color="accent" size={64} />
      </View>
      <Text style={styles.title}>Please turn your device sideways to start learning!</Text>
      <Text style={styles.message}>
        BAYA is ready when you are. Your work stays here.
      </Text>
    </SafeAreaView>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  hidden: { opacity: 0 },
  container: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: FontSize.xl,
    textAlign: 'center',
  },
  message: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.sm,
    maxWidth: 360,
    textAlign: 'center',
  },
});
