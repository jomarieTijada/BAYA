/**
 * apps/mobile/database/connection.ts
 *
 * Connection management for BAYA SQLite database.
 * Uses expo-sqlite and provides dependency injection support for unit testing.
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { DatabaseConnection } from './types';

export const DATABASE_NAME = 'baya.db';

let activeConnection: DatabaseConnection | null = null;
let connectionPromise: Promise<DatabaseConnection> | null = null;

let webTransactionQueue: Promise<unknown> = Promise.resolve();

function serializeWebTransaction<T>(action: () => Promise<T>): Promise<T> {
  const next = webTransactionQueue.then(action, action);
  webTransactionQueue = next.catch(() => {});
  return next;
}

let isInWebTransaction = false;

/**
 * Checks if Origin Private File System (OPFS) is supported by the current environment.
 * On native platforms, returns true. On web, OPFS requires window.isSecureContext
 * (HTTPS or localhost) and navigator.storage.getDirectory.
 */
export function isOpfsSupported(): boolean {
  if (Platform.OS !== 'web') return true;
  if (typeof window === 'undefined') return true;
  return Boolean(
    window.isSecureContext &&
    typeof navigator !== 'undefined' &&
    typeof navigator.storage?.getDirectory === 'function'
  );
}

/**
 * Adapts an expo-sqlite SQLiteDatabase instance to the DatabaseConnection interface.
 */
function wrapExpoDatabase(rawDb: SQLite.SQLiteDatabase): DatabaseConnection {
  const db: DatabaseConnection = {
    async execAsync(source: string): Promise<void> {
      await rawDb.execAsync(source);
    },
    async runAsync(source: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
      const res = await rawDb.runAsync(source, params as SQLite.SQLiteBindParams);
      return {
        lastInsertRowId: res.lastInsertRowId,
        changes: res.changes,
      };
    },
    async getFirstAsync<T>(source: string, params: unknown[] = []): Promise<T | null> {
      return rawDb.getFirstAsync<T>(source, params as SQLite.SQLiteBindParams);
    },
    async getAllAsync<T>(source: string, params: unknown[] = []): Promise<T[]> {
      return rawDb.getAllAsync<T>(source, params as SQLite.SQLiteBindParams);
    },
    async withTransactionAsync<T>(action: (transactionDb: DatabaseConnection) => Promise<T>): Promise<T> {
      let result: T;
      if (Platform.OS !== 'web') {
        await rawDb.withExclusiveTransactionAsync(async (txn) => {
          result = await action(wrapExpoDatabase(txn));
        });
      } else {
        if (isInWebTransaction) {
          // Already within an active serialized transaction; execute directly to prevent queue deadlock
          return action(db);
        }
        await serializeWebTransaction(async () => {
          isInWebTransaction = true;
          try {
            await rawDb.withTransactionAsync(async () => {
              result = await action(db);
            });
          } finally {
            isInWebTransaction = false;
          }
        });
      }
      return result!;
    },
    async closeAsync(): Promise<void> {
      await rawDb.closeAsync();
    },
  };
  return db;
}

/**
 * Configure database pragmas (foreign keys, WAL mode).
 */
export async function configurePragmas(db: DatabaseConnection): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  } catch {
    // In-memory or web databases might not support WAL mode; ignore safely
  }
}

/**
 * Open or retrieve the singleton SQLite database connection.
 *
 * Guarantees exactly ONE call to SQLite.openDatabaseAsync for the lifetime of
 * the app. `connectionPromise` is kept alive after resolution so that any
 * concurrent or subsequent caller awaits the same promise and receives the
 * same already-open connection. Clearing it in a `finally` block was the
 * original race: a caller arriving between promise creation and `finally`
 * clearance could start a second open, causing the web SQLite worker to
 * initialise its WASM VFS twice and throw "Invalid VFS state".
 */
export async function getDatabaseConnection(): Promise<DatabaseConnection> {
  if (activeConnection) {
    return activeConnection;
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      if (Platform.OS === 'web' && !isOpfsSupported()) {
        const origin = typeof window !== 'undefined' ? window.location?.origin : 'unknown';
        const msg = `[BAYA Database] Secure Context required: expo-sqlite on Web requires a Secure Context (HTTPS or localhost) for OPFS persistence. Current origin ${origin} is insecure (window.isSecureContext === false).`;
        console.warn(msg);
        throw new Error(msg);
      }
      const rawDb = await SQLite.openDatabaseAsync(DATABASE_NAME);
      const db = wrapExpoDatabase(rawDb);
      await configurePragmas(db);
      activeConnection = db;
      return db;
    })().catch((error) => {
      // Allow retry on failure by clearing the promise.
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (activeConnection && typeof activeConnection.closeAsync === 'function') {
      activeConnection.closeAsync().catch(() => {});
    }
  });
}

/**
 * Inject a custom or in-memory database connection (primarily for testing).
 */
export function setDatabaseConnection(db: DatabaseConnection | null): void {
  activeConnection = db;
  connectionPromise = null;
}

/**
 * Check if an active connection currently exists.
 */
export function isDatabaseConnected(): boolean {
  return activeConnection !== null;
}

/**
 * Close the active database connection if open.
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (activeConnection) {
    if (typeof activeConnection.closeAsync === 'function') {
      await activeConnection.closeAsync();
    }
    activeConnection = null;
    connectionPromise = null;
  }
}
