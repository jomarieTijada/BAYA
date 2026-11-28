import { readWallet } from '../../modules/rewards/wallet';
import { questionPlacements } from '../../content/characterActivities/checkpoints';
import { achievementCatalog } from '../../content/achievements/achievementCatalog';
import { redeemHint, resolveHint } from '../../modules/rewards/hints';
import { performanceRating,rewardPolicy } from '../../modules/rewards/policy';
import { matchingBoards, matchingPair } from '../../content/characterActivities/matching';
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
  it('rejects withholding approved audio and persists all five scored responses', async () => {
    const audioSet = characterActivities[0].sets[1];
    let a = await service.begin(audioSet.id, false, db);
    for (const q of audioSet.questions) {
      if (q.type !== 'multiple-choice') throw Error('fixture');
      if (['DE','RE'].includes(q.prompt)) await expect(service.submit(a,q.id,{kind:'unavailable',reason:'recording-pending-validation'},db)).rejects.toThrow('Available questions cannot be deferred');
      const answer = {kind:'choice' as const,optionId:`${q.id}-${q.correctLetter}`,audioPlayed:true};
      a = await service.submit(a, q.id, answer, db); a = await service.advance(a, db);
    }
    expect(a.cursor).toBe(5); expect(attemptedCount(a)).toBe(5); expect(score(a)).toBe(5); expect(complete(a)).toBe(true);
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


  const prepareWallet = async () => {
    for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1']) {
      await localLearnerService.completeTopic(id,db);
    }
    return service.begin('checkpoint-v1-topic-2-1',false,db);
  };
  it('credits distinct topics, modules and achievements once per owner', async()=>{
    const a=await prepareWallet();
    const first=await readWallet(a.profileId,db);
    expect(first.rows.filter(r=>r.kind==='topic')).toHaveLength(6);
    expect(first.rows.find(r=>r.kind==='module')?.amount).toBe(5);
    expect(first.rows.find(r=>r.source_id==='first_step')?.amount).toBe(1);
    await localLearnerService.completeTopic('topic-1-1',db);
    expect(await readWallet(a.profileId,db)).toEqual(first);
  });
  it('restores a paid clue and records actual correctness independently of answer credit',async()=>{
    const a=await prepareWallet(), board=matchingBoards(a.setId)[0], q=board.pairs[0].id;
    const before=await readWallet(a.profileId,db);
    const hint=await redeemHint(a,q,db);
    expect(hint.level).toBe('answer-revealed');
    expect(await redeemHint(a,q,db)).toEqual(hint);
    const after=await readWallet(a.profileId,db);
    expect(after.balance).toBe(before.balance-rewardPolicy.hintCost);
    expect(after.earned).toBe(before.earned);
    const saved=await service.submit(a,q,{kind:'mascot-match-v3',boardId:board.id,boardStart:0,targetQuestionId:q},db);
    expect(saved.responses[0].correct).toBe(true);
    expect((await readWallet(a.profileId,db)).rows.some(r=>r.kind==='matching'&&r.source_id===q)).toBe(false);
    await expect(redeemHint(a,q,db)).rejects.toThrow('submitted');
  });
  it('rolls back undelivered hints and rejects stale identities and invalid debits',async()=>{
    const a=await prepareWallet(),q=matchingBoards(a.setId)[0].pairs[0].id;
    const before=await readWallet(a.profileId,db);
    await db.execAsync("CREATE TRIGGER simulate_delivery_failure BEFORE INSERT ON learner_hint_usage BEGIN SELECT RAISE(ABORT,'delivery failed'); END;");
    await expect(redeemHint(a,q,db)).rejects.toThrow('delivery failed');
    expect(await readWallet(a.profileId,db)).toEqual(before);
    await expect(db.runAsync("INSERT INTO learner_star_transactions(learner_id,kind,source_id,amount,policy_version) VALUES(?,'hint','overspend',-99999,1)",[a.profileId])).rejects.toThrow('Insufficient Stars');
    await expect(db.runAsync('UPDATE learner_star_transactions SET amount=99')).rejects.toThrow('Immutable');
    await db.runAsync("DELETE FROM local_app_state WHERE state_key='active_learner_profile_id'");
    const second=await localLearnerService.saveProfile('Other wallet','',db);
    await expect(redeemHint(a,q,db)).rejects.toThrow('changed');
    expect((await readWallet(second.profile_id,db)).balance).toBe(0);
  });
  it('offers only approved assistance and validates each live catalog price', () => {
    for (const definition of achievementCatalog) {
      expect(Number.isInteger(definition.starValue)).toBe(true);
      expect(definition.starValue).toBeGreaterThanOrEqual(1);
      expect(definition.starValue).toBeLessThanOrEqual(5);
    }
    for (const {question} of questionPlacements) {
      const hint = resolveHint(question);
      if (question.type === 'multiple-choice') {
        const pair = matchingPair(question.id);
        if (pair.pending) expect(hint).toBeNull();
        else {
          expect(hint?.level).toBe('answer-revealed');
          expect(hint?.en).toContain(pair.reading+' → '+pair.glyph);
          expect(hint?.tl).toContain(pair.reading+' → '+pair.glyph);
        }
      } else if (hint) {
        expect(hint.level).toBe('clue');
        expect(hint.en).toBeTruthy();
        expect(hint.tl).toBeTruthy();
      }
    }
  });
  it('keeps performance rating independent from wallet balances',()=>{
    expect([performanceRating(0,0),performanceRating(2,5),performanceRating(3,5),performanceRating(5,5)]).toEqual([0,1,2,3]);
    expect(Object.values(rewardPolicy.earnings).every(n=>Number.isInteger(n)&&n>=0)).toBe(true);
    expect(rewardPolicy.hintCost).toBeGreaterThan(0);
  });
});
