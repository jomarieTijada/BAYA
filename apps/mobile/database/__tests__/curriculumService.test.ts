import { DatabaseSync } from 'node:sqlite';
import { setDatabaseConnection, closeDatabaseConnection, configurePragmas } from '../connection';
import { runMigrations } from '../migrate';
import { seedCurriculum, SEED_CONTENT_VERSION } from '../seed';
import { curriculumService, normalizeLessonId } from '../services/curriculumService';
import { lessonRepository } from '../repositories/lessonRepository';
import type { DatabaseConnection } from '../types';

function createInMemoryDatabase(): DatabaseConnection {
  const rawDb = new DatabaseSync(':memory:');

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


const expectedTopics = [
  { id: 'topic-1-1', title: 'Kasaysayan at Kahalagahan ng Baybayin' },
  { id: 'topic-1-2', title: 'Baybayin: Isang Silabaryo (Pantigan)' },
  { id: 'topic-1-3', title: 'Ang 17 Simbolo ng Baybayin' },
  { id: 'topic-1-4', title: 'Magkaibang Letra, Iisang Simbolo?' },
  { id: 'topic-1-5', title: 'Paano naman ang Da at Ra?' },
];
const expectedModule2Topics = [
  { id: 'topic-2-1', title: 'Ang mga Patinig' },
  { id: 'topic-2-2', title: 'Kilalanin ang mga Katinig' },
];
const expectedModule3Topics = [
  { id: 'topic-3-1', title: 'Mga Patinig' },
  { id: 'topic-3-2', title: 'Mga Katinig' },
];
async function expectApprovedCurriculum(db: DatabaseConnection) {
  const modules = await curriculumService.getCurriculumModules(db);
  expect(modules).toHaveLength(3);
  expect(modules[0].id).toBe('module-1');
  expect(modules[0].title).toBe('Pagkilala sa Baybayin');
  expect(modules[0].topics.map(({ id, title }) => ({ id, title }))).toEqual(expectedTopics);
  expect(modules[0].topics.map(({ status }) => status)).toEqual(['available', 'locked', 'locked', 'locked', 'locked']);
  expect(modules[0].purpose).toBeUndefined();
  expect(modules[0].subtitle).toBeUndefined();
  expect(modules[1].id).toBe('module-2');
  expect(modules[1].title).toBe('Baybayin Characters');
  expect(modules[1].topics.map(({ id, title }) => ({ id, title }))).toEqual(expectedModule2Topics);
  expect(modules[1].topics.map(({ status, contentAvailable }) => ({ status, contentAvailable })))
    .toEqual([{ status: 'locked', contentAvailable: true }, { status: 'locked', contentAvailable: true }]);
  expect(modules[2].id).toBe('module-3');
  expect(modules[2].topics.map(({ id, title }) => ({ id, title }))).toEqual(expectedModule3Topics);
  expect(modules[2].topics.every(topic => topic.contentAvailable)).toBe(true);
}

describe('Strict curriculum service and SQLite boundaries', () => {
  let db: DatabaseConnection;
  beforeEach(async () => {
    db = createInMemoryDatabase();
    await configurePragmas(db);
    setDatabaseConnection(db);
    await runMigrations(db);
    await seedCurriculum(db);
  });
  afterEach(async () => { await closeDatabaseConnection(); });

  it('loads all three supplied modules and exact titles from SQLite', async () => {
    await expectApprovedCurriculum(db);
    expect(await lessonRepository.getLessons(undefined, db)).toHaveLength(3);
    expect((await lessonRepository.getActivitiesByLesson('module-1', db)).map((row) => row.title))
      .toEqual(expectedTopics.map((topic) => topic.title));
    expect((await lessonRepository.getActivitiesByLesson('module-2', db)).map((row) => row.title))
      .toEqual(expectedModule2Topics.map((topic) => topic.title));
    expect((await lessonRepository.getActivitiesByLesson('module-3', db)).map((row) => row.activity_type))
      .toEqual(['writing', 'writing']);
  });
  it('supports exact numeric aliases without accepting partial IDs', async () => {
    for (const id of ['1', 1, 'module-1']) {
      expect(normalizeLessonId(id)).toBe('module-1');
      expect((await curriculumService.getModuleById(id, db))?.topics).toHaveLength(5);
    }
    expect(await curriculumService.getModuleById('1-invented', db)).toBeNull();
  });
  it('blocks extra topics and modules even inside a database version marked approved', async () => {
    await db.runAsync(`INSERT INTO lessons VALUES ('module-4', ?, 4, 'Invented module', 'Generated description');`, [SEED_CONTENT_VERSION.content_version_id]);
    await db.runAsync(`INSERT INTO activities VALUES ('topic-1-6', 'module-1', 'concept', 'Kudlit', 6);`);
    await db.runAsync(`INSERT INTO activities VALUES ('topic-4-1', 'module-4', 'concept', 'Invented topic', 1);`);
    await expectApprovedCurriculum(db);
    expect(await curriculumService.getModuleById('module-4', db)).toBeNull();
    expect(await curriculumService.getModuleTopics('module-4', db)).toEqual([]);
    for (const id of ['topic-1-6', 'topic-4-1', 'unknown']) {
      expect(await curriculumService.getTopicById(id, db)).toBeNull();
      expect(await lessonRepository.getActivityById(id, db)).toBeNull();
    }
    expect(await lessonRepository.getLessons(undefined, db)).toHaveLength(3);
    expect(await lessonRepository.getActivitiesByLesson('module-1', db)).toHaveLength(5);
  });
  it('does not let renamed database titles or descriptions override the manifest', async () => {
    await db.runAsync(`UPDATE lessons SET title = 'Invented module', description = 'AI description';`);
    await db.runAsync(`UPDATE activities SET title = 'Mga Patinig';`);
    await expectApprovedCurriculum(db);
    expect(await lessonRepository.getLessons(undefined, db)).toEqual([]);
    expect((await curriculumService.getTopicById('topic-1-1', db))?.title).toBe(expectedTopics[0].title);
  });
  it.each(['draft', 'under_review', 'deprecated'])('excludes %s database versions, falling back to independently approved data', async (status) => {
    await db.runAsync('UPDATE content_versions SET validation_status = ?;', [status]);
    expect(await lessonRepository.getLessons(undefined, db)).toEqual([]);
    expect(await lessonRepository.getActivitiesByLesson('module-1', db)).toEqual([]);
    await expectApprovedCurriculum(db);
  });
  it('uses the same approved fallback for an empty database and a query failure', async () => {
    await db.runAsync('DELETE FROM activities;');
    await db.runAsync('DELETE FROM lessons;');
    await expectApprovedCurriculum(db);
    const broken = { ...db, getAllAsync: async () => { throw new Error('unavailable'); } };
    await expectApprovedCurriculum(broken);
    expect(await curriculumService.getModuleById('module-6', broken)).toBeNull();
    expect(await curriculumService.getTopicById('topic-1-6', broken)).toBeNull();
  });
  it('reconciles legacy titles on reseed without deleting learner history', async () => {
    await db.runAsync(`INSERT INTO content_versions VALUES ('version-baya-basics-v1', 'Legacy', 'approved', NULL);`);
    await db.runAsync(`UPDATE lessons SET content_version_id = 'version-baya-basics-v1', title = 'Old title', description = 'Generated description';`);
    await db.runAsync(`UPDATE activities SET title = 'Old topic';`);
    await db.runAsync(`INSERT INTO lessons VALUES ('module-4', 'version-baya-basics-v1', 4, 'Invented module', NULL);`);
    await db.runAsync(`INSERT INTO activities VALUES ('topic-1-6', 'module-1', 'concept', 'Kudlit', 6);`);
    await db.runAsync(`INSERT INTO profiles VALUES ('learner', NULL, 'Learner', 'learner', 'now', 'now');`);
    await db.runAsync(`INSERT INTO activity_attempts VALUES ('history', 'learner', 'topic-1-6', 'completed', NULL, NULL, NULL, 'now');`);
    const result = await seedCurriculum(db);
    expect(result.lessonsInsertedCount).toBe(0);
    expect(result.activitiesInsertedCount).toBe(0);
    expect(await db.getFirstAsync('SELECT attempt_id FROM activity_attempts WHERE attempt_id = ?;', ['history']))
      .toEqual({ attempt_id: 'history' });
    expect(await db.getFirstAsync('SELECT validation_status FROM content_versions WHERE content_version_id = ?;', ['version-baya-basics-v1']))
      .toEqual({ validation_status: 'deprecated' });
    expect((await lessonRepository.getLessonById('module-1', db))?.description).toBeNull();
    expect(await lessonRepository.getActivitiesByLesson('module-1', db)).toHaveLength(5);
    await expectApprovedCurriculum(db);
    expect(await seedCurriculum(db)).toEqual({ contentVersionInserted: false, lessonsInsertedCount: 0, activitiesInsertedCount: 0 });
  });
  it('does not retain mutations between loads', async () => {
    const modules = await curriculumService.getCurriculumModules(db);
    modules[0].topics[0].title = 'Invented';
    await expectApprovedCurriculum(db);
  });
  it('requires reviewed materials without letting their metadata alter the approved curriculum', async () => {
    const payload = JSON.stringify({
      id: 'topic-1-1', moduleId: 'module-1', title: 'Untrusted title', moduleTitle: 'Untrusted module',
      steps: [{ id: 'test-step', title: 'Test material', type: 'story', content: { title: 'Test material', content: 'Test fixture' } }],
    });
    await db.runAsync(
      `UPDATE activity_content SET revision = ?, validation_status = ?, reviewed_by = ?, reviewed_at = ?, payload_json = ? WHERE activity_id = ?;`,
      [1, 'draft', 'validator-test', '2026-09-01T00:00:00Z', payload, 'topic-1-1']
    );
    expect((await curriculumService.getTopicById('topic-1-1', db))?.contentAvailable).toBe(true);
    await db.runAsync(`UPDATE activity_content SET validation_status = 'approved';`);
    expect((await curriculumService.getTopicById('topic-1-1', db))?.contentAvailable).toBe(true);
    await expectApprovedCurriculum(db);
  });
});
