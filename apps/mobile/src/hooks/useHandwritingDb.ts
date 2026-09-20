/**
 * apps/mobile/src/hooks/useHandwritingDb.ts
 *
 * React hook that opens the BAYA SQLite database and applies any pending
 * Drizzle migrations on first mount.
 *
 * Returns { db, isReady, error } so callers can defer queries until the
 * migration phase is complete.
 */

import { useMemo } from 'react';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openBayaDatabase, type BayaDatabase } from '../db/client';
import migrations from '../db/migrations';

interface UseHandwritingDbResult {
  /** Drizzle database instance — use for queries after isReady is true. */
  db: BayaDatabase;
  /** True once all migrations have been applied successfully. */
  isReady: boolean;
  /** Non-null if migrations failed. */
  error: Error | undefined;
}

/**
 * Opens the BAYA SQLite database and runs pending Drizzle migrations.
 *
 * The returned `db` instance is stable across renders (created once via useMemo).
 * Only use `db` for queries after `isReady === true`.
 */
export function useHandwritingDb(): UseHandwritingDbResult {
  // Create the db instance once — stable reference across renders.
  const db = useMemo(() => openBayaDatabase(), []);

  // useMigrations runs any pending SQL migrations on mount.
  // It returns { success: boolean, error?: Error }.
  const { success, error } = useMigrations(db, migrations);

  return {
    db,
    isReady: success,
    error,
  };
}
