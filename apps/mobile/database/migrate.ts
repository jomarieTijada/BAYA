/**
 * apps/mobile/database/migrate.ts
 *
 * Migration runner for BAYA SQLite database.
 * Tracks applied migrations in `schema_migrations`, runs pending migrations
 * in strict numerical order within transactions, and ensures safety and idempotency.
 */

import { MIGRATIONS } from './migrations';
import type { DatabaseConnection, MigrationDefinition, SchemaMigration } from './types';

export interface MigrationResult {
  success: boolean;
  appliedCount: number;
  appliedMigrations: string[];
  alreadyAppliedCount: number;
  error?: Error;
}

/**
 * Ensures the `schema_migrations` table exists.
 */
export async function ensureMigrationTable(db: DatabaseConnection): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

/**
 * Returns all migrations that have already been recorded as applied.
 */
export async function getAppliedMigrations(db: DatabaseConnection): Promise<SchemaMigration[]> {
  await ensureMigrationTable(db);
  const rows = await db.getAllAsync<SchemaMigration>(
    'SELECT id, version, name, applied_at FROM schema_migrations ORDER BY version ASC;'
  );
  return rows || [];
}

/**
 * Runs a single migration inside a transaction.
 */
async function applyMigration(db: DatabaseConnection, migration: MigrationDefinition): Promise<void> {
  const executeMigration = async (transactionDb: DatabaseConnection) => {
    // Execute migration DDL/SQL
    await transactionDb.execAsync(migration.sql);

    // Record migration in schema_migrations
    const nowIso = new Date().toISOString();
    await transactionDb.runAsync(
      'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);',
      [migration.version, migration.name, nowIso]
    );
  };

  if (typeof db.withTransactionAsync === 'function') {
    await db.withTransactionAsync(executeMigration);
  } else {
    // Fallback manual transaction control if withTransactionAsync is not present
    await db.execAsync('BEGIN TRANSACTION;');
    try {
      await executeMigration(db);
      await db.execAsync('COMMIT;');
    } catch (err) {
      await db.execAsync('ROLLBACK;');
      throw err;
    }
  }
}

/**
 * Check and run all pending migrations in ascending version order.
 */
export async function runMigrations(
  db: DatabaseConnection,
  migrations: readonly MigrationDefinition[] = MIGRATIONS
): Promise<MigrationResult> {
  await ensureMigrationTable(db);

  const appliedList = await getAppliedMigrations(db);
  const appliedVersionSet = new Set(appliedList.map((m) => m.version));

  // Sort available migrations strictly by version ascending
  const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);

  const pending = sortedMigrations.filter((m) => !appliedVersionSet.has(m.version));
  const newlyApplied: string[] = [];

  for (const migration of pending) {
    try {
      await applyMigration(db, migration);
      newlyApplied.push(migration.name);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Migration ${migration.name} (v${migration.version}) failed:`, error.message);
      return {
        success: false,
        appliedCount: newlyApplied.length,
        appliedMigrations: newlyApplied,
        alreadyAppliedCount: appliedList.length,
        error,
      };
    }
  }

  return {
    success: true,
    appliedCount: newlyApplied.length,
    appliedMigrations: newlyApplied,
    alreadyAppliedCount: appliedList.length,
  };
}
