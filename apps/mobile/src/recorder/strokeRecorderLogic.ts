/**
 * apps/mobile/src/recorder/strokeRecorderLogic.ts
 *
 * Pure state-transition functions for attempt-level stroke recording.
 *
 * NO React, NO Expo, NO side-effects — fully unit-testable without mounting
 * any component. The React hook (useStrokeRecorder.ts) wraps these functions
 * in refs; tests call them directly with synthetic timestamps.
 *
 * Timestamp convention:
 *   All timing values are ELAPSED MILLISECONDS from the first touch-down of
 *   the current attempt, derived from performance.now() deltas.
 *   - The `now` parameter in each function should be performance.now() in
 *     production, or a synthetic value in tests.
 *   - t === 0 for the very first point of the attempt.
 *   - t increases monotonically across all strokes.
 *   - Date.now() is NOT used here.
 *
 * Tap / dot correctness:
 *   A normal tap produces:
 *     handleTouchBegin(...)  →  activeStroke.points.length === 1
 *     handleTouchEnd(...)    →  finalized stroke with points.length === 1
 *   A zero-point active stroke is an ABNORMAL internal state (logged as a
 *   warning). It is NOT the normal single-tap case.
 */

import type { RecordedStroke, RecordedStrokePoint } from '@baya/shared-types';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/** In-progress stroke that has not yet been finalized. */
interface ActiveStroke {
  strokeId:    number;
  startedAtMs: number;           // elapsed ms at touch-down
  points:      RecordedStrokePoint[];
}

/** Immutable recorder state snapshot. All mutations return a new object. */
export interface RecorderState {
  /** Completed strokes in draw order. */
  strokes:      RecordedStroke[];
  /** The stroke currently being drawn; null between strokes. */
  activeStroke: ActiveStroke | null;
  /**
   * performance.now() value at the first touch-down of the current attempt.
   * Null before the first touch-down.
   */
  attemptStart: number | null;
  /** Logical-pixel canvas dimensions locked on the first touch. */
  canvasWidth: number | null;
  canvasHeight: number | null;
  /** True if the system interrupted a stroke. Prevents submission until cleared. */
  isCancelled:  boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute elapsed ms from attempt start. Returns 0 if not yet started. */
function elapsed(attemptStart: number, now: number): number {
  return Math.max(0, now - attemptStart);
}

/** The next strokeId to assign (one more than the last completed stroke). */
function nextStrokeId(state: RecorderState): number {
  return state.strokes.length + (state.activeStroke !== null ? 1 : 0);
}

// ---------------------------------------------------------------------------
// State factory
// ---------------------------------------------------------------------------

/** Initial empty recorder state. */
export function createInitialState(): RecorderState {
  return {
    strokes:      [],
    activeStroke: null,
    attemptStart: null,
    canvasWidth:  null,
    canvasHeight: null,
    isCancelled:  false,
  };
}

// ---------------------------------------------------------------------------
// State transitions — pure functions
// ---------------------------------------------------------------------------

/**
 * Called on touch-down / pointer-down.
 *
 * - If this is the FIRST touch of the attempt, establishes `attemptStart`.
 * - Creates a new ActiveStroke.
 * - Records the initial coordinate with t = elapsed ms (0 for first point).
 *
 * @param state  Current recorder state.
 * @param x      Canvas-pixel X coordinate.
 * @param y      Canvas-pixel Y coordinate.
 * @param now    performance.now() at the moment of touch-down.
 */
export function handleTouchBegin(
  state: RecorderState,
  x: number,
  y: number,
  now: number,
  canvasWidth: number,
  canvasHeight: number,
): RecorderState {
  if (state.isCancelled) return state;

  if (!hasValidCanvasDimensions(canvasWidth, canvasHeight)) {
    return handleTouchCancel(state);
  }

  if (!canvasDimensionsMatch(state, canvasWidth, canvasHeight)) {
    return handleTouchCancel(state);
  }


  // Establish attempt start on first touch.
  if (state.attemptStart === null && typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[BAYA Time Origin] SET firstTouchAbsolute=${now.toFixed(1)}`);
  }
  const attemptStart = state.attemptStart ?? now;

  const elapsedMs    = elapsed(attemptStart, now);


  const activeStroke: ActiveStroke = {
    strokeId:    nextStrokeId({ ...state, attemptStart }),
    startedAtMs: elapsedMs,
    points:      [{ x, y, t: elapsedMs }],
  };
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[BAYA Stroke] BEGIN id=${activeStroke.strokeId} relative=${activeStroke.startedAtMs.toFixed(1)}`);
  }


