import { matchingBoards, validMatches } from '../../content/characterActivities/matching';
import { getReadyDatabase } from '../lifecycle';
import type { DatabaseConnection } from '../types';
import { localLearnerService } from './localLearnerService';
import { getAssessmentSet, findCheckpoint } from '../../content/characterActivities/checkpoints';
import { checkpointEligibilityFromIds } from '../../modules/characterActivities/curriculum';
import { evaluateAnswer, parseAttempt, type Answer, type SetAttempt } from '../../modules/characterActivities/assessment';

const prefix = (profileId: string) => `character_assessment:v1:${profileId}:`;
const key = (a: SetAttempt) => prefix(a.profileId) + a.id;
async function owner(db: DatabaseConnection, expected?: string) {
  const profile = await localLearnerService.getActiveLearner(db);
  if (!profile || (expected && profile.profile_id !== expected)) throw new Error('Active learner changed. Reopen the activity.');
  return profile.profile_id;
}
async function write(db: DatabaseConnection, a: SetAttempt) {
  await db.runAsync('INSERT INTO local_app_state (state_key, state_value) VALUES (?, ?) ON CONFLICT(state_key) DO UPDATE SET state_value = excluded.state_value;', [key(a), JSON.stringify(a)]);
}
async function read(db: DatabaseConnection, a: SetAttempt) {
  await owner(db, a.profileId);
  const row = await db.getFirstAsync<{state_value: string}>('SELECT state_value FROM local_app_state WHERE state_key = ?;', [key(a)]);
  if (!row) throw new Error('Attempt is missing.');
  return parseAttempt(row.state_value, a.profileId);
}
/** Uses existing transactional SQLite storage, scoped to the active learner. No raw drawings.
 * Cloud currently accepts approved foundational topic completions only; these attempts remain
 * explicitly local-only until a versioned assessment synchronization contract is approved.
 */
export const characterActivityService = {
  async list(override?: DatabaseConnection): Promise<SetAttempt[]> {
    const db = override ?? await getReadyDatabase(), profileId = await owner(db);
    const rows = await db.getAllAsync<{state_value: string}>('SELECT state_value FROM local_app_state WHERE state_key LIKE ?;', [prefix(profileId) + '%']);
    return rows.map(r => parseAttempt(r.state_value, profileId)).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  },
  async begin(setId: string, repeat = false, override?: DatabaseConnection): Promise<SetAttempt> {
    const db = override ?? await getReadyDatabase();
    if (!db.withTransactionAsync) throw new Error('Transactions required');
    return db.withTransactionAsync(async tx => {
      const profileId = await owner(tx), { activity, set } = getAssessmentSet(setId);
      const checkpoint = findCheckpoint(setId);
      if (checkpoint && !checkpointEligibilityFromIds(checkpoint.id, await localLearnerService.getCompletedTopicIds(tx)).eligible) throw new Error('Checkpoint prerequisites incomplete');
      const rows = await tx.getAllAsync<{state_value: string}>('SELECT state_value FROM local_app_state WHERE state_key LIKE ?;', [prefix(profileId) + '%']);
      const attempts = rows.map(r => parseAttempt(r.state_value, profileId)).filter(a => a.setId === setId).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      const unfinished = attempts.find(a => a.cursor < set.questions.length);
      if (unfinished) return unfinished;
      if (!repeat && attempts[0]) return attempts[0];
      const id = await tx.getFirstAsync<{id: string}>('SELECT lower(hex(randomblob(16))) AS id;');
      if (!id) throw new Error('Could not create attempt');
      const now = new Date().toISOString();
      const a: SetAttempt = { version: 1, id: id.id, profileId, activityId: activity.id, setId, startedAt: now, updatedAt: now, cursor: 0, responses: [], failures: [], syncState: 'local-only' };
      await write(tx, a); return a;
    });
  },
  async submit(attempt: SetAttempt, questionId: string, answer: Answer, override?: DatabaseConnection) {
    const db = override ?? await getReadyDatabase();
    if (!db.withTransactionAsync) throw new Error('Transactions required');
    return db.withTransactionAsync(async tx => {
      const a = await read(tx, attempt), { set } = getAssessmentSet(a.setId);
      // A retry after a lost acknowledgement returns the original score, never a duplicate.
      if (a.responses.some(r => r.questionId === questionId)) return a;
      const q = set.questions[a.cursor];
      if (!q || q.id !== questionId || a.responses.length !== a.cursor) throw new Error('Question changed');
      const now = new Date().toISOString();
      a.responses.push({ questionId, answer, correct: evaluateAnswer(q, answer), answeredAt: now });
      a.updatedAt = now; await write(tx, a); return a;
    });
  },
  async submitMatches(attempt: SetAttempt, boardId: string, matches: Record<string, string>, played: readonly string[], override?: DatabaseConnection) {
    const db = override ?? await getReadyDatabase();
    if (!db.withTransactionAsync) throw Error('Transactions required');
    return db.withTransactionAsync(async tx => {
      const a = await read(tx, attempt);
      if (a.responses.some(r => r.answer.kind === 'matching-v2' && r.answer.boardId === boardId)) return a;
      const board = matchingBoards(a.setId, a.cursor)[0];
      if (!board || board.id !== boardId || board.start !== a.cursor || a.responses.length !== a.cursor || !validMatches(board, matches)) throw Error('Incomplete or changed matching board');
      const now = new Date().toISOString();
      const responses = board.pairs.map(p => {
        const answer: Answer = { kind: 'matching-v2', boardId, boardStart: board.start, targetQuestionId: matches[p.id], audioPlayed: played.includes(p.id) };
        return { questionId: p.id, answer, correct: evaluateAnswer(p.question, answer), answeredAt: now };
      });
      a.responses.push(...responses); a.updatedAt = now;
      await write(tx, a); return a;
    });
  },
  async advance(attempt: SetAttempt, override?: DatabaseConnection) {
    const db = override ?? await getReadyDatabase();
    if (!db.withTransactionAsync) throw new Error('Transactions required');
    return db.withTransactionAsync(async tx => {
      const a = await read(tx, attempt);
      if (a.cursor !== attempt.cursor || !a.responses[a.cursor]) return a;
      if (a.responses[a.cursor]) {
        const answer = a.responses[a.cursor].answer;
        a.cursor += answer.kind === 'matching-v2' ? matchingBoards(a.setId, answer.boardStart)[0].pairs.length : 1;
      }
      a.updatedAt = new Date().toISOString(); await write(tx, a); return a;
    });
  },
  async failure(attempt: SetAttempt, reason: string, override?: DatabaseConnection) {
    const db = override ?? await getReadyDatabase();
    if (!db.withTransactionAsync) throw new Error('Transactions required');
    await db.withTransactionAsync(async tx => {
      const a = await read(tx, attempt), q = getAssessmentSet(a.setId).set.questions[a.cursor];
      if (!q || a.responses[a.cursor]) return;
      a.failures = [...a.failures, { questionId: q.id, reason, at: new Date().toISOString() }].slice(-50);
      await write(tx, a);
    });
  },
};
