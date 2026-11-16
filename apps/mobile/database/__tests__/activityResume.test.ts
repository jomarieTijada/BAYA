import { DatabaseSync } from 'node:sqlite';
import type { DatabaseConnection } from '../types';
import { runMigrations } from '../migrate';
import { seedCurriculum } from '../seed';
import { localLearnerService } from '../services/localLearnerService';
import { activityResumeService as resume } from '../services/activityResumeService';
import { initialDraft, parseCheckpoint, type Checkpoint } from '../../modules/resume/checkpoint';
import { APPROVED_CONTENT_VERSION_ID } from '../../content/approvedCurriculum';

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


describe('profile-owned activity resume (real SQLite)', () => {
  let db: DatabaseConnection;
  let owner: string;
  const checkpoint = (topicId = 'topic-3-1'): Checkpoint => ({ version: 1, contentVersion: APPROVED_CONTENT_VERSION_ID, profileId: owner, topicId, startedAt: '2026-11-01T00:00:00.000Z', savedAt: '2026-11-01T00:00:01.000Z', draft: initialDraft(topicId)! });
  beforeEach(async () => {
    db = createInMemoryDatabase();
    await runMigrations(db);
    await seedCurriculum(db);
    owner = (await localLearnerService.saveProfile('Resume A', '', db)).profile_id;
  });
  afterEach(async () => { await db.closeAsync?.(); });
  it('restores separate stroke groups, target and geometry without writing attempts or completion', async () => {
    const c = checkpoint();
    if (c.draft.kind !== 'writing') throw Error('fixture');
    c.draft.strokes = [[{ x: .1, y: .2, t: 10 }, { x: .3, y: .5, t: 20 }], [{ x: .8, y: .9 }]];
    c.draft.width = 400; c.draft.height = 250;
    await resume.save(c, db);
    expect(await resume.read(owner, undefined, db)).toEqual(c);
    expect(await resume.acceptedCounts(c, db)).toEqual({});
    expect(await db.getAllAsync('SELECT * FROM activity_attempts')).toEqual([]);
    expect(await localLearnerService.getCompletedTopicIds(db)).toEqual(new Set());
  });
  it('derives capped mastery only from validated saved attempts in this instance', async () => {
    const c = checkpoint();
    const sample = { characterId: 'a', strokeData: [[{ x: .1, y: .2 }, { x: .5, y: .7 }]], imageData: null, recognizedClassId: 'a', attemptedAt: '2026-11-01T00:00:01.000Z', confidence: .9, result: 'valid' as const };
    await localLearnerService.recordWritingAttempt(c.topicId, { ...sample, attemptedAt: '2026-10-01T00:00:00.000Z' }, db, owner);
    expect(await resume.acceptedCounts(c, db)).toEqual({});
    for (let n = 0; n < 3; n++) await localLearnerService.recordWritingAttempt(c.topicId, sample, db, owner);
    expect(await resume.acceptedCounts(c, db)).toEqual({ a: 2 });
    await expect(localLearnerService.recordWritingAttempt(c.topicId, sample, db, 'other')).rejects.toThrow('Learner changed');
    expect((await db.getAllAsync('SELECT * FROM activity_attempts')).length).toBe(4);
  });
  it('offers the most recently changed unfinished topic and hides completed topics', async () => {
    const a = checkpoint('topic-1-1'), b = { ...checkpoint('topic-1-2'), savedAt: '2026-11-02T00:00:00.000Z' };
    await resume.save(a, db); await resume.save(b, db);
    expect((await resume.read(owner, undefined, db))?.topicId).toBe(b.topicId);
    await localLearnerService.completeTopic(a.topicId, db, owner);
    expect(await resume.read(owner, a.topicId, db)).toBeNull();
    await resume.save(a, db);
    expect(await resume.read(owner, a.topicId, db)).toBeNull();
  });
  it('keeps queued clear and replacement ordered after earlier drawing saves', async () => {
    const c = checkpoint();
    if (c.draft.kind !== 'writing') throw Error('fixture');
    c.draft.strokes = [[{x: .2, y: .3}]];
    const older = resume.save(c, db);
    c.draft.strokes = [];
    const cleared = resume.save(c, db);
    await Promise.all([older, cleared]);
    expect((await resume.read(owner, undefined, db))?.draft).toEqual(c.draft);
    await Promise.all([resume.save(c, db), resume.clear(owner, c.topicId, db)]);
    expect(await resume.read(owner, undefined, db)).toBeNull();
  });
  it('isolates two selected profiles and rejects pending work belonging to the former owner', async () => {
    const a = checkpoint('topic-1-1'); await resume.save(a, db);
    await db.runAsync("DELETE FROM local_app_state WHERE state_key = 'active_learner_profile_id'");
    const b = await localLearnerService.saveProfile('Resume B', '', db);
    expect(await resume.read(owner, undefined, db)).toBeNull();
    expect(await resume.read(b.profile_id, undefined, db)).toBeNull();
    await resume.save({ ...a, draft: { kind: 'story', page: 'content' } }, db);
    await expect(localLearnerService.completeTopic(a.topicId, db, owner)).rejects.toThrow('Learner changed');
    await db.runAsync("UPDATE local_app_state SET state_value = ? WHERE state_key = 'active_learner_profile_id'", [owner]);
    expect(await resume.read(owner, undefined, db)).toEqual(a);
    await db.runAsync('DELETE FROM profiles WHERE profile_id = ?', [owner]);
    expect(await resume.read(owner, undefined, db)).toBeNull();
  });
  it.each(['{', 'null', JSON.stringify({ version: 999 }), JSON.stringify({ topicId: '/mentor' })])('ignores corrupt or unsupported state: %s', async raw => {
    await db.runAsync('INSERT INTO local_app_state(state_key, state_value) VALUES (?, ?)', [`activity_resume:${owner}:bad`, raw]);
    expect(await resume.read(owner, undefined, db)).toBeNull();
  });
  it('rejects incompatible content, wrong target, malformed geometry and foreign ownership', () => {
    const c = checkpoint();
    expect(parseCheckpoint(JSON.stringify({ ...c, contentVersion: 'obsolete' }), owner)).toBeNull();
    expect(parseCheckpoint(JSON.stringify(c), 'other')).toBeNull();
    expect(parseCheckpoint(JSON.stringify({ ...c, draft: { ...c.draft, characterId: 'bogus' } }), owner)).toBeNull();
    expect(parseCheckpoint(JSON.stringify({ ...c, draft: { ...c.draft, strokes: [[{ x: 2, y: .2 }]] } }), owner)).toBeNull();
  });
  it('projects only the allowed fields rather than preserving arbitrary data', async () => {
    const c = checkpoint('topic-1-1');
    const raw = JSON.stringify({ ...c, token: 'not-retained', draft: { ...c.draft, route: '/mentor' } });
    expect(parseCheckpoint(raw, owner)).toEqual(c);
    await resume.save(JSON.parse(raw), db);
    expect((await db.getFirstAsync<{state_value: string}>('SELECT state_value FROM local_app_state WHERE state_key = ?', [`activity_resume:${owner}:${c.topicId}`]))?.state_value).not.toContain('not-retained');
  });
  it('keeps last-opened bookmarks per module, including completed review topics', async () => {
    await resume.rememberOpened(owner, 'topic-1-1', db);
    await resume.rememberOpened(owner, 'topic-1-2', db);
    await resume.rememberOpened(owner, 'topic-2-1', db);
    await localLearnerService.completeTopic('topic-1-1', db, owner);
    await localLearnerService.completeTopic('topic-1-2', db, owner);
    expect(await resume.lastOpened('module-1', db)).toBe('topic-1-2');
    expect(await resume.lastOpened('module-2', db)).toBe('topic-2-1');
    await resume.rememberOpened(owner, '/mentor', db);
    expect(await resume.lastOpened('module-1', db)).toBe('topic-1-2');
    await db.runAsync("DELETE FROM local_app_state WHERE state_key = 'active_learner_profile_id'");
    await localLearnerService.saveProfile('Other learner', '', db);
    expect(await resume.lastOpened('module-1', db)).toBeNull();
    await resume.rememberOpened(owner, 'topic-1-3', db);
    await db.runAsync("UPDATE local_app_state SET state_value = ? WHERE state_key = 'active_learner_profile_id'", [owner]);
    expect(await resume.lastOpened('module-1', db)).toBe('topic-1-2');
  });

});
