import { APPROVED_CONTENT_VERSION_ID, approvedCurriculum } from '../../content/approvedCurriculum';
import { getWritingTopic } from '../../content/writingLessonData';
import { getBaybayinCharacterTopic } from '../../content/baybayinCharactersData';
import { WRITING_INPUT_LIMITS } from '../../content/writingCanvasValidation';
import type { StrokeData } from '../../content/writingEngine';

export type ActivityDraft =
  | { kind: 'story'; page: 'introduction' | 'content' }
  | { kind: 'characters'; index: number }
  | { kind: 'writing'; index: number; characterId: string; strokes: StrokeData; width: number; height: number; submitted: boolean };
export type Checkpoint = { version: 1; contentVersion: string; profileId: string; topicId: string; startedAt: string; savedAt: string; draft: ActivityDraft };

export function initialDraft(topicId: string): ActivityDraft | null {
  if (approvedCurriculum[0].topics.some(t => t.id === topicId)) return { kind: 'story', page: topicId === 'topic-1-1' ? 'introduction' : 'content' };
  if (getBaybayinCharacterTopic(topicId)) return { kind: 'characters', index: 0 };
  const first = getWritingTopic(topicId)?.exercises[0];
  return first ? { kind: 'writing', index: 0, characterId: first.characterId, strokes: [], width: 1, height: 1, submitted: false } : null;
}

/** Checkpoint data is untrusted. Only known curriculum context can form a route. */
export function parseCheckpoint(raw: string, profileId: string): Checkpoint | null {
  try {
    if (raw.length > 2_000_000) return null;
    const c = JSON.parse(raw) as Checkpoint;
    if (!c || typeof c.topicId !== 'string' || typeof c.startedAt !== 'string' || typeof c.savedAt !== 'string') return null;
    if (c.version !== 1 || c.contentVersion !== APPROVED_CONTENT_VERSION_ID || c.profileId !== profileId
      || !Number.isFinite(Date.parse(c.savedAt)) || !Number.isFinite(Date.parse(c.startedAt)) || Date.parse(c.startedAt) > Date.parse(c.savedAt)) return null;
    const expected = initialDraft(c.topicId), d = c.draft;
    if (!expected || !d || d.kind !== expected.kind) return null;
    if (d.kind === 'story') {
      if (!['introduction', 'content'].includes(d.page)) return null;
    } else {
      if (!Number.isInteger(d.index) || d.index < 0) return null;
      if (d.kind === 'characters' && !getBaybayinCharacterTopic(c.topicId)?.characters[d.index]) return null;
      if (d.kind === 'writing') {
        if (getWritingTopic(c.topicId)?.exercises[d.index]?.characterId !== d.characterId || typeof d.submitted !== 'boolean'
          || ![d.width, d.height].every(n => Number.isFinite(n) && n >= 1 && n <= 10000) || !Array.isArray(d.strokes) || d.strokes.length > WRITING_INPUT_LIMITS.maxPoints) return null;
        let count = 0;
        for (const stroke of d.strokes) {
          if (!Array.isArray(stroke) || !stroke.length) return null;
          count += stroke.length;
          if (count > WRITING_INPUT_LIMITS.maxPoints) return null;
          if (stroke.some(p => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1 || (p.t !== undefined && (!Number.isFinite(p.t) || p.t < 0)))) return null;
        }
      }
    }
    // Strip arbitrary stored fields (including routes/tokens) at the boundary.
    return { version: 1, contentVersion: APPROVED_CONTENT_VERSION_ID, profileId, topicId: c.topicId, startedAt: c.startedAt, savedAt: c.savedAt, draft: d.kind === 'story' ? { kind: 'story', page: d.page } : d.kind === 'characters' ? { kind: 'characters', index: d.index } : { kind: 'writing', index: d.index, characterId: d.characterId, width: d.width, height: d.height, submitted: d.submitted, strokes: d.strokes.map(stroke => stroke.map(p => ({ x: p.x, y: p.y, ...(p.t === undefined ? {} : { t: p.t }) }))) } };
  } catch { return null; }
}
