import metadata from '../public/models/baya/resnet18-v1/preprocessing.json';
import { BayaModelError } from './BayaModelError';

export type RgbaImage = { width: number; height: number; data: Uint8Array | Uint8ClampedArray };
export type ImageTransform = { scale: number; offsetX: number; offsetY: number; sourceWidth: number; sourceHeight: number };
export const INPUT_SIZE = 160;
const PIXELS = INPUT_SIZE * INPUT_SIZE;

function roundEven(value: number): number {
  const floor = Math.floor(value), fraction = value - floor;
  return fraction === 0.5 ? floor + (floor % 2 === 0 ? 0 : 1) : Math.round(value);
}

/** Inverse affine map from normalized model coordinates to capture pixels. */
export function modelPointToSource(point: readonly [number, number], transform: ImageTransform): [number, number] {
  return [(point[0] * INPUT_SIZE - transform.offsetX) / transform.scale,
    (point[1] * INPUT_SIZE - transform.offsetY) / transform.scale];
}

export function preprocessBayaImageWithTransform(image: RgbaImage) {
  const { width, height, data } = image;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0
    || data.length !== width * height * 4) throw new BayaModelError('INVALID_INPUT', 'Invalid RGBA image dimensions.');
  if (metadata.input_layout !== 'NCHW' || metadata.input_size !== INPUT_SIZE || metadata.input_channels !== 3
    || metadata.input_dtype !== 'float32') throw new BayaModelError('MODEL_CONTRACT_INVALID', 'Unsupported preprocessing metadata.');
  const gray = new Uint8Array(width * height);
  let minX = width, minY = height, maxX = -1, maxY = -1, inkPixels = 0;
  for (let i = 0; i < gray.length; i++) {
    const alpha = data[i * 4 + 3] / 255;
    const r = Math.round(data[i * 4] * alpha + 255 * (1 - alpha));
    const g = Math.round(data[i * 4 + 1] * alpha + 255 * (1 - alpha));
    const b = Math.round(data[i * 4 + 2] * alpha + 255 * (1 - alpha));
    gray[i] = (19595 * r + 38470 * g + 7471 * b + 32768) >>> 16;
    if (gray[i] < 225) {
      inkPixels++;
      const x = i % width, y = Math.floor(i / width);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  if (inkPixels < 2) throw new BayaModelError('INSUFFICIENT_INPUT', 'Write a visible character before asking BAYA to recognize it.');
  const side = Math.max(10, maxX - minX + 1, maxY - minY + 1) * 1.34;
  const exactScale = INPUT_SIZE / side;
  const scale = Math.fround(exactScale);
  const transform: ImageTransform = { scale, offsetX: Math.fround(INPUT_SIZE / 2 - (minX + maxX) / 2 * exactScale),
    offsetY: Math.fround(INPUT_SIZE / 2 - (minY + maxY) / 2 * exactScale), sourceWidth: width, sourceHeight: height };
  const pixel = (x: number, y: number) => x < 0 || y < 0 || x >= width || y >= height ? 255 : gray[y * width + x];
  const imageData = new Float32Array(3 * PIXELS);
  for (let y = 0; y < INPUT_SIZE; y++) for (let x = 0; x < INPUT_SIZE; x++) {
    // OpenCV INTER_LINEAR: 10-bit affine arithmetic, 5-bit interpolation table,
    // and uint8 rounding. The notebook constructs its affine matrix as float32.
    const sx = Math.floor((roundEven(x / scale * 1024) + roundEven(-transform.offsetX / scale * 1024) + 16) / 32);
    const sy = Math.floor((roundEven(y / scale * 1024 - transform.offsetY / scale * 1024) + 16) / 32);
    const x0 = Math.floor(sx / 32), y0 = Math.floor(sy / 32), dx = sx / 32 - x0, dy = sy / 32 - y0;
    const resized = Math.round((pixel(x0, y0) * (1 - dx) + pixel(x0 + 1, y0) * dx) * (1 - dy)
      + (pixel(x0, y0 + 1) * (1 - dx) + pixel(x0 + 1, y0 + 1) * dx) * dy);
    const value = Math.fround(1 - Math.fround((255 - resized) / 255));
    for (let c = 0; c < 3; c++) imageData[c * PIXELS + y * INPUT_SIZE + x] =
      Math.fround(Math.fround(value - Math.fround(metadata.rgb_mean[c])) / Math.fround(metadata.rgb_std[c]));
  }
  return { imageData, transform };
}

export function preprocessBayaImage(image: RgbaImage): Float32Array {
  return preprocessBayaImageWithTransform(image).imageData;
}
