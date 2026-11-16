import { WRITING_INPUT_LIMITS } from './writingCanvasValidation';

/** One touchpoint with normalized canvas coordinates and an optional capture timestamp in milliseconds. */
export interface TouchPoint { x: number; y: number; t?: number }
/** A sequence of touchpoints collected during one continuous drawing movement. */
export type Stroke = readonly TouchPoint[];
export type StrokeData = readonly Stroke[];

const MAX_POINTS = WRITING_INPUT_LIMITS.maxPoints;

/** Keeps normalized touchpoint coordinates within the canvas bounds [0, 1] */
export function clampTouchPoint(x: number, y: number, t?: number): TouchPoint {
  const point: TouchPoint = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  if (t !== undefined) {
    point.t = t;
  }
  return point;
}

/** Adds a touchpoint to the current stroke, respecting point spacing and the total point limit. */
export function appendTouchPoint(strokes: StrokeData, point: TouchPoint): StrokeData {
  if (!strokes.length || strokes.reduce((count, stroke) => count + stroke.length, 0) >= MAX_POINTS) return strokes;
  const last = strokes[strokes.length - 1];
  const previous = last[last.length - 1];
  if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < WRITING_INPUT_LIMITS.pointSpacing) return strokes;
  return [...strokes.slice(0, -1), [...last, point]];
}

/** Converts normalized touch points into an SVG path for displaying handwriting */
export function strokePath(stroke: Stroke): string {
  if (!stroke.length) return '';
  const xy = (point: TouchPoint) => `${(point.x * 1000).toFixed(1)},${(point.y * 1000).toFixed(1)}`;
  if (stroke.length === 1) return `M${xy(stroke[0])}`;
  if (stroke.length === 2) return `M${xy(stroke[0])} L${xy(stroke[1])}`;
  const segments = [`M${xy(stroke[0])}`];
  for (let index = 0; index < stroke.length - 1; index++) {
    const point = stroke[index];
    const next = stroke[index + 1];
    const midpoint = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };
    segments.push(`Q${xy(point)} ${xy(midpoint)}`);
  }
  const last = stroke[stroke.length - 1];
  segments.push(`Q${xy(last)} ${xy(last)}`);
  return segments.join(' ');
}
