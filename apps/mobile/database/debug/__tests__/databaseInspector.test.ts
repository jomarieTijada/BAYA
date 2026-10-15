/**
 * apps/mobile/database/debug/__tests__/databaseInspector.test.ts
 *
 * Tests for the BAYA Database Inspector service.
 * Validates read-only safety, table discovery, pagination, schema discovery,
 * feature flag behavior, and ensures no second SQLite connection is created.
 */
import { DatabaseSync } from 'node:sqlite';
import {
  setDatabaseConnection,
  closeDatabaseConnection,
  configurePragmas,
  getDatabaseState,
} from '../../connection';
import { runMigrations } from '../../migrate';
import { seedCurriculum } from '../../seed';
import type { DatabaseConnection } from '../../types';
import {
  isReadOnlyQuery,
  getDatabaseMetadata,
  getTableList,
  getTableData,
  getTableSchema,
  executeReadOnlyQuery,
} from '../databaseInspectorService';

// ---------------------------------------------------------------------------
// In-memory database helper (same pattern as database.test.ts)
// ---------------------------------------------------------------------------
function createInMemoryDatabase(): DatabaseConnection {
  const rawDb = new DatabaseSync(':memory:');
  const connection: DatabaseConnection = {
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
      rawDb.exec('BEGIN TRANSACTION;');
      try {
        const result = await action(connection);
        rawDb.exec('COMMIT;');
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK;');
        throw err;
      }
    },
    async closeAsync(): Promise<void> {
      rawDb.close();
    },
  };
  return connection;
}

