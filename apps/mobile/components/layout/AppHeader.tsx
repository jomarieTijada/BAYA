/**
 * components/layout/AppHeader.tsx
 *
 * Responsive application header for the BAYA PWA.
 * Adapts between mobile and desktop layouts using React Native Web
 * responsive primitives — no device-specific hacks.
 */

import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors, Spacing, FontSize } from '../../constants/theme';

// Breakpoint at which the layout shifts from mobile to desktop
const DESKTOP_BREAKPOINT = 768;

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title = 'BAYA' }: AppHeaderProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  return (
    <View style={[styles.header, isDesktop && styles.headerDesktop]}>
      <View style={styles.headerContent}>
        <View style={styles.brand}>
          <Text style={styles.brandText}>{title}</Text>
          <Text style={styles.brandSub}>Baybayin Learning</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDesktop: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerContent: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  brand: {
    flexDirection: 'column',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 2,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
