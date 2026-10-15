import fs from 'node:fs';
import path from 'node:path';
import { preprocessNotebookSequence } from '../bilstmSequence';
import { preprocessNotebookImage } from '../efficientNetPreprocessing';

const root = path.join(__dirname, 'fixtures/bilstm-v1.1');
const cases = fs.readdirSync(root).filter(name => fs.existsSync(path.join(root, name, 'sequence.f32')));
const floats = (file: string) => {
  const bytes = fs.readFileSync(file);
  return Float32Array.from({ length: bytes.length / 4 }, (_, i) => bytes.readFloatLE(i * 4));
};

it.each(cases)('matches refinement-notebook image and sequence tensors: %s', name => {
  const folder = path.join(root, name);
  const row = JSON.parse(fs.readFileSync(path.join(folder, 'input.json'), 'utf8'));
  const sequence = preprocessNotebookSequence(row);
  expect(sequence).toHaveLength(512 * 6);
  expect(sequence.every(Number.isFinite)).toBe(true);
  expect(sequence).toEqual(floats(path.join(folder, 'sequence.f32')));
  const image = preprocessNotebookImage({ width: row.width, height: row.height, data: new Uint8Array(fs.readFileSync(path.join(folder, 'input.rgba'))) });
  expect(image).toEqual(floats(path.join(folder, 'image.f32')));
});

it('keeps signed deltas, stroke starts, global time gaps, and zero masking rows', () => {
  const sequence = preprocessNotebookSequence({ duration_ms: 100, strokes: [
    { points: [{ x: 10, y: 10, t: 0 }, { x: 0, y: 0, t: 20 }] },
    { points: [{ x: 5, y: 5, t: 80 }] },
  ] });
  expect(sequence[8]).toBeLessThan(0);
  expect(sequence[9]).toBeLessThan(0);
  expect(sequence[5]).toBe(1);
  expect(sequence[11]).toBe(0);
  expect(sequence[17]).toBe(1);
  expect(sequence[16]).toBeCloseTo(0.6);
  expect(sequence.slice(18).every(value => value === 0)).toBe(true);
});
