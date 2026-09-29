import { writingReferenceMasks } from './writingReferenceMasks';

/** Canvas coordinates plus an optional monotonic capture timestamp in milliseconds. */
export interface StrokePoint { x: number; y: number; t?: number }
export type Stroke = readonly StrokePoint[];
export type StrokeData = readonly Stroke[];

export interface WritingAttempt {
  characterId: string;
  strokeData: StrokeData;
  imageData: string | null;
  /** Local visual-similarity estimate, not OCR/classification confidence. */
  confidence: number;
  result: 'similar' | 'keep_practicing';
}

const GRID = 32;
const MAX_POINTS = 4000;

export function clampPoint(x: number, y: number, t?: number): StrokePoint {
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)), ...(t === undefined ? {} : { t }) };
}

export function appendStrokePoint(strokes: StrokeData, point: StrokePoint): StrokeData {
  if (!strokes.length || strokes.reduce((count, stroke) => count + stroke.length, 0) >= MAX_POINTS) return strokes;
  const last = strokes[strokes.length - 1];
  const previous = last[last.length - 1];
  if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.002) return strokes;
  return [...strokes.slice(0, -1), [...last, point]];
}

export function strokePath(stroke: Stroke): string {
  if (!stroke.length) return '';
  const xy = (point: StrokePoint) => `${(point.x * 1000).toFixed(1)},${(point.y * 1000).toFixed(1)}`;
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

function rasterize(strokes: StrokeData): number[] {
  const points = strokes.flat();
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const spanX = Math.max(0.02, Math.max(...xs) - minX);
  const spanY = Math.max(0.02, Math.max(...ys) - minY);
  const scale = 26 / Math.max(spanX, spanY);
  const offsetX = (GRID - spanX * scale) / 2;
  const offsetY = (GRID - spanY * scale) / 2;
  const grid = new Set<number>();
  const mark = (point: StrokePoint) => {
    const x = Math.round((point.x - minX) * scale + offsetX);
    const y = Math.round((point.y - minY) * scale + offsetY);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (x + dx >= 0 && x + dx < GRID && y + dy >= 0 && y + dy < GRID) grid.add((y + dy) * GRID + x + dx);
    }
  };
  for (const stroke of strokes) {
    if (!stroke.length) continue;
    mark(stroke[0]);
    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i - 1], b = stroke[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * scale * 2));
      for (let step = 1; step <= steps; step++) mark({ x: a.x + (b.x - a.x) * step / steps, y: a.y + (b.y - a.y) * step / steps });
    }
  }
  return [...grid];
}

function meanNearest(source: readonly number[], target: readonly number[]): number {
  if (!source.length || !target.length) return GRID;
  let sum = 0;
  for (const pixel of source) {
    const x = pixel % GRID, y = Math.floor(pixel / GRID);
    let closest = GRID;
    for (const candidate of target) {
      const distance = Math.hypot(x - candidate % GRID, y - Math.floor(candidate / GRID));
      if (distance < closest) closest = distance;
    }
    sum += closest;
  }
  return sum / source.length;
}

/** Offline shape feedback. It never claims to identify a character or act as OCR. */
export function evaluateWriting(characterId: string, strokes: StrokeData): WritingAttempt | null {
  const template = writingReferenceMasks[characterId];
  if (!template) return null;
  const points = strokes.flat();
  if (points.length < 3) return null;
  const traveled = strokes.reduce((sum, stroke) => sum + stroke.slice(1).reduce((length, point, index) => length + Math.hypot(point.x - stroke[index].x, point.y - stroke[index].y), 0), 0);
  if (traveled < 0.07) return null;
  const learner = rasterize(strokes);
  const reference = Array.from(template).flatMap((cell, index) => cell === '1' ? [index] : []);
  const distance = (meanNearest(learner, reference) + meanNearest(reference, learner)) / 2;
  const confidence = Math.round(Math.max(0, Math.min(1, 1 - distance / 8)) * 100) / 100;
  return { characterId, strokeData: strokes, imageData: null, confidence, result: confidence >= 0.65 ? 'similar' : 'keep_practicing' };
}
