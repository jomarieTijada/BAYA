import type { BayaPrediction } from '../../../ml/writingRecognition';

/** Learner-facing state for the existing BAYA recognition request. */
export type RecognitionState =
  | { status: 'idle' }
  | { status: 'analyzing' }
  | { status: 'success'; predictions: BayaPrediction[] }
  | { status: 'empty' }
  | { status: 'error' };

/** Rank existing model probabilities without changing their values. */
export function rankPredictions(predictions: BayaPrediction[]): BayaPrediction[] {
  return [...predictions].sort((left, right) => right.probability - left.probability).slice(0, 3);
}

export type ConfidenceLevel = 'high' | 'moderate' | 'low';

export function getConfidencePresentation(confidence: number) {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('Model confidence must be finite and between 0 and 1.');
  }

  // Truncate at one decimal so a value below a threshold never displays as that threshold.
  const percentage = `${(Math.floor(confidence * 1000) / 10).toFixed(1)}%`;
  if (confidence >= 0.9) {
    return {
      level: 'high' as const,
      percentage,
      message: 'Mataas ang kumpiyansa ng BAYA!',
      accent: '#216E38',
      badgeBackground: '#E8F6EB',
      border: '#9ACFAA',
    };
  }
  if (confidence >= 0.7) {
    return {
      level: 'moderate' as const,
      percentage,
      message: 'Medyo sigurado ang BAYA.',
      accent: '#865600',
      badgeBackground: '#FFF3D8',
      border: '#E2BF76',
    };
  }
  return {
    level: 'low' as const,
    percentage,
    message: 'Subukan nating tingnan muli ang sulat.',
    accent: '#9B432B',
    badgeBackground: '#FFF0E9',
    border: '#E7B4A3',
  };
}

export function displayPredictedClass(label: string): string {
  return label.replace(/_/g, '/').toUpperCase();
}
