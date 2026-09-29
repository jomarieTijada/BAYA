import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Spacing } from '../../../constants/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { LessonCard, LessonCardWidth } from './LessonCard';
import type { LessonItem } from './lessonData';

type Props = {
  lessons: readonly LessonItem[];
  onContinueLesson?: (lesson: LessonItem) => void;
};

/** Keeps modules in one row, centered when they fit and swipeable when they do not. */
export function LessonJourney({ lessons, onContinueLesson }: Props) {
  const { isPhone, isCompactHeight, isPhoneLandscape } = useResponsiveLayout();
  const [viewportWidth, setViewportWidth] = useState(0);
  const cardWidth = isPhoneLandscape
    ? LessonCardWidth.landscapeCompact
    : isPhone || isCompactHeight
      ? LessonCardWidth.compact
      : LessonCardWidth.regular;
  const sideInset = viewportWidth < cardWidth * 2 + Spacing.lg
    ? Math.max(0, (viewportWidth - cardWidth) / 2)
    : 0;

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.journey, { paddingHorizontal: sideInset }]}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      style={styles.scroller}
      testID="lesson-journey"
    >
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} compact={isPhone || isCompactHeight}
          isLandscapeCompact={isPhoneLandscape} lesson={lesson}
          onContinue={() => onContinueLesson?.(lesson)} totalLessons={lessons.length} />
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  scroller: { width: '100%', flexGrow: 0 },
  journey: { flexGrow: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: Spacing.lg },
});