  return {
    ...state,
    activeStroke,
    attemptStart,
    canvasWidth:  state.canvasWidth ?? canvasWidth,
    canvasHeight: state.canvasHeight ?? canvasHeight,
  };
}

/**
 * Called on touch-move / pointer-move.
 *
 * Appends a coordinate to the active stroke. No-ops if there is no
 * active stroke (should not happen in normal operation).
 *
 * @param state  Current recorder state.
 * @param x      Canvas-pixel X coordinate.
 * @param y      Canvas-pixel Y coordinate.
 * @param now    performance.now() at the moment of the move event.
 */
export function handleTouchMove(
  state: RecorderState,
  x: number,
  y: number,
  now: number,
  canvasWidth: number,
  canvasHeight: number,
): RecorderState {
  if (state.isCancelled || state.activeStroke === null || state.attemptStart === null) {
    return state;
  }

  if (!canvasDimensionsMatch(state, canvasWidth, canvasHeight)) {
    return handleTouchCancel(state);
  }

  const point: RecordedStrokePoint = {
    x,
    y,
    t: elapsed(state.attemptStart, now),
  };

  return {
    ...state,
    activeStroke: {
      ...state.activeStroke,
      points: [...state.activeStroke.points, point],
    },
  };
}

/**
 * Called on touch-up / pointer-up.
 *
 * Finalizes the active stroke:
 *  - Sets endedAtMs.
 *  - Pushes the completed RecordedStroke into state.strokes.
 *  - Clears activeStroke.
 *
 * If the active stroke has 0 points, that indicates an ABNORMAL internal
 * state (a touch-up with no preceding touch-begin point). This is preserved
 * rather than silently dropped so the issue is visible, but a console warning
 * is logged.
 *
 * A NORMAL single-tap produces a 1-point stroke:
 *   handleTouchBegin records the first point, then handleTouchEnd finalizes.
 *
 * @param state  Current recorder state.
 * @param now    performance.now() at the moment of touch-up.
 */
