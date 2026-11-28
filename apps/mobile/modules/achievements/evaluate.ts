import { matchingBoards } from '../../content/characterActivities/matching';
import { approvedCurriculum } from '../../content/approvedCurriculum';
import { achievementCatalog } from '../../content/achievements/achievementCatalog';
import type { AchievementMetric, AchievementState, CharacterGroup } from '../../content/achievements/achievementTypes';
import { questionPlacements, topicCheckpoints, findCheckpoint, getAssessmentSet } from '../../content/characterActivities/checkpoints';
import { glyphClass } from '../../content/characterActivities';
import { complete, score, type SetAttempt } from '../characterActivities/assessment';

export type EvidenceEvent = { event_type: string; entity_id: string; occurred_at: string };
export type AchievementEvidence = { topics: string[]; attempts: SetAttempt[]; events: EvidenceEvent[]; writingAttempts: number; writingSuccess: number };
const unique = (items: string[]) => new Set(items).size;
const writingInventory = questionPlacements.filter(p => p.question.type === 'handwriting');

/** Pure evaluator. Only validated persisted responses enter this boundary. */
export function evaluateAchievements(e: AchievementEvidence): AchievementState[] {
  const events = (kind: string) => e.events.filter(v => v.event_type === kind).map(v => v.entity_id);
  const completed = e.attempts.filter(a => findCheckpoint(a.setId) && complete(a) && a.cursor === getAssessmentSet(a.setId).set.questions.length);
  const correct = e.attempts.flatMap(a => a.responses.filter(r => r.correct === true));
  const matched = correct.filter(r => r.answer.kind === 'matching-v2' || r.answer.kind === 'mascot-match-v3');
  const questions = (interaction: number) => unique(matched.filter(r => questionPlacements.some(p => p.questionId === r.questionId && p.interaction === interaction)).map(r => r.questionId));
  const written = correct.filter(r => r.answer.kind === 'writing');
  const targets = (group: string) => unique(written.flatMap(r => {
    const p = writingInventory.find(p => p.questionId === r.questionId && p.concept === group);
    return p ? [glyphClass(p.glyph)] : [];
  }));
  const boards = e.attempts.flatMap(a => {
    const groups = new Map<string, typeof a.responses>();
    a.responses.forEach(r => { if (r.answer.kind === 'matching-v2' || r.answer.kind === 'mascot-match-v3') groups.set(r.answer.boardId, [...(groups.get(r.answer.boardId) ?? []), r]); });
    return [...groups.values()].filter(group => {
      const answer = group[0].answer;
      if (answer.kind !== 'matching-v2' && answer.kind !== 'mascot-match-v3') return false;
      const board = matchingBoards(a.setId, answer.boardStart)[0];
      return board && board.pairs.length === group.length && board.pairs.every(p => group.some(r => r.questionId === p.id));
    });
  });
  const signature = (a: SetAttempt) => a.responses.filter(r => r.correct !== null).map(r => `${r.questionId}:${r.answer.kind}`).sort().join('|');
  const prior = (a: SetAttempt) => completed.filter(b => b.id !== a.id && b.setId === a.setId && b.updatedAt <= a.startedAt);
  const metrics: Record<AchievementMetric, number> = {
    recordings: unique(events('audio')), pairs: unique(matched.map(r => r.questionId)),
    boardCorrect: Math.max(0, ...boards.map(b => b.filter(r => r.correct === true).length)),
    audioQuestions: questions(1), decodeQuestions: questions(2), buildQuestions: questions(3),
    perfectBoard: Number(boards.some(b => b.filter(r => r.correct !== null).length >= 3 && b.every(r => r.correct === true))),
    writingAttempts: e.writingAttempts + e.attempts.flatMap(a => a.responses).filter(r => r.answer.kind === 'writing').length,
    writingSuccess: e.writingSuccess + written.length, writingQuestions: unique(written.map(r => r.questionId)),
    baseTargets: targets('base-consonant'), upperTargets: targets('upper-kudlit'), lowerTargets: targets('lower-kudlit'),
    checkpoints: unique(completed.map(a => a.setId)),
    allCheckpoints: Number(topicCheckpoints.length > 0 && topicCheckpoints.every(c => completed.some(a => a.setId === c.id))),
    retry: Number(completed.some(a => prior(a).length > 0)),
    improvement: Number(completed.some(a => prior(a).some(b => signature(b) === signature(a) && score(a) > score(b)))),
    resume: Number(completed.some(a => events('resume').includes(a.id))),
    story: Number(events('story').length > 0), replay: Number(events('replay').length > 0),
    offline: Number(completed.some(a => events('offline').includes(a.id))), values: 0,
  };
  return achievementCatalog.map(definition => {
    const c = definition.condition;
    let current = 0, target = 1, availability = definition.availability;
    if (c.type === 'topics' || c.type === 'module') {
      const ids = c.type === 'module' ? approvedCurriculum.find(m => m.id === c.id)!.topics.map(t => t.id) : c.ids.length ? c.ids : approvedCurriculum.flatMap(m => m.topics.map(t => t.id));
      target = c.type === 'topics' && c.minimum ? c.minimum : ids.length;
      current = ids.filter(id => e.topics.includes(id)).length;
    } else if (c.type === 'exploration') {
      const groups: CharacterGroup[] = c.group === 'foundation' ? ['vowel', 'base-consonant'] : [c.group];
      current = unique(groups.flatMap(g => events(`explore:${g}`))); target = c.minimum;
    } else {
      current = metrics[c.metric]; target = c.minimum;
      const group = ({ baseTargets: 'base-consonant', upperTargets: 'upper-kudlit', lowerTargets: 'lower-kudlit' } as Record<string, string>)[c.metric];
      if (group && unique(writingInventory.filter(p => p.concept === group).map(p => glyphClass(p.glyph))) < target) availability = 'pending-validation';
      if (c.metric === 'writingQuestions' && writingInventory.length < target) availability = 'pending-validation';
    }
    return { definition, current: Math.min(current, target), target, unlockedAt: null, availability };
  });
}
