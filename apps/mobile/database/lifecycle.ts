import { getDatabaseConnection, onDatabaseClose } from './connection';
import { runMigrations, type MigrationResult } from './migrate';
import { seedCurriculum, type SeedResult } from './seed';
import type { DatabaseConnection } from './types';

export interface InitDatabaseOptions {
  seed?: boolean;
  dbOverride?: DatabaseConnection;
}

export interface InitDatabaseResult {
  initialized: boolean;
  migrationResult: MigrationResult;
  seedResult?: SeedResult;
}

/** Apply pending schema changes, then reconcile validator-approved content. */
export async function initDatabase(options: InitDatabaseOptions = {}): Promise<InitDatabaseResult> {
  const db = options.dbOverride || (await getDatabaseConnection());
  const migrationResult = await runMigrations(db);
  if (!migrationResult.success) {
    throw migrationResult.error || new Error('Database migration failed.');
  }
  const seedResult = options.seed ? await seedCurriculum(db) : undefined;
  return { initialized: true, migrationResult, seedResult };
}

let readyPromise: Promise<DatabaseConnection> | null = null;

/** Share startup work across the root layout and screens that open immediately. */
export function getReadyDatabase(): Promise<DatabaseConnection> {
  if (!readyPromise) {
    readyPromise = getDatabaseConnection()
      .then((db) => initDatabase({ seed: true, dbOverride: db }).then(() => db))
      .catch((error) => {
        readyPromise = null;
        throw error;
      });
  }
  return readyPromise;
}

export function resetReadyDatabase(): void {
  readyPromise = null;
}

// Auto-reset readyPromise whenever the underlying connection closes or is reset
onDatabaseClose(() => {
  resetReadyDatabase();
});

