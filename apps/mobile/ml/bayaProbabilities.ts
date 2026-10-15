import { BAYA_MODEL_CONFIG } from './bayaModelConfig';

/** Validate raw softmax output without clipping, rounding or recalibration. */
export function validateBayaProbabilities(values: unknown): asserts values is Float32Array {
  if (!(values instanceof Float32Array) || values.length !== BAYA_MODEL_CONFIG.classCount) {
    throw new Error(`Expected ${BAYA_MODEL_CONFIG.classCount} float32 probabilities.`);
  }
  let sum = 0;
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`Output contains an invalid probability at index ${index}: ${value}.`);
    }
    sum += value;
  }
  if (Math.abs(sum - 1) > 1e-3) throw new Error(`Expected a probability sum near 1; received ${sum}.`);
}
