/** One connection and one OPFS owner per browser page. */
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { databaseOwnership } from './ownership';
import { releaseSqliteWorker } from './workerLifecycle';
import type { DatabaseConnection } from './types';

export const DATABASE_NAME = 'baya.db';
export const OPFS_LOCK_CONFLICT = 'OPFS_LOCK_CONFLICT';

export type DatabaseState = 'CLOSED' | 'ACQUIRING_OWNERSHIP' | 'OPENING' | 'READY' | 'YIELD_REQUESTED' | 'CLOSING' | 'ERROR';

let state: DatabaseState = 'CLOSED';
let activeConnection: DatabaseConnection | null = null;
let connectionPromise: Promise<DatabaseConnection> | null = null;
let closePromise: Promise<void> | null = null;
let activeOperations = 0;
let activeTransactions = 0;
let drainResolvers: (() => void)[] = [];
let webTransactionQueue: Promise<unknown> = Promise.resolve();
let isInWebTransaction = false;

type DatabaseCloseListener = () => void;
const closeListeners = new Set<DatabaseCloseListener>();

function setState(next: DatabaseState): void {
  state = next;
  if (Platform.OS === 'web') {
    console.info(`[BAYA Database] session=${databaseOwnership.sessionId} state=${next} activeTransactions=${activeTransactions}`);
  }
}

export function getDatabaseState(): DatabaseState {
  return state;
}

export function onDatabaseClose(listener: DatabaseCloseListener): () => void {
  closeListeners.add(listener);
  return () => closeListeners.delete(listener);
}

export function isOpfsLockConflictError(error: unknown): boolean {
  if (!error) return false;
  if ((error as { code?: string }).code === OPFS_LOCK_CONFLICT) return true;
  const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return ['createSyncAccessHandle', 'another open Access Handle', 'WritableStream associated with the same file', 'Invalid VFS state', 'NoModificationAllowedError', OPFS_LOCK_CONFLICT]
    .some((part) => msg.includes(part));
}

export function isOpfsSupported(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return true;
  return Boolean(window.isSecureContext && navigator.storage?.getDirectory);
}

function signalDrained(): void {
  if (activeOperations !== 0) return;
  const listeners = drainResolvers;
  drainResolvers = [];
  listeners.forEach((resolve) => resolve());
}

function waitForOperations(): Promise<void> {
  if (activeOperations === 0) return Promise.resolve();
  return new Promise((resolve) => drainResolvers.push(resolve));
}

async function runOperation<T>(action: () => Promise<T>, internal = false, transaction = false): Promise<T> {
  if (!internal && (state === 'CLOSING' || state === 'YIELD_REQUESTED' || state === 'ERROR')) {
    throw new Error('Database ownership is being released. Please try again.');
  }
  activeOperations += 1;
  if (transaction) activeTransactions += 1;
  try {
    return await action();
  } finally {
    activeOperations -= 1;
    if (transaction) activeTransactions -= 1;
    signalDrained();
  }
}

function serializeWebTransaction<T>(action: () => Promise<T>): Promise<T> {
  const next = webTransactionQueue.then(action, action);
  webTransactionQueue = next.catch(() => {});
  return next;
}

function wrapExpoDatabase(rawDb: SQLite.SQLiteDatabase, internal = false): DatabaseConnection {
  const db: DatabaseConnection = {
    execAsync(source) {
      return runOperation(() => rawDb.execAsync(source), internal);
    },
    runAsync(source, params = []) {
      return runOperation(async () => {
        const result = await rawDb.runAsync(source, params as SQLite.SQLiteBindParams);
        return { lastInsertRowId: result.lastInsertRowId, changes: result.changes };
      }, internal);
    },
    getFirstAsync<T>(source: string, params: unknown[] = []) {
      return runOperation(() => rawDb.getFirstAsync<T>(source, params as SQLite.SQLiteBindParams), internal);
    },
    getAllAsync<T>(source: string, params: unknown[] = []) {
      return runOperation(() => rawDb.getAllAsync<T>(source, params as SQLite.SQLiteBindParams), internal);
    },
    withTransactionAsync<T>(action: (transactionDb: DatabaseConnection) => Promise<T>): Promise<T> {
      return runOperation(async () => {
        let result!: T;
        if (Platform.OS !== 'web') {
          await rawDb.withExclusiveTransactionAsync(async (txn) => {
            result = await action(wrapExpoDatabase(txn, true));
          });
          return result;
        }
        if (isInWebTransaction) return action(wrapExpoDatabase(rawDb, true));
        await serializeWebTransaction(async () => {
          isInWebTransaction = true;
          try {
            await rawDb.withTransactionAsync(async () => {
              result = await action(wrapExpoDatabase(rawDb, true));
            });
          } finally {
            isInWebTransaction = false;
          }
        });
        return result;
      }, internal, true);
    },
    closeAsync() {
      return rawDb.closeAsync();
    },
  };
  return db;
}

