import { DatabaseSync } from 'node:sqlite';
import type { DatabaseConnection } from '../types';
import { runMigrations } from '../migrate';
import { seedCurriculum } from '../seed';
import { localLearnerService } from '../services/localLearnerService';
import { characterActivityService as service } from '../services/characterActivityService';
import { characterActivities } from '../../content/characterActivities';
import { score, attemptedCount, complete } from '../../modules/characterActivities/assessment';
function createInMemoryDatabase(path = ':memory:'): DatabaseConnection {
  const rawDb = new DatabaseSync(path);

  const connection: DatabaseConnection = {
    async execAsync(source: string): Promise<void> {
      rawDb.exec(source);
    },
    async runAsync(source: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
      const stmt = rawDb.prepare(source);
      const res = (stmt.run as (...args: unknown[]) => { lastInsertRowid: number | bigint; changes: number | bigint })(...params);
      return {
        lastInsertRowId: Number(res.lastInsertRowid ?? 0),
        changes: Number(res.changes ?? 0),
      };
    },
    async getFirstAsync<T>(source: string, params: unknown[] = []): Promise<T | null> {
      const stmt = rawDb.prepare(source);
      const row = (stmt.get as (...args: unknown[]) => unknown)(...params);
      return (row as T) || null;
    },
    async getAllAsync<T>(source: string, params: unknown[] = []): Promise<T[]> {
      const stmt = rawDb.prepare(source);
      return ((stmt.all as (...args: unknown[]) => unknown[])(...params) as T[]) || [];
    },
    async withTransactionAsync<T>(action: (transactionDb: DatabaseConnection) => Promise<T>): Promise<T> {
      rawDb.exec('BEGIN TRANSACTION;');
      try {
        const result = await action(connection);
        rawDb.exec('COMMIT;');
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK;');
        throw err;
      }
    },
    async closeAsync(): Promise<void> {
      rawDb.close();
    },
  };

  return connection;
}

