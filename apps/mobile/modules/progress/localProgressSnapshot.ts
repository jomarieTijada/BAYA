import { APPROVED_CONTENT_VERSION_ID, approvedCurriculum } from '../../content/approvedCurriculum';
import { getReadyDatabase } from '../../database/lifecycle';
import { localLearnerService } from '../../database/services/localLearnerService';
import type { DatabaseConnection } from '../../database/types';
import type { ProgressSnapshot } from './contracts';

/** A small cumulative snapshot is retryable without mutating learning data or an outbox. */
export async function readProgressSnapshot(override?: DatabaseConnection): Promise<ProgressSnapshot> {
  const db = override ?? await getReadyDatabase();
  const learner = await localLearnerService.getActiveLearner(db);
  if (!learner) throw { code: 'learner_required' };
  const approved = new Set(approvedCurriculum.flatMap(m => m.topics.map(t => t.id)));
  const rows = await db.getAllAsync<{ activity_id: string; completed_at: string }>(
    `SELECT activity_id, MIN(attempted_at) AS completed_at FROM activity_attempts
     WHERE learner_profile_id = ? AND result_status = 'completed' GROUP BY activity_id;`, [learner.profile_id]);
  return {
    localProfileId: learner.profile_id,
    authUserId: learner.auth_user_id,
    displayName: learner.display_name,
    version: APPROVED_CONTENT_VERSION_ID,
    completed: rows.filter(row => approved.has(row.activity_id)).map(row => {
      if (!Number.isFinite(Date.parse(row.completed_at))) throw new Error('Invalid saved completion timestamp');
      return { topicKey: row.activity_id, completedAt: new Date(row.completed_at).toISOString() };
    }),
  };
}
