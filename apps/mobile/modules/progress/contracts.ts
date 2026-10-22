import type { Result, WorkspaceSummary } from '../cloud/services';

export type Completion = { topicKey: string; completedAt: string };
export type ProgressSnapshot = {
  localProfileId: string;
  authUserId: string | null;
  displayName: string;
  version: string;
  completed: Completion[];
};
export type LearnerProgressSummary = {
  profileId: string;
  displayName: string;
  lastSyncedAt: string | null;
  completedTopics: number;
  totalTopics: number;
  percentage: number | null;
  currentTopic: string;
  stage: number;
  totalStages: number;
};
export type TopicProgress = { topicKey: string; title: string; moduleTitle: string; completedAt: string | null };
export type ProgressDashboard = {
  workspace: WorkspaceSummary;
  learnerCount: number;
  lastSyncedAt: string | null;
  learners: LearnerProgressSummary[];
  nextOffset: number | null;
};
export interface ProgressServices {
  sync(): Promise<Result<{ syncedAt: string }>>;
  dashboard(workspaceId: string, offset?: number): Promise<Result<ProgressDashboard>>;
  learner(workspaceId: string, profileId: string): Promise<Result<{ learner: LearnerProgressSummary; topics: TopicProgress[] }>>;
}
