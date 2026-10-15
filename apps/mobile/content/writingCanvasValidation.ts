import type { StrokeData } from './writingEngine';

/** Reuses the existing writingEngine limits; separate from model confidence. */
export const WRITING_INPUT_LIMITS = Object.freeze({ minPoints: 3, minTravel: 0.07, maxPoints: 4000, pointSpacing: 0.002, minExtent: 13 / 1000 });

export function validWritingCanvas(strokes: unknown, geometry: { width: number; height: number }): strokes is StrokeData {
  if (!Number.isFinite(geometry.width) || !Number.isFinite(geometry.height) || geometry.width <= 1 || geometry.height <= 1
    || !Array.isArray(strokes) || !strokes.length || strokes.length > WRITING_INPUT_LIMITS.maxPoints) return false;
  let count = 0, travel = 0, meaningfulPoints = 0;
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  let firstTime: number | undefined, lastTime: number | undefined;
  for (const stroke of strokes) {
    if (!Array.isArray(stroke) || !stroke.length) return false;
    count += stroke.length;
    if (count > WRITING_INPUT_LIMITS.maxPoints) return false;
    let previous: { x: number; y: number } | undefined;
    for (const point of stroke) {
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)
        || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return false;
      if (point.t !== undefined) {
        if (!Number.isFinite(point.t) || point.t < 0 || (lastTime !== undefined && point.t < lastTime)) return false;
        firstTime ??= point.t;
        lastTime = point.t;
      }
      const distance = previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0;
      if (!previous || distance >= WRITING_INPUT_LIMITS.pointSpacing) meaningfulPoints++;
      travel += distance;
      minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y);
      previous = point;
    }
  }
  // A scribbled dot cannot accumulate distance to evade the existing travel limit.
  // Require extent of at least the existing capture pen width (13/1000).
  return meaningfulPoints >= WRITING_INPUT_LIMITS.minPoints && travel >= WRITING_INPUT_LIMITS.minTravel
    && Math.max(maxX - minX, maxY - minY) >= WRITING_INPUT_LIMITS.minExtent
    && (firstTime === undefined || lastTime! > firstTime);
}
