import React from 'react';
import { Animated, Platform, ScrollView } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { LessonJourney } from '../LessonJourney';
import { lessonJourneyHintSession } from '../FloatingSwipeHint';
import { createApprovedModules } from '../lessonData';
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../LessonCard', () => ({ LessonCard: () => null, LessonCardWidth: { landscapeCompact: 240, compact: 280, regular: 330 } }));
jest.mock('../../../../hooks/useResponsiveLayout', () => ({ useResponsiveLayout: () => ({ height: 375, isPhone: true, isCompactHeight: true, isPhoneLandscape: true }) }));
jest.mock('../../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => false }));
const lessons = createApprovedModules();
function layout(width = 600) {
  fireEvent(screen.getByTestId('lesson-journey'), 'layout', { nativeEvent: { layout: { width } } });
  fireEvent(screen.getByTestId('lesson-journey'), 'contentSizeChange', 900, 300);
  lessons.forEach((lesson, index) => fireEvent(screen.getByTestId(`journey-slot-${lesson.id}`), 'layout', { nativeEvent: { layout: { height: index ? 170 : 300 } } }));
}
beforeEach(() => { lessonJourneyHintSession.clear(); jest.useFakeTimers(); jest.replaceProperty(Platform, 'OS', 'web'); jest.spyOn(Animated, 'sequence').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() }); });
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
it('replaces arrows with bounded keyboard and accessibility scrolling', () => {
  const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
  render(<LessonJourney lessons={lessons} availableHeight={250} />); layout();
  const row = screen.getByTestId('lesson-journey');
  expect(screen.queryByLabelText('Mga naunang modyul')).toBeNull();
  expect(screen.queryByLabelText('Mga susunod na modyul')).toBeNull();
  expect(screen.getByTestId('floating-swipe-hint')).toBeTruthy();
  expect(row.props.tabIndex).toBe(0);
  const target = {}, preventDefault = jest.fn();
  fireEvent(row, 'keyDown', { key: 'ArrowRight', target, currentTarget: target, preventDefault });
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 264, animated: false });
  expect(preventDefault).toHaveBeenCalled();
  expect(screen.queryByTestId('floating-swipe-hint')).toBeNull();
  fireEvent(row, 'keyDown', { key: 'End', target, currentTarget: target, preventDefault });
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 300, animated: false });
  fireEvent.scroll(row, { nativeEvent: { contentOffset: { x: 300, y: 0 } } });
  fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 36, animated: false });
  fireEvent(row, 'keyDown', { key: 'Home', target, currentTarget: target, preventDefault });
  expect(scrollTo).toHaveBeenLastCalledWith({ x: 0, animated: false });
});
it('omits the gesture when the measured viewport has no safe empty area', () => {
  render(<LessonJourney lessons={lessons} availableHeight={180} />); layout();
  expect(screen.queryByTestId('floating-swipe-hint')).toBeNull();
});
it('hides when content fits and reevaluates after resize without changing card dimensions', () => {
  render(<LessonJourney lessons={lessons} availableHeight={250} />); layout();
  const width = screen.getByTestId(`journey-slot-${lessons[0].id}`).props.style.width;
  expect(screen.getByTestId('floating-swipe-hint')).toBeTruthy();
  layout(1000);
  expect(screen.queryByTestId('floating-swipe-hint')).toBeNull();
  expect(screen.queryByLabelText('Mga susunod na modyul')).toBeNull();
  layout(); expect(screen.getByTestId('floating-swipe-hint')).toBeTruthy();
  expect(screen.getByTestId(`journey-slot-${lessons[0].id}`).props.style.width).toBe(width);
});
it.each(['drag', 'scroll', 'timeout'])('remembers %s dismissal across return visits without persistence', mode => {
  const view = render(<LessonJourney lessons={lessons} availableHeight={250} />); layout();
  if (mode === 'drag') fireEvent(screen.getByTestId('lesson-journey'), 'scrollBeginDrag');
  else if (mode === 'scroll') fireEvent.scroll(screen.getByTestId('lesson-journey'), { nativeEvent: { contentOffset: { x: 40, y: 0 } } });
  else act(() => jest.advanceTimersByTime(3600));
  expect(screen.queryByTestId('floating-swipe-hint')).toBeNull();
  view.unmount(); render(<LessonJourney lessons={lessons} availableHeight={250} />); layout();
  expect(screen.queryByTestId('floating-swipe-hint')).toBeNull();
});
