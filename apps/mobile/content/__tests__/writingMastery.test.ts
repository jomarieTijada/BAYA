import { BAYA_WRITING_MASTERY_POLICY, isValidWritingResult, nextValidCount, validPredictions, writingClassId } from '../writingMastery';
import { rankPredictions, getConfidencePresentation } from '../../components/learner/writing/recognitionPresentation';
import { writingTopics } from '../writingLessonData';

const prediction = (label: string, probability: number) => ({ label, probability, classIndex: writingClassId(label) });
describe('strict writing mastery policy', () => {
  it.each([[0.80, true], [0.800001, true], [0.799999, false], [0.7996, false], [0, false], [1, true]])('compares raw %s inclusively', (probability, valid) => {
    expect(isValidWritingResult('ba', [prediction('ba', probability as number)])).toBe(valid);
  });
  it.each([NaN, Infinity, -Infinity, undefined, null, -0.01, 1.01, '0.99'])('rejects malformed confidence %s', probability => {
    expect(isValidWritingResult('ba', [prediction('ba', probability as number)])).toBe(false);
  });
  it('never promotes a target at rank two or three', () => {
    expect(isValidWritingResult('ba', [prediction('pa', 0.99)])).toBe(false);
    expect(isValidWritingResult('ba', [prediction('pa', 0.99), prediction('ba', 0.90)])).toBe(false);
    expect(isValidWritingResult('ba', [prediction('pa', 0.99), prediction('ma', 0.97), prediction('ba', 0.95)])).toBe(false);
  });
  it('preserves stable model ranking and raw probabilities, including ties', () => {
    const values = [prediction('pa', 0.1), prediction('ba', 0.83), prediction('ma', 0.07)];
    expect(rankPredictions(values)).toEqual([values[1], values[0], values[2]]);
    const tied = [prediction('pa', 0.8), prediction('ba', 0.8)];
    expect(rankPredictions(tied)).toEqual(tied);
    expect(isValidWritingResult('ba', rankPredictions(tied))).toBe(false);
    expect(values[0].probability).toBe(0.1);
  });
  it.each(['E/I', 'O/U', 'DA/RA', 'DE/DI', 'DO/DU'])('resolves %s using the model class map', target => {
    expect(isValidWritingResult(target, [prediction(target.toLowerCase().replace('/', '_'), 0.8)])).toBe(true);
  });
  it('validates class IDs, mismatched labels, empty outputs and every curriculum target', () => {
    expect(validPredictions([])).toBe(false);
    expect(validPredictions([{ ...prediction('ba', 0.9), classIndex: 0 }])).toBe(false);
    expect(validPredictions([prediction('ba', 0.9), prediction('ba', 0.1)])).toBe(false);
    for (const topic of writingTopics) for (const exercise of topic.exercises) expect(writingClassId(exercise.characterId)).toBeGreaterThanOrEqual(0);
  });
  it('accumulates successes without resetting on failure and caps progress', () => {
    let count = 0;
    const counts = [true, false, true, false, true, true].map(valid => count = nextValidCount(count, valid));
    expect(counts).toEqual([1, 1, 2, 2, 3, 3]);
    expect(count).toBe(BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts);
  });
  it.each([
    [[0.92, 0.85, 0.80], [1, 2, 3]],
    [[0.80, 0.80, 0.80], [1, 2, 3]],
    [[0.91, 0.76, 0.84, 0.79, 0.93], [1, 1, 2, 2, 3]],
  ])('counts independent raw-confidence trials %j', (probabilities, expected) => {
    let count = 0;
    expect(probabilities.map(probability => count = nextValidCount(count, isValidWritingResult('ba', [prediction('ba', probability)])))).toEqual(expected);
  });
  it.each([-1, NaN, Infinity, 1.5])('keeps an invalid counter %s within activity bounds', count => {
    expect(nextValidCount(count, false)).toBe(0);
  });
  it('does not display 80% for confidence below the boundary', () => {
    for (const p of [0.7996, 0.799999, 0.8 - Number.EPSILON]) expect(getConfidencePresentation(p).percentage).toBe('79.9%');
    expect(getConfidencePresentation(0.8).percentage).toBe('80.0%');
  });
});
