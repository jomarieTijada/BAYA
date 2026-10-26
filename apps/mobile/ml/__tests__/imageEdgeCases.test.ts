import { preprocessNotebookImage, type RgbaImage } from '../inkImagePreprocessing';

function raster(width: number, height: number, ink: (x: number, y: number) => boolean, value = 0): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!ink(x, y)) continue;
    const offset = (y * width + x) * 4;
    data[offset] = data[offset + 1] = data[offset + 2] = value;
  }
  return { width, height, data };
}

describe('validated image preprocessing boundaries', () => {
  it.each([
    ['empty', 32, 21, () => false, 255],
    ['weak tiny mark', 32, 32, (x: number, y: number) => x === 5 && y === 5, 250],
    ['single dot', 1, 1, () => true, 0],
    ['short line', 32, 32, (x: number, y: number) => x >= 4 && x <= 8 && y === 4, 0],
    ['small character', 100, 100, (x: number, y: number) => x >= 40 && x <= 44 && y >= 40 && y <= 44, 0],
    ['large edge touching', 97, 51, () => true, 0],
    ['off center', 120, 90, (x: number, y: number) => x > 100 && y < 10, 0],
    ['thin stroke', 21, 75, (x: number) => x === 10, 0],
    ['thick stroke', 60, 100, (x: number) => x >= 20 && x <= 40, 0],
    ['disconnected marks', 90, 45, (x: number, y: number) => (x < 8 && y < 7) || (x > 80 && y > 37), 0],
  ])('produces finite deterministic 96x96 ink for %s', (_name, width, height, ink, value) => {
    const image = raster(width as number, height as number, ink as (x: number, y: number) => boolean, value as number);
    const output = preprocessNotebookImage(image);
    expect(output).toHaveLength(96 * 96);
    expect(output.every(v => Number.isFinite(v) && v >= 0 && v <= 1)).toBe(true);
    expect(output).toEqual(preprocessNotebookImage(image));
    if (_name === 'empty') expect(output.every(v => v === 0)).toBe(true);
  });

  it('recenters translated identical ink deterministically', () => {
    const first = raster(100, 80, (x, y) => x >= 5 && x <= 20 && y >= 8 && y <= 37);
    const second = raster(100, 80, (x, y) => x >= 65 && x <= 80 && y >= 40 && y <= 69);
    expect(preprocessNotebookImage(first)).toEqual(preprocessNotebookImage(second));
  });

  it('composites transparent pixels onto white', () => {
    const image = raster(13, 27, () => true);
    for (let i = 3; i < image.data.length; i += 4) image.data[i] = 0;
    expect(preprocessNotebookImage(image).every(v => v === 0)).toBe(true);
  });

  it.each([
    null, { width: 0, height: 1, data: new Uint8Array(0) },
    { width: -1, height: 1, data: new Uint8Array(0) },
    { width: NaN, height: 1, data: new Uint8Array(4) },
    { width: 1.5, height: 1, data: new Uint8Array(4) },
    { width: Number.MAX_SAFE_INTEGER, height: 2, data: new Uint8Array(4) },
    { width: 1, height: 1, data: null },
    { width: 1, height: 1, data: [0, 0, 0, 255] },
    { width: 1, height: 1, data: new Uint8Array(3) },
  ])('rejects malformed RGBA input safely', image => {
    expect(() => preprocessNotebookImage(image as RgbaImage)).toThrow();
  });
});
