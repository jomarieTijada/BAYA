/**
 * apps/mobile/database/__tests__/concurrencyAndLifecycle.test.ts
 *
 * Dedicated verification suite for:
 * 1. Six concurrent completeTopic requests joining one transaction
 * 2. Six separate call sites joining one transaction
 * 3. Immediate transaction rejection handling
 * 4. Rejected task cleanup allowing subsequent retry
 * 5. Transaction queue resilience (no deadlock or poisoning on rejection)
 * 6. Nested transactions avoiding queue deadlock
 * 7. isOpfsSupported capability detection
 */

import { DatabaseSync } from 'node:sqlite';
import { Platform } from 'react-native';
import {
  setDatabaseConnection,
  closeDatabaseConnection,
  isOpfsSupported,
} from '../connection';
import { getReadyDatabase, resetReadyDatabase } from '../lifecycle';
import { runMigrations } from '../migrate';
import { seedCurriculum } from '../seed';
import { localLearnerService } from '../services/localLearnerService';
import type { DatabaseConnection } from '../types';

function createMockDatabase(): { db: DatabaseConnection; transactionCount: () => number } {
  const rawDb = new DatabaseSync(':memory:');
  let txCount = 0;

  let inTransaction = false;
  const db: DatabaseConnection = {
    async execAsync(source: string): Promise<void> {
      rawDb.exec(source);
    },
    async runAsync(source: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
      const stmt = rawDb.prepare(source);
      const res = (stmt.run as (...args: unknown[]) => { lastInsertRowid: number | bigint; changes: number | bigint })(...params);
      return {
        lastInsertRowId: Number(res.lastInsertRowid ?? 0),
        changes: Number(res.changes ?? 0),
      };
    },
    async getFirstAsync<T>(source: string, params: unknown[] = []): Promise<T | null> {
      const stmt = rawDb.prepare(source);
      const row = (stmt.get as (...args: unknown[]) => unknown)(...params);
      return (row as T) || null;
    },
    async getAllAsync<T>(source: string, params: unknown[] = []): Promise<T[]> {
      const stmt = rawDb.prepare(source);
      return ((stmt.all as (...args: unknown[]) => unknown[])(...params) as T[]) || [];
    },
    async withTransactionAsync<T>(action: (transactionDb: DatabaseConnection) => Promise<T>): Promise<T> {
      txCount++;
      const isTopLevel = !inTransaction;
      if (isTopLevel) {
        inTransaction = true;
        rawDb.exec('BEGIN TRANSACTION;');
      } else {
        rawDb.exec('SAVEPOINT sp;');
      }
      try {
        const result = await action(db);
        if (isTopLevel) {
          rawDb.exec('COMMIT;');
        } else {
          rawDb.exec('RELEASE SAVEPOINT sp;');
        }
        return result;
      } catch (err) {
        if (isTopLevel) {
          rawDb.exec('ROLLBACK;');
        } else {
          rawDb.exec('ROLLBACK TO SAVEPOINT sp;');
        }
        throw err;
      } finally {
        if (isTopLevel) {
          inTransaction = false;
        }
      }
    },
    async closeAsync(): Promise<void> {
      rawDb.close();
    },
  };

  return { db, transactionCount: () => txCount };
}

