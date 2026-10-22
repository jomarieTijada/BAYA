import { approvedCurriculum } from '../../../content/approvedCurriculum';
import type { CloudServices } from '../../../modules/cloud/services';
import { fixtureServices, joinedFixture, workspaceFixture } from './fixtures';
const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const learners = [
  { profileId: 'preview-learner', displayName: 'Jomarie', completedTopics: 4, percentage: 44, currentTopic: 'Paano naman ang Da at Ra?', stage: 1, lastSyncedAt: now },
  { profileId: 'preview-two', displayName: 'Carlo', completedTopics: 6, percentage: 67, currentTopic: 'Kilalanin ang mga Katinig', stage: 2, lastSyncedAt: now },
  { profileId: 'preview-three', displayName: 'Mia', completedTopics: 3, percentage: 33, currentTopic: 'Magkaibang Letra, Iisang Simbolo?', stage: 1, lastSyncedAt: yesterday },
].map(l => ({ ...l, totalTopics: 9, totalStages: 3 }));
/** Imported only under the development preview branch; never a production fallback. */
export const progressPreviewServices: CloudServices = {
  ...fixtureServices,
  workspaces: { ...fixtureServices.workspaces, memberships: async () => ({ ok: true, data: [{ ...joinedFixture, membership: { ...joinedFixture.membership, last_synced_at: now } }] }) },
  progress: {
    sync: async () => ({ ok: true, data: { syncedAt: new Date().toISOString() } }),
    dashboard: async () => ({ ok: true, data: { workspace: workspaceFixture, learnerCount: 3, lastSyncedAt: now, learners, nextOffset: null } }),
    learner: async () => ({ ok: true, data: { learner: learners[0], topics: approvedCurriculum.flatMap(m => m.topics.map(t => ({ topicKey: t.id, title: t.title, moduleTitle: m.title, completedAt: t.id < 'topic-1-5' ? now : null }))) } }),
  },
};
