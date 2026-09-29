import React from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { BayaMascot } from '../../branding/BayaMascot';
import { AppButton } from '../../ui/AppButton';
import { AppIcon } from '../../ui/AppIcon';
import {
  Colors,
  FontFamily,
  Radius,
  Spacing,
} from '../../../constants/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { FilipinoLabels } from '../../../constants/filipinoLabels';
import { LessonStepProgress } from './LessonStepProgress';
import type { LearnerHomeViewModel } from './learnerHomeDemo';

type ContinueLessonHeroProps = {
  lesson: LearnerHomeViewModel['currentLesson'];
  onContinue: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function ContinueLessonHero({ lesson, onContinue, onLayout }: ContinueLessonHeroProps) {
  const {
    width,
    isCompactHeight,
    isPhoneLandscape,
    isPhonePortrait,
    isTabletPortrait,
  } = useResponsiveLayout();
  const stacked = isPhonePortrait || isTabletPortrait;
  const compact = isPhoneLandscape || isCompactHeight;
  const landscapeCompact = isPhoneLandscape;
  const mascotSize = stacked ? 190 : landscapeCompact ? 116 : compact ? 165 : width < 1100 ? 220 : 265;
  const isComplete = lesson.status === 'completed';
  const hasStarted = lesson.status
    ? lesson.status === 'in_progress'
    : lesson.steps.some((step) => step.status === 'completed');
  const cleanCourse = lesson.course.trim();
  const eyebrowText = `${isComplete ? FilipinoLabels.complete : hasStarted ? FilipinoLabels.continue : FilipinoLabels.begin} ${cleanCourse}`.toUpperCase();
  const ctaLabel = isComplete ? FilipinoLabels.review : hasStarted ? FilipinoLabels.continue : FilipinoLabels.begin;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.hero,
        compact && styles.heroCompact,
        landscapeCompact && styles.heroLandscapeCompact,
        stacked && styles.heroStacked,
      ]}
      testID="continue-lesson-hero"
    >
      <View accessibilityElementsHidden style={styles.decorativeOrb} />
      <View
        style={[
          styles.mascotArea,
          compact && styles.mascotAreaCompact,
          landscapeCompact && styles.mascotAreaLandscapeCompact,
          stacked && styles.mascotAreaStacked,
        ]}
      >
        <BayaMascot
          crop="upperBody"
          decorative
          size={mascotSize}
          state="idle"
        />
      </View>

      <View
        style={[
          styles.lessonContent,
          compact && styles.lessonContentCompact,
          landscapeCompact && styles.lessonContentLandscapeCompact,
          stacked && styles.lessonContentStacked,
        ]}
      >
        <Text
          style={[
            styles.eyebrow,
            compact && styles.eyebrowCompact,
            landscapeCompact && styles.eyebrowLandscapeCompact,
          ]}
        >
          {eyebrowText}
        </Text>
        <View
          style={[
            styles.titleRow,
            landscapeCompact && styles.titleRowLandscapeCompact,
          ]}
        >
          <View
            style={[
              styles.writingIcon,
              compact && styles.writingIconCompact,
              landscapeCompact && styles.writingIconLandscapeCompact,
            ]}
          >
            <AppIcon
              color="accent"
              name="pencil"
              size={landscapeCompact ? 14 : compact ? 20 : 25}
            />
          </View>
          <View style={styles.titleCopy}>
            <Text
              accessibilityRole="header"
              style={[
                styles.title,
                compact && styles.titleCompact,
                landscapeCompact && styles.titleLandscapeCompact,
              ]}
            >
              {lesson.title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                compact && styles.subtitleCompact,
                landscapeCompact && styles.subtitleLandscapeCompact,
              ]}
            >
              {isComplete ? 'Tapos na ang lahat ng paksa' : `Paksa ${lesson.currentStep} sa ${lesson.totalSteps}`}
            </Text>
          </View>
        </View>
        <LessonStepProgress
          compact={compact}
          density={landscapeCompact ? 'landscapeCompact' : undefined}
          currentStep={lesson.currentStep}
          steps={lesson.steps}
          totalSteps={lesson.totalSteps}
        />
      </View>

      <View
        style={[
          styles.action,
          compact && styles.actionCompact,
          landscapeCompact && styles.actionLandscapeCompact,
          stacked && styles.actionStacked,
        ]}
      >
        <AppButton
          accessibilityLabel={`${ctaLabel} ${lesson.title}`}
          compact={stacked || compact}
          density={landscapeCompact ? 'heroCompact' : undefined}
          fullWidth={stacked}
          icon="chevronRight"
          label={ctaLabel}
          onPress={onContinue}
          pill
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: Colors.heroBackground,
    borderColor: Colors.rolePrimary,
    borderRadius: Radius.xl,
    borderWidth: 4,
    flexDirection: 'row',
    flexShrink: 0,
    minWidth: 0,
    minHeight: 238,
    overflow: 'hidden',
    paddingHorizontal: 24,
    position: 'relative',
    width: '100%',
  },
  heroStacked: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    width: '100%',
  },
  heroCompact: {
    alignSelf: 'stretch',
    minHeight: 184,
    paddingHorizontal: 12,
    width: '100%',
  },
  heroLandscapeCompact: {
    alignItems: 'center',
    borderWidth: 3,
    height: 100,
    maxHeight: 102,
    minHeight: 98,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  decorativeOrb: {
    backgroundColor: Colors.heroLandscape,
    borderRadius: Radius.full,
    height: 380,
    opacity: 0.55,
    position: 'absolute',
    right: '8%',
    top: -110,
    width: 380,
  },
  mascotArea: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    height: 222,
    justifyContent: 'flex-start',
    marginBottom: -2,
    overflow: 'hidden',
    width: 290,
  },
  mascotAreaStacked: {
    alignSelf: 'center',
    height: 145,
    width: 210,
  },
  mascotAreaCompact: {
    height: 154,
    width: 185,
  },
  mascotAreaLandscapeCompact: {
    alignSelf: 'flex-end',
    height: 94,
    justifyContent: 'flex-end',
    marginBottom: 0,
    overflow: 'hidden',
    width: 118,
  },
  lessonContent: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  lessonContentStacked: {
    alignItems: 'center',
    paddingHorizontal: 0,
    width: '100%',
  },
  lessonContentCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  lessonContentLandscapeCompact: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  eyebrow: {
    color: '#495B47',
    fontFamily: FontFamily.rounded,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  eyebrowCompact: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
  eyebrowLandscapeCompact: {
    fontSize: 10,
    includeFontPadding: false,
    letterSpacing: 0.6,
    lineHeight: 13,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  titleRowLandscapeCompact: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 3,
    marginTop: 2,
  },
  writingIcon: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: '#FFA20A',
    borderRadius: Radius.full,
    borderWidth: 2,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  writingIconCompact: {
    height: 40,
    width: 40,
  },
  writingIconLandscapeCompact: {
    borderWidth: 1.5,
    height: 28,
    width: 28,
  },
  titleCopy: {
    flexShrink: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  titleCompact: {
    fontSize: 21,
    lineHeight: 26,
  },
  titleLandscapeCompact: {
    fontSize: 17,
    includeFontPadding: false,
    lineHeight: 20,
  },
  subtitle: {
    color: Colors.textMuted,
    fontFamily: FontFamily.body,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 3,
  },
  subtitleCompact: {
    fontSize: 14,
  },
  subtitleLandscapeCompact: {
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 14,
    marginTop: 1,
  },
  action: {
    maxWidth: 245,
    minWidth: 205,
    width: '18%',
  },
  actionStacked: {
    marginTop: Spacing.lg,
    maxWidth: 430,
    width: '100%',
  },
  actionCompact: {
    maxWidth: 190,
    minWidth: 150,
  },
  actionLandscapeCompact: {
    maxWidth: 160,
    minWidth: 140,
  },
});
