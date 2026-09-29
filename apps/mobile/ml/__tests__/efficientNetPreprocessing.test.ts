import fs from 'node:fs';
import path from 'node:path';
import {
  allocatePointsPerStroke,
  preprocessNotebookImage,
  preprocessNotebookSequence,
  selectEvenly,
} from '../efficientNetPreprocessing';
import { EFFICIENTNET_CLASS_LABELS, EFFICIENTNET_LABEL_TO_ID } from '../efficientNetClassLabels';
import { toNotebookSequenceRow } from '../writingRecognition';

const FIXTURES = path.join(__dirname, 'fixtures', 'efficientnet-v1');
const CASES = [
  'single-stroke', 'multi-stroke', 'kudlit-above', 'kudlit-below', 'narrow-tall',
  'wide', 'tiny-edge', 'alpha-gray', 'short-sequence', 'exact-512', 'over-512',
  'many-strokes-downsampling', 'zero-duration', 'degenerate-duration', 'blank-image',
];

function readFloat32(filePath: string): Float32Array {
  const bytes = fs.readFileSync(filePath);
  if (bytes.byteLength % Float32Array.BYTES_PER_ELEMENT !== 0) throw new Error(`Invalid float32 fixture: ${filePath}`);
  return new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

function errors(actual: Float32Array, expected: Float32Array) {
  expect(actual.length).toBe(expected.length);
  let max = 0;
  let total = 0;
  for (let index = 0; index < actual.length; index += 1) {
    const error = Math.abs(actual[index] - expected[index]);
    max = Math.max(max, error);
    total += error;
  }
  return { max, mean: total / actual.length };
}

describe('EfficientNet notebook preprocessing parity', () => {
  it('matches every image float against Python/Pillow goldens and reports aggregate error', () => {
    let total = 0;
    let maximum = 0;
    for (const name of CASES) {
      const folder = path.join(FIXTURES, name);
      const shape = JSON.parse(fs.readFileSync(path.join(folder, 'shape.json'), 'utf8')) as { sourceImage: { width: number; height: number } };
      const input = fs.readFileSync(path.join(folder, 'input.rgba'));
      const actual = preprocessNotebookImage({
        width: shape.sourceImage.width,
        height: shape.sourceImage.height,
        data: new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)),
      });
      const expected = readFloat32(path.join(folder, 'image.f32'));
      const error = errors(actual, expected);
      if (error.max !== 0) console.info(`Image fixture ${name}: maxAbs=${error.max}, meanAbs=${error.mean}`);
      total += error.mean * actual.length;
      maximum = Math.max(maximum, error.max);
      expect(error.max).toBe(0);
    }
    console.info(`Image parity: maxAbs=${maximum}, meanAbs=${total / (CASES.length * 96 * 96)}`);
  });

  it('matches all 3,072 sequence floats per case, reports feature errors, and matches stroke_start exactly', () => {
    const featureMaximum = new Array<number>(6).fill(0);
    let total = 0;
    let maximum = 0;
    let values = 0;
    for (const name of CASES) {
      const folder = path.join(FIXTURES, name);
      const row = JSON.parse(fs.readFileSync(path.join(folder, 'input.json'), 'utf8'));
      const actual = preprocessNotebookSequence(row);
      const expected = readFloat32(path.join(folder, 'sequence.f32'));
      const error = errors(actual, expected);
      maximum = Math.max(maximum, error.max);
      total += error.mean * actual.length;
      values += actual.length;
      for (let index = 0; index < actual.length; index += 1) {
        const feature = index % 6;
        featureMaximum[feature] = Math.max(featureMaximum[feature], Math.abs(actual[index] - expected[index]));
      }
      for (let step = 0; step < 512; step += 1) expect(actual[step * 6 + 5]).toBe(expected[step * 6 + 5]);
      expect(error.max).toBeLessThanOrEqual(1e-7);
    }
    console.info(`Sequence parity: maxAbs=${maximum}, meanAbs=${total / values}, featureMax=${JSON.stringify(featureMaximum)}`);
  });

  it('uses the complete sorted 63-class mapping validated by the notebook', () => {
    const notebookMapping = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'class-mapping.json'), 'utf8')) as {
      class_labels: string[];
      label_to_id: Record<string, number>;
    };
    expect(EFFICIENTNET_CLASS_LABELS).toHaveLength(63);
    expect([...EFFICIENTNET_CLASS_LABELS]).toEqual([...EFFICIENTNET_CLASS_LABELS].sort());
    expect(Object.keys(EFFICIENTNET_LABEL_TO_ID)).toHaveLength(63);
    expect([...EFFICIENTNET_CLASS_LABELS]).toEqual(notebookMapping.class_labels);
    expect(EFFICIENTNET_LABEL_TO_ID).toEqual(notebookMapping.label_to_id);
    expect(EFFICIENTNET_CLASS_LABELS.slice(0, 20)).toEqual([
      'a', 'b', 'ba', 'be_bi', 'bo_bu', 'd', 'da_ra', 'de_di', 'do_du', 'e_i',
      'g', 'ga', 'ge_gi', 'go_gu', 'h', 'ha', 'he_hi', 'ho_hu', 'k', 'ka',
    ]);
    EFFICIENTNET_CLASS_LABELS.forEach((label, index) => expect(EFFICIENTNET_LABEL_TO_ID[label]).toBe(index));
  });

  it('records the constants and preprocessing metadata recovered from the notebook cells', () => {
    const audit = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'notebook-audit.json'), 'utf8'));
    expect(audit.constants).toEqual({
      IMG_HEIGHT: 96,
      IMG_WIDTH: 96,
      IMG_CHANNELS: 1,
      SEQ_FEATURES: 6,
      MAX_SEQ_LEN: 512,
      IMAGE_PADDING_RATIO: 0.15,
      INK_THRESHOLD: 0.08,
      TRAJECTORY_PADDING_RATIO: 0.15,
    });
    expect(audit.preprocessingMetadata.sequence_features).toEqual([
      'x_shape', 'y_shape', 'dx', 'dy', 'dt_norm', 'stroke_start',
    ]);
    expect(audit.preprocessingMetadata.sequence_overflow_rule).toBe('stroke-preserving proportional downsampling');
    expect(audit.metadataVerifiedInSource).toBe(true);
    expect(audit.classGroupValidationFromExecutedCell41).toEqual({ count: 63, missing: 0, extra: 0, duplicates: 0 });
  });

  it('reproduces notebook allocation, NumPy ties-to-even selection and padding edge behavior', () => {
    expect(allocatePointsPerStroke([301, 277])).toEqual([267, 245]);
    expect(allocatePointsPerStroke([520, 520, 520, 520])).toEqual([128, 128, 128, 128]);
    expect(selectEvenly([0, 1, 2, 3, 4], 3)).toEqual([0, 2, 4]);
    expect(selectEvenly([0, 1, 2, 3, 4, 5], 4)).toEqual([0, 2, 3, 5]);
  });

  it('preserves absolute point timestamps and derives the notebook duration_ms across strokes', () => {
    const row = toNotebookSequenceRow([
      [{ x: 0.1, y: 0.2, t: 1_000 }, { x: 0.3, y: 0.4, t: 1_040 }],
      [{ x: 0.8, y: 0.9, t: 1_125 }],
    ], { width: 200, height: 100 });
    expect(row.duration_ms).toBe(125);
    expect(row.strokes[1].points[0]).toEqual({ x: 160, y: 90, t: 1_125 });
  });
});
