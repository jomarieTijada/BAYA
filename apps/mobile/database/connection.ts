/**
 * apps/mobile/database/connection.ts
 *
 * Connection management for BAYA SQLite database.
 * Uses expo-sqlite with OPFS lifecycle protection, web locks, and retry logic.
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { DatabaseConnection } from './types';

export const DATABASE_NAME = 'baya.db';
export const OPFS_LOCK_CONFLICT = 'OPFS_LOCK_CONFLICT';

let activeConnection: DatabaseConnection | null = null;
let connectionPromise: Promise<DatabaseConnection> | null = null;

let webTransactionQueue: Promise<unknown> = Promise.resolve();

function serializeWebTransaction<T>(action: () => Promise<T>): Promise<T> {
  const next = webTransactionQueue.then(action, action);
  webTransactionQueue = next.catch(() => {});
  return next;
}

let isInWebTransaction = false;

type DatabaseCloseListener = () => void;
const closeListeners = new Set<DatabaseCloseListener>();

export function onDatabaseClose(listener: DatabaseCloseListener): () => void {
  closeListeners.add(listener);
  return () => {
    closeListeners.delete(listener);
  };
}

/**
 * Classifies whether an error is caused by OPFS SyncAccessHandle lock contention
 * or wa-sqlite VFS state invalidation.
 */
export function isOpfsLockConflictError(error: unknown): boolean {
  if (!error) return false;
  const code = (error as { code?: string })?.code;
  if (code === OPFS_LOCK_CONFLICT) return true;
  const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return (
    msg.includes('createSyncAccessHandle') ||
    msg.includes('another open Access Handle') ||
    msg.includes('WritableStream associated with the same file') ||
    msg.includes('Invalid VFS state') ||
    msg.includes('NoModificationAllowedError') ||
    msg.includes(OPFS_LOCK_CONFLICT)
  );
}

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

let webLockResolver: (() => void) | null = null;

function acquireWebLock(): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.locks) {
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    let resolved = false;

    navigator.locks.request('baya_sqlite_opfs', { ifAvailable: true }, async (lock) => {
      if (!lock) {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
        return;
      }

      if (!resolved) {
        resolved = true;
        resolve(true);
      }

      // Keep lock held until releaseWebLock is called
      await new Promise<void>((releaseResolve) => {
        webLockResolver = releaseResolve;
      });
    }).catch(() => {
      if (!resolved) {
        resolved = true;
        resolve(true);
      }
    });
  });
}

function releaseWebLock(): void {
  if (webLockResolver) {
    webLockResolver();
    webLockResolver = null;
  }
}

let dbChannel: BroadcastChannel | null = null;
if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    dbChannel = new BroadcastChannel('baya_db_channel');
    dbChannel.onmessage = (event) => {
      if (event.data?.type === 'REQUEST_YIELD') {
        // If this tab is currently in the background, yield the database connection
        if (typeof document !== 'undefined' && document.hidden) {
          void closeDatabaseConnection();
        }
      }
    };
  } catch {
    // BroadcastChannel unsupported or restricted in environment
  }
}

function requestOtherTabsYield(): void {
  try {
    dbChannel?.postMessage({ type: 'REQUEST_YIELD' });
  } catch {}
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

async function openRawDatabaseWithRetry(): Promise<DatabaseConnection> {
  const attemptOpen = async () => {
    const rawDb = await SQLite.openDatabaseAsync(DATABASE_NAME);
    const db = wrapExpoDatabase(rawDb);
    await configurePragmas(db);
    return db;
  };

  try {
    return await attemptOpen();
  } catch (error) {
    if (Platform.OS === 'web' && isOpfsLockConflictError(error)) {
      console.warn('[BAYA Database] OPFS lock conflict detected. Retrying connection after backoff...', error);
      requestOtherTabsYield();
      // Backoff to allow lingering handles or terminating workers to clear
      await new Promise((r) => setTimeout(r, 350));
      try {
        const recoveredDb = await attemptOpen();
        console.info('[BAYA Database] Successfully recovered OPFS database on retry.');
        return recoveredDb;
      } catch (retryError) {
        console.error('[BAYA Database] OPFS lock conflict persisted after retry:', retryError);
        const conflictErr = new Error(
          'Database is busy or open in another tab. Please close other BAYA tabs and try again.'
        );
        (conflictErr as any).code = OPFS_LOCK_CONFLICT;
        (conflictErr as any).cause = retryError;
        throw conflictErr;
      }
    }
    throw error;
  }
}

/**
 * Open or retrieve the singleton SQLite database connection.
 *
 * Guarantees exactly ONE active connection lifecycle per window.
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

      if (Platform.OS === 'web') {
        const lockAcquired = await acquireWebLock();
        if (!lockAcquired) {
          // Check if lock frees up after notifying other tabs
          requestOtherTabsYield();
          await new Promise((r) => setTimeout(r, 200));
          await acquireWebLock();
        }
      }

      const db = await openRawDatabaseWithRetry();
      activeConnection = db;
      return db;
    })().catch((error) => {
      // Allow retry on failure by clearing the promise and releasing any partial lock.
      activeConnection = null;
      connectionPromise = null;
      releaseWebLock();
      throw error;
    });
  }

  return connectionPromise;
}

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Mobile & desktop lifecycle handlers
  window.addEventListener('pagehide', () => {
    void closeDatabaseConnection();
  });

  window.addEventListener('beforeunload', () => {
    void closeDatabaseConnection();
  });

  let hiddenTimer: ReturnType<typeof setTimeout> | null = null;
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimer = setTimeout(() => {
          void closeDatabaseConnection();
        }, 3500);
      } else if (document.visibilityState === 'visible') {
        if (hiddenTimer) {
          clearTimeout(hiddenTimer);
          hiddenTimer = null;
        }
      }
    });
  }
}

/**
 * Inject a custom or in-memory database connection (primarily for testing).
 */
export function setDatabaseConnection(db: DatabaseConnection | null): void {
  activeConnection = db;
  connectionPromise = null;
  if (!db) {
    releaseWebLock();
  }
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
  await webTransactionQueue.catch(() => {});

  if (activeConnection) {
    const conn = activeConnection;
    activeConnection = null;
    connectionPromise = null;
    if (typeof conn.closeAsync === 'function') {
      await conn.closeAsync().catch(() => {});
    }
  } else {
    connectionPromise = null;
  }

  releaseWebLock();

  for (const listener of closeListeners) {
    try {
      listener();
    } catch {}
  }
}
