import { appendStrokePoint, clampPoint, evaluateWriting, strokePath, type StrokeData } from '../writingEngine';
import { writingReferenceMasks } from '../writingReferenceMasks';
import { writingTopics } from '../writingLessonData';

describe('Module 3 writing data and local feedback', () => {
  it('reuses all 17 bundled character exercises in topic order', () => {
    expect(writingTopics.map(topic => topic.exercises.length)).toEqual([3, 14]);
    expect(new Set(writingTopics.flatMap(topic => topic.exercises.map(exercise => exercise.characterId))).size).toBe(17);
    expect(writingTopics[1].exercises.find(exercise => exercise.characterId === 'ka')?.character).toBe('ᜃ');
  });

  it('keeps normalized input bounded and produces drawable paths', () => {
    const point = clampPoint(-2, 3);
    expect(point).toEqual({ x: 0, y: 1 });
    const strokes = appendStrokePoint([[{ x: 0.1, y: 0.2 }]], { x: 0.2, y: 0.3 });
    expect(strokePath(strokes[0])).toContain('L200.0,300.0');
    const curved = strokePath([{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 }]);
    expect(curved).toContain('Q500.0,1000.0 750.0,500.0');
    expect(curved).toMatch(/Q1000\.0,0\.0 1000\.0,0\.0$/);
  });

  it('requires a real stroke and scores a reference-like trace without claiming recognition', () => {
    expect(evaluateWriting('ka', [])).toBeNull();
    expect(evaluateWriting('unknown', [[{ x: 0, y: 0 }, { x: 1, y: 1 }]])).toBeNull();
    const mask = writingReferenceMasks.ka;
    const strokes: StrokeData = Array.from({ length: 32 }, (_, row) => {
      const points = Array.from({ length: 32 }, (_, col) => mask[row * 32 + col] === '1' ? { x: col / 31, y: row / 31 } : null).filter((point): point is { x: number; y: number } => point !== null);
      return points;
    }).filter(stroke => stroke.length > 1);
    const result = evaluateWriting('ka', strokes);
    expect(result?.confidence).toBeGreaterThan(0.65);
    expect(result?.characterId).toBe('ka');
    expect(result?.imageData).toBeNull();
  });
});
