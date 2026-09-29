/**
 * apps/mobile/database/repositories/syncRepository.ts
 *
 * Repository for SYNC_OUTBOX offline synchronization queue.
 * Parameterized queries only.
 */

import { getDatabaseConnection } from '../connection';
import type {
  DatabaseConnection,
  SyncOutbox,
  SyncOperation,
  SyncStatus,
} from '../types';

export interface QueueSyncOperationInput {
  outbox_id: string;
  learner_profile_id: string;
  entity_name: string;
  entity_id: string;
  operation: SyncOperation | string;
  sync_status?: SyncStatus | string;
  queued_at?: string;
  last_attempt_at?: string | null;
}

export const syncRepository = {
  /**
   * Queue a new sync operation into SYNC_OUTBOX.
   */
  async queueSyncOperation(
    input: QueueSyncOperationInput,
    dbOverride?: DatabaseConnection
  ): Promise<SyncOutbox> {
    const db = dbOverride || (await getDatabaseConnection());
    const queuedAt = input.queued_at || new Date().toISOString();
    const syncStatus = input.sync_status || 'pending';
    const lastAttemptAt = input.last_attempt_at || null;

    await db.runAsync(
      `INSERT INTO sync_outbox (
        outbox_id, learner_profile_id, entity_name, entity_id, operation, sync_status, queued_at, last_attempt_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        input.outbox_id,
        input.learner_profile_id,
        input.entity_name,
        input.entity_id,
        input.operation,
        syncStatus,
        queuedAt,
        lastAttemptAt,
      ]
    );

    return {
      outbox_id: input.outbox_id,
      learner_profile_id: input.learner_profile_id,
      entity_name: input.entity_name,
      entity_id: input.entity_id,
      operation: input.operation,
      sync_status: syncStatus,
      queued_at: queuedAt,
      last_attempt_at: lastAttemptAt,
    };
  },

  /**
   * Get all pending sync operations for a learner, ordered by queue time.
   */
  async getPendingSyncOperations(
    learnerProfileId: string,
    dbOverride?: DatabaseConnection
  ): Promise<SyncOutbox[]> {
    const db = dbOverride || (await getDatabaseConnection());
    return db.getAllAsync<SyncOutbox>(
      `SELECT outbox_id, learner_profile_id, entity_name, entity_id, operation, sync_status, queued_at, last_attempt_at
       FROM sync_outbox
       WHERE learner_profile_id = ? AND sync_status = 'pending'
       ORDER BY queued_at ASC;`,
      [learnerProfileId]
    );
  },

  /**
   * Update the status and last attempt timestamp for an outbox record.
   */
  async updateSyncStatus(
    outboxId: string,
    status: SyncStatus | string,
    dbOverride?: DatabaseConnection
  ): Promise<void> {
    const db = dbOverride || (await getDatabaseConnection());
    const nowIso = new Date().toISOString();

    await db.runAsync(
      `UPDATE sync_outbox
       SET sync_status = ?, last_attempt_at = ?
       WHERE outbox_id = ?;`,
      [status, nowIso, outboxId]
    );
  },
};