export async function configurePragmas(db: DatabaseConnection): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  } catch {
    // The web VFS and in-memory test databases can reject WAL.
  }
}

async function openRawDatabase(): Promise<DatabaseConnection> {
  console.info(`[BAYA Database] session=${databaseOwnership.sessionId} openDatabaseAsync`);
  const rawDb = await SQLite.openDatabaseAsync(DATABASE_NAME);
  const db = wrapExpoDatabase(rawDb);
  try {
    // A close may already be waiting for this open to finish.
    await configurePragmas(wrapExpoDatabase(rawDb, true));
    return db;
  } catch (error) {
    await rawDb.closeAsync();
    throw error;
  }
}

export async function getDatabaseConnection(): Promise<DatabaseConnection> {
  if (closePromise) await closePromise;
  if (activeConnection && state === 'READY') return activeConnection;
  if (state === 'ERROR') throw new Error('Database teardown failed; reload BAYA before retrying.');
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    if (Platform.OS === 'web') {
      if (!isOpfsSupported()) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
        throw new Error(`Secure Context required for OPFS persistence. Current origin: ${origin}`);
      }
      setState('ACQUIRING_OWNERSHIP');
      await databaseOwnership.acquire();
    }
    setState('OPENING');
    const db = await openRawDatabase();
    activeConnection = db;
    if (state !== 'CLOSING') {
      setState('READY');
      if (Platform.OS === 'web') databaseOwnership.reportDatabaseReady();
    }
    return db;
  })().catch(async (error) => {
    connectionPromise = null;
    const hadOwnership = databaseOwnership.hasOwnership();
    try {
      if (Platform.OS === 'web' && databaseOwnership.hasOwnership()) {
        await releaseSqliteWorker();
        await databaseOwnership.release();
      }
      setState('CLOSED');
    } catch (teardownError) {
      setState('ERROR');
      console.error('[BAYA Database] Failed opening cleanup; retaining Web Lock', teardownError);
    }
    if (isOpfsLockConflictError(error)) {
      if (hadOwnership) {
        console.error('[BAYA Database] OPFS lock conflict despite ownership', error);
      }
      const conflict = new Error('Database is busy in another BAYA window. Close that window and try again.');
      (conflict as Error & { code: string }).code = OPFS_LOCK_CONFLICT;
      (conflict as Error & { cause: unknown }).cause = error;
      throw conflict;
    }
    throw error;
  });
  return connectionPromise;
}

/** Test-only injection of an in-memory or mock connection. */
export function setDatabaseConnection(db: DatabaseConnection | null): void {
  activeConnection = db;
  connectionPromise = null;
  setState(db ? 'READY' : 'CLOSED');
}

export function isDatabaseConnected(): boolean {
  return activeConnection !== null && state === 'READY';
}

export async function closeDatabaseConnection(): Promise<void> {
  if (closePromise) return closePromise;
  const pendingOpen = connectionPromise;
  setState('CLOSING');
  databaseOwnership.cancelPending();
  closePromise = (async () => {
    try {
      await pendingOpen?.catch(() => {});
      await waitForOperations();
      if (activeConnection) {
        await activeConnection.closeAsync?.();
        activeConnection = null;
      }
      if (Platform.OS === 'web' && databaseOwnership.hasOwnership()) {
        await releaseSqliteWorker();
        await databaseOwnership.release();
      }
      connectionPromise = null;
      setState('CLOSED');
      for (const listener of closeListeners) {
        try { listener(); } catch (error) {
          console.error('[BAYA Database] Close listener failed', error);
        }
      }
    } catch (error) {
      setState('ERROR');
      console.error('[BAYA Database] Close failed; retaining ownership', error);
      throw error;
    } finally {
      closePromise = null;
    }
  })();
  return closePromise;
}

databaseOwnership.setYieldHandler(async () => {
  setState('YIELD_REQUESTED');
  await closeDatabaseConnection();
});

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { void closeDatabaseConnection(); });
  window.addEventListener('beforeunload', () => { void closeDatabaseConnection(); });
  let hiddenTimer: ReturnType<typeof setTimeout> | null = null;
  document.addEventListener('visibilitychange', () => {
    if (hiddenTimer) clearTimeout(hiddenTimer);
    hiddenTimer = null;
    if (document.visibilityState === 'hidden') {
      hiddenTimer = setTimeout(() => {
        hiddenTimer = null;
        void closeDatabaseConnection();
      }, 3500);
    }
  });
}
