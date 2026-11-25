import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Spacing } from '../../../constants/theme';
import { FloatingSwipeHint, lessonJourneyHintSession } from './FloatingSwipeHint';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { LessonCard, LessonCardWidth } from './LessonCard';
import type { LessonItem } from './lessonData';

type Props = {
  lessons: readonly LessonItem[];
  renderAssessments?: (topicId: string) => React.ReactNode;
  availableHeight?: number;
  moduleId?: string;
  onTopicPress?: (topicId: string) => void;
  onContinueLesson?: (lesson: LessonItem) => void;
};

/** Keeps modules in one row, centered when they fit and swipeable when they do not. */
export function LessonJourney({ lessons, renderAssessments, moduleId, availableHeight = 0, onContinueLesson, onTopicPress }: Props) {
  const { isPhone, isCompactHeight, isPhoneLandscape, width, height } = useResponsiveLayout();
  const sessionKey = lessons.map(lesson => lesson.id).join(':');
  const [dismissed, setDismissed] = useState(() => lessonJourneyHintSession.has(sessionKey));
  const dismissHint = useCallback(() => { lessonJourneyHintSession.add(sessionKey); setDismissed(true); }, [sessionKey]);
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const scroller = useRef<ScrollView>(null);

  const maxOffset = Math.max(0, contentWidth - viewportWidth);
  const visibleCards = Math.min(lessons.length, width >= 780 ? 4 : 2);
  let cardWidth;
  if (isPhoneLandscape) {
    cardWidth = viewportWidth ? Math.floor((viewportWidth - 10 * (visibleCards - 1)) / visibleCards) : LessonCardWidth.landscapeCompact;
  } else {
    if (isPhone || isCompactHeight) {
      cardWidth = LessonCardWidth.compact;
    } else {
      cardWidth = LessonCardWidth.regular;
    }
  }
  useEffect(() => {
    const index = lessons.findIndex(m => m.id === moduleId);
    if (index >= 0 && viewportWidth && contentWidth) scroller.current?.scrollTo({ x: Math.min(maxOffset, index * (cardWidth + (isPhoneLandscape ? 10 : Spacing.lg))), animated: false });
  }, [moduleId, lessons, viewportWidth, contentWidth, cardWidth, maxOffset, isPhoneLandscape]);
  const overflow = viewportWidth > 0 && contentWidth > viewportWidth + 1;
  const rowHeight = Math.max(0, ...Object.values(cardHeights));
  // Anchor the gesture to the visible right edge, independent of card gaps.
  // It floats over the row without taking space or intercepting card presses.
  const visibleHeight = Math.min(rowHeight, availableHeight);
  let hintSlot;
  if (visibleHeight >= 64 && viewportWidth >= 92) {
    hintSlot = {
    left: viewportWidth - 48 - 12,
    top: (visibleHeight - 48) / 2,
    size: 48,
    travel: 32,
  };
  } else {
    hintSlot = undefined;
  }
  const navigate = (x: number) => {
    dismissHint();
    scroller.current?.scrollTo({ x: Math.min(maxOffset, Math.max(0, x)), animated: false });
  };
  let webNavigation;
  if (Platform.OS === 'web') {
    webNavigation = {
    tabIndex: 0 as const,
    role: 'region' as const,
    onWheel: dismissHint,
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return;
      const destinations: Record<string, number> = { ArrowRight: offset + cardWidth + (isPhoneLandscape ? 10 : Spacing.lg), ArrowLeft: offset - cardWidth - (isPhoneLandscape ? 10 : Spacing.lg), Home: 0, End: maxOffset };
      if (event.key in destinations) { event.preventDefault(); navigate(destinations[event.key]); }
    },
  };
  } else {
    webNavigation = {};
  }

  return (
    <View style={styles.root} testID="lesson-journey-frame">

    <ScrollView
      ref={scroller}
      {...webNavigation}
      accessibilityLabel="Mga modyul ng Baybayin"
      accessibilityHint="Mag-scroll pahalang. Sa keyboard, gamitin ang kaliwa at kanang arrow, Home o End."
      accessibilityActions={[{ name: 'increment', label: 'Mga susunod na modyul' }, { name: 'decrement', label: 'Mga naunang modyul' }]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'increment') navigate(offset + cardWidth + (isPhoneLandscape ? 10 : Spacing.lg));
        if (event.nativeEvent.actionName === 'decrement') navigate(offset - cardWidth - (isPhoneLandscape ? 10 : Spacing.lg));
      }}
      onTouchStart={dismissHint}
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.journey, isPhoneLandscape && { gap: 10 }]}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      onContentSizeChange={(width) => setContentWidth(width)}
      onScrollBeginDrag={dismissHint}
      onScroll={(event) => { const x = event.nativeEvent.contentOffset.x; if (Math.abs(x - offset) > 2) dismissHint(); setOffset(x); }}
      scrollEventThrottle={16}
      style={styles.scroller}
      testID="lesson-journey"
    >
      {lessons.map((lesson) => (
        <View key={lesson.id} style={{ width: cardWidth, flexShrink: 0 }} onLayout={event => { const h = event.nativeEvent.layout.height; setCardHeights(previous => {
          if (previous[lesson.id] === h) {
            return previous;
          } else {
            return { ...previous, [lesson.id]: h };
          }
        }); }} testID={`journey-slot-${lesson.id}`}>
          <LessonCard compact={isPhone || isCompactHeight}
            isLandscapeCompact={isPhoneLandscape} lesson={lesson}
            onTopicPress={onTopicPress}
            renderAssessment={renderAssessments}
            onContinue={() => { dismissHint(); onContinueLesson?.(lesson); }} totalLessons={lessons.length} />
        </View>
      ))}
    </ScrollView>
    {width > height && overflow && !dismissed && offset <= 1 && hintSlot && <FloatingSwipeHint {...hintSlot} onDismiss={dismissHint} />}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { width: '100%', position: 'relative' },
  scroller: { width: '100%', flexGrow: 0 },
  journey: { flexGrow: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: Spacing.lg },
});
