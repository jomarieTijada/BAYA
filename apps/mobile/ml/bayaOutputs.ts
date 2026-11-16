import { BAYA_BASE_LABELS, BAYA_CLASS_LABELS, BAYA_MODIFIER_LABELS } from './bayaClassLabels';
import { BayaModelError } from './BayaModelError';

export type SpatialHeads = { class_logits: Float32Array; base_logits: Float32Array; modifier_logits: Float32Array;
  kudlit_xy: Float32Array; body_bbox: Float32Array };
export type HeadPrediction = { label: string; probability: number; classIndex: number };
export type SpatialRecognition = {
  probabilities: Float32Array;
  primary: HeadPrediction;
  base: HeadPrediction;
  modifier: HeadPrediction;
  kudlit: [number, number] | null;
  bodyBbox: [number, number, number, number];
  consistency: { baseMatches: boolean; modifierMatches: boolean };
};

export function softmax(logits: Float32Array): Float32Array {
  if (!logits.length || !logits.every(Number.isFinite)) throw new BayaModelError('INFERENCE_FAILED', 'Non-finite model logits.');
  const max = Math.max(...logits);
  const values = Array.from(logits, value => Math.exp(value - max));
  const sum = values.reduce((a, b) => a + b, 0);
  return Float32Array.from(values, value => value / sum);
}
function best(probabilities: Float32Array, labels: readonly string[]): HeadPrediction {
  let index = 0;
  for (let i = 1; i < probabilities.length; i++) if (probabilities[i] > probabilities[index]) index = i;
  return { label: labels[index], classIndex: index, probability: probabilities[index] };
}
export function expectedAuxiliary(label: string) {
  if (['a', 'e_i', 'o_u'].includes(label)) return { base: label, modifier: 'not_applicable' };
  const base = label.startsWith('ng') ? 'ng' : label[0];
  const modifier = label === base ? 'virama' : label.includes('e_') ? 'above' : label.includes('o_') ? 'below' : 'none';
  return { base, modifier };
}
export function decodeSpatialHeads(heads: SpatialHeads): SpatialRecognition {
  for (const [key, length] of Object.entries({ class_logits: 63, base_logits: 18, modifier_logits: 5, kudlit_xy: 2, body_bbox: 4 })) {
    const values = heads[key as keyof SpatialHeads];
    if (!(values instanceof Float32Array) || values.length !== length || !values.every(Number.isFinite)) {
      throw new BayaModelError('INFERENCE_FAILED', `Invalid ${key} output.`);
    }
  }
  if (![...heads.kudlit_xy, ...heads.body_bbox].every(value => value >= 0 && value <= 1)
    || heads.body_bbox[0] > heads.body_bbox[2] || heads.body_bbox[1] > heads.body_bbox[3]) {
    throw new BayaModelError('INFERENCE_FAILED', 'Invalid spatial coordinates.');
  }
  const probabilities = softmax(heads.class_logits);
  const primary = best(probabilities, BAYA_CLASS_LABELS);
  const base = best(softmax(heads.base_logits), BAYA_BASE_LABELS);
  const modifier = best(softmax(heads.modifier_logits), BAYA_MODIFIER_LABELS);
  const expected = expectedAuxiliary(primary.label);
  // Pseudo-localization is diagnostic only. Vowels and base-only classes have no location.
  const localized = ['above', 'below', 'virama'].includes(modifier.label)
    && ['above', 'below', 'virama'].includes(expected.modifier);
  return { probabilities, primary, base, modifier,
    kudlit: localized ? [heads.kudlit_xy[0], heads.kudlit_xy[1]] : null,
    bodyBbox: [heads.body_bbox[0], heads.body_bbox[1], heads.body_bbox[2], heads.body_bbox[3]],
    consistency: { baseMatches: base.label === expected.base, modifierMatches: modifier.label === expected.modifier } };
}