describe('Character assessment SQLite persistence', () => {
  let db: DatabaseConnection;
  beforeEach(async () => { db = createInMemoryDatabase(); await runMigrations(db); await seedCurriculum(db); await localLearnerService.saveProfile('Assessment test', '', db); });
  afterEach(async () => db.closeAsync?.());
  const set = characterActivities[1].sets[0];
  it('resumes the same attempt and persists feedback before advancing', async () => {
    const a = await service.begin(set.id, false, db), q = set.questions[0];
    const saved = await service.submit(a, q.id, {kind:'choice',optionId:`${q.id}-B`}, db);
    expect(saved.cursor).toBe(0); expect(score(saved)).toBe(1);
    expect(await service.begin(set.id, false, db)).toEqual(saved);
    const next = await service.advance(saved, db); expect(next.cursor).toBe(1);
    expect((await service.list(db))[0]).toEqual(next);
  });
  it('does not score or advance twice when a caller retries', async () => {
    const a = await service.begin(set.id, false, db), q = set.questions[0];
    const saved = await service.submit(a, q.id, {kind:'choice',optionId:`${q.id}-A`}, db);
    const duplicate = await service.submit(a, q.id, {kind:'choice',optionId:`${q.id}-B`}, db);
    expect(duplicate).toEqual(saved); expect(score(saved)).toBe(0);
    await service.advance(saved, db); expect((await service.advance(saved, db)).cursor).toBe(1);
  });
  it('keeps old results when a completed set is repeated', async () => {
    let a = await service.begin(set.id, false, db);
    for (const q of set.questions) {
      if (q.type !== 'multiple-choice') throw Error('fixture');
      a = await service.submit(a, q.id, {kind:'choice',optionId:`${q.id}-${q.correctLetter}`}, db);
      a = await service.advance(a, db);
    }
    expect(score(a)).toBe(5); expect((await service.begin(set.id, false, db)).id).toBe(a.id);
    const repeat = await service.begin(set.id, true, db); expect(repeat.id).not.toBe(a.id);
    expect((await service.list(db)).length).toBe(2);
    expect((await localLearnerService.getCompletedTopicIds(db)).size).toBe(0);
  });
  it('records technical failures separately and rejects out-of-order responses', async () => {
    const a = await service.begin(set.id, false, db);
    await service.failure(a, 'uncertain', db);
    expect((await service.list(db))[0].failures).toHaveLength(1);
    expect((await service.list(db))[0].responses).toHaveLength(0);
    await expect(service.submit(a, set.questions[1].id, {kind:'choice',optionId:`${set.questions[1].id}-A`}, db)).rejects.toThrow();
  });
  it('isolates profiles and rejects writes after identity changes', async () => {
    const a = await service.begin(set.id, false, db);
    await db.runAsync("DELETE FROM local_app_state WHERE state_key = 'active_learner_profile_id';");
    await localLearnerService.saveProfile('Other learner', '', db);
    expect(await service.list(db)).toEqual([]);
    await expect(service.advance(a, db)).rejects.toThrow('changed');
  });
  it('lets learners reach valid questions after withheld audio without false completion', async () => {
    const audioSet = characterActivities[0].sets[1];
    let a = await service.begin(audioSet.id, false, db);
    for (const q of audioSet.questions) {
      if (q.type !== 'multiple-choice') throw Error('fixture');
      const answer = ['DE','RE'].includes(q.prompt) ? {kind:'unavailable' as const,reason:'recording-pending-validation' as const}
        : {kind:'choice' as const,optionId:`${q.id}-${q.correctLetter}`,audioPlayed:true};
      a = await service.submit(a, q.id, answer, db); a = await service.advance(a, db);
    }
    expect(a.cursor).toBe(5); expect(attemptedCount(a)).toBe(3); expect(score(a)).toBe(3); expect(complete(a)).toBe(false);
    expect((await service.list(db))[0]).toEqual(a);
  });
  it('enforces topic prerequisites transactionally and preserves original history beside variable-length attempts', async () => {
    const id='checkpoint-v1-topic-2-1';
    const historic=await service.begin(set.id,false,db);
    await expect(service.begin(id,false,db)).rejects.toThrow('prerequisites');
    for (const topic of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1']) await localLearnerService.completeTopic(topic,db);
    const { getAssessmentSet } = require('../../content/characterActivities/checkpoints');
    const questions=getAssessmentSet(id).set.questions;
    let attempt=await service.begin(id,false,db);
    for (const q of questions) {
      attempt=await service.submit(attempt,q.id,{kind:'choice',optionId:`${q.id}-${q.correctLetter}`,audioPlayed:true},db);
      expect(await service.begin(id,false,db)).toEqual(attempt);
      attempt=await service.advance(attempt,db);
    }
    expect(attempt.cursor).toBe(3); expect(score(attempt)).toBe(3); expect(complete(attempt)).toBe(true);
    const retry=await service.begin(id,true,db);
    expect(retry.id).not.toBe(attempt.id);
    expect(await service.list(db)).toEqual(expect.arrayContaining([historic,attempt,retry]));
    await expect(service.begin('checkpoint-v1-topic-2-2',false,db)).rejects.toThrow('prerequisites');
  });

  it('atomically saves a whole matching board and preserves it across duplicate submissions and reload', async () => {
    const { matchingBoards } = require('../../content/characterActivities/matching');
    const a = await service.begin(set.id, false, db), board = matchingBoards(set.id)[0];
    const matches = Object.fromEntries(board.pairs.map((p: {id:string}) => [p.id,p.id]));
    const saved = await service.submitMatches(a,board.id,matches,[],db);
    expect(saved.responses).toHaveLength(board.pairs.length); expect(saved.cursor).toBe(0);
    expect(await service.submitMatches(a,board.id,{},[],db)).toEqual(saved);
    expect(await service.begin(set.id,false,db)).toEqual(saved);
    const advanced = await service.advance(saved,db); expect(advanced.cursor).toBe(board.pairs.length);
    expect(await service.advance(saved,db)).toEqual(advanced);
  });
  it('rejects partial matching without storing any response', async () => {
    const { matchingBoards } = require('../../content/characterActivities/matching');
    const a = await service.begin(set.id,false,db), board = matchingBoards(set.id)[0];
    await expect(service.submitMatches(a,board.id,{},[],db)).rejects.toThrow();
    expect((await service.list(db))[0].responses).toEqual([]);
  });

});