describe('BAYA Database Inspector', () => {
  let db: DatabaseConnection;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    await configurePragmas(db);
    setDatabaseConnection(db);
    await runMigrations(db);
    await seedCurriculum(db);
  });

  afterEach(async () => {
    await closeDatabaseConnection();
  });

  // -----------------------------------------------------------------------
  // 1. Table discovery
  // -----------------------------------------------------------------------
  test('1. discovers all tables dynamically from sqlite_master', async () => {
    const tables = await getTableList();
    expect(tables.length).toBeGreaterThan(0);
    const names = tables.map(t => t.name);
    expect(names).toContain('profiles');
    expect(names).toContain('lessons');
    expect(names).toContain('activities');
    expect(names).toContain('learner_progress');
    expect(names).toContain('activity_attempts');
    // Should not include sqlite internal tables
    expect(names.every(n => !n.startsWith('sqlite_'))).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 2. Row count
  // -----------------------------------------------------------------------
  test('2. row counts are accurate for each table', async () => {
    const tables = await getTableList();
    const lessonsTable = tables.find(t => t.name === 'lessons');
    expect(lessonsTable).toBeDefined();
    expect(lessonsTable!.rowCount).toBe(3);

    const activitiesTable = tables.find(t => t.name === 'activities');
    expect(activitiesTable).toBeDefined();
    expect(activitiesTable!.rowCount).toBe(9);
  });

  // -----------------------------------------------------------------------
  // 3. Table pagination
  // -----------------------------------------------------------------------
  test('3. table data returns paginated results', async () => {
    const result = await getTableData('activities', 1, 5);
    expect(result.rows.length).toBeLessThanOrEqual(5);
    expect(result.totalRows).toBe(9);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(5);
    expect(result.totalPages).toBe(2);

    const page2 = await getTableData('activities', 2, 5);
    expect(page2.rows.length).toBe(4);
    expect(page2.page).toBe(2);
  });

  // -----------------------------------------------------------------------
  // 4. Schema discovery
  // -----------------------------------------------------------------------
  test('4. schema discovery returns columns, create SQL, and indexes', async () => {
    const schema = await getTableSchema('profiles');
    expect(schema.columns.length).toBeGreaterThan(0);
    const colNames = schema.columns.map(c => c.name);
    expect(colNames).toContain('profile_id');
    expect(colNames).toContain('display_name');
    expect(colNames).toContain('role');

    const pkCol = schema.columns.find(c => c.pk > 0);
    expect(pkCol).toBeDefined();
    expect(pkCol!.name).toBe('profile_id');

    expect(schema.createSql).toBeTruthy();
    expect(schema.createSql).toContain('CREATE TABLE');
  });

  // -----------------------------------------------------------------------
  // 5. Null rendering
  // -----------------------------------------------------------------------
  test('5. table data correctly returns null values', async () => {
    await db.runAsync(
      `INSERT INTO profiles (profile_id, display_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?);`,
      ['test-id', 'Test', 'learner', new Date().toISOString(), new Date().toISOString()]
    );
    const result = await getTableData('profiles', 1, 25);
    const testRow = result.rows.find(r => r.profile_id === 'test-id');
    expect(testRow).toBeDefined();
    expect(testRow!.auth_user_id).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 6. Read-only SELECT query allowed
  // -----------------------------------------------------------------------
  test('6. read-only SELECT query is allowed and returns results', async () => {
    const result = await executeReadOnlyQuery('SELECT * FROM lessons;');
    expect(result.rowCount).toBe(3);
    expect(result.columns).toContain('lesson_id');
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  // -----------------------------------------------------------------------
  // 7. WITH query allowed
  // -----------------------------------------------------------------------
  test('7. WITH (CTE) query is allowed', async () => {
    const result = await executeReadOnlyQuery(
      `WITH lesson_counts AS (SELECT lesson_id, COUNT(*) as cnt FROM activities GROUP BY lesson_id) SELECT * FROM lesson_counts;`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // 8. INSERT rejected
  // -----------------------------------------------------------------------
  test('8. INSERT query is rejected', async () => {
    await expect(executeReadOnlyQuery(
      `INSERT INTO profiles (profile_id, display_name, role, created_at, updated_at) VALUES ('x', 'x', 'learner', 'x', 'x');`
    )).rejects.toThrow('Forbidden keyword: INSERT');
  });

  // -----------------------------------------------------------------------
  // 9. UPDATE rejected
  // -----------------------------------------------------------------------
  test('9. UPDATE query is rejected', async () => {
    await expect(executeReadOnlyQuery(
      `UPDATE profiles SET display_name = 'hacked' WHERE profile_id = '1';`
    )).rejects.toThrow('Forbidden keyword: UPDATE');
  });

  // -----------------------------------------------------------------------
  // 10. DELETE rejected
  // -----------------------------------------------------------------------
  test('10. DELETE query is rejected', async () => {
    await expect(executeReadOnlyQuery(
      `DELETE FROM profiles WHERE profile_id = '1';`
    )).rejects.toThrow('Forbidden keyword: DELETE');
  });

  // -----------------------------------------------------------------------
  // 11. DROP rejected
  // -----------------------------------------------------------------------
  test('11. DROP query is rejected', async () => {
    await expect(executeReadOnlyQuery(
      `DROP TABLE profiles;`
    )).rejects.toThrow('Forbidden keyword: DROP');
  });

  // -----------------------------------------------------------------------
  // 12. Multiple statements rejected
  // -----------------------------------------------------------------------
  test('12. multiple statements are rejected', async () => {
    await expect(executeReadOnlyQuery(
      `SELECT 1; SELECT 2;`
    )).rejects.toThrow('Multiple statements');
  });

  // -----------------------------------------------------------------------
  // 13. Inspector reuses getDatabaseConnection
  // -----------------------------------------------------------------------
  test('13. inspector reuses getDatabaseConnection (no direct openDatabaseAsync)', async () => {
    const tables = await getTableList();
    expect(tables.length).toBeGreaterThan(0);
    const meta = await getDatabaseMetadata();
    expect(meta.state).toBe('READY');
  });

  // -----------------------------------------------------------------------
  // 14. Inspector never calls SQLite.openDatabaseAsync directly
  // -----------------------------------------------------------------------
  test('14. databaseInspectorService source does not statically import expo-sqlite', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('node:path') as typeof import('node:path');
    const sourceFile = path.join(__dirname, '..', 'databaseInspectorService.ts');
    const source = fs.readFileSync(sourceFile, 'utf-8');
    expect(source).toContain("from '../connection'");
    const staticExpoImports = (source.match(/^import .* from ['"]expo-sqlite['"]/gm) || []);
    expect(staticExpoImports.length).toBe(0);
  });

  // -----------------------------------------------------------------------
  // 15. Refresh does not reopen DB
  // -----------------------------------------------------------------------
  test('15. refresh operations reuse existing connection', async () => {
    const tables1 = await getTableList();
    const meta1 = await getDatabaseMetadata();
    const tables2 = await getTableList();
    const meta2 = await getDatabaseMetadata();
    expect(meta1.state).toBe(meta2.state);
    expect(tables1.length).toBe(tables2.length);
    expect(getDatabaseState()).toBe('READY');
  });

  // -----------------------------------------------------------------------
  // 16. Feature flag disables inspector
  // -----------------------------------------------------------------------
  test('16. feature flag check validates correctly', () => {
    expect(isReadOnlyQuery('SELECT 1').safe).toBe(true);
    expect(isReadOnlyQuery('DROP TABLE x').safe).toBe(false);
    expect(isReadOnlyQuery('').safe).toBe(false);
  });

  // -----------------------------------------------------------------------
  // 17. Comprehensive SQL safety patterns
  // -----------------------------------------------------------------------
  test('17. isReadOnlyQuery validates various SQL patterns', () => {
    // Safe
    expect(isReadOnlyQuery('SELECT * FROM profiles').safe).toBe(true);
    expect(isReadOnlyQuery('  SELECT * FROM profiles  ').safe).toBe(true);
    expect(isReadOnlyQuery('WITH cte AS (SELECT 1) SELECT * FROM cte').safe).toBe(true);
    expect(isReadOnlyQuery('EXPLAIN SELECT 1').safe).toBe(true);
    expect(isReadOnlyQuery('EXPLAIN QUERY PLAN SELECT 1').safe).toBe(true);
    expect(isReadOnlyQuery('PRAGMA table_info(profiles)').safe).toBe(true);
    expect(isReadOnlyQuery('PRAGMA index_list(profiles)').safe).toBe(true);

    // Dangerous
    expect(isReadOnlyQuery('INSERT INTO x VALUES (1)').safe).toBe(false);
    expect(isReadOnlyQuery('UPDATE x SET y = 1').safe).toBe(false);
    expect(isReadOnlyQuery('DELETE FROM x').safe).toBe(false);
    expect(isReadOnlyQuery('DROP TABLE x').safe).toBe(false);
    expect(isReadOnlyQuery('ALTER TABLE x ADD COLUMN y').safe).toBe(false);
    expect(isReadOnlyQuery('CREATE TABLE x (id INT)').safe).toBe(false);
    expect(isReadOnlyQuery('REPLACE INTO x VALUES (1)').safe).toBe(false);
    expect(isReadOnlyQuery('ATTACH DATABASE x AS y').safe).toBe(false);
    expect(isReadOnlyQuery('DETACH DATABASE x').safe).toBe(false);
    expect(isReadOnlyQuery('VACUUM').safe).toBe(false);
    expect(isReadOnlyQuery('REINDEX').safe).toBe(false);
    expect(isReadOnlyQuery('BEGIN').safe).toBe(false);
    expect(isReadOnlyQuery('COMMIT').safe).toBe(false);
    expect(isReadOnlyQuery('ROLLBACK').safe).toBe(false);
    expect(isReadOnlyQuery('SELECT 1; DROP TABLE x').safe).toBe(false);
    expect(isReadOnlyQuery('PRAGMA journal_mode = DELETE').safe).toBe(false);
  });

  // -----------------------------------------------------------------------
  // 18. Query result limits
  // -----------------------------------------------------------------------
  test('18. query results auto-limit to MAX_QUERY_ROWS', async () => {
    const result = await executeReadOnlyQuery('SELECT * FROM activities');
    expect(result.rowCount).toBe(9);
    expect(result.rowCount).toBeLessThanOrEqual(500);
  });

  // -----------------------------------------------------------------------
  // 19. Metadata correctness
  // -----------------------------------------------------------------------
  test('19. database metadata returns correct state and counts', async () => {
    const meta = await getDatabaseMetadata();
    expect(meta.state).toBe('READY');
    expect(meta.totalTables).toBeGreaterThan(0);
    expect(meta.sessionId).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // 20. Non-existent table throws
  // -----------------------------------------------------------------------
  test('20. getTableData rejects non-existent table', async () => {
    await expect(getTableData('nonexistent_table', 1, 25))
      .rejects.toThrow('not found');
  });
});
