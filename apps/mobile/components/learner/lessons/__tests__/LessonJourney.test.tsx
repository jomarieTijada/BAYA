import React from 'react';
import { Animated, Platform, ScrollView, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { LessonJourney } from '../LessonJourney';
import { lessonJourneyHintSession } from '../FloatingSwipeHint';
import { createApprovedModules } from '../lessonData';
jest.mock('../../../ui/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('../LessonCard', () => ({ LessonCard: () => null, LessonCardWidth: { landscapeCompact: 240, compact: 280, regular: 330 } }));
let mockViewport = { width: 667, height: 375 };
jest.mock('../../../../hooks/useResponsiveLayout', () => ({ useResponsiveLayout: () => ({ ...mockViewport, isPhone: true, isCompactHeight: true, isPhoneLandscape: mockViewport.width > mockViewport.height }) }));
jest.mock('../../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => false }));
const lessons = createApprovedModules();
function layout(width = 600) {
  fireEvent(screen.getByTestId('lesson-journey'), 'layout', { nativeEvent: { layout: { width } } });
  fireEvent(screen.getByTestId('lesson-journey'), 'contentSizeChange', 900, 300);
  lessons.forEach((lesson, index) => fireEvent(screen.getByTestId(`journey-slot-${lesson.id}`), 'layout', { nativeEvent: { layout: { height: index ? 170 : 300 } } }));
}
beforeEach(() => { mockViewport = { width: 667, height: 375 }; lessonJourneyHintSession.clear(); jest.useFakeTimers(); jest.replaceProperty(Platform, 'OS', 'web'); jest.spyOn(Animated, 'sequence').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() }); });
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
it('uses the existing card gap when a short viewport cannot fit the full gesture', () => {
  render(<LessonJourney lessons={lessons} availableHeight={180} />); layout();
  const style = StyleSheet.flatten(screen.getByTestId('floating-swipe-hint').props.style);
  expect(style.width).toBe(16);
  expect(style.left - 8).toBeGreaterThanOrEqual(240);
  expect(style.left + style.width).toBeLessThanOrEqual(264);
  expect(style.top + style.height).toBeLessThanOrEqual(180);
});
it('does not spend the hint timeout behind the portrait rotation guard', () => {
  mockViewport = { width: 375, height: 667 };
  const view = render(<LessonJourney lessons={lessons} availableHeight={250} />); layout();
  act(() => jest.advanceTimersByTime(5000));
  expect(screen.queryByTestId('floating-swipe-hint')).toBeNull();
  expect(lessonJourneyHintSession.size).toBe(0);
  mockViewport = { width: 667, height: 375 };
  view.rerender(<LessonJourney lessons={lessons} availableHeight={250} />);
  expect(screen.getByTestId('floating-swipe-hint')).toBeTruthy();
});
it('waits for actual layout measurements', () => {
  render(<LessonJourney lessons={lessons} />); layout();
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
