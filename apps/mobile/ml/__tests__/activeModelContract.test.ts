import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { BAYA_MODEL_CONFIG } from '../bayaModelConfig';
import { BAYA_CLASS_LABELS, BAYA_BASE_LABELS, BAYA_MODIFIER_LABELS } from '../bayaClassLabels';

it('preserves the supplied model and metadata bytes', () => {
  for (const [file, hash] of Object.entries(BAYA_MODEL_CONFIG.sha256)) {
    const bytes = fs.readFileSync(path.resolve(__dirname, '../../public/models/baya/resnet18-v1', file));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash);
  }
});
it('preserves complete ordered label maps and the five-head contract', () => {
  expect(BAYA_CLASS_LABELS).toHaveLength(63);
  expect(new Set(BAYA_CLASS_LABELS).size).toBe(63);
  expect(BAYA_BASE_LABELS).toHaveLength(18);
  expect(BAYA_MODIFIER_LABELS).toEqual(['none', 'above', 'below', 'virama', 'not_applicable']);
  expect(BAYA_MODEL_CONFIG.logicalInputs[0].shape).toEqual([1, 3, 160, 160]);
  expect(BAYA_MODEL_CONFIG.outputs.map(o => o.shape)).toEqual([[1, 63], [1, 18], [1, 5], [1, 2], [1, 4]]);
});
