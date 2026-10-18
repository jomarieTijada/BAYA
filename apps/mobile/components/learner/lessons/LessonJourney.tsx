import React, { useCallback, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Spacing } from '../../../constants/theme';
import { FloatingSwipeHint, lessonJourneyHintSession } from './FloatingSwipeHint';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { LessonCard, LessonCardWidth } from './LessonCard';
import type { LessonItem } from './lessonData';

type Props = {
  lessons: readonly LessonItem[];
  availableHeight?: number;
  onContinueLesson?: (lesson: LessonItem) => void;
};

/** Keeps modules in one row, centered when they fit and swipeable when they do not. */
export function LessonJourney({ lessons, availableHeight = 0, onContinueLesson }: Props) {
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
  const cardWidth = isPhoneLandscape
    ? LessonCardWidth.landscapeCompact
    : isPhone || isCompactHeight
      ? LessonCardWidth.compact
      : LessonCardWidth.regular;
  const overflow = viewportWidth > 0 && contentWidth > viewportWidth + 1;
  const rowHeight = Math.max(0, ...Object.values(cardHeights));
  // Prefer the full gesture below a shorter card. On short phones, use the
  // existing gap between cards without covering content or reserving space.
  const belowCard = lessons.map((lesson, index) => ({
    left: index * (cardWidth + Spacing.lg) - offset + cardWidth * 0.7,
    top: (cardHeights[lesson.id] ?? Infinity) + 8,
    size: 28,
    travel: 28,
  })).filter(slot => slot.left - 28 >= 0 && slot.left + 28 <= viewportWidth && slot.top + 28 <= Math.min(rowHeight, availableHeight))
    .sort((a, b) => a.top - b.top || b.left - a.left)[0];
  const betweenCards = lessons.slice(0, -1).map((lesson, index) => ({
    left: index * (cardWidth + Spacing.lg) - offset + cardWidth + 8,
    top: Math.min(rowHeight, availableHeight) * 0.55 - 8,
    size: 16,
    travel: 8,
  })).find(slot => slot.left - slot.travel >= 0 && slot.left + slot.size <= viewportWidth
    && slot.top >= 0 && slot.top + slot.size <= Math.min(rowHeight, availableHeight));
  const hintSlot = belowCard ?? betweenCards;
  const navigate = (x: number) => {
    dismissHint();
    scroller.current?.scrollTo({ x: Math.min(maxOffset, Math.max(0, x)), animated: false });
  };
  const webNavigation = Platform.OS === 'web' ? {
    tabIndex: 0 as const,
    role: 'region' as const,
    onWheel: dismissHint,
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return;
      const destinations: Record<string, number> = { ArrowRight: offset + cardWidth + Spacing.lg, ArrowLeft: offset - cardWidth - Spacing.lg, Home: 0, End: maxOffset };
      if (event.key in destinations) { event.preventDefault(); navigate(destinations[event.key]); }
    },
  } : {};

  return (
    <View style={styles.root} testID="lesson-journey-frame">

    <ScrollView
      ref={scroller}
      {...webNavigation}
      accessibilityLabel="Mga modyul ng Baybayin"
      accessibilityHint="Mag-scroll pahalang. Sa keyboard, gamitin ang kaliwa at kanang arrow, Home o End."
      accessibilityActions={[{ name: 'increment', label: 'Mga susunod na modyul' }, { name: 'decrement', label: 'Mga naunang modyul' }]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'increment') navigate(offset + cardWidth + Spacing.lg);
        if (event.nativeEvent.actionName === 'decrement') navigate(offset - cardWidth - Spacing.lg);
      }}
      onTouchStart={dismissHint}
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.journey}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      onContentSizeChange={(width) => setContentWidth(width)}
      onScrollBeginDrag={dismissHint}
      onScroll={(event) => { const x = event.nativeEvent.contentOffset.x; if (Math.abs(x - offset) > 2) dismissHint(); setOffset(x); }}
      scrollEventThrottle={16}
      style={styles.scroller}
      testID="lesson-journey"
    >
      {lessons.map((lesson) => (
        <View key={lesson.id} style={{ width: cardWidth, flexShrink: 0 }} onLayout={event => { const h = event.nativeEvent.layout.height; setCardHeights(previous => previous[lesson.id] === h ? previous : { ...previous, [lesson.id]: h }); }} testID={`journey-slot-${lesson.id}`}>
          <LessonCard compact={isPhone || isCompactHeight}
            isLandscapeCompact={isPhoneLandscape} lesson={lesson}
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
