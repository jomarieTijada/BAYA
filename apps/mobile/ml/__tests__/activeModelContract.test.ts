import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { BAYA_MODEL_CONFIG, BAYA_RECOGNITION_MODEL_URL } from '../bayaModelConfig';
import { BAYA_CLASS_LABELS } from '../bayaClassLabels';

const publicRoot = path.resolve(__dirname, '../../public');
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

it('loads only the exact authoritative ResNet18 bytes under the canonical URL', () => {
  expect(BAYA_MODEL_CONFIG.id).toBe('resnet18-1.0');
  expect(BAYA_MODEL_CONFIG.modelName).toBe('BAYA_ResNet18_1.0');
  expect(BAYA_RECOGNITION_MODEL_URL).toBe('/models/baya/BAYA_ResNet18_1.0.onnx');
  const model = fs.readFileSync(path.join(publicRoot, BAYA_RECOGNITION_MODEL_URL));
  expect(model.length).toBe(44974086);
  expect(hash(model)).toBe('fc41b21606b96b2a1fec6850259a8cbdc446d54f3d113ae8086e87310268f265');
  expect(hash(model)).toBe(BAYA_MODEL_CONFIG.onnxSha256);
  const contract = JSON.parse(fs.readFileSync(path.join(publicRoot, BAYA_MODEL_CONFIG.contractUrl), 'utf8'));
  expect(contract).toEqual(BAYA_MODEL_CONFIG);
  expect(contract.sourceModel).toBe('BAYA_ResNet18_1.0.keras');
  expect(contract.sourceSha256).toBe('9a97b5d3933bef49b955b155369c58c32ccec3cf61bfbb4f213fad2d2ca1f7b8');
  expect(contract.imageOnly).toBe(true);
  expect(contract.logicalInputs).toEqual([{ name: 'image_input', shape: [1, 96, 96, 1], dtype: 'float32' }]);
  expect(contract.output).toEqual({ name: 'Identity:0', shape: [1, 63], dtype: 'float32' });
});

it('binds all 63 outputs to this model independently exported training labels', () => {
  const bytes = fs.readFileSync(path.join(publicRoot, BAYA_MODEL_CONFIG.labelsUrl));
  expect(hash(bytes)).toBe(BAYA_MODEL_CONFIG.labelsSha256);
  const labels = JSON.parse(bytes.toString('utf8'));
  expect(Object.keys(labels.label_to_id)).toHaveLength(63);
  expect(Object.keys(labels.id_to_label)).toHaveLength(63);
  expect(new Set(Object.values(labels.label_to_id)).size).toBe(63);
  expect(BAYA_MODEL_CONFIG.orderedLabels).toEqual([...BAYA_CLASS_LABELS]);
  BAYA_MODEL_CONFIG.orderedLabels.forEach((label: string, i: number) => {
    expect(labels.label_to_id[label]).toBe(i);
    expect(labels.id_to_label[String(i)]).toBe(label);
  });
  expect(['k', 'ka', 'ke_ki', 'ko_ku'].map(label => labels.label_to_id[label])).toEqual([18, 19, 20, 21]);
});

it('binds exact model provenance to strict Python/browser and preprocessing parity', () => {
  const root = path.resolve(__dirname, '../../../../');
  const notebook = fs.readFileSync(path.join(root, BAYA_MODEL_CONFIG.preprocessing.sourceCode));
  expect(hash(notebook)).toBe(BAYA_MODEL_CONFIG.preprocessing.sourceCodeSha256);
  expect(BAYA_MODEL_CONFIG.preprocessing.cell).toBe(15);
  expect(BAYA_MODEL_CONFIG.preprocessingId).toBe('ink-square-pillow-v1');
  const parity = BAYA_MODEL_CONFIG.parity;
  expect(parity.preprocessingProvenanceConfirmed).toBe(true);
  expect(parity.checkerPassed).toBe(true);
  expect(parity.sampleCount).toBeGreaterThanOrEqual(16);
  expect(parity.top1Matches).toBe(parity.sampleCount);
  expect(parity.maximumAbsoluteDifference).toBeLessThanOrEqual(1e-5);
  const browser = BAYA_MODEL_CONFIG.browserParity;
  expect(browser.passed).toBe(true);
  expect(browser.preprocessingMaximum).toBe(0);
  expect(browser.top1Matches).toBe(browser.sampleCount);
  expect(browser.top3Matches).toBe(browser.sampleCount);
});
