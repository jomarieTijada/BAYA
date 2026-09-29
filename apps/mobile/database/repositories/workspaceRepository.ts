/**
 * apps/mobile/database/repositories/workspaceRepository.ts
 *
 * Repository for Workspaces and Workspace Memberships.
 * Parameterized queries only.
 */

import { getDatabaseConnection } from '../connection';
import type {
  DatabaseConnection,
  Workspace,
  WorkspaceMembership,
  WorkspaceStatus,
} from '../types';

export interface CreateWorkspaceInput {
  workspace_id: string;
  mentor_profile_id: string;
  workspace_code: string;
  workspace_name: string;
  status: WorkspaceStatus | string;
  created_at?: string;
}

export interface JoinWorkspaceResult {
  membership: WorkspaceMembership;
  workspace: Workspace;
}

export const workspaceRepository = {
  /**
   * Find a workspace by its unique code.
   */
  async getWorkspaceByCode(
    workspaceCode: string,
    dbOverride?: DatabaseConnection
  ): Promise<Workspace | null> {
    const db = dbOverride || (await getDatabaseConnection());
    return db.getFirstAsync<Workspace>(
      'SELECT workspace_id, mentor_profile_id, workspace_code, workspace_name, status, created_at FROM workspaces WHERE workspace_code = ?;',
      [workspaceCode]
    );
  },

  /**
   * Find a workspace by its ID.
   */
  async getWorkspaceById(
    workspaceId: string,
    dbOverride?: DatabaseConnection
  ): Promise<Workspace | null> {
    const db = dbOverride || (await getDatabaseConnection());
    return db.getFirstAsync<Workspace>(
      'SELECT workspace_id, mentor_profile_id, workspace_code, workspace_name, status, created_at FROM workspaces WHERE workspace_id = ?;',
      [workspaceId]
    );
  },

  /**
   * Create a new workspace.
   */
  async createWorkspace(
    input: CreateWorkspaceInput,
    dbOverride?: DatabaseConnection
  ): Promise<Workspace> {
    const db = dbOverride || (await getDatabaseConnection());
    const createdAt = input.created_at || new Date().toISOString();

    await db.runAsync(
      `INSERT INTO workspaces (
        workspace_id, mentor_profile_id, workspace_code, workspace_name, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      [
        input.workspace_id,
        input.mentor_profile_id,
        input.workspace_code,
        input.workspace_name,
        input.status,
        createdAt,
      ]
    );

    return {
      workspace_id: input.workspace_id,
      mentor_profile_id: input.mentor_profile_id,
      workspace_code: input.workspace_code,
      workspace_name: input.workspace_name,
      status: input.status,
      created_at: createdAt,
    };
  },

  /**
   * Enroll a learner in a workspace using the workspace code.
   */
  async joinWorkspace(
    learnerProfileId: string,
    workspaceCode: string,
    membershipId: string,
    dbOverride?: DatabaseConnection
  ): Promise<JoinWorkspaceResult> {
    const db = dbOverride || (await getDatabaseConnection());
    const workspace = await this.getWorkspaceByCode(workspaceCode, db);

    if (!workspace) {
      throw new Error(`Workspace with code "${workspaceCode}" not found.`);
    }

    // Check if membership already exists
    const existingMembership = await db.getFirstAsync<WorkspaceMembership>(
      'SELECT membership_id, learner_profile_id, workspace_id, joined_at, last_synced_at, is_active FROM workspace_memberships WHERE learner_profile_id = ? AND workspace_id = ?;',
      [learnerProfileId, workspace.workspace_id]
    );

    if (existingMembership) {
      // Re-activate if inactive
      if (existingMembership.is_active === 0) {
        await db.runAsync(
          'UPDATE workspace_memberships SET is_active = 1 WHERE membership_id = ?;',
          [existingMembership.membership_id]
        );
        return {
          membership: { ...existingMembership, is_active: 1 },
          workspace,
        };
      }
      return { membership: existingMembership, workspace };
    }

    const joinedAt = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO workspace_memberships (
        membership_id, learner_profile_id, workspace_id, joined_at, last_synced_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      [membershipId, learnerProfileId, workspace.workspace_id, joinedAt, null, 1]
    );

    const membership: WorkspaceMembership = {
      membership_id: membershipId,
      learner_profile_id: learnerProfileId,
      workspace_id: workspace.workspace_id,
      joined_at: joinedAt,
      last_synced_at: null,
      is_active: 1,
    };

    return { membership, workspace };
  },

  /**
   * Get all active workspaces a learner is enrolled in.
   */
  async getLearnerWorkspaces(
    learnerProfileId: string,
    dbOverride?: DatabaseConnection
  ): Promise<Array<Workspace & { membership_id: string; joined_at: string; last_synced_at: string | null }>> {
    const db = dbOverride || (await getDatabaseConnection());
    return db.getAllAsync<Workspace & { membership_id: string; joined_at: string; last_synced_at: string | null }>(
      `SELECT w.workspace_id, w.mentor_profile_id, w.workspace_code, w.workspace_name, w.status, w.created_at,
              wm.membership_id, wm.joined_at, wm.last_synced_at
       FROM workspace_memberships wm
       JOIN workspaces w ON w.workspace_id = wm.workspace_id
       WHERE wm.learner_profile_id = ? AND wm.is_active = 1
       ORDER BY wm.joined_at DESC;`,
      [learnerProfileId]
    );
  },
};
