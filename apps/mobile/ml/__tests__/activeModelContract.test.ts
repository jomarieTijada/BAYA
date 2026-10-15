import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { BAYA_MODEL_CONFIG, BAYA_RECOGNITION_MODEL_URL } from '../bayaModelConfig';
import { EFFICIENTNET_CLASS_LABELS } from '../efficientNetClassLabels';

const publicRoot = path.resolve(__dirname, '../../public');
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

it('loads only the exact authoritative EfficientNet bytes under the canonical URL', () => {
  expect(BAYA_MODEL_CONFIG.id).toBe('bilstm-v1.1');
  expect(BAYA_MODEL_CONFIG.modelName).toBe('Baybayin_EfficientNetB0_BiLSTM_1.1');
  expect(BAYA_RECOGNITION_MODEL_URL).toBe('/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1.onnx');
  const model = fs.readFileSync(path.join(publicRoot, BAYA_RECOGNITION_MODEL_URL));
  expect(model.length).toBe(17175276);
  expect(hash(model)).toBe('32b63d2f36802e5792006c07f18bcc1aead2f9d20ed1181edc1feebf59ab70b1');
  expect(hash(model)).toBe(BAYA_MODEL_CONFIG.onnxSha256);
  const contract = JSON.parse(fs.readFileSync(path.join(publicRoot, BAYA_MODEL_CONFIG.contractUrl), 'utf8'));
  expect(contract).toEqual(BAYA_MODEL_CONFIG);
  expect(contract.sourceModel).toBe('Baybayin_EfficientNetB0_BiLSTM_1.1.keras');
  expect(contract.sourceSha256).toBe('067a7005b6f656fd3ba32648adee580af55cd5a05fbb03d76892627b5745c539');
  expect(contract.imageOnly).toBe(false);
  expect(contract.logicalInputs).toEqual([{ name: 'image_input', shape: [1, 96, 96, 1], dtype: 'float32' }, { name: 'sequence_input', shape: [1, 512, 6], dtype: 'float32' }]);
  expect(contract.output).toEqual({ name: 'Identity:0', shape: [1, 63], dtype: 'float32' });
});

it('binds all 63 outputs to this model independently exported training labels', () => {
  const bytes = fs.readFileSync(path.join(publicRoot, BAYA_MODEL_CONFIG.labelsUrl));
  expect(hash(bytes)).toBe(BAYA_MODEL_CONFIG.labelsSha256);
  const labels = JSON.parse(bytes.toString('utf8'));
  expect(Object.keys(labels.label_to_id)).toHaveLength(63);
  expect(Object.keys(labels.id_to_label)).toHaveLength(63);
  expect(new Set(Object.values(labels.label_to_id)).size).toBe(63);
  expect(BAYA_MODEL_CONFIG.orderedLabels).toEqual([...EFFICIENTNET_CLASS_LABELS]);
  BAYA_MODEL_CONFIG.orderedLabels.forEach((label: string, i: number) => {
    expect(labels.label_to_id[label]).toBe(i);
    expect(labels.id_to_label[String(i)]).toBe(label);
  });
  expect(['k', 'ka', 'ke_ki', 'ko_ku'].map(label => labels.label_to_id[label])).toEqual([18, 19, 20, 21]);
});

it('binds exact model provenance to strict Python/browser and preprocessing parity', () => {
  const root = path.resolve(__dirname, '../../../../');
  const notebook = fs.readFileSync(path.join(root, BAYA_MODEL_CONFIG.preprocessing.sourceNotebook));
  expect(hash(notebook)).toBe(BAYA_MODEL_CONFIG.preprocessing.notebookSha256);
  expect(BAYA_MODEL_CONFIG.preprocessing.cell).toBe(9);
  expect(BAYA_MODEL_CONFIG.preprocessingId).toBe('ink-square-pillow-v1');
  const parity = BAYA_MODEL_CONFIG.parity;
  expect(parity.preprocessingProvenanceConfirmed).toBe(true);
  expect(parity.checkerPassed).toBe(true);
  expect(parity.sampleCount).toBeGreaterThanOrEqual(16);
  expect(parity.top1Matches).toBe(parity.sampleCount);
  expect(parity.top3Matches).toBe(parity.sampleCount);
  expect(parity.maximumAbsoluteDifference).toBeLessThanOrEqual(1e-5);
  const browser = BAYA_MODEL_CONFIG.browserParity;
  expect(browser.passed).toBe(true);
  expect(browser.preprocessingMaximum).toBe(0);
  expect(browser.top1Matches).toBe(browser.sampleCount);
  expect(browser.top3Matches).toBe(browser.sampleCount);
});
