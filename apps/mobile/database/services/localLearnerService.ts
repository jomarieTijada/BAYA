/** Local learner identity and progress, backed by the ERD tables. */
import { approvedCurriculum } from '../../content/approvedCurriculum';
import { getWritingTopic } from '../../content/writingLessonData';
import { writingClassId, isValidWritingResult, type ModelWritingAttempt } from '../../content/writingMastery';
import { WRITING_INPUT_LIMITS } from '../../content/writingCanvasValidation';
import type { Module } from '../../content/modules/catalog';
import { getReadyDatabase } from '../lifecycle';
import type { DatabaseConnection, Profile } from '../types';

const ACTIVE_LEARNER_KEY = 'active_learner_profile_id';
const PENDING_WORKSPACE_KEY = 'pending_workspace_code';

const inFlightCompletions = new Map<string, Promise<void>>();

async function database(override?: DatabaseConnection) {
  return override ?? getReadyDatabase();
}

async function newId(db: DatabaseConnection): Promise<string> {
  const row = await db.getFirstAsync<{ id: string }>(
    "SELECT lower(hex(randomblob(16))) AS id;"
  );
  if (!row?.id) throw new Error('Unable to create a local identifier.');
  const hex = row.id;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
}

async function activeLearner(db: DatabaseConnection): Promise<Profile | null> {
  return db.getFirstAsync<Profile>(
    `SELECT p.profile_id, p.auth_user_id, p.display_name, p.role, p.created_at, p.updated_at
     FROM profiles p JOIN local_app_state s ON s.state_value = p.profile_id
     WHERE s.state_key = ? AND p.role = 'learner';`,
    [ACTIVE_LEARNER_KEY]
  );
}

async function setState(db: DatabaseConnection, key: string, value: string) {
  await db.runAsync(
    `INSERT INTO local_app_state (state_key, state_value) VALUES (?, ?)
     ON CONFLICT(state_key) DO UPDATE SET state_value = excluded.state_value;`,
    [key, value]
  );
}

