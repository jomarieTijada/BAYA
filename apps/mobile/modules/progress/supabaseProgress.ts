import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProgressServices, ProgressSnapshot, LearnerProgressSummary, ProgressDashboard, TopicProgress } from './contracts';
import type { Result, FailureCode } from '../cloud/services';

type Dependencies = {
  mentor: SupabaseClient;
  learnerClient: (id: string) => SupabaseClient;
  snapshot: () => Promise<ProgressSnapshot>;
  failure: (e: unknown) => { ok: false; code: FailureCode };
};
const validDate = (value: string | null) => value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value)));
function validLearner(value: LearnerProgressSummary): boolean {
  return !!value && typeof value.profileId === 'string' && typeof value.displayName === 'string'
    && typeof value.currentTopic === 'string' && validDate(value.lastSyncedAt)
    && Number.isInteger(value.totalTopics) && value.totalTopics > 0
    && Number.isInteger(value.completedTopics) && value.completedTopics >= 0 && value.completedTopics <= value.totalTopics
    && Number.isInteger(value.stage) && value.stage > 0 && Number.isInteger(value.totalStages) && value.stage <= value.totalStages
    && (value.percentage === null || (Number.isFinite(value.percentage) && value.percentage >= 0 && value.percentage <= 100));
}
export function createProgressServices({ mentor, learnerClient, snapshot, failure }: Dependencies): ProgressServices {
  const syncInFlight = new Map<string, Promise<Result<{ syncedAt: string }>>>();
  async function run<T>(operation: () => Promise<T>): Promise<Result<T>> {
    try { return { ok: true, data: await operation() }; } catch (e) {
      if ((e as { code?: string })?.code === '22023') return { ok: false, code: 'incompatible_progress' };
      return failure(e);
    }
  }
  async function rpc<T>(client: SupabaseClient, name: string, params: Record<string, unknown>): Promise<T> {
    const { data, error } = await client.rpc(name, params);
    if (error) throw error;
    if (!data || typeof data !== 'object') throw new Error('Invalid progress response');
    return data as T;
  }
  return {
    sync: async () => {
      let saved: ProgressSnapshot;
      try { saved = await snapshot(); } catch (e) { return failure(e); }
      const existing = syncInFlight.get(saved.localProfileId);
      if (existing) return existing;
      const task = run(async () => {
        const client = learnerClient(saved.localProfileId);
        const session = await client.auth.getSession();
        if (session.error) throw session.error;
        if (!session.data.session) throw { code: 'learner_login_required' };
        if (!saved.authUserId || session.data.session.user.id !== saved.authUserId) throw { code: 'account_mismatch' };
        // Never send the SQLite profile UUID as cloud ownership evidence.
        const result = await rpc<{ syncedAt: string }>(client, 'sync_learning_progress', {
          p_version: saved.version, p_name: saved.displayName, p_completed: saved.completed,
        });
        if (!Number.isFinite(Date.parse(result.syncedAt))) throw new Error('Invalid sync receipt');
        return result;
      }).finally(() => { syncInFlight.delete(saved.localProfileId); });
      syncInFlight.set(saved.localProfileId, task);
      return task;
    },
    dashboard: (id, offset = 0) => run(async () => {
      const result = await rpc<ProgressDashboard>(mentor, 'get_progress_dashboard', { p_workspace_id: id, p_offset: offset });
      if (!Array.isArray(result.learners) || !result.learners.every(validLearner) || !result.workspace
        || typeof result.workspace.workspace_name !== 'string' || typeof result.workspace.workspace_code !== 'string'
        || !Number.isInteger(result.learnerCount) || result.learnerCount < result.learners.length || !validDate(result.lastSyncedAt)
        || !(result.nextOffset === null || (Number.isInteger(result.nextOffset) && result.nextOffset > offset))) throw new Error('Invalid dashboard');
      return result;
    }),
    learner: (id, profileId) => run(async () => {
      const result = await rpc<{ learner: LearnerProgressSummary; topics: TopicProgress[] }>(mentor, 'get_learner_progress', { p_workspace_id: id, p_profile_id: profileId });
      if (!validLearner(result.learner) || !Array.isArray(result.topics) || !result.topics.every(t => t && typeof t.topicKey === 'string'
        && typeof t.title === 'string' && typeof t.moduleTitle === 'string' && validDate(t.completedAt))) throw new Error('Invalid learner progress');
      return result;
    }),
  };
}
