/** Pure TypeScript port of the EfficientNet notebook preprocessing (cells 17/19). */

export const IMAGE_HEIGHT = 96;
export const IMAGE_WIDTH = 96;
export const IMAGE_CHANNELS = 1;
export const IMAGE_PADDING_RATIO = 0.15;
export const INK_THRESHOLD = 0.08;
export const MAX_SEQUENCE_LENGTH = 512;
export const SEQUENCE_FEATURES = 6;
export const TRAJECTORY_PADDING_RATIO = 0.15;

export type RgbaImage = {
  width: number;
  height: number;
  /** Row-major, 8-bit RGBA pixels. */
  data: Uint8Array | Uint8ClampedArray;
};

export type NotebookPoint = { x: number; y: number; t?: number };
export type NotebookStroke = { points?: NotebookPoint[] };
export type NotebookSequenceRow = {
  strokes: NotebookStroke[];
  duration_ms?: number | null;
};

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Python round()/NumPy round() tie behavior (nearest, ties to even). */
function roundTiesToEven(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  if (fraction < 0.5) return lower;
  if (fraction > 0.5) return lower + 1;
  return lower % 2 === 0 ? lower : lower + 1;
}

function rgbaToPillowGray(image: RgbaImage): Uint8Array {
  if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width <= 0 || image.height <= 0) {
    throw new Error('RGBA image dimensions must be positive integers');
  }
  if (image.data.length !== image.width * image.height * 4) {
    throw new Error(`Expected ${image.width * image.height * 4} RGBA bytes, received ${image.data.length}`);
  }

  const ink = new Uint8Array(image.width * image.height);
  for (let pixel = 0; pixel < ink.length; pixel += 1) {
    const offset = pixel * 4;
    const alpha = image.data[offset + 3];
    // Pillow Image.alpha_composite over opaque white, retaining 8-bit rounding.
    const red = Math.floor((image.data[offset] * alpha + 255 * (255 - alpha) + 127) / 255);
    const green = Math.floor((image.data[offset + 1] * alpha + 255 * (255 - alpha) + 127) / 255);
    const blue = Math.floor((image.data[offset + 2] * alpha + 255 * (255 - alpha) + 127) / 255);
    // Pillow's RGB -> L conversion uses ITU-R 601-2 fixed-point coefficients.
    const gray = (red * 19595 + green * 38470 + blue * 7471 + 32768) >> 16;
    ink[pixel] = gray;
  }
  return ink;
}

type ResampleContributor = { start: number; weights: Int32Array };
const RESAMPLE_PRECISION_BITS = 22;
const RESAMPLE_PRECISION = 1 << RESAMPLE_PRECISION_BITS;

/** Reproduce Pillow's 8-bit BILINEAR resampler, including fixed-point rounding. */
function makeBilinearContributors(inputSize: number, outputSize: number): ResampleContributor[] {
  const scale = inputSize / outputSize;
  const filterScale = Math.max(1, scale);
  const support = filterScale;
  const contributors: ResampleContributor[] = [];

  for (let output = 0; output < outputSize; output += 1) {
    const center = (output + 0.5) * scale;
    const first = Math.max(0, Math.floor(center - support + 0.5));
    const last = Math.min(inputSize, Math.floor(center + support + 0.5));
    const raw: number[] = [];
    let total = 0;
    for (let input = first; input < last; input += 1) {
      const distance = Math.abs((input + 0.5 - center) / filterScale);
      const weight = Math.max(0, 1 - distance);
      raw.push(weight);
      total += weight;
    }
    const weights = Int32Array.from(raw, (weight) => Math.floor((weight / total) * RESAMPLE_PRECISION + 0.5));
    contributors.push({ start: first, weights });
  }
  return contributors;
}

