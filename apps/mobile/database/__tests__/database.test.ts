/**
 * apps/mobile/database/__tests__/database.test.ts
 *
 * Comprehensive tests for BAYA SQLite Database Foundation & Migration System.
 * Uses real in-memory SQLite engine to verify:
 *   1. Database connection & pragma configuration
 *   2. Migration execution & tracking
 *   3. Migration idempotency
 *   4. Existence of all 11 ERD tables
 *   5. Index existence
 *   6. Foreign key enforcement (RESTRICT / CASCADE)
 *   7. Seed data idempotency and accuracy
 *   8. Repository CRUD operations (parameterized queries)
 */

import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  setDatabaseConnection,
  closeDatabaseConnection,
  configurePragmas,
} from '../connection';
import { runMigrations, getAppliedMigrations } from '../migrate';
import { MIGRATIONS } from '../migrations';
import { seedCurriculum } from '../seed';
import { createActivityContentService } from '../services/activityContentService';
import { activityContentRepository } from '../repositories/activityContentRepository';
import { initDatabase } from '../index';
import { lessonRepository } from '../repositories/lessonRepository';
import { profileRepository } from '../repositories/profileRepository';
import { progressRepository } from '../repositories/progressRepository';
import { workspaceRepository } from '../repositories/workspaceRepository';
import { syncRepository } from '../repositories/syncRepository';
import type { DatabaseConnection } from '../types';
import { localLearnerService } from '../services/localLearnerService';
import { curriculumService } from '../services/curriculumService';
import { buildLearnerHomeModel } from '../../components/learner/home/learnerHomeModel';

/**
 * Creates an in-memory SQLite database adhering to DatabaseConnection.
 */
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

