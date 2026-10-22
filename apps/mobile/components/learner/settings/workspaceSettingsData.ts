/**
 * Data contracts for BAYA Learner Settings.
 * Pure UI data definitions — no backend, API, or persistence.
 */


export type WorkspaceConnectionStatus = 'none' | 'connected';

export interface WorkspaceInfo {
  status: WorkspaceConnectionStatus;
  workspaceName?: string;
  workspaceCode?: string;
  lastSyncedText?: string;
}

/** Default clean application state: Independent learner with no workspace. */
export const defaultWorkspaceInfo: WorkspaceInfo = {
  status: 'none',
};
