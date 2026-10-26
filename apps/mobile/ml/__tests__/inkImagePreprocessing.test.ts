import fs from 'node:fs';
import path from 'node:path';
import { preprocessNotebookImage } from '../inkImagePreprocessing';
import { BAYA_CLASS_LABELS } from '../bayaClassLabels';

const root = path.join(__dirname, 'fixtures/imagenet-finetune-1.0');
const audit = JSON.parse(fs.readFileSync(path.join(root, 'training-audit.json'), 'utf8'));

it('preserves the historical fixture class order at every output index', () => {
  expect(audit.orderedLabels).toHaveLength(63);
  expect(audit.orderedLabels).toEqual([...BAYA_CLASS_LABELS]);
  expect(audit.preprocessingCell).toBe(18);
  expect(audit.notebookSha256).toBe('20dc57f5bac5b7036377ea01e510d69fc02eb455689bf9302caf25264b07629e');
});

it('matches the shared Pillow pipeline golden floats on 94 glyphs and 15 edge cases', () => {
  expect(audit.samples).toHaveLength(109);
  let maximum = 0;
  for (const sample of audit.samples) {
    const folder = path.join(root, sample.id);
    const input = fs.readFileSync(path.join(folder, 'input.rgba'));
    const bytes = fs.readFileSync(path.join(folder, 'image.f32'));
    const expected = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    const actual = preprocessNotebookImage({ width: sample.width, height: sample.height, data: input });
    expect(actual).toHaveLength(96 * 96);
    for (let i = 0; i < actual.length; i++) maximum = Math.max(maximum, Math.abs(actual[i] - expected[i]));
  }
  expect(maximum).toBe(0);
});