describe('BAYA SQLite Database Foundation', () => {
  let db: DatabaseConnection;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    await configurePragmas(db);
    setDatabaseConnection(db);
  });

  afterEach(async () => {
    await closeDatabaseConnection();
  });

  test('1. Database opens and connects properly', async () => {
    expect(db).toBeDefined();
    const result = await db.getFirstAsync<{ test_val: number }>('SELECT 1 AS test_val;');
    expect(result?.test_val).toBe(1);
  });

  test('2. Foreign keys are enabled', async () => {
    const fkPragma = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys;');
    expect(fkPragma?.foreign_keys).toBe(1);
  });

  test('3. Migrations execute in order and record completion', async () => {
    const migrationResult = await runMigrations(db);
    expect(migrationResult.success).toBe(true);
    expect(migrationResult.appliedCount).toBe(5);
    expect(migrationResult.appliedMigrations).toEqual(['001_initial_schema', '002_indexes', '003_activity_content', '004_local_learner_state', '005_writing_attempts']);

    const applied = await getAppliedMigrations(db);
    expect(applied.length).toBe(5);
    expect(applied[0].version).toBe(1);
    expect(applied[0].name).toBe('001_initial_schema');
    expect(applied[1].version).toBe(2);
    expect(applied[1].name).toBe('002_indexes');
  });

  test('4. Second migration run is idempotent (does nothing)', async () => {
    await runMigrations(db);
    const secondResult = await runMigrations(db);

    expect(secondResult.success).toBe(true);
    expect(secondResult.appliedCount).toBe(0);
    expect(secondResult.appliedMigrations).toEqual([]);
    expect(secondResult.alreadyAppliedCount).toBe(5);
  });

  test('5. All 11 ERD tables exist', async () => {
    await runMigrations(db);

    const tables = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';`
    );
    const tableNames = tables.map((t) => t.name).sort();

    const expectedTables = [
      'activity_content',
      'schema_migrations',
      'content_versions',
      'lessons',
      'activities',
      'profiles',
      'learner_progress',
      'activity_attempts',
      'review_items',
      'mentor_profiles',
      'workspaces',
      'workspace_memberships',
      'sync_outbox',
      'local_app_state',
      'writing_attempts',
    ].sort();

    for (const expected of expectedTables) {
      expect(tableNames).toContain(expected);
    }
    expect(tableNames.length).toBe(expectedTables.length);
  });

  test('6. Indexes exist as required by ERD', async () => {
    await runMigrations(db);

    const indexes = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%';`
    );
    const indexNames = indexes.map((i) => i.name);

    const expectedIndexes = [
      'idx_lessons_content_version_id',
      'idx_activities_lesson_id',
      'idx_learner_progress_profile',
      'idx_learner_progress_lesson',
      'idx_activity_attempts_profile',
      'idx_activity_attempts_activity',
      'idx_workspace_memberships_profile',
      'idx_workspace_memberships_workspace',
      'idx_sync_outbox_profile',
      'idx_sync_outbox_status',
    ];

    for (const expected of expectedIndexes) {
      expect(indexNames).toContain(expected);
    }
  });

  test('7. Foreign key violation fails (ON DELETE RESTRICT)', async () => {
    await runMigrations(db);

    // Attempting to insert a lesson with a non-existent content_version_id must fail
    await expect(
      db.runAsync(
        `INSERT INTO lessons (lesson_id, content_version_id, stage_number, title, description)
         VALUES ('l-1', 'non-existent-version', 1, 'Lesson 1', 'Desc');`
      )
    ).rejects.toThrow();

    // Inserting a valid content version first allows the lesson insertion
    await db.runAsync(
      `INSERT INTO content_versions (content_version_id, version_label, validation_status, activated_at)
       VALUES ('cv-test', 'Test v1', 'approved', '2026-01-01T00:00:00Z');`
    );

    const insertRes = await db.runAsync(
      `INSERT INTO lessons (lesson_id, content_version_id, stage_number, title, description)
       VALUES ('l-1', 'cv-test', 1, 'Lesson 1', 'Desc');`
    );
    expect(insertRes.changes).toBe(1);

    // Deleting the referenced content_version must fail due to ON DELETE RESTRICT
    await expect(
      db.runAsync(`DELETE FROM content_versions WHERE content_version_id = 'cv-test';`)
    ).rejects.toThrow();
  });

  test('8. Curriculum seed data is idempotent and accurately populates the approved topics', async () => {
    await runMigrations(db);

    // Initial seed
    const seed1 = await seedCurriculum(db);
    expect(seed1.contentVersionInserted).toBe(true);
    expect(seed1.lessonsInsertedCount).toBe(3);
    expect(seed1.activitiesInsertedCount).toBe(9);

    // Second seed (idempotent run)
    const seed2 = await seedCurriculum(db);
    expect(seed2.contentVersionInserted).toBe(false);
    expect(seed2.lessonsInsertedCount).toBe(0);
    expect(seed2.activitiesInsertedCount).toBe(0);

    // Verify row counts
    const lessons = await lessonRepository.getLessons();
    expect(lessons.length).toBe(3);
    expect(lessons.map((l) => l.title)).toEqual(['Pagkilala sa Baybayin', 'Baybayin Characters', 'Pagsusulat ng Baybayin']);

    const module1Activities = await lessonRepository.getActivitiesByLesson('module-1');
    expect(module1Activities.length).toBe(5);
    expect(module1Activities[0].activity_id).toBe('topic-1-1');
    expect(module1Activities[0].title).toBe('Ang Kasaysayan at Kahalagahan');
    expect(module1Activities[0].activity_type).toBe('concept');
    const module2Activities = await lessonRepository.getActivitiesByLesson('module-2');
    expect(module2Activities.map(({ activity_id }) => activity_id)).toEqual(['topic-2-1', 'topic-2-2']);
    const module3Activities = await lessonRepository.getActivitiesByLesson('module-3');
    expect(module3Activities.map(({ activity_id, activity_type }) => [activity_id, activity_type])).toEqual([['topic-3-1', 'writing'], ['topic-3-2', 'writing']]);

    const seededStories = await db.getAllAsync<{
      activity_id: string;
      validation_status: string;
      payload_json: string;
    }>(
      `SELECT activity_id, validation_status, payload_json
       FROM activity_content ORDER BY activity_id;`
    );
    expect(seededStories).toHaveLength(5);
    expect(seededStories.map(({ activity_id, validation_status }) => [activity_id, validation_status])).toEqual([
      ['topic-1-1', 'approved'],
      ['topic-1-2', 'approved'],
      ['topic-1-3', 'approved'],
      ['topic-1-4', 'approved'],
      ['topic-1-5', 'approved'],
    ]);
    const story1 = JSON.parse(seededStories[0].payload_json);
    const story2 = JSON.parse(seededStories[1].payload_json);
    const story3 = JSON.parse(seededStories[2].payload_json);
    expect(story1.steps).toHaveLength(1);
    expect(story2.steps).toHaveLength(1);
    expect(story3.steps).toHaveLength(1);
    expect(story1.steps[0].content.content).toContain('Tara at balikan natin kung saan nagmula ang Baybayin.');
    expect(story1.steps[0].content.content.endsWith('Dahil wala pang papel noon, sa mga puno, kawayan, at dahon sila umuukit gamit ang matutulis na bagay para magsulat ng mga tula at mensahe.')).toBe(true);
    expect(story1.steps[0].content.content).not.toContain('Ito ay mahalagang bahagi ng pagkatao natin.');
    expect(story1.steps[0].content.storyMessage).toBe('Ito ay mahalagang bahagi ng pagkatao natin.');
    expect(story2.steps[0].content.examples).toBe('ᜊ = Ba\nᜃ = Ka\nᜆ = Ta');
    expect(story2.steps[0].content.content).toContain('Doctrina Christiana noong 1593.');
    expect(story2.steps[0].content.storyMessage).toBe('Isang simbolo, isang pantig! Ganoon kadali ang Baybayin.');
    expect(story1.steps[0].content.illustration).toBeUndefined();
    expect(story2.steps[0].content.illustration).toBeUndefined();
    expect(story1.video).toEqual({
      title: 'Baybayin Song',
      source: { type: 'asset', assetId: 'baybayin-song' },
      isAvailable: true,
    });
    expect(story2.video.source).toBeNull();
    expect(story2.video.isAvailable).toBe(false);
    expect(story3.video.source).toBeNull();
    expect(story3.video.isAvailable).toBe(false);
  });

  test('9. Repositories perform CRUD operations with parameterized queries', async () => {
    await initDatabase({ seed: true });

    // --- Profile Repository ---
    const learner = await profileRepository.createProfile({
      profile_id: 'learner-001',
      display_name: 'Juan Dela Cruz',
      role: 'learner',
    });
    expect(learner.profile_id).toBe('learner-001');
    expect(learner.display_name).toBe('Juan Dela Cruz');

    const fetchedLearner = await profileRepository.getProfileById('learner-001');
    expect(fetchedLearner?.display_name).toBe('Juan Dela Cruz');

    const updatedLearner = await profileRepository.updateProfile('learner-001', {
      display_name: 'Juan D. Cruz',
    });
    expect(updatedLearner?.display_name).toBe('Juan D. Cruz');

    // --- Progress Repository ---
    const progress = await progressRepository.createProgress({
      learner_progress_id: 'prog-001',
      learner_profile_id: 'learner-001',
      lesson_id: 'module-1',
      status: 'in_progress',
    });
    expect(progress.status).toBe('in_progress');

    const updatedProgress = await progressRepository.updateProgress('prog-001', {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    expect(updatedProgress?.status).toBe('completed');

    const allProgress = await progressRepository.getLearnerProgress('learner-001');
    expect(allProgress.length).toBe(1);
    expect(allProgress[0].lesson_id).toBe('module-1');

    // Attempt recording
    const attempt = await progressRepository.recordAttempt({
      attempt_id: 'att-001',
      learner_profile_id: 'learner-001',
      activity_id: 'topic-1-1',
      result_status: 'passed',
      confidence_value: 0.95,
      feedback_code: 'EXCELLENT',
    });
    expect(attempt.result_status).toBe('passed');

    const attempts = await progressRepository.getAttemptsByActivity('learner-001', 'topic-1-1');
    expect(attempts.length).toBe(1);
    expect(attempts[0].attempt_id).toBe('att-001');

    // Review item recording
    const reviewItem = await progressRepository.createReviewItem({
      review_item_id: 'rev-001',
      learner_profile_id: 'learner-001',
      activity_id: 'topic-1-1',
      reason: 'Need review on stroke order',
      status: 'pending',
    });
    expect(reviewItem.status).toBe('pending');

    const reviews = await progressRepository.getReviewItems('learner-001', 'pending');
    expect(reviews.length).toBe(1);

    // --- Workspace Repository ---
    // Create mentor profile first (FK constraint)
    const mentorUser = await profileRepository.createProfile({
      profile_id: 'mentor-user-001',
      display_name: 'Guro Maria',
      role: 'mentor',
    });
    await db.runAsync(
      `INSERT INTO mentor_profiles (mentor_profile_id, learner_profile_id) VALUES ('mentor-001', ?);`,
      [mentorUser.profile_id]
    );

    const workspace = await workspaceRepository.createWorkspace({
      workspace_id: 'ws-001',
      mentor_profile_id: 'mentor-001',
      workspace_code: 'BAYA2026',
      workspace_name: 'Baybayin Beginners 101',
      status: 'active',
    });
    expect(workspace.workspace_code).toBe('BAYA2026');

    const fetchedWorkspace = await workspaceRepository.getWorkspaceByCode('BAYA2026');
    expect(fetchedWorkspace?.workspace_name).toBe('Baybayin Beginners 101');

    const joinResult = await workspaceRepository.joinWorkspace(
      'learner-001',
      'BAYA2026',
      'membership-001'
    );
    expect(joinResult.membership.is_active).toBe(1);

    const learnerWorkspaces = await workspaceRepository.getLearnerWorkspaces('learner-001');
    expect(learnerWorkspaces.length).toBe(1);
    expect(learnerWorkspaces[0].workspace_name).toBe('Baybayin Beginners 101');

    // --- Sync Outbox Repository ---
    const outboxItem = await syncRepository.queueSyncOperation({
      outbox_id: 'outbox-001',
      learner_profile_id: 'learner-001',
      entity_name: 'learner_progress',
      entity_id: 'prog-001',
      operation: 'UPDATE',
    });
    expect(outboxItem.sync_status).toBe('pending');

    const pendingOps = await syncRepository.getPendingSyncOperations('learner-001');
    expect(pendingOps.length).toBe(1);
    expect(pendingOps[0].outbox_id).toBe('outbox-001');

    await syncRepository.updateSyncStatus('outbox-001', 'synced');
    const pendingAfter = await syncRepository.getPendingSyncOperations('learner-001');
    expect(pendingAfter.length).toBe(0);
  });
  test('reviewed activity payloads load from SQLite; drafts and bad JSON never reach UI', async () => {
    await runMigrations(db);
    await seedCurriculum(db);
    const payload = { id: 'topic-1-1', moduleId: 'module-1', moduleTitle: 'Module', title: 'Topic', steps: [{ id: 'story-1', type: 'story', title: 'Story', content: { title: 'Story', content: 'Reviewed lesson text' } }] };
    await db.runAsync('INSERT INTO activity_content (activity_id, revision, validation_status, reviewed_by, reviewed_at, payload_json) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(activity_id) DO UPDATE SET payload_json = excluded.payload_json;', ['topic-1-1', 1, 'approved', 'test-validator', '2026-09-26T00:00:00Z', JSON.stringify(payload)]);
    const service = createActivityContentService({ getByTopicId: id => activityContentRepository.getByTopicId(id, db) });
    expect((await service.getByTopicId('topic-1-1'))?.steps[0].content).toMatchObject({ content: 'Reviewed lesson text' });
    await db.runAsync('UPDATE activity_content SET validation_status = ? WHERE activity_id = ?;', ['draft', 'topic-1-1']);
    expect(await service.getByTopicId('topic-1-1')).toBeNull();
    await db.runAsync('UPDATE activity_content SET validation_status = ?, payload_json = ? WHERE activity_id = ?;', ['approved', '{broken', 'topic-1-1']);
    expect(await service.getByTopicId('topic-1-1')).toBeNull();
  });

  test('upgrades an existing v3 database without losing learner rows', async () => {
    await runMigrations(db, MIGRATIONS.slice(0, 3));
    await seedCurriculum(db);
    await db.runAsync(
      `INSERT INTO profiles (profile_id, display_name, role, created_at, updated_at)
       VALUES ('existing-learner', 'Maria', 'learner', 'now', 'now');`
    );
    const upgrade = await runMigrations(db);
    expect(upgrade.appliedMigrations).toEqual(['004_local_learner_state', '005_writing_attempts']);
    expect(await db.getFirstAsync<{ display_name: string }>(
      'SELECT display_name FROM profiles WHERE profile_id = ?;', ['existing-learner']
    )).toEqual({ display_name: 'Maria' });
    expect(await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys;'))
      .toEqual({ foreign_keys: 1 });
    expect((await runMigrations(db)).appliedCount).toBe(0);
  });

  test('persists learner setup and advances only approved topics', async () => {
    await runMigrations(db);
    await seedCurriculum(db);
    const profile = await localLearnerService.saveProfile(' Ana ', 'baya-1234', db);
    expect(profile.display_name).toBe('Ana');
    const renamed = await localLearnerService.saveProfile('Ana Maria', '', db);
    expect(renamed.profile_id).toBe(profile.profile_id);
    expect(renamed.display_name).toBe('Ana Maria');
    expect((await localLearnerService.getActiveLearner(db))?.profile_id).toBe(profile.profile_id);
    expect(await db.getFirstAsync<{ state_value: string }>(
      'SELECT state_value FROM local_app_state WHERE state_key = ?;', ['pending_workspace_code']
    )).toEqual({ state_value: 'BAYA-1234' });
    await expect(localLearnerService.completeTopic('invented-topic', db)).rejects.toThrow();
    await expect(localLearnerService.completeTopic('topic-1-3', db)).rejects.toThrow('locked');
    expect(await localLearnerService.getTodayCompletedTopicCount(db)).toBe(0);
    await localLearnerService.completeTopic('topic-1-1', db);
    await localLearnerService.completeTopic('topic-1-1', db);
    expect(await localLearnerService.getTodayCompletedTopicCount(db)).toBe(1);
    const modules = await curriculumService.getCurriculumModules(db);
    expect(modules[0].topics.map(topic => topic.status)).toEqual([
      'completed', 'available', 'locked', 'locked', 'locked',
    ]);
    expect(await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM activity_attempts WHERE learner_profile_id = ?;`, [profile.profile_id]
    )).toEqual({ count: 1 });
    const resumed = buildLearnerHomeModel(await localLearnerService.getActiveLearner(db), modules, await localLearnerService.getTodayCompletedTopicCount(db));
    expect(resumed.currentLesson.topicId).toBe('topic-1-2');
    expect(resumed.currentLesson.status).toBe('in_progress');
    expect(resumed.dailyGoal.completed).toBe(1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(await localLearnerService.getTodayCompletedTopicCount(db, tomorrow)).toBe(0);
    for (const topic of modules[0].topics.slice(1)) await localLearnerService.completeTopic(topic.id, db);
    expect((await curriculumService.getModuleById('module-1', db))?.status).toBe('completed');
    const finished = buildLearnerHomeModel(renamed, await curriculumService.getCurriculumModules(db), await localLearnerService.getTodayCompletedTopicCount(db));
    expect(finished.currentLesson.moduleId).toBe('module-2');
    expect(finished.currentLesson.status).toBe('not_started');
    expect(finished.currentLesson.topicId).toBe('topic-2-1');
    const finishedTomorrow = buildLearnerHomeModel(renamed, await curriculumService.getCurriculumModules(db), await localLearnerService.getTodayCompletedTopicCount(db, tomorrow));
    expect(finishedTomorrow.dailyGoal).toEqual({ completed: 0, target: 3 });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await db.runAsync('UPDATE activity_attempts SET attempted_at = ? WHERE activity_id = ?;', [yesterday.toISOString(), 'topic-1-1']);
    await db.runAsync(
      `INSERT INTO activity_attempts (attempt_id, learner_profile_id, activity_id, result_status, attempted_at)
       VALUES (?, ?, ?, 'completed', ?);`,
      ['duplicate-today', profile.profile_id, 'topic-1-1', new Date().toISOString()]
    );
    expect(await localLearnerService.getTodayCompletedTopicCount(db)).toBe(4);
    expect(await db.getFirstAsync<{ status: string }>(
      'SELECT status FROM learner_progress WHERE learner_profile_id = ?;', [profile.profile_id]
    )).toEqual({ status: 'completed' });
  });

  test('keeps learner identity and topic progress after reopening the SQLite file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'baya-progress-'));
    const file = join(directory, 'baya.db');
    try {
      await closeDatabaseConnection();
      const first = createInMemoryDatabase(file);
      setDatabaseConnection(first);
      await configurePragmas(first);
      await runMigrations(first);
      await seedCurriculum(first);
      const saved = await localLearnerService.saveProfile('Maria', '', first);
      await localLearnerService.completeTopic('topic-1-1', first);
      await closeDatabaseConnection();

      const reopened = createInMemoryDatabase(file);
      setDatabaseConnection(reopened);
      await configurePragmas(reopened);
      expect((await runMigrations(reopened)).appliedCount).toBe(0);
      await seedCurriculum(reopened);
      expect((await localLearnerService.getActiveLearner(reopened))?.profile_id).toBe(saved.profile_id);
      expect((await curriculumService.getCurriculumModules(reopened))[0].topics.map(topic => topic.status))
        .toEqual(['completed', 'available', 'locked', 'locked', 'locked']);
      expect(await localLearnerService.getTodayCompletedTopicCount(reopened)).toBe(1);
    } finally {
      await closeDatabaseConnection();
      unlinkSync(file);
      rmdirSync(directory);
    }
  });

  test('unlocks and saves both Module 2 character topics after Module 1', async () => {
    await runMigrations(db);
    await seedCurriculum(db);
    await localLearnerService.saveProfile('Learner', '', db);
    await expect(localLearnerService.completeTopic('topic-2-1', db)).rejects.toThrow('locked');
    for (const id of ['topic-1-1', 'topic-1-2', 'topic-1-3', 'topic-1-4', 'topic-1-5']) {
      await localLearnerService.completeTopic(id, db);
    }
    expect((await curriculumService.getModuleById('module-2', db))?.topics.map(topic => topic.status))
      .toEqual(['available', 'locked']);
    await localLearnerService.completeTopic('topic-2-1', db);
    expect((await curriculumService.getModuleById('module-2', db))?.topics.map(topic => topic.status))
      .toEqual(['completed', 'available']);
    await localLearnerService.completeTopic('topic-2-2', db);
    const module2 = await curriculumService.getModuleById('module-2', db);
    expect(module2?.status).toBe('completed');
    expect(module2?.topics.map(topic => topic.status)).toEqual(['completed', 'completed']);
    expect((await localLearnerService.getCompletedTopicIds(db)).size).toBe(7);
  });

  test('stores separate handwriting samples per character and unlocks Module 3 in order', async () => {
    await runMigrations(db);
    await seedCurriculum(db);
    const learner = await localLearnerService.saveProfile('Mila', '', db);
    for (const id of ['topic-1-1', 'topic-1-2', 'topic-1-3', 'topic-1-4', 'topic-1-5', 'topic-2-1', 'topic-2-2']) {
      await localLearnerService.completeTopic(id, db);
    }
    const sample = { characterId: 'a', strokeData: [[{ x: 0.1, y: 0.2 }, { x: 0.5, y: 0.7 }, { x: 0.8, y: 0.3 }]], imageData: null, confidence: 0.72, result: 'similar' as const };
    await localLearnerService.recordWritingAttempt('topic-3-1', sample, db);
    const row = await db.getFirstAsync<{ character_id: string; stroke_json: string; confidence_value: number; recognized_result: string | null }>(
      `SELECT w.character_id, w.stroke_json, a.confidence_value, a.recognized_result
       FROM writing_attempts w JOIN activity_attempts a ON a.attempt_id = w.attempt_id
       WHERE a.learner_profile_id = ?;`, [learner.profile_id]
    );
    expect(row?.character_id).toBe('a');
    expect(JSON.parse(row!.stroke_json)).toEqual(sample.strokeData);
    expect(row?.confidence_value).toBe(0.72);
    expect(row?.recognized_result).toBeNull();
    await expect(localLearnerService.recordWritingAttempt('topic-3-2', sample, db)).rejects.toThrow('Unknown writing exercise');
    expect((await curriculumService.getModuleById('module-3', db))?.topics.map(topic => topic.status)).toEqual(['available', 'locked']);
    await localLearnerService.completeTopic('topic-3-1', db);
    expect((await curriculumService.getModuleById('module-3', db))?.topics.map(topic => topic.status)).toEqual(['completed', 'available']);
  });

  test('13. Concurrent completeTopic calls for the same topic join in-flight task without error or duplicate records', async () => {
    await runMigrations(db);
    await seedCurriculum(db);
    const profile = await localLearnerService.saveProfile('Concurrent Test Learner', '', db);

    // Call completeTopic twice simultaneously using the active connection singleton
    await Promise.all([
      localLearnerService.completeTopic('topic-1-1'),
      localLearnerService.completeTopic('topic-1-1'),
    ]);

    const attempts = await db.getAllAsync<{ attempt_id: string }>(
      `SELECT attempt_id FROM activity_attempts
       WHERE learner_profile_id = ? AND activity_id = 'topic-1-1' AND result_status = 'completed';`,
      [profile.profile_id]
    );

    expect(attempts).toHaveLength(1);
    expect(await localLearnerService.getTodayCompletedTopicCount(db)).toBe(1);
  });
});
