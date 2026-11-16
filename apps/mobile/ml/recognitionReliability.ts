import { validWritingCanvas } from '../content/writingCanvasValidation';
import { isValidWritingResult } from '../content/writingMastery';
import type { StrokeData } from '../content/writingEngine';
import { RECOGNITION_CONFIDENCE_THRESHOLD, validPredictions } from '../content/writingMastery';
import type { BayaPrediction } from './writingRecognition';

/** Application decision, never a 64th model class. Non-recognized outcomes carry no guess. */
export type RecognitionDecision =
  | { status: 'recognized'; prediction: BayaPrediction }
  | { status: 'uncertain'; reason: 'below-existing-confidence-requirement' }
  | { status: 'insufficient-input' }
  | { status: 'rejected'; reason: 'validated-non-baybayin' }
  | { status: 'error' };

/** No OOD detector is enabled: high softmax is NOT evidence of Baybayin validity.
 * The rejected contract is reserved for an independently validated detector.
 * Reuse the established mastery threshold only to withhold uncertain guesses.
 */
export function assessRecognition(predictions: readonly BayaPrediction[]): RecognitionDecision {
  if (!validPredictions(predictions)) return { status: 'error' };
  const top = [...predictions].sort((a, b) => b.probability - a.probability || a.classIndex - b.classIndex)[0];
  if (top.probability < RECOGNITION_CONFIDENCE_THRESHOLD) {
    return { status: 'uncertain', reason: 'below-existing-confidence-requirement' };
  }
  return { status: 'recognized', prediction: { ...top } };
}

/** Final award barrier. A recognized class is not a validated input-validity claim.
 * Non-recognized decisions never reach target/confidence-based mastery.
 */
export function canAwardWritingMastery(input: {
  strokes: StrokeData;
  geometry: { width: number; height: number };
  target: string;
  decision: RecognitionDecision;
}): boolean {
  return validWritingCanvas(input.strokes, input.geometry)
    && input.decision.status === 'recognized'
    && isValidWritingResult(input.target, [input.decision.prediction]);
}
