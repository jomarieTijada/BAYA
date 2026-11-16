import { approvedCurriculum } from '../../content/approvedCurriculum';
import { getReadyDatabase } from '../lifecycle';
import type { DatabaseConnection } from '../types';
import { localLearnerService } from './localLearnerService';
import { parseCheckpoint, type Checkpoint } from '../../modules/resume/checkpoint';
import { isValidWritingResult, writingClassId } from '../../content/writingMastery';

const key = (profileId: string, topicId: string) => `activity_resume:${profileId}:${topicId}`;
let pending: Promise<unknown> = Promise.resolve();
/** Invocation order is maintained across saves, clears and activity instances. */
function ordered<T>(work: () => Promise<T>): Promise<T> {
  const next = pending.then(work, work);
  pending = next.catch(() => undefined);
  return next;
}
export const activityResumeService = {
  /** A navigation bookmark is separate from completion and unfinished work. */
  rememberOpened(profileId: string, topicId: string, override?: DatabaseConnection): Promise<void> {
    return ordered(async () => {
      const module = approvedCurriculum.find(item => item.topics.some(topic => topic.id === topicId));
      if (!module) return;
      const db = override ?? await getReadyDatabase();
      if ((await localLearnerService.getActiveLearner(db))?.profile_id !== profileId) return;
      await db.runAsync('INSERT INTO local_app_state (state_key, state_value) VALUES (?, ?) ON CONFLICT(state_key) DO UPDATE SET state_value = excluded.state_value;',
        [`last_topic:${profileId}:${module.id}`, topicId]);
    });
  },
  async lastOpened(moduleId: string, override?: DatabaseConnection): Promise<string | null> {
    await pending;
    const db = override ?? await getReadyDatabase();
    const owner = await localLearnerService.getActiveLearner(db);
    if (!owner) return null;
    const row = await db.getFirstAsync<{ state_value: string }>('SELECT state_value FROM local_app_state WHERE state_key = ?;', [`last_topic:${owner.profile_id}:${moduleId}`]);
    return approvedCurriculum.find(item => item.id === moduleId)?.topics.some(topic => topic.id === row?.state_value) ? row!.state_value : null;
  },
  async read(profileId: string, topicId?: string, override?: DatabaseConnection): Promise<Checkpoint | null> {
    await pending;
    const db = override ?? await getReadyDatabase();
    const owner = await localLearnerService.getActiveLearner(db);
    if (owner?.profile_id !== profileId) return null;
    const rows = await db.getAllAsync<{ state_value: string }>(
      'SELECT state_value FROM local_app_state WHERE state_key LIKE ?;', [`activity_resume:${profileId}:%`]);
    const complete = await localLearnerService.getCompletedTopicIds(db);
    return rows.map(row => parseCheckpoint(row.state_value, profileId)).filter((c): c is Checkpoint => !!c && (!topicId || c.topicId === topicId) && !complete.has(c.topicId))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0] ?? null;
  },
  save(checkpoint: Checkpoint, override?: DatabaseConnection): Promise<void> {
    const snapshot = JSON.stringify(checkpoint);
    return ordered(async () => {
      const c = parseCheckpoint(snapshot, checkpoint.profileId);
      if (!c) throw new Error('Invalid activity checkpoint.');
      const db = override ?? await getReadyDatabase();
      if (!db.withTransactionAsync) throw new Error('Checkpoint requires a transaction.');
      await db.withTransactionAsync(async tx => {
        if ((await localLearnerService.getActiveLearner(tx))?.profile_id !== c.profileId) return;
        if ((await localLearnerService.getCompletedTopicIds(tx)).has(c.topicId)) return;
        await tx.runAsync('INSERT INTO local_app_state (state_key, state_value) VALUES (?, ?) ON CONFLICT(state_key) DO UPDATE SET state_value = excluded.state_value;', [key(c.profileId, c.topicId), JSON.stringify(c)]);
      });
    });
  },
  clear(profileId: string, topicId: string, override?: DatabaseConnection): Promise<void> {
    return ordered(async () => {
      const db = override ?? await getReadyDatabase();
      await db.runAsync('DELETE FROM local_app_state WHERE state_key = ?;', [key(profileId, topicId)]);
    });
  },
  /** Mastery comes from saved validated attempts, never editable checkpoint counters. */
  async acceptedCounts(c: Checkpoint, override?: DatabaseConnection): Promise<Record<string, number>> {
    const db = override ?? await getReadyDatabase();
    if ((await localLearnerService.getActiveLearner(db))?.profile_id !== c.profileId) return {};
    const rows = await db.getAllAsync<{ character_id: string; recognized_result: string; confidence_value: number }>(
      `SELECT w.character_id, a.recognized_result, a.confidence_value FROM writing_attempts w JOIN activity_attempts a ON a.attempt_id = w.attempt_id
       WHERE a.learner_profile_id = ? AND a.activity_id = ? AND a.result_status = 'valid' AND a.attempted_at >= ?;`, [c.profileId, c.topicId, c.startedAt]);
    const counts: Record<string, number> = {};
    for (const row of rows) if (isValidWritingResult(row.character_id, [{ label: row.recognized_result, classIndex: writingClassId(row.recognized_result), probability: row.confidence_value }])) {
      counts[row.character_id] = Math.min(2, (counts[row.character_id] ?? 0) + 1);
    }
    return counts;
  },
};
