import { matchingPair, matchingBoards } from '../../content/characterActivities/matching';
import { glyphClass, questionRecording, type CharacterQuestion } from '../../content/characterActivities';
import { getAssessmentSet } from '../../content/characterActivities/checkpoints';
import { assessRecognition } from '../../ml/recognitionReliability';
import { isValidWritingResult } from '../../content/writingMastery';
import type { BayaPrediction } from '../../ml/writingRecognition';

export type Answer = { kind: 'mascot-match-v3'; targetQuestionId: string; boardId: string; boardStart: number; audioPlayed?: boolean } | { kind: 'matching-v2'; targetQuestionId: string; boardId: string; boardStart: number; audioPlayed?: boolean } | { kind: 'choice'; optionId: string; audioPlayed?: boolean } | { kind: 'writing'; prediction: BayaPrediction } | { kind: 'unavailable'; reason: 'recording-pending-validation' };
export type Response = { questionId: string; answer: Answer; correct: boolean | null; answeredAt: string };
export type SetAttempt = {
  version: 1; id: string; profileId: string; activityId: string; setId: string;
  startedAt: string; updatedAt: string; cursor: number; responses: Response[];
  failures: { questionId: string; reason: string; at: string }[]; syncState: 'local-only';
};
function getAssessmentSetForQuestion(boardId: string) {
  if (!boardId.startsWith('matching-v2:')) throw Error('Invalid board');
  return boardId.slice('matching-v2:'.length, boardId.lastIndexOf(':'));
}
export function evaluateAnswer(q: CharacterQuestion, answer: Answer): boolean | null {
  if (answer.kind === 'unavailable') {
    if (q.id.startsWith('character-1-') && !questionRecording(q) && answer.reason === 'recording-pending-validation') return null;
    throw new Error('Available questions cannot be deferred.');
  }
  if (q.type === 'multiple-choice' && (answer.kind === 'matching-v2' || answer.kind === 'mascot-match-v3')) {
    const source = matchingPair(q.id), target = matchingPair(answer.targetQuestionId);
    if (source.pending || target.pending || source.topicId !== target.topicId || source.interaction !== target.interaction || (source.interaction === 1 && !answer.audioPlayed)) throw Error('Invalid matching response');
    if (answer.kind === 'mascot-match-v3') {
      const board = matchingBoards(getAssessmentSetForQuestion(answer.boardId), answer.boardStart)[0];
      if (!board || board.id !== answer.boardId || !board.pairs.some(p => p.id === q.id) || !board.pairs.some(p => p.id === target.id)) throw Error('Invalid card provenance');
    }
    return glyphClass(source.glyph) === glyphClass(target.glyph);
  }
  if (q.type === 'multiple-choice' && answer.kind === 'choice') {
    const option = q.options.find(o => o.id === answer.optionId);
    if (!option || (q.id.startsWith('character-1-') && !answer.audioPlayed)) throw new Error('A valid selection and played audio are required.');
    return option.letter === q.correctLetter;
  }
  if (q.type === 'handwriting' && answer.kind === 'writing') {
    if (assessRecognition([answer.prediction]).status !== 'recognized') throw new Error('Recognition needs another try.');
    return isValidWritingResult(glyphClass(q.expectedGlyph), [answer.prediction]);
  }
  throw new Error('Answer type does not match question.');
}
export const score = (a: SetAttempt) => a.responses.filter(r => r.correct).length;
export const attemptedCount = (a: SetAttempt) => a.responses.filter(r => r.correct !== null).length;
export const complete = (a: SetAttempt) => attemptedCount(a) === getAssessmentSet(a.setId).set.questions.length;
/** Validate persisted state before resuming, including recomputing assessment correctness. */
export function parseAttempt(value: string, profileId: string): SetAttempt {
  const a: SetAttempt = JSON.parse(value);
  const { set, activity } = getAssessmentSet(a.setId);
  if (a.version !== 1 || a.profileId !== profileId || a.activityId !== activity.id || !a.id || !Array.isArray(a.responses)
      || a.responses.length > set.questions.length || !Number.isInteger(a.cursor) || a.cursor < 0 || a.cursor > set.questions.length
      || a.cursor > a.responses.length || (a.cursor < a.responses.length - 1 && a.responses[a.cursor]?.answer.kind !== 'matching-v2')
      || !Number.isFinite(Date.parse(a.startedAt)) || !Number.isFinite(Date.parse(a.updatedAt))) throw new Error('Invalid saved attempt');
  a.responses.forEach((r, i) => {
    // Both questions were unscoreable before the combined recording was approved.
    // Retain the original null score when reading those historical submissions.
    const historicalDeferral = ['character-1-q-06', 'character-1-q-10'].includes(r.questionId)
      && r.answer.kind === 'unavailable' && r.answer.reason === 'recording-pending-validation' && r.correct === null;
    if (r.questionId !== set.questions[i].id || (!historicalDeferral && r.correct !== evaluateAnswer(set.questions[i], r.answer))
        || !Number.isFinite(Date.parse(r.answeredAt))) throw new Error('Invalid saved response');
  });
  const current = a.responses[a.cursor]?.answer;
  if (current?.kind === 'matching-v2') {
    const board = matchingBoards(a.setId, current.boardStart)[0];
    if (!board || board.id !== current.boardId || board.start !== a.cursor || a.responses.length !== a.cursor + board.pairs.length) throw Error('Invalid saved matching board');
  }
  for (const r of a.responses) {
    if (r.answer.kind !== 'matching-v2') continue;
    const answer = r.answer, board = matchingBoards(a.setId, answer.boardStart)[0];
    if (!board || board.id !== answer.boardId || !board.pairs.some(p => p.id === r.questionId) || !board.pairs.some(p => p.id === answer.targetQuestionId)) throw Error('Invalid matching provenance');
    const responses = a.responses.filter(r => r.answer.kind === 'matching-v2' && r.answer.boardId === answer.boardId);
    if (responses.length !== board.pairs.length || new Set(responses.map(r => r.answer.kind === 'matching-v2' && r.answer.targetQuestionId)).size !== board.pairs.length) throw Error('Invalid matching ownership');
  }
  return a;
}
