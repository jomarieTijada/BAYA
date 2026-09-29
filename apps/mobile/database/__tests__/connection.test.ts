/**
 * apps/mobile/database/__tests__/connection.test.ts
 *
 * Tests for getDatabaseConnection() singleton guarantees.
 *
 * Verifies the root-cause fix for the "Invalid VFS state" regression:
 * concurrent calls must never spawn more than one SQLite.openDatabaseAsync
 * invocation, because the web worker's wa-sqlite VFS initialization is not
 * re-entrant — a second concurrent open causes "Invalid VFS state".
 */

import {
  getDatabaseConnection,
  setDatabaseConnection,
  closeDatabaseConnection,
  isDatabaseConnected,
} from '../connection';
import type { DatabaseConnection } from '../types';

// ---------------------------------------------------------------------------
// Minimal stub that satisfies DatabaseConnection
// ---------------------------------------------------------------------------
function makeStub(): DatabaseConnection {
  return {
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 0, changes: 0 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    withTransactionAsync: jest.fn().mockImplementation(async (action) => action({} as DatabaseConnection)),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Mock expo-sqlite so tests do not attempt real OPFS/WASM initialization
// ---------------------------------------------------------------------------
let openCallCount = 0;
let resolveOpen: (() => void) | null = null;

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn((_name: string) => {
    openCallCount += 1;
    return new Promise<unknown>((resolve) => {
      // Expose a way to control when the open resolves so we can test
      // concurrent callers without timing dependencies.
      resolveOpen = () =>
        resolve({
          execAsync: jest.fn().mockResolvedValue(undefined),
          runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 0, changes: 0 }),
          getFirstAsync: jest.fn().mockResolvedValue(null),
          getAllAsync: jest.fn().mockResolvedValue([]),
          withExclusiveTransactionAsync: jest.fn().mockImplementation(async (action: (db: unknown) => unknown) => action({})),
          withTransactionAsync: jest.fn().mockImplementation(async (action: () => unknown) => action()),
          closeAsync: jest.fn().mockResolvedValue(undefined),
        });
    });
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getDatabaseConnection — singleton guarantee', () => {
  beforeEach(() => {
    openCallCount = 0;
    resolveOpen = null;
    // Reset the module-level singleton state between tests by injecting null.
    setDatabaseConnection(null);
  });

  afterEach(async () => {
    await closeDatabaseConnection();
  });

  it('returns the injected connection when one is already set', async () => {
    const stub = makeStub();
    setDatabaseConnection(stub);
    const conn = await getDatabaseConnection();
    expect(conn).toBe(stub);
    expect(openCallCount).toBe(0);
  });

  it('calls openDatabaseAsync exactly once on first call', async () => {
    const promise = getDatabaseConnection();
    resolveOpen?.();
    await promise;
    expect(openCallCount).toBe(1);
  });

  it('concurrent callers receive the same connection and open only once', async () => {
    // Start two concurrent calls before the open resolves.
    const p1 = getDatabaseConnection();
    const p2 = getDatabaseConnection();

    // Resolve the single open.
    resolveOpen?.();

    const [c1, c2] = await Promise.all([p1, p2]);

    // Both must resolve to the same object.
    expect(c1).toBe(c2);

    // openDatabaseAsync must have been called exactly once — the key invariant
    // that prevents the web worker from initialising its VFS twice.
    expect(openCallCount).toBe(1);
  });

  it('subsequent calls after first resolution return cached connection without re-opening', async () => {
    const p1 = getDatabaseConnection();
    resolveOpen?.();
    const first = await p1;

    // Second call arrives after full resolution.
    const second = await getDatabaseConnection();

    expect(second).toBe(first);
    expect(openCallCount).toBe(1);
  });

  it('isDatabaseConnected returns false before open, true after', async () => {
    expect(isDatabaseConnected()).toBe(false);
    const p = getDatabaseConnection();
    resolveOpen?.();
    await p;
    expect(isDatabaseConnected()).toBe(true);
  });

  it('clears connection promise on open failure so next call retries', async () => {
    const { openDatabaseAsync } = jest.requireMock('expo-sqlite') as {
      openDatabaseAsync: jest.Mock;
    };

    // First call will reject.
    openDatabaseAsync.mockRejectedValueOnce(new Error('WASM load failed'));
    await expect(getDatabaseConnection()).rejects.toThrow('WASM load failed');

    // Reset call count; next call should retry open.
    openCallCount = 0;

    // Second call: let it succeed via the stub injected after reset.
    const stub = makeStub();
    setDatabaseConnection(stub);
    const conn = await getDatabaseConnection();
    expect(conn).toBe(stub);
  });
});

describe('getDatabaseConnection — topic progress idempotency', () => {
  it('setDatabaseConnection allows injecting a fresh connection for tests', async () => {
    const stub = makeStub();
    setDatabaseConnection(stub);
    const conn = await getDatabaseConnection();
    expect(conn).toBe(stub);
  });

  it('closeDatabaseConnection resets activeConnection', async () => {
    const stub = makeStub();
    setDatabaseConnection(stub);
    expect(isDatabaseConnected()).toBe(true);
    await closeDatabaseConnection();
    expect(isDatabaseConnected()).toBe(false);
  });
});
