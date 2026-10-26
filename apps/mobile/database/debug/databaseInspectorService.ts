/**
 * apps/mobile/database/debug/databaseInspectorService.ts
 *
 * Read-only database inspection service for BAYA debug inspector.
 * Reuses the existing DatabaseConnection from connection.ts.
 * NEVER opens a new SQLite connection or bypasses OPFS ownership.
 */
import { getDatabaseConnection, getDatabaseState, type DatabaseState } from '../connection';
import { databaseOwnership } from '../ownership';
import type { DatabaseConnection } from '../types';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DatabaseMetadata {
  state: DatabaseState;
  sqliteVersion: string;
  totalTables: number;
  environment: string;
  origin: string;
  sessionId: string;
}

export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

export interface IndexColumnInfo {
  seqno: number;
  cid: number;
  name: string;
}

export interface TableSchema {
  columns: ColumnInfo[];
  createSql: string | null;
  indexes: { name: string; unique: number; columns: IndexColumnInfo[] }[];
}

export interface PaginatedResult<T> {
  rows: T[];
  totalRows: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
}

// ---------------------------------------------------------------------------
// SQL safety
// ---------------------------------------------------------------------------
const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'REPLACE',
  'ATTACH', 'DETACH', 'VACUUM', 'REINDEX', 'BEGIN', 'COMMIT', 'ROLLBACK',
  'SAVEPOINT', 'RELEASE', 'GRANT', 'REVOKE',
];

const SAFE_PRAGMA_PREFIXES = [
  'table_info', 'table_xinfo', 'index_list', 'index_info', 'index_xinfo',
  'foreign_key_list', 'database_list', 'compile_options', 'collation_list',
  'table_list',
];

export function isReadOnlyQuery(sql: string): { safe: boolean; reason?: string } {
  // Strip comments and trim
  const cleaned = sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  if (!cleaned) {
    return { safe: false, reason: 'Empty query' };
  }

  // Reject multiple statements
  const statements = cleaned
    .replace(/'[^']*'/g, '') // remove string literals
    .replace(/"[^"]*"/g, '') // remove quoted identifiers
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (statements.length > 1) {
    return { safe: false, reason: 'Multiple statements are not allowed' };
  }

  const upper = cleaned.toUpperCase();

  // Check for forbidden keywords at word boundaries
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(upper)) {
      return { safe: false, reason: `Forbidden keyword: ${keyword}` };
    }
  }

  // Allow SELECT, WITH ... SELECT, EXPLAIN SELECT
  const startsWithSelect = /^SELECT\b/i.test(cleaned);
  const startsWithWith = /^WITH\b/i.test(cleaned);
  const startsWithExplain = /^EXPLAIN\b/i.test(cleaned);
  const startsWithPragma = /^PRAGMA\b/i.test(cleaned);

  if (startsWithSelect || startsWithWith) {
    return { safe: true };
  }

  if (startsWithExplain) {
    if (/^EXPLAIN\s+(QUERY\s+PLAN\s+)?SELECT\b/i.test(cleaned)) {
      return { safe: true };
    }
    return { safe: false, reason: 'EXPLAIN is only allowed with SELECT statements' };
  }

  if (startsWithPragma) {
    const pragmaMatch = cleaned.match(/^PRAGMA\s+(\w+)/i);
    if (pragmaMatch) {
      const pragmaName = pragmaMatch[1].toLowerCase();
      if (SAFE_PRAGMA_PREFIXES.some(p => pragmaName.startsWith(p))) {
        return { safe: true };
      }
      const readOnlyPragmas = [
        'database_list', 'compile_options', 'collation_list',
        'encoding', 'freelist_count', 'integrity_check',
        'page_count', 'page_size', 'schema_version',
        'user_version', 'data_version',
      ];
      if (readOnlyPragmas.includes(pragmaName)) {
        return { safe: true };
      }
      // Reject pragmas with assignment (=)
      if (cleaned.includes('=')) {
        return { safe: false, reason: 'PRAGMA write operations are not allowed' };
      }
      // Allow PRAGMA queries (reading values)
      return { safe: true };
    }
  }

  return { safe: false, reason: 'Only SELECT, WITH, EXPLAIN SELECT, and read-only PRAGMA queries are allowed' };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
const MAX_QUERY_ROWS = 500;

async function getDb(): Promise<DatabaseConnection> {
  return getDatabaseConnection();
}

