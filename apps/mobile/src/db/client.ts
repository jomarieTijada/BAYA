/**
 * apps/mobile/src/db/client.ts
 *
 * Drizzle + expo-sqlite database client for BAYA.
 *
 * Opens the SQLite database file 'baya.db' in the device's document directory
 * and returns a typed Drizzle instance. Call this once and share the instance
 * via the useHandwritingDb hook.
 */

import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '../../../../packages/db/src/schema.sqlite';

/** The SQLite database filename. */
const DB_NAME = 'baya.db';

/**
 * Open the SQLite database and wrap it with Drizzle ORM.
 * Returns a typed ExpoSQLiteDatabase instance ready for queries.
 *
 * This function is synchronous — expo-sqlite opens databases lazily,
 * so the actual connection occurs on first query.
 */
export function openBayaDatabase() {
  const sqlite = openDatabaseSync(DB_NAME);
  return drizzle(sqlite, { schema });
}

export type BayaDatabase = ReturnType<typeof openBayaDatabase>;
