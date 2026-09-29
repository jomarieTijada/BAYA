/**
 * apps/mobile/database/repositories/profileRepository.ts
 *
 * Repository for managing user profiles (Learner and Mentor).
 * Parameterized queries only.
 */

import { getDatabaseConnection } from '../connection';
import type { DatabaseConnection, Profile, ProfileRole } from '../types';

export interface CreateProfileInput {
  profile_id: string;
  auth_user_id?: string | null;
  display_name: string;
  role: ProfileRole;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateProfileInput {
  display_name?: string;
  role?: ProfileRole;
  auth_user_id?: string | null;
}

export const profileRepository = {
  /**
   * Create a new user profile.
   */
  async createProfile(
    input: CreateProfileInput,
    dbOverride?: DatabaseConnection
  ): Promise<Profile> {
    const db = dbOverride || (await getDatabaseConnection());
    const nowIso = new Date().toISOString();
    const createdAt = input.created_at || nowIso;
    const updatedAt = input.updated_at || nowIso;
    const authUserId = input.auth_user_id || null;

    await db.runAsync(
      `INSERT INTO profiles (
        profile_id, auth_user_id, display_name, role, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      [input.profile_id, authUserId, input.display_name, input.role, createdAt, updatedAt]
    );

    return {
      profile_id: input.profile_id,
      auth_user_id: authUserId,
      display_name: input.display_name,
      role: input.role,
      created_at: createdAt,
      updated_at: updatedAt,
    };
  },

  /**
   * Retrieve a profile by its ID.
   */
  async getProfileById(
    profileId: string,
    dbOverride?: DatabaseConnection
  ): Promise<Profile | null> {
    const db = dbOverride || (await getDatabaseConnection());
    return db.getFirstAsync<Profile>(
      'SELECT profile_id, auth_user_id, display_name, role, created_at, updated_at FROM profiles WHERE profile_id = ?;',
      [profileId]
    );
  },

  /**
   * Update profile fields.
   */
  async updateProfile(
    profileId: string,
    updates: UpdateProfileInput,
    dbOverride?: DatabaseConnection
  ): Promise<Profile | null> {
    const db = dbOverride || (await getDatabaseConnection());
    const existing = await this.getProfileById(profileId, db);
    if (!existing) {
      return null;
    }

    const updatedAt = new Date().toISOString();
    const displayName = updates.display_name !== undefined ? updates.display_name : existing.display_name;
    const role = updates.role !== undefined ? updates.role : existing.role;
    const authUserId = updates.auth_user_id !== undefined ? updates.auth_user_id : existing.auth_user_id;

    await db.runAsync(
      `UPDATE profiles
       SET display_name = ?, role = ?, auth_user_id = ?, updated_at = ?
       WHERE profile_id = ?;`,
      [displayName, role, authUserId, updatedAt, profileId]
    );

    return {
      profile_id: profileId,
      auth_user_id: authUserId,
      display_name: displayName,
      role,
      created_at: existing.created_at,
      updated_at: updatedAt,
    };
  },
};