function resizeHorizontal(source: Uint8Array, width: number, height: number, outputWidth: number): Uint8Array {
  const contributors = makeBilinearContributors(width, outputWidth);
  const output = new Uint8Array(outputWidth * height);
  const rounding = 1 << (RESAMPLE_PRECISION_BITS - 1);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < outputWidth; x += 1) {
      const contributor = contributors[x];
      let sum = rounding;
      for (let i = 0; i < contributor.weights.length; i += 1) {
        sum += source[y * width + contributor.start + i] * contributor.weights[i];
      }
      output[y * outputWidth + x] = clamp(sum >> RESAMPLE_PRECISION_BITS, 0, 255);
    }
  }
  return output;
}

function resizeVertical(source: Uint8Array, width: number, height: number, outputHeight: number): Uint8Array {
  const contributors = makeBilinearContributors(height, outputHeight);
  const output = new Uint8Array(width * outputHeight);
  const rounding = 1 << (RESAMPLE_PRECISION_BITS - 1);
  for (let y = 0; y < outputHeight; y += 1) {
    const contributor = contributors[y];
    for (let x = 0; x < width; x += 1) {
      let sum = rounding;
      for (let i = 0; i < contributor.weights.length; i += 1) {
        sum += source[(contributor.start + i) * width + x] * contributor.weights[i];
      }
      output[y * width + x] = clamp(sum >> RESAMPLE_PRECISION_BITS, 0, 255);
    }
  }
  return output;
}

/** Implements the notebook's RGBA -> white composite -> ink crop/square -> PIL resize pipeline. */
export function preprocessNotebookImage(image: RgbaImage): Float32Array {
  const grayBytes = rgbaToPillowGray(image);
  const ink = new Float32Array(grayBytes.length);
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const index = y * image.width + x;
      const grayValue = Math.fround(grayBytes[index] / 255);
      const value = Math.fround(1 - grayValue);
      ink[index] = value;
      if (value > INK_THRESHOLD) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  let side: number;
  let square: Float32Array;
  if (maxX >= minX && maxY >= minY) {
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const maxDimension = Math.max(cropHeight, cropWidth);
    const padding = Math.max(2, roundTiesToEven(maxDimension * IMAGE_PADDING_RATIO));
    side = maxDimension + 2 * padding;
    square = new Float32Array(side * side);
    const top = Math.floor((side - cropHeight) / 2);
    const left = Math.floor((side - cropWidth) / 2);
    for (let y = 0; y < cropHeight; y += 1) {
      const src = (minY + y) * image.width + minX;
      const dst = (top + y) * side + left;
      square.set(ink.subarray(src, src + cropWidth), dst);
    }
  } else {
    // The notebook retains the complete source-sized ink raster on blank input.
    side = 0;
    square = ink;
  }

  const squareU8 = Uint8Array.from(square, (value) => clamp(Math.trunc(Math.fround(value * 255)), 0, 255));
  const resizedX = resizeHorizontal(squareU8, maxX >= minX && maxY >= minY ? side : image.width, maxX >= minX && maxY >= minY ? side : image.height, IMAGE_WIDTH);
  const resized = resizeVertical(resizedX, IMAGE_WIDTH, maxX >= minX && maxY >= minY ? side : image.height, IMAGE_HEIGHT);
  const result = new Float32Array(IMAGE_HEIGHT * IMAGE_WIDTH);
  for (let index = 0; index < result.length; index += 1) result[index] = Math.fround(resized[index] / 255);
  return result;
}

