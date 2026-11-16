import { OriginStorybook } from './OriginStorybook';
import { Text } from '../../localization/components';
import React from 'react';
import { useStorybookIntroduction } from './useStorybookIntroduction';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BayaLogo } from '../branding/BayaLogo';
import { BayaMascot } from '../branding/BayaMascot';
import {
  Colors,
  FontFamily,
  ResponsiveLayout,
  Spacing,
} from '../../constants/theme';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { RoleSelector } from './RoleSelector';

type LandingHeroProps = {
  introductionEligible?: boolean;
  onLearnerPress: () => void;
  onMentorPress: () => void;
};

export function LandingHero({ onLearnerPress, onMentorPress, introductionEligible = false }: LandingHeroProps) {
  // Keep the reading session mounted when the welcome layout changes on rotation.
  const story = useStorybookIntroduction(introductionEligible);
  const learner = () => { story.leaveWelcome(); onLearnerPress(); };
  const mentor = () => { story.leaveWelcome(); onMentorPress(); };
  const insets = useSafeAreaInsets();
  const {
    height,
    width,
    isCompactHeight,
    isDesktop,
    isPhone,
    isPhoneLandscape,
    isPhonePortrait,
    isTablet,
    isTabletLandscape,
  } = useResponsiveLayout();
  const useWideLayout = isDesktop || isPhoneLandscape || isTabletLandscape;
  const compactControls = isPhone || isCompactHeight;

  let mascotSize;
  if (isPhoneLandscape) {
    mascotSize = Math.min(width * 0.42, height * 0.8, 300);
  } else {
    if (useWideLayout) {
      mascotSize = Math.min(width * 0.52, height * 0.86, (() => {
        if (isTablet) {
          return 500;
        } else {
          return 820;
        }
      })());
    } else {
      if (isPhonePortrait) {
        mascotSize = Math.min(width - 64, height * 0.34, 280);
      } else {
        mascotSize = Math.min(width * 0.58, height * 0.4, 390);
      }
    }
  }
  let logoSize;
  if (isPhoneLandscape) {
    logoSize = Math.min(66, height * 0.17);
  } else {
    if (isPhonePortrait) {
      if (width < 360) {
        logoSize = 52;
      } else {
        logoSize = 60;
      }
    } else {
      if (useWideLayout) {
        logoSize = Math.min(104, Math.max(72, width * 0.07));
      } else {
        logoSize = 76;
      }
    }
  }

  const tagline = (
    <Text
      style={[
        styles.tagline,
        (() => {
          if (useWideLayout) {
            return styles.taglineWide;
          } else {
            return styles.taglineStacked;
          }
        })(),
        isPhone && styles.taglinePhone,
      ]}
    >
      {"Mabuhay! Let's learn Baybayin together!"}
    </Text>
  );

  return (
    <SafeAreaView
      edges={(() => {
        if (isPhoneLandscape) {
          return ['left', 'right', 'bottom'];
        } else {
          return ['top', 'bottom', 'left', 'right'];
        }
      })()}
      style={styles.safeArea}
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          (() => {
            if (useWideLayout) {
              return styles.scrollContentWide;
            } else {
              return styles.scrollContentStacked;
            }
          })(),
          isPhoneLandscape && styles.scrollContentPhoneLandscape,
          isPhonePortrait && styles.scrollContentPhonePortrait,
          { paddingBottom: Math.max(insets.bottom + Spacing.sm, Spacing.md) },
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        {(() => {
          if (useWideLayout) {
            return (
          <View style={[styles.wideHero, isPhoneLandscape && styles.wideHeroPhone]}>
            <View style={[styles.mascotPane, isPhoneLandscape && styles.mascotPanePhone]}>
              <BayaMascot size={mascotSize} state="ambient" />
            </View>

            <View style={[styles.contentPane, isPhoneLandscape && styles.contentPanePhone]}>
              <View style={styles.branding}>
                <BayaLogo size={logoSize} />
                {tagline}
              </View>
              <View testID="welcome-role-selector" style={[styles.selectorWide, compactControls && styles.selectorCompact]}>
                <RoleSelector
                  compact={compactControls}
                  onLearnerPress={learner}
                  onMentorPress={mentor}
                />
              </View>
            </View>
          </View>
        );
          } else {
            return (
          <View style={[styles.stackedHero, isPhonePortrait && styles.stackedHeroPhone]}>
            <BayaLogo size={logoSize} />
            <BayaMascot size={mascotSize} state="ambient" />
            {tagline}
            <View testID="welcome-role-selector" style={[styles.selectorStacked, isPhonePortrait && styles.selectorStackedPhone]}>
              <RoleSelector
                compact
                onLearnerPress={learner}
                onMentorPress={mentor}
              />
            </View>
          </View>
        );
          }
        })()}
      </ScrollView>
      {story.mode && <OriginStorybook onClose={() => {
        story.close();
        if (Platform.OS === 'web') requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-testid="welcome-role-selector"] [role="button"]')?.focus());
      }} />}
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
  scrollView: {
    flex: 1,
    minWidth: 0,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
  },
  scrollContentWide: {
    paddingHorizontal: ResponsiveLayout.pagePadding.desktop,
  },
  scrollContentStacked: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  scrollContentPhoneLandscape: {
    paddingHorizontal: ResponsiveLayout.pagePadding.phone,
    paddingTop: Spacing.sm,
  },
  scrollContentPhonePortrait: {
    paddingHorizontal: ResponsiveLayout.pagePadding.phone,
    paddingTop: 12,
  },
  wideHero: {
    alignSelf: 'center',
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1760,
    width: '100%',
  },
  wideHeroPhone: {
    minHeight: 0,
  },
  mascotPane: {
    alignItems: 'center',
    flex: 1.12,
    justifyContent: 'center',
    minWidth: 0,
  },
  mascotPanePhone: {
    flex: 0.44,
  },
  contentPane: {
    alignItems: 'center',
    flex: 0.88,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: Spacing.md,
  },
  contentPanePhone: {
    flex: 0.56,
    paddingHorizontal: Spacing.sm,
  },
  branding: {
    alignItems: 'center',
  },
  tagline: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontWeight: '800',
    textAlign: 'center',
  },
  taglineWide: {
    fontSize: 30,
    lineHeight: 38,
    marginTop: Spacing.sm,
  },
  taglineStacked: {
    fontSize: 20,
    lineHeight: 27,
    marginTop: 2,
  },
  taglinePhone: {
    fontSize: 18,
    lineHeight: 23,
    marginTop: 2,
  },
  selectorWide: {
    marginTop: Spacing.xxl,
    maxWidth: 500,
    width: '100%',
  },
  selectorCompact: {
    marginTop: 12,
    maxWidth: 380,
  },
  stackedHero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
  },
  stackedHeroPhone: {
    gap: 10,
    justifyContent: 'flex-start',
  },
  selectorStacked: {
    maxWidth: 430,
    width: '100%',
  },
  selectorStackedPhone: {
    marginTop: 4,
    maxWidth: 360,
  },
});
