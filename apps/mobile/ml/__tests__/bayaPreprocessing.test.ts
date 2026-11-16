import fs from 'node:fs';
import path from 'node:path';
import { preprocessBayaImage, preprocessBayaImageWithTransform, modelPointToSource } from '../bayaPreprocessing';
import reference from './fixtures/resnet18-spatial-v1/reference.json';
const root = path.resolve(__dirname, 'fixtures/resnet18-spatial-v1');
const image = (width = 80, height = 50) => ({ width, height, data: new Uint8ClampedArray(width * height * 4).fill(255) });
function dot(im: ReturnType<typeof image>, x: number, y: number, rgba = [0, 0, 0, 255]) { im.data.set(rgba, (y * im.width + x) * 4); }

it.each(reference.samples)('matches notebook OpenCV/Pillow tensor: $id', sample => {
  const actual = preprocessBayaImage({ width: sample.width, height: sample.height, data: fs.readFileSync(path.join(root, sample.id + '.rgba')) });
  const bytes = fs.readFileSync(path.join(root, sample.id + '.f32'));
  const expected = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
  let maximum = 0, differences = 0;
  for (let i = 0; i < actual.length; i++) { maximum = Math.max(maximum, Math.abs(actual[i] - expected[i])); if (actual[i] !== expected[i]) differences++; }
  expect({ maximum, differences }).toEqual({ maximum: 0, differences: 0 });
});
it('rejects blank, transparent and malformed images', () => {
  expect(() => preprocessBayaImage(image())).toThrow('visible character');
  const im = image(); im.data.fill(0);
  expect(() => preprocessBayaImage(im)).toThrow('visible character');
  expect(() => preprocessBayaImage({ ...im, width: 2 })).toThrow('dimensions');
});
it('centers complete ink, keeps aspect ratio, padding and an invertible transform', () => {
  const im = image(); dot(im, 10, 10); dot(im, 29, 19);
  const { imageData, transform } = preprocessBayaImageWithTransform(im);
  expect(imageData.length).toBe(3 * 160 * 160);
  expect(transform.scale).toBeCloseTo(160 / (20 * 1.34));
  expect(modelPointToSource([.5, .5], transform)[0]).toBeCloseTo(19.5);
  expect(modelPointToSource([.5, .5], transform)[1]).toBeCloseTo(14.5);
  for (const point of [[0, 0], [79, 49], [13, 17]]) {
    const mapped = modelPointToSource([(point[0] * transform.scale + transform.offsetX) / 160, (point[1] * transform.scale + transform.offsetY) / 160], transform);
    expect(mapped[0]).toBeCloseTo(point[0]); expect(mapped[1]).toBeCloseTo(point[1]);
  }
});
it('uses NCHW ImageNet normalization, white borders and minimum padded side', () => {
  const im = image(); dot(im, 20, 20); dot(im, 21, 20);
  const { imageData, transform } = preprocessBayaImageWithTransform(im);
  expect(transform.scale).toBeCloseTo(160 / 13.4);
  [.485, .456, .406].forEach((mean, c) => expect(imageData[c * 25600]).toBeCloseTo((1 - mean) / [.229, .224, .225][c]));
});
it('composites transparent ink over white and preserves grayscale channel order', () => {
  const transparent = image(), white = image();
  dot(transparent, 20, 20); dot(white, 20, 20); dot(transparent, 21, 20); dot(white, 21, 20);
  dot(transparent, 50, 35, [0, 0, 0, 0]);
  expect(preprocessBayaImage(transparent)).toEqual(preprocessBayaImage(white));
});
