import { validWritingCanvas, WRITING_INPUT_LIMITS } from '../writingCanvasValidation';

const size = { width: 400, height: 250 };
const sample = [[{ x: 0.1, y: 0.2, t: 10 }, { x: 0.5, y: 0.6, t: 30 }, { x: 0.8, y: 0.2, t: 50 }]];
describe('canvas input validity, separate from recognition', () => {
  it('accepts meaningful drawing and legacy samples with no timestamps', () => {
    expect(validWritingCanvas(sample, size)).toBe(true);
    expect(validWritingCanvas(sample.map(s => s.map(({ x, y }) => ({ x, y }))), size)).toBe(true);
  });
  it.each([[], [[]], null, {}, [null], [[null]], [[{ x: 0.5, y: 0.5 }]], [[{ x: 0.1, y: 0.1 }, { x: 0.101, y: 0.1 }, { x: 0.102, y: 0.1 }]]].map(data => ({ data })))('rejects empty, malformed, tap or short data: $data', ({ data }) => {
    expect(validWritingCanvas(data, size)).toBe(false);
  });
  it.each([NaN, Infinity, -Infinity, -0.1, 1.1, null, undefined])('rejects invalid coordinates %s', x => {
    expect(validWritingCanvas([[{ ...sample[0][0], x }, ...sample[0].slice(1)]], size)).toBe(false);
  });
  it('rejects zero-length duplicates and a tiny high-point-count scribble', () => {
    expect(validWritingCanvas([Array(20).fill(sample[0][0])], size)).toBe(false);
    expect(validWritingCanvas([Array.from({ length: 200 }, (_, i) => ({ x: 0.5 + i % 2 * 0.003, y: 0.5, t: i }))], size)).toBe(false);
  });
  it.each([NaN, Infinity, -1, 0])('rejects invalid canvas dimension %s', width => {
    expect(validWritingCanvas(sample, { width, height: 200 })).toBe(false);
  });
  it('rejects unmeasured capture, excessive points and strokes before flattening', () => {
    expect(validWritingCanvas(sample, { width: 1, height: 1 })).toBe(false);
    expect(validWritingCanvas([Array(WRITING_INPUT_LIMITS.maxPoints + 1).fill(sample[0][0])], size)).toBe(false);
    expect(validWritingCanvas(Array(WRITING_INPUT_LIMITS.maxPoints + 1).fill(sample[0]), size)).toBe(false);
  });
  it('rejects malformed, decreasing and zero-duration timestamps', () => {
    for (const t of [NaN, Infinity, -1]) expect(validWritingCanvas([[{ ...sample[0][0], t }, ...sample[0].slice(1)]], size)).toBe(false);
    expect(validWritingCanvas([sample[0].map(p => ({ ...p, t: 0 }))], size)).toBe(false);
    expect(validWritingCanvas([[sample[0][2], sample[0][1], sample[0][0]]], size)).toBe(false);
  });
});