export function handleTouchEnd(
  state: RecorderState,
  now: number,
): RecorderState {
  if (state.isCancelled || state.activeStroke === null || state.attemptStart === null) {
    return state;
  }

  if (state.activeStroke.points.length === 0) {
    // ABNORMAL: touch-up without any recorded points.
    // Log a warning and discard this stroke rather than storing invalid data.
    console.warn(
      '[StrokeRecorder] handleTouchEnd: active stroke has 0 points — abnormal state. ' +
      'Stroke discarded. (A normal tap has 1 point from handleTouchBegin.)'
    );
    return {
      ...state,
      activeStroke: null,
    };
  }


  const endedAtMs = elapsed(state.attemptStart, now);

  const completedStroke: RecordedStroke = {
    strokeId:    state.activeStroke.strokeId,
    startedAtMs: state.activeStroke.startedAtMs,
    endedAtMs,
    points:      state.activeStroke.points,
  };
  
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[BAYA Stroke] END id=${completedStroke.strokeId} endedAt=${completedStroke.endedAtMs.toFixed(1)}`);
  }


  return {
    ...state,
    strokes:      [...state.strokes, completedStroke],
    activeStroke: null,
  };
}

/**
 * Called when a gesture is cancelled by the system (e.g. scroll took over).
 * Marks the attempt as cancelled. Requires a clear/reset before drawing resumes.
 */
export function handleTouchCancel(state: RecorderState): RecorderState {
  if (state.isCancelled) return state;

  return {
    ...state,
    isCancelled: true,
    activeStroke: null,
  };
}

/**
 * Resets all recorder state for a new attempt.
 * targetClass is NOT part of recorder state — it lives in the practice screen.
 */
export function handleReset(): RecorderState {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[BAYA Recorder Reset] reason=handleReset origin=null');
  }
  return createInitialState();
}

/**
 * Removes the last completed stroke from the state.
 */
export function handleUndo(state: RecorderState): RecorderState {
  if (state.strokes.length === 0) return state;

  const nextStrokes = state.strokes.slice(0, -1);
  const isNowEmpty = nextStrokes.length === 0 && state.activeStroke === null;
  return {
    ...state,
    strokes: nextStrokes,
    attemptStart: isNowEmpty ? null : state.attemptStart,
    canvasWidth:  isNowEmpty ? null : state.canvasWidth,
    canvasHeight: isNowEmpty ? null : state.canvasHeight,
  };
}

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

/**
 * Returns the total duration of the attempt (from first touch-down to last touch-up).
 * If there are no completed strokes, returns 0.
 * Does NOT include the time elapsed since the last touch-up.
 */
export function getDurationMs(state: RecorderState): number {
  if (state.strokes.length === 0) {
    return 0;
  }
  return state.strokes[state.strokes.length - 1].endedAtMs;
}

/**
 * Returns a value-copy of all completed strokes (not including any
 * in-progress active stroke).
 */
export function getCompletedStrokes(state: RecorderState): RecordedStroke[] {
  // Shallow copy of the array; individual stroke objects are treated as immutable.
  return [...state.strokes];
}

// ---------------------------------------------------------------------------
// Canvas/trace validation
// ---------------------------------------------------------------------------

const CANVAS_DIMENSION_TOLERANCE = 0.01;

function hasValidCanvasDimensions(width: number, height: number): boolean {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

function canvasDimensionsMatch(
  state: RecorderState,
  width: number,
  height: number,
): boolean {
  if (!hasValidCanvasDimensions(width, height)) return false;
  if (state.canvasWidth === null || state.canvasHeight === null) return true;
  return (
    Math.abs(state.canvasWidth - width) <= CANVAS_DIMENSION_TOLERANCE &&
    Math.abs(state.canvasHeight - height) <= CANVAS_DIMENSION_TOLERANCE
  );
}

/**
 * Validate a completed raw trace before it is paired with a PNG and saved.
 * Coordinates remain raw logical pixels; this function never normalizes or
 * mutates them.
 */
export function validateRecordedStrokes(
  strokes: RecordedStroke[],
  canvasWidth: number,
  canvasHeight: number,
  coordinateTolerance = 0.5,
): string[] {
  const errors: string[] = [];
  if (!hasValidCanvasDimensions(canvasWidth, canvasHeight)) {
    return ['Canvas dimensions must be finite positive numbers.'];
  }

  let previousStrokeEnd = 0;
  strokes.forEach((stroke, strokeIndex) => {
    if (stroke.strokeId !== strokeIndex) {
      errors.push(`Stroke ${strokeIndex} has non-sequential strokeId ${stroke.strokeId}.`);
    }
    if (stroke.points.length === 0) {
      errors.push(`Stroke ${stroke.strokeId} has no points.`);
    }
    if (!Number.isFinite(stroke.startedAtMs) || !Number.isFinite(stroke.endedAtMs)) {
      errors.push(`Stroke ${stroke.strokeId} has non-finite boundary timing.`);
    } else {
      if (strokeIndex === 0 && Math.abs(stroke.startedAtMs) > coordinateTolerance) {
        errors.push('The first stroke must start at t=0.');
      }
      if (stroke.startedAtMs < previousStrokeEnd - coordinateTolerance) {
        errors.push(`Stroke ${stroke.strokeId} starts before the previous stroke ended.`);
      }
      if (stroke.endedAtMs < stroke.startedAtMs - coordinateTolerance) {
        errors.push(`Stroke ${stroke.strokeId} ends before it starts.`);
      }
      previousStrokeEnd = stroke.endedAtMs;
    }

    let previousPointTime = stroke.startedAtMs;
    stroke.points.forEach((point, pointIndex) => {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.t)) {
        errors.push(`Stroke ${stroke.strokeId} point ${pointIndex} contains a non-finite value.`);
        return;
      }
      if (strokeIndex === 0 && pointIndex === 0 && Math.abs(point.t) > coordinateTolerance) {
        errors.push('The first actual touch point must have t=0.');
      }
      if (
        point.x < -coordinateTolerance || point.x > canvasWidth + coordinateTolerance ||
        point.y < -coordinateTolerance || point.y > canvasHeight + coordinateTolerance
      ) {
        errors.push(`Stroke ${stroke.strokeId} point ${pointIndex} is outside the canvas.`);
      }
      if (point.t < previousPointTime - coordinateTolerance) {
        errors.push(`Stroke ${stroke.strokeId} point ${pointIndex} has non-monotonic time.`);
      }
      if (
        point.t < stroke.startedAtMs - coordinateTolerance ||
        point.t > stroke.endedAtMs + coordinateTolerance
      ) {
        errors.push(`Stroke ${stroke.strokeId} point ${pointIndex} is outside its stroke timing bounds.`);
      }
      previousPointTime = point.t;
    });
  });

  return errors;
}
