import { appendStrokePoint, clampPoint, strokePath } from '../writingEngine';
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

});
