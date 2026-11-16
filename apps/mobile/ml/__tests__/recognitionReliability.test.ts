import { assessRecognition, canAwardWritingMastery } from '../recognitionReliability';

describe('recognition reliability (application policy, not OOD accuracy)', () => {
  it.each([0, 0.3, 0.799999])('withholds guesses below the existing threshold: %s', probability => {
    expect(assessRecognition([{ label: 'a', classIndex: 0, probability }])).toEqual({ status: 'uncertain', reason: 'below-existing-confidence-requirement' });
  });
  it.each([0.8, 0.946, 1])('preserves raw scores above the threshold without claiming OOD detection: %s', probability => {
    expect(assessRecognition([{ label: 'ha', classIndex: 15, probability }])).toEqual({ status: 'recognized', prediction: { label: 'ha', classIndex: 15, probability } });
  });
  it('fails closed for corrupt output', () => {
    for (const probability of [NaN, Infinity, -1, 1.1]) expect(assessRecognition([{ label: 'a', classIndex: 0, probability }])).toEqual({ status: 'error' });
    expect(assessRecognition([])).toEqual({ status: 'error' });
    expect(assessRecognition([{ label: 'ka', classIndex: 0, probability: 1 }])).toEqual({ status: 'error' });
  });
  it('is target-independent, stable and does not mutate predictions', () => {
    const predictions = Object.freeze([Object.freeze({ label: 'ba', classIndex: 2, probability: 0.1 }), Object.freeze({ label: 'a', classIndex: 0, probability: 0.9 })]);
    expect(assessRecognition(predictions)).toMatchObject({ status: 'recognized', prediction: { label: 'a' } });
    expect(predictions[0].label).toBe('ba');
  });
});

describe('final mastery barrier', () => {
  const input = { strokes: [[{ x: 0.1, y: 0.2 }, { x: 0.5, y: 0.6 }, { x: 0.8, y: 0.7 }]], geometry: { width: 640, height: 320 }, target: 'ha' };
  const prediction = { label: 'ha', classIndex: 15, probability: 0.9873320460319519 };
  it('does not equate the reproduced high-confidence wave score with validated validity', () => {
    // With validity unavailable, the known unresolved target-match behavior remains explicit.
    expect(canAwardWritingMastery({ ...input, decision: { status: 'recognized', prediction } })).toBe(true);
    expect(canAwardWritingMastery({ ...input, target: 'a', decision: { status: 'recognized', prediction } })).toBe(false);
  });
  it.each([
    { status: 'uncertain', reason: 'below-existing-confidence-requirement' },
    { status: 'rejected', reason: 'validated-non-baybayin' },
    { status: 'insufficient-input' }, { status: 'error' },
  ] as const)('never awards a $status outcome', decision => {
    expect(canAwardWritingMastery({ ...input, decision })).toBe(false);
  });
  it('rechecks sufficiency and confidence at the award boundary', () => {
    expect(canAwardWritingMastery({ ...input, strokes: [], decision: { status: 'recognized', prediction } })).toBe(false);
    expect(canAwardWritingMastery({ ...input, decision: { status: 'recognized', prediction: { ...prediction, probability: 0.79 } } })).toBe(false);
  });
});
