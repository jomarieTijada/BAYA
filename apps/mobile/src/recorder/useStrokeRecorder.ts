/**
 * apps/mobile/src/recorder/useStrokeRecorder.ts
 *
 * React hook wrapping the pure strokeRecorderLogic state machine in a ref.
 *
 * Design:
 *   - Recorder state is stored in a useRef — zero re-renders caused by
 *     recording. The canvas renders independently via Skia shared values.
 *   - performance.now() is called inside each handler (not injected) because
 *     this is the React layer; tests use strokeRecorderLogic directly with
 *     synthetic timestamps.
 *   - getSnapshot() returns a value-copy safe to pass to async save handlers.
 */

import { useRef, useCallback } from 'react';
import type { RecordedStroke } from '@baya/shared-types';
import {
  createInitialState,
  handleTouchBegin,
  handleTouchMove,
  handleTouchEnd,
  handleTouchCancel,
  handleReset,
  handleUndo,
  getDurationMs,
  getCompletedStrokes,
  type RecorderState,
} from './strokeRecorderLogic';

export interface StrokeRecorderSnapshot {
  /** Completed strokes in draw order. */
  strokes: RecordedStroke[];
  /**
   * Total duration in milliseconds from the first touch-down to the last touch-up.
   * Computed based on stroke timestamps, not current Date.now().
   */
  durationMs: number;
  /** True if the attempt was cancelled by the system. */
  isCancelled: boolean;
  /** True if there is an in-progress stroke that hasn't been ended. */
  isActive: boolean;
  /** Canvas dimensions locked on the first touch of this attempt. */
  canvasWidth: number | null;
  canvasHeight: number | null;
}

export interface UseStrokeRecorderResult {
  /** Call at touch-down. Records the first point of the new stroke. */
  onTouchBegin:  (x: number, y: number, canvasWidth: number, canvasHeight: number) => void;
  /** Call at touch-move. Appends points to the active stroke. */
  onTouchMove:   (x: number, y: number, canvasWidth: number, canvasHeight: number) => void;
  /** Call at touch-up. Finalizes the active stroke. */
  onTouchEnd:    () => void;
  /** Call when the system cancels the gesture. Marks attempt cancelled. */
  onTouchCancel: () => void;
  /** Resets all recorder state for a new attempt. */
  reset:         () => void;
  /** Removes the last completed stroke. */
  undo:          () => void;
  /**
   * Returns a value-copy of the current recorder snapshot safe to pass to
   * async handlers (save, upload, etc.).
   */
  getSnapshot:   () => StrokeRecorderSnapshot;
}

/**
 * Manages attempt-level stroke recording for the practice canvas.
 *
 * State is stored in a ref ?" no re-renders are triggered by recording.
 * Timestamps use performance.now() internally.
 */
export function useStrokeRecorder(): UseStrokeRecorderResult {
  const stateRef = useRef<RecorderState>(createInitialState());

  const onTouchBegin = useCallback((x: number, y: number, canvasWidth: number, canvasHeight: number) => {
    stateRef.current = handleTouchBegin(
      stateRef.current,
      x,
      y,
      performance.now(),
      canvasWidth,
      canvasHeight,
    );
  }, []);

  const onTouchMove = useCallback((x: number, y: number, canvasWidth: number, canvasHeight: number) => {
    stateRef.current = handleTouchMove(
      stateRef.current,
      x,
      y,
      performance.now(),
      canvasWidth,
      canvasHeight,
    );
  }, []);

  const onTouchEnd = useCallback(() => {
    stateRef.current = handleTouchEnd(stateRef.current, performance.now());
  }, []);

  const onTouchCancel = useCallback(() => {
    stateRef.current = handleTouchCancel(stateRef.current);
  }, []);

  const reset = useCallback(() => {
    stateRef.current = handleReset();
  }, []);

  const undo = useCallback(() => {
    stateRef.current = handleUndo(stateRef.current);
  }, []);

  const getSnapshot = useCallback((): StrokeRecorderSnapshot => {
    const state = stateRef.current;
    return {
      strokes:     getCompletedStrokes(state),
      durationMs:  getDurationMs(state),
      isCancelled: state.isCancelled,
      isActive:    state.activeStroke !== null,
      canvasWidth: state.canvasWidth,
      canvasHeight: state.canvasHeight,
    };
  }, []);

  return { onTouchBegin, onTouchMove, onTouchEnd, onTouchCancel, reset, undo, getSnapshot };
}
