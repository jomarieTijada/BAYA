import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BayaLogo } from '../branding/BayaLogo';
import { BayaMascot } from '../branding/BayaMascot';
import {
  Breakpoints,
  Colors,
  FontFamily,
  Spacing,
} from '../../constants/theme';
import { RoleSelector } from './RoleSelector';

type LandingHeroProps = {
  onLearnerPress: () => void;
  onMentorPress: () => void;
};

export function LandingHero({ onLearnerPress, onMentorPress }: LandingHeroProps) {
  const { height, width } = useWindowDimensions();
  const isWide = width >= Breakpoints.tablet && width >= height;
  const isSmallHeight = height < 700;
  const compactControls = width < 600 || isSmallHeight;

  const wideMascotSize = Math.min(width * 0.55, height * 0.9, 820);
  const stackedMascotSize = Math.min(
    width - Spacing.lg,
    isSmallHeight ? 268 : width < 600 ? 340 : 390,
  );
  const logoSize = isWide
    ? Math.min(104, Math.max(72, width * 0.07))
    : width < 360
      ? 52
      : width < 600
        ? 64
        : 78;

  const branding = (
    <View style={styles.branding}>
      <BayaLogo size={logoSize} />
      <Text style={[styles.tagline, isWide ? styles.taglineWide : styles.taglineStacked]}>
        Learn to write Baybayin.
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          isWide ? styles.scrollContentWide : styles.scrollContentStacked,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isWide ? (
          <View style={styles.wideHero}>
            <View style={styles.mascotPane}>
              <BayaMascot size={wideMascotSize} state="ambient" />
            </View>

            <View style={styles.contentPane}>
              {branding}
              <View style={styles.selectorWide}>
                <RoleSelector
                  compact={compactControls}
                  onLearnerPress={onLearnerPress}
                  onMentorPress={onMentorPress}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.stackedHero}>
            {branding}
            <BayaMascot size={stackedMascotSize} state="ambient" />
            <View style={styles.selectorStacked}>
              <RoleSelector
                compact
                onLearnerPress={onLearnerPress}
                onMentorPress={onMentorPress}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentWide: {
    paddingHorizontal: Spacing.xl,
  },
  scrollContentStacked: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  wideHero: {
    alignSelf: 'center',
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1760,
    width: '100%',
  },
  mascotPane: {
    alignItems: 'center',
    flex: 1.12,
    justifyContent: 'center',
    minWidth: 0,
  },
  contentPane: {
    alignItems: 'center',
    flex: 0.88,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: Spacing.md,
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
  selectorWide: {
    marginTop: Spacing.xxl,
    maxWidth: 500,
    width: '100%',
  },
  stackedHero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
  },
  selectorStacked: {
    maxWidth: 430,
    width: '100%',
  },
});
