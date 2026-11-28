import { characterActivities, validateCharacterContent, questionRecording } from '../../content/characterActivities';
import { topicCheckpoints } from '../../content/characterActivities/checkpoints';
import { matchingPairs, matchingBoards, validateBoard, connect, targetOrder, validMatches } from '../../content/characterActivities/matching';
import { evaluateAnswer, parseAttempt, type SetAttempt } from './assessment';
const checkpoint = topicCheckpoints.find(c => c.topicId === 'topic-2-1')!;
const board = matchingBoards(checkpoint.id)[0];
const now = '2026-11-24T00:00:00Z';
function attempt(): SetAttempt { return { version: 1, id: 'test', profileId: 'owner', activityId: checkpoint.id, setId: checkpoint.id, startedAt: now, updatedAt: now, cursor: 0, responses: [], failures: [], syncState: 'local-only' }; }
describe('matching source integrity', () => {
  test('all original choice and handwriting records remain', () => { expect(matchingPairs).toHaveLength(75); expect(characterActivities[3].sets.flatMap(s => s.questions)).toHaveLength(25); });
  test('published matching audio resolves for every source', () => { expect(validateCharacterContent()).toHaveLength(0); expect(matchingPairs.filter(p => p.pending).map(p => p.reading)).toEqual([]); });
  test.each(matchingPairs.map(p => [p.id, p] as const))('%s derives its answer solely from the source key', (_, p) => {
    const option = p.question.options.find(o => o.letter === p.question.correctLetter)!;
    expect(p.interaction === 2 ? p.reading : p.glyph).toBe(option.label);
    expect(p.question.id).toBe(p.sourceQuestionId);
  });
  test('75 sources are covered exactly once in checkpoints', () => {
    const ids = topicCheckpoints.flatMap(c => matchingBoards(c.id).flatMap(b => b.pairs.map(p => p.id)));
    expect(ids.sort()).toEqual(matchingPairs.map(p => p.id).sort()); expect(new Set(ids).size).toBe(75);
  });
  test.each(topicCheckpoints.filter(c => c.questions[0].type === 'multiple-choice').map(c => [c.id, c] as const))('%s is deterministic and unambiguous', (_, c) => {
    const boards = matchingBoards(c.id); expect(boards).toEqual(matchingBoards(c.id));
    for (const b of boards) { expect(b.pairs[0].topicId).toBe(c.topicId); expect(b.pairs.every(p => p.pending) || validateBoard(b.pairs)).toBe(true); }
  });
  test('duplicate traditional glyphs are rejected', () => { const pairs = matchingPairs.filter(p => p.interaction === 3 && p.glyph === 'ᜇ'); expect(validateBoard([pairs[0], pairs[0]])).toBe(false); });
  test('directions and topics cannot mix', () => { expect(validateBoard([matchingPairs[0], board.pairs[0]])).toBe(false); });
  test('audio is never admitted while awaiting validation', () => { for (const p of matchingPairs.filter(p => p.pending)) { expect(questionRecording(p.question)).toBeUndefined(); expect(validateBoard([p])).toBe(false); } });
});
describe('provisional matching state and scoring', () => {
  test('connection is provisional and does not mutate old state', () => { const old = {}; expect(connect(old, 'a', 'b')).toEqual({ a: 'b' }); expect(old).toEqual({}); });
  test('same connection can be undone', () => expect(connect({a:'b'}, 'a', 'b')).toEqual({}));
  test('reassignment removes old target ownership', () => expect(connect({a:'b',c:'d'}, 'a', 'd')).toEqual({a:'d'}));
  test('partial boards cannot submit', () => expect(validMatches(board, {[board.pairs[0].id]:board.pairs[0].id})).toBe(false));
  test('duplicate target boards cannot submit', () => expect(validMatches(board, Object.fromEntries(board.pairs.map(p => [p.id, board.pairs[0].id])))).toBe(false));
  test('unknown targets cannot submit', () => expect(validMatches(board, Object.fromEntries(board.pairs.map(p => [p.id, 'bad'])))).toBe(false));
  test('all valid bijections are complete, even when incorrect', () => expect(validMatches(board, Object.fromEntries(board.pairs.map((p,i) => [p.id,board.pairs[(i+1)%3].id])))).toBe(true));
  test('target order remains stable and is not identity', () => { expect(targetOrder(board,'a')).toEqual(targetOrder(board,'a')); expect(targetOrder(board,'a')).not.toEqual(board.pairs); });
  test('each pair is scored independently', () => { const results=board.pairs.map((p,i) => evaluateAnswer(p.question,{kind:'matching-v2',boardId:board.id,boardStart:board.start,targetQuestionId:board.pairs[i===0?0:i===1?2:1].id})); expect(results).toEqual([true,false,false]); });
  test('played audio is required', () => { const p=matchingPairs.find(p=>p.interaction===1&&!p.pending)!; expect(()=>evaluateAnswer(p.question,{kind:'matching-v2',boardId:'test',boardStart:0,targetQuestionId:p.id})).toThrow(); });
  test('pending audio is null, never incorrect', () => { const q={...matchingPairs.find(p=>p.interaction===1)!.question,prompt:'DO'}; expect(questionRecording(q)).toBeUndefined(); expect(evaluateAnswer(q,{kind:'unavailable',reason:'recording-pending-validation'})).toBeNull(); });
  test('submitted whole board parses before advancing', () => { const a=attempt(); a.responses=board.pairs.map(p=>({questionId:p.id,answer:{kind:'matching-v2',boardId:board.id,boardStart:0,targetQuestionId:p.id},correct:true,answeredAt:now})); expect(parseAttempt(JSON.stringify(a),'owner')).toEqual(a); });
  test('partial persisted board is rejected', () => { const a=attempt(); const p=board.pairs[0]; a.responses=[{questionId:p.id,answer:{kind:'matching-v2',boardId:board.id,boardStart:0,targetQuestionId:p.id},correct:true,answeredAt:now}]; expect(()=>parseAttempt(JSON.stringify(a),'owner')).toThrow(); });
  test('legacy choice answer remains reviewable and unchanged', () => { const a=attempt(),p=board.pairs[0]; a.responses=[{questionId:p.id,answer:{kind:'choice',optionId:p.question.options.find(o=>o.letter===p.question.correctLetter)!.id},correct:true,answeredAt:now}]; expect(parseAttempt(JSON.stringify(a),'owner')).toEqual(a); });
  test('owner is checked before resume', () => expect(()=>parseAttempt(JSON.stringify(attempt()),'other')).toThrow());
});

test('historical DE deferral remains readable while new submissions require the approved clip', () => {
  const set = characterActivities[0].sets[1], q = set.questions[0];
  const answer = {kind:'unavailable' as const, reason:'recording-pending-validation' as const};
  expect(q.id).toBe('character-1-q-06');
  expect(() => evaluateAnswer(q,answer)).toThrow('Available questions cannot be deferred');
  const old = {...attempt(), activityId:characterActivities[0].id,setId:set.id,cursor:1,responses:[{questionId:q.id,answer,correct:null,answeredAt:now}]};
  expect(parseAttempt(JSON.stringify(old),'owner')).toEqual(old);
});
