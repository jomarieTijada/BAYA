/**
 * Data contracts and mock models for BAYA Learner Settings.
 * Pure UI data definitions — no backend, API, or persistence.
 */
import { SETTINGS_COPY } from './settingsCopy';

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

/** Mock connected workspace state for QA testing. */
export const connectedWorkspaceInfo: WorkspaceInfo = {
  status: 'connected',
  workspaceName: 'Baybayin Workshop A',
  workspaceCode: 'BAYA-7K2P',
  lastSyncedText: SETTINGS_COPY.justNow,
};