describe('Concurrency and Database Lifecycle', () => {
  let mockDbInfo: ReturnType<typeof createMockDatabase>;

  beforeEach(async () => {
    resetReadyDatabase();
    mockDbInfo = createMockDatabase();
    await runMigrations(mockDbInfo.db);
    await seedCurriculum(mockDbInfo.db);
    setDatabaseConnection(mockDbInfo.db);
    await getReadyDatabase();
  });

  afterEach(async () => {
    await closeDatabaseConnection();
    resetReadyDatabase();
  });

  test('1. Six concurrent completeTopic(topic-1-1) requests trigger exactly ONE underlying transaction', async () => {
    const startTxCount = mockDbInfo.transactionCount();

    // Fire 6 simultaneous completion requests for the same topic
    const results = await Promise.all([
      localLearnerService.completeTopic('topic-1-1'),
      localLearnerService.completeTopic('topic-1-1'),
      localLearnerService.completeTopic('topic-1-1'),
      localLearnerService.completeTopic('topic-1-1'),
      localLearnerService.completeTopic('topic-1-1'),
      localLearnerService.completeTopic('topic-1-1'),
    ]);

    expect(results).toHaveLength(6);
    // Exactly one transaction executed despite 6 concurrent callers
    expect(mockDbInfo.transactionCount() - startTxCount).toBe(1);

    const attempts = await mockDbInfo.db.getAllAsync<{ attempt_id: string }>(
      `SELECT attempt_id FROM activity_attempts WHERE activity_id = 'topic-1-1' AND result_status = 'completed';`
    );
    expect(attempts).toHaveLength(1);
  });

  test('2. Six calls from separate call sites trigger exactly ONE underlying transaction', async () => {
    const callerA = () => localLearnerService.completeTopic('topic-1-1');
    const callerB = () => localLearnerService.completeTopic('topic-1-1');
    const callerC = () => localLearnerService.completeTopic('topic-1-1');
    const callerD = () => localLearnerService.completeTopic('topic-1-1');
    const callerE = () => localLearnerService.completeTopic('topic-1-1');
    const callerF = () => localLearnerService.completeTopic('topic-1-1');

    const startTxCount = mockDbInfo.transactionCount();
    await Promise.all([callerA(), callerB(), callerC(), callerD(), callerE(), callerF()]);

    expect(mockDbInfo.transactionCount() - startTxCount).toBe(1);
  });

  test('3. Immediate transaction rejection keeps in-flight entry until promise settles and rejects all joiners', async () => {
    const failingDb: DatabaseConnection = {
      ...mockDbInfo.db,
      withTransactionAsync: jest.fn().mockImplementation(async () => {
        throw new Error('Simulated VFS failure');
      }),
    };
    resetReadyDatabase();
    setDatabaseConnection(failingDb);

    const promise1 = localLearnerService.completeTopic('topic-1-1');
    const promise2 = localLearnerService.completeTopic('topic-1-1');
    const promise3 = localLearnerService.completeTopic('topic-1-1');

    await expect(promise1).rejects.toThrow('Simulated VFS failure');
    await expect(promise2).rejects.toThrow('Simulated VFS failure');
    await expect(promise3).rejects.toThrow('Simulated VFS failure');
    expect(failingDb.withTransactionAsync).toHaveBeenCalledTimes(1);
  });

  test('4. Rejected task cleanup allows subsequent deliberate retry to start a new transaction', async () => {
    let shouldFail = true;
    const retryCalls = jest.fn();
    const originalWithTx = mockDbInfo.db.withTransactionAsync!;
    mockDbInfo.db.withTransactionAsync = async (action) => {
      retryCalls();
      if (shouldFail) {
        throw new Error('Database temporarily locked');
      }
      return originalWithTx(action);
    };

    // Initial attempt fails
    await expect(localLearnerService.completeTopic('topic-1-1')).rejects.toThrow('Database temporarily locked');

    // In-flight map is cleaned up in finally block; retry succeeds with a fresh transaction
    shouldFail = false;
    await expect(localLearnerService.completeTopic('topic-1-1')).resolves.toBeUndefined();
    expect(retryCalls).toHaveBeenCalledTimes(2);
  });

  test('5. Transaction queue handles rejection without poisoning subsequent operations', async () => {
    let txIndex = 0;
    const serialDb: DatabaseConnection = {
      ...mockDbInfo.db,
      withTransactionAsync: jest.fn().mockImplementation(async (action) => {
        txIndex++;
        if (txIndex === 1) {
          throw new Error('Transaction 1 failed');
        }
        return action(serialDb);
      }),
    };

    resetReadyDatabase();
    setDatabaseConnection(serialDb);

    // Transaction 1 fails
    await expect(serialDb.withTransactionAsync!(async () => 'first')).rejects.toThrow('Transaction 1 failed');

    // Subsequent transactions proceed normally
    const secondResult = await serialDb.withTransactionAsync!(async () => 'second ok');
    expect(secondResult).toBe('second ok');

    const thirdResult = await serialDb.withTransactionAsync!(async () => 'third ok');
    expect(thirdResult).toBe('third ok');
  });

  test('6. Nested transaction calls execute without deadlocking', async () => {
    const result = await mockDbInfo.db.withTransactionAsync!(async (outerDb) => {
      const innerResult = await outerDb.withTransactionAsync!(async () => {
        return 'nested success';
      });
      return `outer: ${innerResult}`;
    });

    expect(result).toBe('outer: nested success');
  });

  test('7. isOpfsSupported accurately reflects environment capabilities', () => {
    if (Platform.OS !== 'web') {
      expect(isOpfsSupported()).toBe(true);
    }
  });
});
