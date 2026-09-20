/**
 * app/index.tsx
 *
 * BAYA PWA — Home / Dashboard Shell
 *
 * This is the clean starting point for the new web-first application.
 * The previous data-gathering / Canvas workflow has been retired.
 *
 * The layout adapts responsively across:
 *   - Mobile browsers  (320–430px)
 *   - Tablets          (768–1024px)
 *   - Desktop browsers (1280px+)
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/layout/AppHeader';
import { StatusCard } from '../components/ui/StatusCard';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

// ---------------------------------------------------------------------------
// Responsive breakpoints
// ---------------------------------------------------------------------------
const TABLET_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1280;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const isTablet = width >= TABLET_BREAKPOINT;
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  // Content max-width creates pleasant reading column on large screens
  const contentMaxWidth = isDesktop ? 1100 : isTablet ? 720 : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <AppHeader />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.content,
            contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : undefined,
          ]}
        >
          {/* Hero area */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Application Ready</Text>
            <Text style={styles.heroSubtitle}>
              The new PWA foundation has been successfully initialized.
            </Text>
          </View>

          {/* Status cards */}
          <View style={[styles.cards, isTablet && styles.cardsRow]}>
            <View style={[styles.cardWrapper, isTablet && styles.cardWrapperRow]}>
              <StatusCard
                title="System Status"
                value="Ready"
                description="Expo Router and React Native Web foundation."
              />
            </View>
            <View style={[styles.cardWrapper, isTablet && styles.cardWrapperRow]}>
              <StatusCard
                title="Platform"
                value={Platform.OS === 'web' ? 'Web' : Platform.OS}
                description="Responsive web app configured for standalone display."
              />
            </View>
            <View style={[styles.cardWrapper, isTablet && styles.cardWrapperRow]}>
              <StatusCard
                title="Application"
                value="BAYA"
                description="Baybayin learning application — foundation phase."
              />
            </View>
          </View>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              BAYA · PWA Foundation · Expo SDK 57
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  scrollContentTablet: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  content: {
    flex: 1,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  hero: {
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    maxWidth: 480,
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  cards: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardWrapper: {
    flex: 1,
    minWidth: 200,
  },
  cardWrapperRow: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 200,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});
