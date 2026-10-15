/** Pure TypeScript port of the EfficientNet image preprocessing (cell 18). */

export const IMAGE_HEIGHT = 96;
export const IMAGE_WIDTH = 96;
export const IMAGE_CHANNELS = 1;
export const IMAGE_PADDING_RATIO = 0.15;
export const INK_THRESHOLD = 0.08;

export type RgbaImage = {
  width: number;
  height: number;
  /** Row-major, 8-bit RGBA pixels. */
  data: Uint8Array | Uint8ClampedArray;
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
  if (!image || !Number.isSafeInteger(image.width) || !Number.isSafeInteger(image.height) || image.width <= 0 || image.height <= 0
    || !Number.isSafeInteger(image.width * image.height * 4)) {
    throw new Error('RGBA image dimensions must be positive integers');
  }
  if (!(image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) throw new Error('RGBA image data must contain 8-bit bytes');
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