/** Port allocate_points_per_stroke from notebook cell 19. */
export function allocatePointsPerStroke(lengths: number[], maxTotal = MAX_SEQUENCE_LENGTH): number[] {
  const count = lengths.length;
  if (count === 0) return [];
  const total = lengths.reduce((sum, length) => sum + length, 0);
  if (total <= maxTotal) return [...lengths];
  const minEach = maxTotal >= 2 * count ? 2 : 1;
  const base = lengths.map((length) => Math.min(minEach, length));
  const remaining = maxTotal - base.reduce((sum, length) => sum + length, 0);
  if (remaining <= 0) return base;
  const capacity = lengths.map((length, index) => Math.max(0, length - base[index]));
  const capacityTotal = capacity.reduce((sum, length) => sum + length, 0);
  if (capacityTotal === 0) return base;
  const rawExtra = capacity.map((value) => (remaining * value) / capacityTotal);
  const extra = rawExtra.map(Math.floor);
  const allocation = base.map((value, index) => value + extra[index]);
  let leftover = maxTotal - allocation.reduce((sum, value) => sum + value, 0);
  const order = rawExtra.map((value, index) => ({ index, fraction: value - extra[index] }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);
  for (const { index } of order) {
    if (leftover <= 0) break;
    if (allocation[index] < lengths[index]) {
      allocation[index] += 1;
      leftover -= 1;
    }
  }
  return allocation;
}

/** Port select_evenly from notebook cell 19. */
export function selectEvenly<T>(points: T[], targetCount: number): T[] {
  if (targetCount >= points.length) return points;
  if (targetCount <= 1) return [points[0]];
  const indices: number[] = [];
  for (let index = 0; index < targetCount; index += 1) {
    const position = (index * (points.length - 1)) / (targetCount - 1);
    const rounded = roundTiesToEven(position);
    if (indices[indices.length - 1] !== rounded) indices.push(rounded);
  }
  if (indices.length < targetCount) {
    const used = new Set(indices);
    for (let index = 0; index < points.length && indices.length < targetCount; index += 1) {
      if (!used.has(index)) indices.push(index);
    }
    indices.sort((left, right) => left - right);
  }
  return indices.slice(0, targetCount).map((index) => points[index]);
}

function trajectoryTransform(strokes: NotebookStroke[]): [number, number, number] {
  const points = strokes.flatMap((stroke) => stroke.points ?? []);
  if (points.length === 0) return [0, 0, 1];
  const xs = points.map((point) => Math.fround(Number(point.x)));
  const ys = points.map((point) => Math.fround(Number(point.y)));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const handwritingSize = Math.max(maxX - minX, maxY - minY, 1e-6);
  return [centerX, centerY, handwritingSize * (1 + 2 * TRAJECTORY_PADDING_RATIO)];
}

/** Port build_sequence from notebook cell 19. Returns row-major float32 [512,6]. */
export function preprocessNotebookSequence(row: NotebookSequenceRow): Float32Array {
  const duration = Math.max(Number(row.duration_ms || 0), 1);
  const cleanStrokes = row.strokes.filter((stroke) => (stroke.points?.length ?? 0) > 0);
  const output = new Float32Array(MAX_SEQUENCE_LENGTH * SEQUENCE_FEATURES);
  if (cleanStrokes.length === 0) return output;

  const [centerX, centerY, scale] = trajectoryTransform(cleanStrokes);
  const lengths = cleanStrokes.map((stroke) => stroke.points!.length);
  const allocations = allocatePointsPerStroke(lengths, MAX_SEQUENCE_LENGTH);
  const sampled = cleanStrokes.map((stroke, index) => selectEvenly(stroke.points!, allocations[index]));
  let featureIndex = 0;
  let previousGlobalTime: number | null = null;

  for (const strokePoints of sampled) {
    let previousX: number | null = null;
    let previousY: number | null = null;
    for (let pointIndex = 0; pointIndex < strokePoints.length; pointIndex += 1) {
      const point = strokePoints[pointIndex];
      const rawX = Number(point.x);
      const rawY = Number(point.y);
      const time = Number(point.t ?? 0);
      const x = ((rawX - centerX) / scale) + 0.5;
      const y = ((rawY - centerY) / scale) + 0.5;
      const strokeStart = pointIndex === 0 ? 1 : 0;
      const dx = pointIndex === 0 ? 0 : x - (previousX as number);
      const dy = pointIndex === 0 ? 0 : y - (previousY as number);
      const dt = previousGlobalTime === null ? 0 : clamp(Math.max(0, time - previousGlobalTime) / duration, 0, 1);
      output[featureIndex++] = clamp(x, 0, 1);
      output[featureIndex++] = clamp(y, 0, 1);
      output[featureIndex++] = dx;
      output[featureIndex++] = dy;
      output[featureIndex++] = dt;
      output[featureIndex++] = strokeStart;
      previousX = x;
      previousY = y;
      previousGlobalTime = time;
    }
  }
  return output;
}
