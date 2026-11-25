import { characterActivities, glyphClass, questionRecording, type ChoiceQuestion } from './index';
import { getAssessmentSet, questionPlacements } from './checkpoints';

export type MatchingPair = { id: string; sourceQuestionId: string; sourceActivityId: string; sourceSetId: string; topicId: string;
  interaction: number; question: ChoiceQuestion; glyph: string; reading: string; pending: boolean };
export type MatchingBoard = { id: string; start: number; pairs: MatchingPair[] };
export const matchingPairs: MatchingPair[] = questionPlacements.flatMap(p => {
  if (p.question.type !== 'multiple-choice') return [];
  const question = p.question;
  const correct = question.options.find(o => o.letter === question.correctLetter)!;
  return [{ id: p.questionId, sourceQuestionId: p.questionId, sourceActivityId: p.sourceActivityId, sourceSetId: p.sourceSetId,
    topicId: p.topicId, interaction: p.interaction, question: p.question, glyph: p.glyph,
    reading: p.interaction === 2 ? correct.label : p.question.prompt,
    pending: p.interaction === 1 && !questionRecording(p.question) }];
});
export function matchingPair(id: string) {
  const pair = matchingPairs.find(p => p.id === id);
  if (!pair) throw Error('Unknown matching source');
  return pair;
}
export function validateBoard(pairs: readonly MatchingPair[]): boolean {
  return pairs.length > 0 && pairs.length <= 4 && pairs.every(p => !p.pending && p.topicId === pairs[0].topicId && p.interaction === pairs[0].interaction)
    && new Set(pairs.map(p => glyphClass(p.glyph))).size === pairs.length
    && new Set(pairs.map(p => p.reading.toUpperCase().replace(/\s/g, ''))).size === pairs.length;
}
/** Keep source order and identities: no distractors, no cross-topic or cross-direction boards. */
export function matchingBoards(setId: string, offset = 0): MatchingBoard[] {
  const questions = getAssessmentSet(setId).set.questions;
  const boards: MatchingBoard[] = [];
  for (let i = offset; i < questions.length; i++) {
    if (questions[i].type !== 'multiple-choice') continue;
    const pair = matchingPair(questions[i].id), last = boards.at(-1);
    if (last && last.pairs.length < 3 && validateBoard([...last.pairs, pair])) last.pairs.push(pair);
    else boards.push({ id: `matching-v2:${setId}:${questions[i].id}`, start: i, pairs: [pair] });
  }
  // A trailing singleton can share a four-pair board, provided it remains unambiguous.
  for (let i = 1; i < boards.length; i++) {
    const previous = boards[i - 1], current = boards[i];
    if (current.pairs.length === 1 && validateBoard([...previous.pairs, ...current.pairs])) {
      previous.pairs.push(...current.pairs); boards.splice(i--, 1);
    }
  }
  return boards;
}
export function targetOrder(board: MatchingBoard, seed: string) {
  // Stable per attempt/board; no position-based grading. Avoid identity permutation.
  let state = 2166136261;
  for (const c of seed + board.id) state = Math.imul(state ^ c.charCodeAt(0), 16777619) >>> 0;
  const result = [...board.pairs];
  for (let i = result.length - 1; i > 0; i--) { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; const j = state % (i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  if (result.length > 1 && result.every((p, i) => p.id === board.pairs[i].id)) result.push(result.shift()!);
  return result;
}
export function connect(matches: Record<string, string>, source: string, target: string) {
  const next = Object.fromEntries(Object.entries(matches).filter(([s, t]) => s !== source && t !== target));
  // Tapping the same connection again undoes it.
  if (matches[source] !== target) next[source] = target;
  return next;
}
export function validMatches(board: MatchingBoard, matches: Record<string, string>) {
  const ids = board.pairs.map(p => p.id);
  return Object.keys(matches).length === ids.length && ids.every(id => ids.includes(matches[id])) && new Set(Object.values(matches)).size === ids.length;
}
export const sourceBank = (id: string) => characterActivities.find(a => a.sets.some(s => s.questions.some(q => q.id === id)))!;
