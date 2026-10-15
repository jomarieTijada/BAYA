import { BAYA_MODEL_CONFIG } from './bayaModelConfig';
import { preprocessNotebookImage, type RgbaImage } from './efficientNetPreprocessing';

export const INK_SQUARE_PREPROCESSING_ID = 'ink-square-pillow-v1';

type ImageContract = {
  preprocessing: Record<string, unknown>;
  preprocessingId?: string;
};

// Require the verified external image steps; model-internal operations stay in ONNX.
export function resolveBayaPreprocessing(contract: ImageContract): typeof INK_SQUARE_PREPROCESSING_ID {
  const expected = {
    height: 96, width: 96, channels: 1, dtype: 'float32', range: [0, 1],
    alpha: 'composite over white', grayscale: 'Pillow L', ink: '1 - gray/255',
    bbox: 'ink > 0.08', padding: 'max(2, round(max_extent * 0.15)), Python ties-to-even',
    centering: 'zero-valued square, integer floor offsets', resize: 'uint8 Pillow BILINEAR',
    normalization: 'divide resized uint8 by 255',
  };
  if ((contract.preprocessingId && contract.preprocessingId !== INK_SQUARE_PREPROCESSING_ID)
    || Object.entries(expected).some(([key, value]) => JSON.stringify(contract.preprocessing[key]) !== JSON.stringify(value))) {
    throw new Error('Unsupported BAYA image preprocessing contract');
  }
  return INK_SQUARE_PREPROCESSING_ID;
}

export function preprocessBayaImage(image: RgbaImage): Float32Array {
  resolveBayaPreprocessing(BAYA_MODEL_CONFIG);
  return preprocessNotebookImage(image);
}
