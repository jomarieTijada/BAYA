import { BAYA_CLASS_LABELS } from '../ml/bayaClassLabels';
import type { BayaPrediction } from '../ml/writingRecognition';
import type { StrokeData } from './writingEngine';

export const RECOGNITION_CONFIDENCE_THRESHOLD = 0.80;
export const REQUIRED_SUCCESSFUL_TRIALS = 2;
export const BAYA_WRITING_MASTERY_POLICY = Object.freeze({ minConfidence: RECOGNITION_CONFIDENCE_THRESHOLD, requiredValidAttempts: REQUIRED_SUCCESSFUL_TRIALS });

/** IDs are model output indices, never a target-biased display-label comparison. */
export function writingClassId(label: string): number {
  const canonical = label.trim().toLowerCase().replace(/\s*\/\s*/g, '_');
  return BAYA_CLASS_LABELS.indexOf(canonical as typeof BAYA_CLASS_LABELS[number]);
}

export function validPredictions(predictions: readonly BayaPrediction[]): boolean {
  return Array.isArray(predictions) && predictions.length > 0 && new Set(predictions.map(p => p?.classIndex)).size === predictions.length
    && predictions.every(p => p && Number.isInteger(p.classIndex) && p.classIndex >= 0
      && p.classIndex < BAYA_CLASS_LABELS.length && typeof p.label === 'string'
      && writingClassId(p.label) === p.classIndex
      && typeof p.probability === 'number' && Number.isFinite(p.probability) && p.probability >= 0 && p.probability <= 1);
}

/** Input must be ranked by the inference layer's stable descending order. */
export function isValidWritingResult(target: string, ranked: readonly BayaPrediction[]): boolean {
  return validPredictions(ranked) && ranked.every((p, i) => i === 0 || ranked[i - 1].probability >= p.probability)
    && ranked[0].classIndex === writingClassId(target)
    && ranked[0].probability >= BAYA_WRITING_MASTERY_POLICY.minConfidence;
}

export function nextValidCount(count: number, valid: boolean): number {
  const current = Number.isInteger(count) && count >= 0 ? count : 0;
  return Math.min(REQUIRED_SUCCESSFUL_TRIALS, current + (valid ? 1 : 0));
}

export interface ModelWritingAttempt {
  characterId: string;
  strokeData: StrokeData;
  imageData: null;
  recognizedClassId: string;
  confidence: number;
  result: 'valid' | 'invalid';
  attemptedAt: string;
}
