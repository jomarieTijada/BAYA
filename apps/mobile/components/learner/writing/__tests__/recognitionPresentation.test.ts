import { displayPredictedClass, getConfidencePresentation, rankPredictions, presentTopPrediction } from '../recognitionPresentation';
import { BAYA_CLASS_LABELS } from '../../../../ml/bayaClassLabels';
import { getBaybayinTracingGuide } from '../../../../content/baybayinTracingGuides';

describe('BAYA confidence presentation', () => {
  it('maps every model class to its existing glyph without retaining additional prediction fields', () => {
    BAYA_CLASS_LABELS.forEach((label, classIndex) => {
      const internal = { label, classIndex, probability: 0.86, scores: [0.86, 0.14] };
      expect(presentTopPrediction(internal)).toEqual({ label, classIndex, probability: 0.86, glyphSource: getBaybayinTracingGuide(label) });
      expect(presentTopPrediction(internal)).not.toHaveProperty('scores');
    });
  });

  it('processes all 63 scores without mutation and preserves the supplied stable order for ties', () => {
    const scores = BAYA_CLASS_LABELS.map((label, classIndex) => ({ label, classIndex, probability: 1 / 63 })).reverse();
    expect(rankPredictions(scores).map(p => p.classIndex)).toEqual([62, 61, 60]);
    expect(scores[0].classIndex).toBe(62);
    expect(presentTopPrediction(rankPredictions(scores)[0]).label).toBe(BAYA_CLASS_LABELS[62]);
  });

  it.each([
    [], [{ label: 'a', classIndex: -1, probability: .8 }],
    [{ label: 'a', classIndex: 63, probability: .8 }],
    [{ label: 'a', classIndex: 1, probability: .8 }],
    [{ label: 'a', classIndex: 0, probability: NaN }],
    [{ label: 'a', classIndex: 0, probability: Infinity }],
    [{ label: 'a', classIndex: 0, probability: 1.1 }],
    [{ label: 'a', classIndex: 0, probability: -.1 }],
  ].map(predictions => ({ predictions })))('rejects malformed candidate input %# instead of manufacturing a character', ({ predictions }) => {
    expect(() => rankPredictions(predictions)).toThrow();
  });

  it('rejects invalid single-class presentation input', () => {
    expect(() => presentTopPrediction({ label: 'ba', classIndex: 0, probability: .9 })).toThrow();
  });

  it.each([0.9, 0.976, 1])('uses high treatment at or above 90%% (%s)', (confidence) => {
    const result = getConfidencePresentation(confidence);
    expect(result.level).toBe('high');
    expect(result.message).toBe('Mataas ang kumpiyansa ng BAYA!');
    expect(result.accent).toBe('#216E38');
  });

  it.each([0.7, 0.8999])('uses moderate treatment from 70%% to below 90%% (%s)', (confidence) => {
    const result = getConfidencePresentation(confidence);
    expect(result.level).toBe('moderate');
    expect(result.message).toBe('Medyo sigurado ang BAYA.');
    expect(result.accent).toBe('#865600');
  });

  it.each([0, 0.6999])('uses low treatment below 70%% (%s)', (confidence) => {
    const result = getConfidencePresentation(confidence);
    expect(result.level).toBe('low');
    expect(result.message).toBe('Subukan nating tingnan muli ang sulat.');
    expect(result.accent).toBe('#9B432B');
  });

  it('formats model confidence to one decimal place and displays compound class names', () => {
    expect(getConfidencePresentation(0.976).percentage).toBe('97.6%');
    expect(getConfidencePresentation(0.7).percentage).toBe('70.0%');
    expect(getConfidencePresentation(0.8999).percentage).toBe('89.9%');
    expect(getConfidencePresentation(0.6999).percentage).toBe('69.9%');
    expect(displayPredictedClass('me_mi')).toBe('ME/MI');
  });

  it('sorts existing probabilities descending without changing them', () => {
    const ranked = rankPredictions([
      { classIndex: 40, label: 'pa', probability: 0.014 },
      { classIndex: 27, label: 'ma', probability: 0.005 },
      { classIndex: 2, label: 'ba', probability: 0.978 },
    ]);
    expect(ranked.map(item => item.label)).toEqual(['ba', 'pa', 'ma']);
    expect(ranked.map(item => item.probability)).toEqual([0.978, 0.014, 0.005]);
  });
});
