import fs from 'node:fs';
import path from 'node:path';
import { resolveBayaPreprocessing, INK_SQUARE_PREPROCESSING_ID } from '../bayaPreprocessing';
const contract = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1_onnx_contract.json'), 'utf8'));

it('validates the sole production model external preprocessing contract', () => {
  expect(resolveBayaPreprocessing(contract)).toBe(INK_SQUARE_PREPROCESSING_ID);
});

it('rejects an unknown pipeline and a changed polarity instead of silently reusing preprocessing', () => {
  expect(() => resolveBayaPreprocessing({ ...contract, preprocessingId: 'unknown' })).toThrow('Unsupported');
  expect(() => resolveBayaPreprocessing({ ...contract, preprocessing: { ...contract.preprocessing, ink: 'gray/255' } })).toThrow('Unsupported');
});
