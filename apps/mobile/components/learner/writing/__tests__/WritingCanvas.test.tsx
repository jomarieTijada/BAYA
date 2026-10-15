import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { WritingCanvas } from '../WritingCanvas';
import { WRITING_INPUT_LIMITS } from '../../../../content/writingCanvasValidation';

const event = (x: number, y: number) => ({ nativeEvent: { locationX: x, locationY: y } });
describe('live canvas capture guards', () => {
  const onChange = jest.fn();
  beforeEach(() => onChange.mockClear());
  function canvas(strokes: any = [], disabled = false) {
    const view = render(<WritingCanvas compact={false} disabled={disabled} hintImage={1} onChange={onChange} strokes={strokes} />);
    fireEvent(screen.getByTestId('writing-canvas'), 'layout', { nativeEvent: { layout: { width: 200, height: 100 } } });
    return view;
  }
  it('captures normalized points and ignores duplicate moves', () => {
    canvas();
    const area = screen.getByTestId('writing-canvas');
    fireEvent(area, 'responderGrant', event(20, 20));
    fireEvent(area, 'responderMove', event(20, 20));
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent(area, 'responderMove', event(100, 60));
    expect(onChange.mock.calls[1][0][0]).toEqual([
      expect.objectContaining({ x: 0.1, y: 0.2, t: expect.any(Number) }),
      expect.objectContaining({ x: 0.5, y: 0.6, t: expect.any(Number) }),
    ]);
  });
  it.each([[-10, 20], [210, 20], [20, -10], [20, 110], [NaN, 20], [Infinity, 20]])('ignores a start outside the writing region %s,%s', (x, y) => {
    canvas();
    const area = screen.getByTestId('writing-canvas');
    fireEvent(area, 'responderGrant', event(x, y));
    fireEvent(area, 'responderMove', event(100, 60));
    expect(onChange).not.toHaveBeenCalled();
  });
  it('does not turn outside movement into a clamped edge stroke', () => {
    canvas();
    const area = screen.getByTestId('writing-canvas');
    fireEvent(area, 'responderGrant', event(20, 20));
    fireEvent(area, 'responderMove', event(210, 20));
    fireEvent(area, 'responderMove', event(100, 60));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
  it('caps stroke starts as well as appended points', () => {
    canvas([Array(WRITING_INPUT_LIMITS.maxPoints).fill({ x: 0.1, y: 0.1 })]);
    fireEvent(screen.getByTestId('writing-canvas'), 'responderGrant', event(20, 20));
    expect(onChange).not.toHaveBeenCalled();
  });
  it('blocks drawing while disabled and clears an active gesture on reset', () => {
    const view = canvas([], true);
    fireEvent(screen.getByTestId('writing-canvas'), 'responderGrant', event(20, 20));
    expect(onChange).not.toHaveBeenCalled();
    view.rerender(<WritingCanvas compact={false} hintImage={1} onChange={onChange} strokes={[]} />);
    fireEvent(screen.getByTestId('writing-canvas'), 'layout', { nativeEvent: { layout: { width: 200, height: 100 } } });
    fireEvent(screen.getByTestId('writing-canvas'), 'responderGrant', event(20, 20));
    expect(onChange).toHaveBeenCalledTimes(1);
    view.rerender(<WritingCanvas compact={false} hintImage={1} onChange={onChange} strokes={[]} />);
    fireEvent(screen.getByTestId('writing-canvas'), 'responderMove', event(100, 60));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