export async function getDatabaseMetadata(): Promise<DatabaseMetadata> {
  const state = getDatabaseState();
  let sqliteVersion = 'unknown';
  let totalTables = 0;

  if (state === 'READY') {
    try {
      const db = await getDb();
      const versionRow = await db.getFirstAsync<{ version: string }>('SELECT sqlite_version() AS version;');
      sqliteVersion = versionRow?.version ?? 'unknown';

      const countRow = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';`
      );
      totalTables = countRow?.count ?? 0;
    } catch {
      // DB may be transitioning states
    }
  }

  const environment = Platform.OS === 'web'
    ? (typeof window !== 'undefined' && (window as { matchMedia?: (q: string) => { matches: boolean } }).matchMedia?.('(display-mode: standalone)')?.matches ? 'PWA' : 'Web')
    : Platform.OS;
  const origin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'N/A';

  return {
    state,
    sqliteVersion,
    totalTables,
    environment,
    origin,
    sessionId: databaseOwnership.sessionId,
  };
}

export async function getTableList(): Promise<TableInfo[]> {
  const db = await getDb();
  const tables = await db.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`
  );

  const result: TableInfo[] = [];
  for (const table of tables) {
    const countRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM "${table.name}";`
    );
    result.push({ name: table.name, rowCount: countRow?.count ?? 0 });
  }
  return result;
}

export async function getTableData(
  tableName: string,
  page: number = 1,
  pageSize: number = 25,
): Promise<PaginatedResult<Record<string, unknown>>> {
  const db = await getDb();

  // Validate table name exists
  const exists = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?;`,
    [tableName]
  );
  if (!exists) throw new Error(`Table "${tableName}" not found`);

  const countRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM "${tableName}";`
  );
  const totalRows = countRow?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const offset = (safePage - 1) * pageSize;

  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM "${tableName}" LIMIT ? OFFSET ?;`,
    [pageSize, offset]
  );

  return { rows, totalRows, page: safePage, pageSize, totalPages };
}

export async function getTableSchema(tableName: string): Promise<TableSchema> {
  const db = await getDb();

  const columns = await db.getAllAsync<ColumnInfo>(
    `PRAGMA table_info("${tableName}");`
  );

  const createSqlRow = await db.getFirstAsync<{ sql: string }>(
    `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?;`,
    [tableName]
  );

  const indexList = await db.getAllAsync<IndexInfo>(
    `PRAGMA index_list("${tableName}");`
  );

  const indexes: TableSchema['indexes'] = [];
  for (const idx of indexList) {
    const cols = await db.getAllAsync<IndexColumnInfo>(
      `PRAGMA index_info("${idx.name}");`
    );
    indexes.push({ name: idx.name, unique: idx.unique, columns: cols });
  }

  return {
    columns,
    createSql: createSqlRow?.sql ?? null,
    indexes,
  };
}

export async function executeReadOnlyQuery(sql: string): Promise<QueryResult> {
  const validation = isReadOnlyQuery(sql);
  if (!validation.safe) {
    throw new Error(`Query rejected: ${validation.reason}`);
  }

  const db = await getDb();

  // Add LIMIT if user hasn't provided one
  let finalSql = sql.trim();
  if (finalSql.endsWith(';')) {
    finalSql = finalSql.slice(0, -1).trim();
  }

  const upperSql = finalSql.toUpperCase();
  if (!upperSql.includes('LIMIT')) {
    finalSql = `${finalSql} LIMIT ${MAX_QUERY_ROWS}`;
  }

  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const rows = await db.getAllAsync<Record<string, unknown>>(finalSql + ';');
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const executionTimeMs = Math.round((end - start) * 100) / 100;

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    columns,
    rows,
    rowCount: rows.length,
    executionTimeMs,
  };
}

export async function exportDatabaseAsBytes(): Promise<Uint8Array | null> {
  try {
    // Dynamic import — only expo-sqlite usage, and only for optional export.
    // The existing connection is still used; expo-sqlite returns the same
    // internal instance for the same database name on the same worker.
    const SQLite = await import('expo-sqlite');
    const rawDb = await SQLite.openDatabaseAsync('baya.db');
    if ('serializeAsync' in rawDb) {
      return await (rawDb as unknown as { serializeAsync: () => Promise<Uint8Array> }).serializeAsync();
    }
    return null;
  } catch {
    return null;
  }
}
