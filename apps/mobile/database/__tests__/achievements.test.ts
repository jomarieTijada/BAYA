import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MIGRATIONS } from '../migrations';
import { DatabaseSync } from 'node:sqlite';
import type { DatabaseConnection } from '../types';
import { runMigrations } from '../migrate';
import { seedCurriculum } from '../seed';
import { localLearnerService } from '../services/localLearnerService';
import { reconcileAchievements, recordAchievementEvent } from '../../modules/achievements/service';
import { evaluateAchievements, type AchievementEvidence } from '../../modules/achievements/evaluate';
import { achievementCatalog } from '../../content/achievements/achievementCatalog';
import { Ionicons } from '@expo/vector-icons';
import { questionPlacements, topicCheckpoints } from '../../content/characterActivities/checkpoints';
import { matchingBoards } from '../../content/characterActivities/matching';
import { approvedCurriculum } from '../../content/approvedCurriculum';
import { BAYA_CLASS_LABELS } from '../../ml/bayaClassLabels';
import { glyphClass, characterActivities } from '../../content/characterActivities';
import { parseAttempt, type SetAttempt } from '../../modules/characterActivities/assessment';
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


const empty: AchievementEvidence = { topics: [], attempts: [], events: [], writingAttempts: 0, writingSuccess: 0 };
const state = (id: string, evidence: Partial<AchievementEvidence> = {}) => evaluateAchievements({ ...empty, ...evidence }).find(s => s.definition.id === id)!;
const attempt = (responses: SetAttempt['responses'], setId = characterActivities[3].sets[0].id): SetAttempt => ({ version: 1, id: 'attempt', profileId: 'learner', activityId: setId, setId, startedAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:01:00Z', cursor: responses.length, responses, failures: [], syncState: 'local-only' });
describe('achievement catalog and evidence', () => {
 it('has exactly 50 distinct bilingual definitions and valid individual icons', () => {
  expect(achievementCatalog).toHaveLength(50);
  expect(new Set(achievementCatalog.map(a => a.id)).size).toBe(50);
  expect(new Set(achievementCatalog.map(a => a.iconKey)).size).toBe(50);
  for (const d of achievementCatalog) {
   expect(Ionicons.glyphMap).toHaveProperty(d.iconKey);
   expect(d.title.tl).toBeTruthy(); expect(d.requirement.tl).toBeTruthy(); expect(d.starValue).toBe(d.proposedStars); expect(d.starValue).toBeGreaterThanOrEqual(1); expect(d.starValue).toBeLessThanOrEqual(5);
   expect(achievementCatalog.filter(a => a.category === d.category)).toHaveLength(10);
  }
 });
 it('starts empty and requires every authoritative module topic', () => {
  expect(evaluateAchievements(empty).every(s => s.current === 0)).toBe(true);
  expect(state('heritage_keeper', { topics: ['topic-1-1'] }).current).toBe(1);
  expect(state('heritage_keeper').target).toBe(5);
  expect(state('first_step', { topics: ['invented'] }).current).toBe(0);
 });
 it('deduplicates discovery and audio evidence', () => {
  const events = [1,2,3].map(() => ({ event_type: 'explore:base-consonant', entity_id: 'da_ra', occurred_at: '' }));
  expect(state('seven_symbols', { events }).current).toBe(1);
  expect(state('symbol_collector', { events }).current).toBe(1);
  expect(state('sound_collector', { events: events.map(e => ({ ...e, event_type: 'audio' })) }).current).toBe(1);
 });
 it('does not treat historical choices as matching pairs', () => {
  const a = attempt([{ questionId: 'character-1-1', answer: { kind: 'choice', optionId: 'x' }, correct: true, answeredAt: '' }]);
  expect(state('pair_pioneer', { attempts: [a] }).current).toBe(0);
 });
 it('counts distinct writing questions separately from distinct canonical targets', () => {
  const questions = questionPlacements.filter(p => p.question.type === 'handwriting');
  const responses = questions.map(p => ({ questionId: p.questionId, answer: { kind: 'writing' as const, prediction: { label: 'ba', classIndex: 0, probability: 1 } }, correct: true, answeredAt: '' }));
  const a = attempt(responses);
  expect(state('baybayin_writing_hero', { attempts: [a,a] }).current).toBe(25);
  expect(state('upper_kudlit_artist', { attempts: [a] }).current).toBe(3);
  expect(state('values_hero', { attempts: [a] }).availability).toBe('coming-soon');
 });
 it('requires completed topic checkpoints, not legacy sets or unfinished responses', () => {
  expect(state('checkpoint_clearer', { attempts: [attempt([])] }).current).toBe(0);
  const c = topicCheckpoints[0];
  expect(state('checkpoint_clearer', { attempts: [attempt([], c.id)] }).current).toBe(0);
 });
});
describe('achievement SQLite persistence', () => {
 let db: DatabaseConnection, owner: string;
 beforeEach(async () => { db = createInMemoryDatabase(); await runMigrations(db); await seedCurriculum(db); owner = (await localLearnerService.saveProfile('QA Achievements', '', db)).profile_id; });
 afterEach(async () => db.closeAsync?.());
 it('unlocks after persisted topic completion, backfills safely, and is concurrent/idempotent', async () => {
  await localLearnerService.completeTopic('topic-1-1', db);
  const first = await reconcileAchievements(owner, db);
  expect(first.filter(s => s.unlockedAt).map(s => s.definition.id)).toEqual(['first_step','time_traveler']);
  await Promise.all([reconcileAchievements(owner, db), reconcileAchievements(owner, db)]);
  const again = await reconcileAchievements(owner, db);
  expect(again.map(s => s.unlockedAt)).toEqual(first.map(s => s.unlockedAt));
  expect(again.find(s => s.definition.id === 'first_sound')!.current).toBe(0);
 });
 it('isolates learners, rejects stale events, and persists unique events', async () => {
  await recordAchievementEvent(owner, 'audio', 'baya-a-ba', db);
  await recordAchievementEvent(owner, 'audio', 'baya-a-ba', db);
  expect((await reconcileAchievements(owner, db)).find(s => s.definition.id === 'sound_collector')!.current).toBe(1);
  await db.runAsync("DELETE FROM local_app_state WHERE state_key = 'active_learner_profile_id';");
  const second = (await localLearnerService.saveProfile('Second QA', '', db)).profile_id;
  await recordAchievementEvent(owner, 'audio', 'baya-a-ka', db);
  expect((await reconcileAchievements(second, db)).every(s => !s.unlockedAt)).toBe(true);
  expect((await reconcileAchievements(owner, db)).find(s => s.definition.id === 'sound_collector')!.current).toBe(1);
 });
 it('preserves unlocks if later evidence is unavailable and records reconciliation provenance', async () => {
  await recordAchievementEvent(owner, 'story', 'five-pages-v1', db);
  await db.runAsync('DELETE FROM achievement_events WHERE learner_id = ?;', [owner]);
  const states = await reconcileAchievements(owner, db);
  expect(states.find(s => s.definition.id === 'baya_story_explorer')!.unlockedAt).toBeTruthy();
  const rows = await db.getAllAsync<{unlock_source: string}>('SELECT unlock_source FROM learner_achievements;');
  expect(rows[0].unlock_source).toBe('reconciled');
 });
});

describe('complete catalog reachability and thresholds', () => {
 it('can satisfy every obtainable condition using the actual published inventory', () => {
  const attempts = topicCheckpoints.map((checkpoint, i) => {
    const responses: SetAttempt['responses'] = checkpoint.questions.map((q, index) => {
      if (q.type === 'handwriting') {
        const label = glyphClass(q.expectedGlyph);
        return { questionId: q.id, answer: { kind: 'writing', prediction: { label, classIndex: BAYA_CLASS_LABELS.indexOf(label), probability: .99 } }, correct: true, answeredAt: '2026-01-02T00:01:00Z' };
      }
      const board = matchingBoards(checkpoint.id).find(b => b.pairs.some(p => p.id === q.id))!;
      return { questionId: q.id, answer: { kind: 'mascot-match-v3', targetQuestionId: q.id, boardId: board.id, boardStart: board.start, audioPlayed: true }, correct: true, answeredAt: '2026-01-02T00:01:00Z' };
    });
    const a = { ...attempt(responses, checkpoint.id), id: `full-${i}`, activityId: checkpoint.id, startedAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:01:00Z' };
    expect(parseAttempt(JSON.stringify(a), 'learner')).toEqual(a);
    return a;
  });
  const older = JSON.parse(JSON.stringify(attempts[0])) as SetAttempt;
  older.id = 'older'; older.startedAt = '2026-01-01T00:00:00Z'; older.updatedAt = '2026-01-01T00:01:00Z'; older.responses[0].correct = false;
  const events = ['vowel:3','base-consonant:14','upper-kudlit:5','lower-kudlit:5'].flatMap(v => { const [group,count] = v.split(':'); return Array.from({length:Number(count)}, (_,i) => ({event_type:`explore:${group}`,entity_id:`${group}-${i}`,occurred_at:''})); });
  events.push(...Array.from({length:15},(_,i)=>({event_type:'audio',entity_id:`recording-${i}`,occurred_at:''})), ...['resume','offline'].map(event_type=>({event_type,entity_id:attempts[0].id,occurred_at:''})), ...['story','replay'].map(event_type=>({event_type,entity_id:'five-pages',occurred_at:''})));
  const results = evaluateAchievements({ ...empty, topics: approvedCurriculum.flatMap(m=>m.topics.map(t=>t.id)), attempts:[older,...attempts], events });
  expect(results.filter(s=>s.availability==='available')).toHaveLength(49);
  expect(results.filter(s=>s.availability==='available'&&s.current<s.target).map(s=>s.definition.id)).toEqual([]);
 });
 it('does not award a perfect board from a partial modern submission', () => {
  const board = matchingBoards(topicCheckpoints[0].id)[0];
  const responses: SetAttempt['responses'] = board.pairs.map(p => ({questionId:p.id,answer:{kind:'mascot-match-v3',targetQuestionId:p.id,boardId:board.id,boardStart:board.start,audioPlayed:true},correct:true,answeredAt:''}));
  expect(state('perfect_pairboard',{attempts:[attempt(responses.slice(0,1),topicCheckpoints[0].id)]}).current).toBe(0);
  expect(state('perfect_pairboard',{attempts:[attempt(responses,topicCheckpoints[0].id)]}).current).toBe(1);
  const wrong = responses.map((r,i)=>({...r,correct:i!==0}));
  expect(state('perfect_pairboard',{attempts:[attempt(wrong,topicCheckpoints[0].id)]}).current).toBe(0);
 });
 it('does not compare incompatible assessment formats for improvement', () => {
  const c=topicCheckpoints[0];
  const old=attempt(c.questions.map(q=>({questionId:q.id,answer:{kind:'choice',optionId:'unused'},correct:false,answeredAt:''})),c.id);
  const newer={...old,id:'new',startedAt:'2026-02-01T00:00:00Z',updatedAt:'2026-02-01T00:01:00Z',responses:old.responses.map(r=>({...r,correct:true,answer:{kind:'mascot-match-v3' as const,targetQuestionId:r.questionId,boardId:'test',boardStart:0}}))};
  expect(state('practice_makes_progress',{attempts:[old,newer]}).current).toBe(0);
 });
});

it('upgrades a populated version-five database and reopens with stable learner evidence', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'baya-migration-'));
  const path = join(directory, 'learner.sqlite');
  let db = createInMemoryDatabase(path);
  const snapshot = async () => {
    const result: Record<string, unknown[]> = {};
    for (const table of ['profiles', 'activity_attempts', 'writing_attempts', 'local_app_state', 'workspaces', 'sync_outbox', 'learner_progress']) {
      result[table] = await db.getAllAsync('SELECT * FROM ' + table + ' ORDER BY rowid');
    }
    return result;
  };
  try {
    expect((await runMigrations(db, MIGRATIONS.filter(m => m.version < 6))).appliedCount).toBe(5);
    await seedCurriculum(db);
    await db.execAsync(`
      INSERT INTO profiles VALUES ('old',NULL,'Existing learner','learner','2025','2025'),('other',NULL,'Second learner','learner','2025','2025');
      INSERT INTO activity_attempts VALUES ('topic','old','topic-1-1','completed',NULL,NULL,NULL,'2025'),('writing','old','topic-3-1','valid','ba',0.99,'baya_model_v1:valid','2025');
      INSERT INTO writing_attempts VALUES ('writing','ba','[[{"x":0.1,"y":0.2}]]',NULL,'baya_model_v1');
      INSERT INTO learner_progress (learner_progress_id,learner_profile_id,lesson_id,status,updated_at) SELECT 'partial','old',lesson_id,'in_progress','2025' FROM lessons LIMIT 1;
      INSERT INTO mentor_profiles VALUES ('mentor','other');
      INSERT INTO workspaces VALUES ('ws','mentor','QA001','Existing workspace','active','2025');
      INSERT INTO sync_outbox VALUES ('out','old','attempt','writing','insert','pending','2025',NULL);
      INSERT INTO local_app_state VALUES ('active_learner_profile_id','old'),('baya.storybook.intro.seen.v1','true');
    `);
    const board = matchingBoards(topicCheckpoints[0].id)[0];
    const q = characterActivities[0].sets[0].questions[0];
    if (q.type !== 'multiple-choice') throw Error('Expected historical choice');
    const timestamp = '2025-01-01T00:00:00Z';
    const choice = attempt([{questionId:q.id,answer:{kind:'choice',optionId:q.options[0].id,audioPlayed:true},correct:q.options[0].letter===q.correctLetter,answeredAt:timestamp}],q.setId);
    const match = attempt([{questionId:board.pairs[0].id,answer:{kind:'mascot-match-v3',targetQuestionId:board.pairs[0].id,boardId:board.id,boardStart:board.start},correct:true,answeredAt:timestamp}],topicCheckpoints[0].id);
    for (const row of [choice, match]) {
      const value = {...row, activityId:row === choice ? characterActivities[0].id : row.activityId, profileId:'old',id:row.setId};
      expect(parseAttempt(JSON.stringify(value), 'old')).toEqual(value);
      await db.runAsync('INSERT INTO local_app_state VALUES (?,?)', ['character_assessment:v1:old:'+value.id,JSON.stringify(value)]);
    }
    const before = await snapshot();
    expect((await runMigrations(db)).appliedCount).toBe(2);
    expect(await snapshot()).toEqual(before);
    const states = await reconcileAchievements('old', db);
    expect(states.find(s=>s.definition.id==='first_step')?.unlockedAt).toBeTruthy();
    expect(states.find(s=>s.definition.id==='first_sound')?.unlockedAt).toBeNull();
    expect((await reconcileAchievements('other',db)).every(s=>!s.unlockedAt)).toBe(true);
    expect(await db.getAllAsync('SELECT * FROM achievement_events')).toEqual([]);
    await db.closeAsync?.();
    db = createInMemoryDatabase(path);
    expect((await runMigrations(db)).appliedCount).toBe(0);
    expect((await reconcileAchievements('old',db)).map(s=>s.unlockedAt)).toEqual(states.map(s=>s.unlockedAt));
    expect(await snapshot()).toEqual(before);
  } finally {
    await db.closeAsync?.();
    rmSync(directory,{recursive:true,force:true});
  }
});