export const localLearnerService = {
  async getActiveLearner(dbOverride?: DatabaseConnection): Promise<Profile | null> {
    return activeLearner(await database(dbOverride));
  },

  /** Store a validated raw model assessment and its original canvas metadata. */
  async recordWritingAttempt(topicId: string, attempt: ModelWritingAttempt, dbOverride?: DatabaseConnection): Promise<void> {
    const topic = getWritingTopic(topicId);
    if (!topic?.exercises.some(exercise => exercise.characterId === attempt.characterId)) throw new Error('Unknown writing exercise.');
    const pointCount = attempt.strokeData.reduce((total, stroke) => total + stroke.length, 0);
    if (!pointCount || pointCount > WRITING_INPUT_LIMITS.maxPoints || !Number.isFinite(attempt.confidence) || attempt.confidence < 0 || attempt.confidence > 1) throw new Error('Invalid writing attempt.');
    if (attempt.strokeData.some(stroke => stroke.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1))) throw new Error('Invalid stroke coordinates.');
    if (writingClassId(attempt.recognizedClassId) < 0 || !Number.isFinite(Date.parse(attempt.attemptedAt))
      || !['valid', 'invalid'].includes(attempt.result)
      || (attempt.result === 'valid') !== isValidWritingResult(attempt.characterId, [{
        label: attempt.recognizedClassId, classIndex: writingClassId(attempt.recognizedClassId), probability: attempt.confidence,
      }])) throw new Error('Invalid model assessment.');
    const db = await database(dbOverride);
    if (!db.withTransactionAsync) throw new Error('Writing attempt requires a transaction.');
    await db.withTransactionAsync(async transactionDb => {
      let learner = await activeLearner(transactionDb);
      if (!learner) {
        const now = new Date().toISOString();
        const id = await newId(transactionDb);
        await transactionDb.runAsync(
          `INSERT INTO profiles (profile_id, auth_user_id, display_name, role, created_at, updated_at)
           VALUES (?, NULL, 'Learner', 'learner', ?, ?);`, [id, now, now]
        );
        await setState(transactionDb, ACTIVE_LEARNER_KEY, id);
        learner = await activeLearner(transactionDb);
      }
      const attemptId = await newId(transactionDb);
      await transactionDb.runAsync(
        `INSERT INTO activity_attempts (attempt_id, learner_profile_id, activity_id, result_status, recognized_result, confidence_value, feedback_code, attempted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [attemptId, learner!.profile_id, topicId, attempt.result, attempt.recognizedClassId, attempt.confidence, `baya_model_v1:${attempt.result}`, attempt.attemptedAt]
      );
      await transactionDb.runAsync(
        `INSERT INTO writing_attempts (attempt_id, character_id, stroke_json, image_data, scoring_method)
         VALUES (?, ?, ?, NULL, ?);`,
        [attemptId, attempt.characterId, JSON.stringify(attempt.strokeData), 'baya_model_v1']
      );
    });
  },

  async saveProfile(name: string, workspaceCode = '', dbOverride?: DatabaseConnection): Promise<Profile> {
    const displayName = name.trim();
    if (!displayName) throw new Error('A learner name is required.');
    const db = await database(dbOverride);
    if (!db.withTransactionAsync) throw new Error('Profile save requires a transaction.');
    return db.withTransactionAsync(async (transactionDb) => {
      const current = await activeLearner(transactionDb);
      const now = new Date().toISOString();
      const profileId = current?.profile_id ?? await newId(transactionDb);
      if (current) {
        await transactionDb.runAsync('UPDATE profiles SET display_name = ?, updated_at = ? WHERE profile_id = ?;', [displayName, now, profileId]);
      } else {
        await transactionDb.runAsync(
          `INSERT INTO profiles (profile_id, auth_user_id, display_name, role, created_at, updated_at)
           VALUES (?, NULL, ?, 'learner', ?, ?);`,
          [profileId, displayName, now, now]
        );
      }
      await setState(transactionDb, ACTIVE_LEARNER_KEY, profileId);
      // A code alone is not a membership. Preserve it for a future mentor sync.
      const code = workspaceCode.trim().toUpperCase();
      if (code) await setState(transactionDb, PENDING_WORKSPACE_KEY, code);
      return (await activeLearner(transactionDb))!;
    });
  },

  async getCompletedTopicIds(dbOverride?: DatabaseConnection): Promise<Set<string>> {
    const db = await database(dbOverride);
    const learner = await activeLearner(db);
    if (!learner) return new Set();
    const rows = await db.getAllAsync<{ activity_id: string }>(
      `SELECT DISTINCT activity_id FROM activity_attempts
       WHERE learner_profile_id = ? AND result_status = 'completed';`,
      [learner.profile_id]
    );
    return new Set(rows.map(row => row.activity_id));
  },

  /** Count distinct approved topics first completed on the learner's local day. */
  async getTodayCompletedTopicCount(dbOverride?: DatabaseConnection, now = new Date()): Promise<number> {
    const db = await database(dbOverride);
    const learner = await activeLearner(db);
    if (!learner) return 0;
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const rows = await db.getAllAsync<{ activity_id: string }>(
      `SELECT activity_id FROM activity_attempts
       WHERE learner_profile_id = ? AND result_status = 'completed'
       GROUP BY activity_id
       HAVING MIN(attempted_at) >= ? AND MIN(attempted_at) < ?;`,
      [learner.profile_id, dayStart.toISOString(), nextDay.toISOString()]
    );
    const approvedIds = new Set(approvedCurriculum.flatMap(module => module.topics.map(topic => topic.id)));
    return rows.filter(row => approvedIds.has(row.activity_id)).length;
  },

  async completeTopic(topicId: string, dbOverride?: DatabaseConnection): Promise<void> {
    const module = approvedCurriculum.find(item => item.topics.some(topic => topic.id === topicId));
    if (!module) throw new Error('Topic is not in the approved curriculum.');

    // If a completion for this topic is already in-flight on the default database,
    // join it rather than starting a duplicate transaction or throwing a race error.
    if (!dbOverride && inFlightCompletions.has(topicId)) {
      if (__DEV__) console.info('[BAYA Progress] persist topicId=%s status=joinedExistingSave', topicId);
      return inFlightCompletions.get(topicId)!;
    }

    const txId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const runCompletion = async () => {
      const db = await database(dbOverride);
      if (!db.withTransactionAsync) throw new Error('Progress update requires a transaction.');
      if (__DEV__) console.info('[BAYA Progress] persist topicId=%s status=started txId=%s', topicId, txId);
      await db.withTransactionAsync(async (transactionDb) => {
        const topicIndex = module.topics.findIndex(topic => topic.id === topicId);
        let learner = await activeLearner(transactionDb);
        const priorRows = learner ? await transactionDb.getAllAsync<{ activity_id: string }>(
          `SELECT DISTINCT activity_id FROM activity_attempts
           WHERE learner_profile_id = ? AND result_status = 'completed';`,
          [learner.profile_id]
        ) : [];
        const priorIds = new Set(priorRows.map(row => row.activity_id));
        const priorModules = approvedCurriculum.slice(0, approvedCurriculum.indexOf(module));
        if (priorModules.some(item => item.topics.some(topic => !priorIds.has(topic.id))) ||
            module.topics.slice(0, topicIndex).some(topic => !priorIds.has(topic.id))) {
          throw new Error('Topic is locked until earlier approved topics are completed.');
        }
        if (!learner) {
          const now = new Date().toISOString();
          const id = await newId(transactionDb);
          await transactionDb.runAsync(
            `INSERT INTO profiles (profile_id, auth_user_id, display_name, role, created_at, updated_at)
             VALUES (?, NULL, 'Learner', 'learner', ?, ?);`,
            [id, now, now]
          );
          await setState(transactionDb, ACTIVE_LEARNER_KEY, id);
          learner = await activeLearner(transactionDb);
        }
        const learnerId = learner!.profile_id;
        const now = new Date().toISOString();
        await transactionDb.runAsync(
          `INSERT INTO activity_attempts
           (attempt_id, learner_profile_id, activity_id, result_status, recognized_result, confidence_value, feedback_code, attempted_at)
           SELECT ?, ?, ?, 'completed', NULL, NULL, NULL, ?
           WHERE NOT EXISTS (
             SELECT 1 FROM activity_attempts WHERE learner_profile_id = ?
               AND activity_id = ? AND result_status = 'completed'
           );`,
          [await newId(transactionDb), learnerId, topicId, now, learnerId, topicId]
        );
        const completedRows = await transactionDb.getAllAsync<{ activity_id: string }>(
          `SELECT DISTINCT activity_id FROM activity_attempts
           WHERE learner_profile_id = ? AND result_status = 'completed';`,
          [learnerId]
        );
        const completedIds = new Set(completedRows.map(row => row.activity_id));
        const completed = module.topics.every(topic => completedIds.has(topic.id));
        const progress = await transactionDb.getFirstAsync<{ learner_progress_id: string }>(
          'SELECT learner_progress_id FROM learner_progress WHERE learner_profile_id = ? AND lesson_id = ? LIMIT 1;',
          [learnerId, module.id]
        );
        if (progress) {
          await transactionDb.runAsync(
            `UPDATE learner_progress SET status = ?, completed_at = CASE WHEN ? = 'completed' THEN COALESCE(completed_at, ?) ELSE NULL END, last_activity_at = ?, updated_at = ?
             WHERE learner_progress_id = ?;`,
            [completed ? 'completed' : 'in_progress', completed ? 'completed' : 'in_progress', now, now, now, progress.learner_progress_id]
          );
        } else {
          await transactionDb.runAsync(
            `INSERT INTO learner_progress
             (learner_progress_id, learner_profile_id, lesson_id, status, completed_at, last_activity_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [await newId(transactionDb), learnerId, module.id, completed ? 'completed' : 'in_progress', completed ? now : null, now, now]
          );
        }
      });
      if (__DEV__) console.info('[BAYA Progress] persist topicId=%s status=committed txId=%s', topicId, txId);
    };

    if (dbOverride) {
      return runCompletion();
    }

    const task = runCompletion();
    inFlightCompletions.set(topicId, task);
    try {
      await task;
    } catch (error) {
      if (__DEV__) console.error('[BAYA Progress] persist topicId=%s status=failed txId=%s error=%s', topicId, txId, error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      inFlightCompletions.delete(topicId);
    }
  },
};

/** Apply stored completion only to topics present in the approved manifest. */
export function applyCompletedTopics(modules: Module[], completedIds: ReadonlySet<string>): Module[] {
  let priorModuleCompleted = true;
  for (const module of modules) {
    let firstIncomplete = module.topics.findIndex(topic => !completedIds.has(topic.id));
    if (firstIncomplete < 0) firstIncomplete = module.topics.length;
    module.status = firstIncomplete === module.topics.length ? 'completed' : priorModuleCompleted ? 'current' : 'locked';
    module.topics.forEach((topic, index) => {
      topic.completed = completedIds.has(topic.id);
      topic.status = topic.completed ? 'completed' : index === firstIncomplete && module.status !== 'locked' ? 'available' : 'locked';
    });
    priorModuleCompleted = module.status === 'completed';
  }
  return modules;
}
