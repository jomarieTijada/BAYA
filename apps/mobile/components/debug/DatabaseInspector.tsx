/**
 * apps/mobile/components/debug/DatabaseInspector.tsx
 *
 * BAYA SQLite Database Inspector — a read-only diagnostic tool.
 * Hidden behind the EXPO_PUBLIC_ENABLE_DB_INSPECTOR feature flag.
 * Reuses the existing database connection through databaseInspectorService.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  getDatabaseMetadata,
  getTableList,
  getTableData,
  getTableSchema,
  executeReadOnlyQuery,
  exportDatabaseAsBytes,
  type DatabaseMetadata,
  type TableInfo,
  type PaginatedResult,
  type TableSchema,
  type QueryResult,
} from '../../database/debug/databaseInspectorService';

// ---------------------------------------------------------------------------
// Palette (isolated — no learner design bleed)
// ---------------------------------------------------------------------------
const C = {
  bg: '#1e1e2e',
  surface: '#282840',
  surfaceHover: '#32324e',
  border: '#3e3e5e',
  text: '#cdd6f4',
  textDim: '#7f849c',
  accent: '#89b4fa',
  green: '#a6e3a1',
  red: '#f38ba8',
  yellow: '#f9e2af',
  orange: '#fab387',
  headerBg: '#181825',
  buttonBg: '#45475a',
  buttonText: '#cdd6f4',
  inputBg: '#313244',
  null: '#6c7086',
};

// ---------------------------------------------------------------------------
// Shared tiny components
// ---------------------------------------------------------------------------
function Badge({ children, color = C.accent }: { children: React.ReactNode; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '66' }]}>
      <Text style={[styles.badgeText, { color }]}>{String(children)}</Text>
    </View>
  );
}

function Btn({ label, onPress, color = C.accent, disabled = false, small = false }: {
  label: string; onPress: () => void; color?: string; disabled?: boolean; small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { borderColor: color + '88', opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.btnLabel, small && styles.btnLabelSmall, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
type Tab = 'data' | 'schema' | 'sql';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DatabaseInspector() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // State
  const [metadata, setMetadata] = useState<DatabaseMetadata | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [tableData, setTableData] = useState<PaginatedResult<Record<string, unknown>> | null>(null);
  const [tableSchema, setTableSchema] = useState<TableSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filterText, setFilterText] = useState('');

  // SQL console
  const [sqlInput, setSqlInput] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  // ---
  const loadMetadata = useCallback(async () => {
    try {
      const m = await getDatabaseMetadata();
      setMetadata(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      const t = await getTableList();
      setTables(t);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTableData = useCallback(async (name: string, p: number, ps: number) => {
    try {
      setLoading(true);
      const data = await getTableData(name, p, ps);
      setTableData(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSchema = useCallback(async (name: string) => {
    try {
      const s = await getTableSchema(name);
      setTableSchema(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // Initial load
  useEffect(() => {
    let active = true;
    void Promise.all([getDatabaseMetadata(), getTableList()]).then(([nextMetadata, nextTables]) => {
      if (!active) return;
      setMetadata(nextMetadata);
      setTables(nextTables);
      setError(null);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Selection changes originate in user actions; reset related state together.
  const handleSelectTable = (name: string, size = pageSize) => {
    setSelectedTable(name);
    setPageSize(size);
    setPage(1);
    setFilterText('');
    void loadTableData(name, 1, size);
    void loadSchema(name);
    setActiveTab('data');
  };

  // Refresh
  const handleRefresh = useCallback(async () => {
    await loadMetadata();
    await loadTables();
    if (selectedTable) {
      await loadTableData(selectedTable, page, pageSize);
      await loadSchema(selectedTable);
    }
  }, [loadMetadata, loadTables, selectedTable, page, pageSize, loadTableData, loadSchema]);

  // Pagination
  const handlePageChange = useCallback((newPage: number) => {
    if (!selectedTable) return;
    setPage(newPage);
    void loadTableData(selectedTable, newPage, pageSize);
  }, [selectedTable, pageSize, loadTableData]);

  // SQL execution
  const handleRunQuery = useCallback(async () => {
    if (!sqlInput.trim()) return;
    setQueryRunning(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const result = await executeReadOnlyQuery(sqlInput);
      setQueryResult(result);
    } catch (e) {
      setQueryError(e instanceof Error ? e.message : String(e));
    } finally {
      setQueryRunning(false);
    }
  }, [sqlInput]);

  // Export DB
  const handleExportDb = useCallback(async () => {
    setExporting(true);
    try {
      const bytes = await exportDatabaseAsBytes();
      if (!bytes) {
        setError('Export not supported on this platform/database.');
        return;
      }
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const filename = `baya-database-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.db`;
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }, []);

  // Client-side filter, shared by the display and CSV export.
  const filteredRows = useMemo(() => {
    if (!tableData) return [];
    if (!filterText.trim()) return tableData.rows;
    const lower = filterText.toLowerCase();
    return tableData.rows.filter(row =>
      Object.values(row).some(v =>
        v !== null && v !== undefined && String(v).toLowerCase().includes(lower)
      )
    );
  }, [tableData, filterText]);

  // Export CSV
  const handleExportCsv = useCallback(() => {
    if (!tableData || !selectedTable) return;
    const rows = filteredRows;
    if (rows.length === 0) return;
    const cols = Object.keys(rows[0]);
    const csvHeader = cols.map(c => `"${c}"`).join(',');
    const csvRows = rows.map(row =>
      cols.map(c => {
        const val = row[c];
        if (val === null || val === undefined) return '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tableData, selectedTable, filteredRows]);

  // ---
  // Render helpers
  // ---
  const renderCellValue = (value: unknown): string => {
    if (value === null) return 'NULL';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') {
      try {
        const json = JSON.stringify(value);
        return json.length > 120 ? json.slice(0, 117) + '\u2026' : json;
      } catch {
        return '[Object]';
      }
    }
    const str = String(value);
    return str.length > 200 ? str.slice(0, 197) + '\u2026' : str;
  };

  const renderDataTable = (rows: Record<string, unknown>[], columns?: string[]) => {
    if (rows.length === 0) return <Text style={styles.dimText}>No rows</Text>;
    const cols = columns ?? Object.keys(rows[0]);
    return (
      <ScrollView horizontal style={styles.tableScroll}>
        <View>
          {/* Header */}
          <View style={styles.dataRow}>
            {cols.map(col => (
              <View key={col} style={styles.headerCell}>
                <Text style={styles.headerCellText} numberOfLines={1}>{col}</Text>
              </View>
            ))}
          </View>
          {/* Rows */}
          {rows.map((row, i) => (
            <View key={i} style={[styles.dataRow, i % 2 === 0 && styles.dataRowAlt]}>
              {cols.map(col => {
                const val = row[col];
                const isNull = val === null || val === undefined;
                return (
                  <View key={col} style={styles.dataCell}>
                    <Text
                      style={[styles.dataCellText, isNull && styles.nullText]}
                      numberOfLines={2}
                    >
                      {renderCellValue(val)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderMetadata = () => {
    if (!metadata) return <ActivityIndicator color={C.accent} />;
    const stateColor = metadata.state === 'READY' ? C.green : metadata.state === 'ERROR' ? C.red : C.yellow;
    return (
      <View style={styles.metadataSection}>
        <Text style={styles.title}>BAYA SQLite Database Inspector</Text>
        <View style={styles.metadataGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Badge color={stateColor}>{metadata.state}</Badge>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>SQLite</Text>
            <Text style={styles.metaValue}>{metadata.sqliteVersion}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Tables</Text>
            <Text style={styles.metaValue}>{metadata.totalTables}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Environment</Text>
            <Text style={styles.metaValue}>{metadata.environment}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Origin</Text>
            <Text style={[styles.metaValue, { fontSize: 11 }]}>{metadata.origin}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Session</Text>
            <Text style={[styles.metaValue, { fontSize: 10 }]}>{metadata.sessionId.slice(0, 8)}{'\u2026'}</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <Btn label={'\u27f3 Refresh'} onPress={handleRefresh} />
          {Platform.OS === 'web' && <Btn label={'\u2b07 Export DB'} onPress={handleExportDb} color={C.green} disabled={exporting} />}
        </View>
      </View>
    );
  };

  const renderTableList = () => (
    <View style={[styles.tableList, !isMobile && styles.tableListDesktop]}>
      <Text style={styles.sectionTitle}>Tables</Text>
      {tables.length === 0 && !loading && <Text style={styles.dimText}>No tables found</Text>}
      {tables.map(t => (
        <Pressable
          key={t.name}
          onPress={() => handleSelectTable(t.name)}
          style={({ pressed }) => [
            styles.tableItem,
            selectedTable === t.name && styles.tableItemActive,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.tableName, selectedTable === t.name && styles.tableNameActive]} numberOfLines={1}>
            {t.name}
          </Text>
          <Text style={styles.tableCount}>{t.rowCount}</Text>
        </Pressable>
      ))}
    </View>
  );

  const renderTabs = () => {
    if (!selectedTable) return null;
    const tabs: { key: Tab; label: string }[] = [
      { key: 'data', label: 'Data' },
      { key: 'schema', label: 'Schema' },
      { key: 'sql', label: 'SQL Query' },
    ];
    return (
      <View style={styles.tabRow}>
        {tabs.map(t => (
          <Pressable
            key={t.key}
            onPress={() => setActiveTab(t.key)}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderDataTab = () => {
    if (!selectedTable || !tableData) return null;
    return (
      <View style={styles.tabContent}>
        <View style={styles.dataToolbar}>
          <Text style={styles.dataInfo}>
            Showing {filteredRows.length > 0 ? `${(tableData.page - 1) * tableData.pageSize + 1}\u2013${Math.min(tableData.page * tableData.pageSize, tableData.totalRows)}` : '0'} of {tableData.totalRows} rows
          </Text>
          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder={'Filter loaded rows\u2026'}
              placeholderTextColor={C.textDim}
              value={filterText}
              onChangeText={setFilterText}
            />
            {Platform.OS === 'web' && (
              <Btn label="CSV" onPress={handleExportCsv} small color={C.orange} />
            )}
          </View>
        </View>
        {loading ? <ActivityIndicator color={C.accent} /> : renderDataTable(filteredRows)}
        {/* Pagination */}
        <View style={styles.pagination}>
          <View style={styles.pageSizeRow}>
            <Text style={styles.dimText}>Rows/page:</Text>
            {[25, 50, 100].map(ps => (
              <Pressable
                key={ps}
                onPress={() => { if (selectedTable) handleSelectTable(selectedTable, ps); }}
                style={[styles.pageSizeBtn, pageSize === ps && styles.pageSizeBtnActive]}
              >
                <Text style={[styles.pageSizeBtnText, pageSize === ps && { color: C.accent }]}>{ps}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.pageNav}>
            <Btn label={'\u2190 Prev'} onPress={() => handlePageChange(page - 1)} disabled={page <= 1} small />
            <Text style={styles.pageText}>Page {tableData.page} of {tableData.totalPages}</Text>
            <Btn label={'Next \u2192'} onPress={() => handlePageChange(page + 1)} disabled={page >= tableData.totalPages} small />
          </View>
        </View>
      </View>
    );
  };

  const renderSchemaTab = () => {
    if (!tableSchema) return null;
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Columns</Text>
        <ScrollView horizontal style={styles.tableScroll}>
          <View>
            <View style={styles.dataRow}>
              {['Column', 'Type', 'Not Null', 'Default', 'PK'].map(h => (
                <View key={h} style={styles.headerCell}>
                  <Text style={styles.headerCellText}>{h}</Text>
                </View>
              ))}
            </View>
            {tableSchema.columns.map((col, i) => (
              <View key={col.name} style={[styles.dataRow, i % 2 === 0 && styles.dataRowAlt]}>
                <View style={styles.dataCell}><Text style={styles.dataCellText}>{col.name}</Text></View>
                <View style={styles.dataCell}><Text style={styles.dataCellText}>{col.type || '\u2014'}</Text></View>
                <View style={styles.dataCell}><Text style={styles.dataCellText}>{col.notnull ? 'Yes' : 'No'}</Text></View>
                <View style={styles.dataCell}><Text style={[styles.dataCellText, !col.dflt_value && styles.nullText]}>{col.dflt_value ?? '\u2014'}</Text></View>
                <View style={styles.dataCell}><Text style={styles.dataCellText}>{col.pk ? '\u2713' : ''}</Text></View>
              </View>
            ))}
          </View>
        </ScrollView>

        {tableSchema.createSql && (
          <View style={styles.sqlBlock}>
            <Text style={styles.sectionTitle}>CREATE SQL</Text>
            <ScrollView horizontal>
              <Text style={styles.codeText} selectable>{tableSchema.createSql}</Text>
            </ScrollView>
          </View>
        )}

        {tableSchema.indexes.length > 0 && (
          <View style={styles.indexSection}>
            <Text style={styles.sectionTitle}>Indexes</Text>
            {tableSchema.indexes.map(idx => (
              <View key={idx.name} style={styles.indexItem}>
                <Text style={styles.indexName}>{idx.name}</Text>
                <Text style={styles.dimText}>
                  {idx.unique ? 'UNIQUE ' : ''}({idx.columns.map(c => c.name).join(', ')})
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSqlTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>SQL Query (Read-Only)</Text>
      <Text style={styles.dimText}>SELECT, WITH, EXPLAIN SELECT, and read-only PRAGMA only.</Text>
      <TextInput
        style={styles.sqlInput}
        multiline
        numberOfLines={4}
        placeholder="SELECT * FROM profiles LIMIT 10;"
        placeholderTextColor={C.textDim}
        value={sqlInput}
        onChangeText={setSqlInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.actionRow}>
        <Btn label={queryRunning ? 'Running\u2026' : '\u25b6 Run Query'} onPress={handleRunQuery} disabled={queryRunning || !sqlInput.trim()} />
        {queryResult && (
          <Btn
            label="Clear"
            onPress={() => { setQueryResult(null); setQueryError(null); }}
            color={C.textDim}
            small
          />
        )}
      </View>
      {queryError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{'\u2715'} {queryError}</Text>
        </View>
      )}
      {queryResult && (
        <View>
          <Text style={styles.dataInfo}>
            Rows returned: {queryResult.rowCount} {'\u00b7'} Execution time: {queryResult.executionTimeMs}ms
          </Text>
          {renderDataTable(queryResult.rows, queryResult.columns)}
        </View>
      )}
    </View>
  );

  // ---
  // Main layout
  // ---
  return (
    <View style={styles.container}>
      {renderMetadata()}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{'\u2715'} {error}</Text>
          <Btn label="Dismiss" onPress={() => setError(null)} small color={C.red} />
        </View>
      )}
      <View style={[styles.mainLayout, !isMobile && styles.mainLayoutDesktop]}>
        {renderTableList()}
        <View style={styles.contentPanel}>
          {selectedTable ? (
            <>
              <Text style={styles.selectedTableTitle}>Selected: {selectedTable}</Text>
              {renderTabs()}
              <ScrollView style={styles.contentScroll}>
                {activeTab === 'data' && renderDataTab()}
                {activeTab === 'schema' && renderSchemaTab()}
                {activeTab === 'sql' && renderSqlTab()}
              </ScrollView>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.dimText}>Select a table from the list to inspect it.</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 12 },
  title: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8, fontFamily: 'monospace' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: C.accent, marginBottom: 6, marginTop: 8 },
  dimText: { color: C.textDim, fontSize: 12 },

  // Metadata
  metadataSection: { marginBottom: 12, padding: 12, backgroundColor: C.headerBg, borderRadius: 8 },
  metadataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  metaItem: { minWidth: 100 },
  metaLabel: { fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 13, color: C.text, fontFamily: 'monospace' },

  // Badge
  badge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },

  // Buttons
  btn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  btnSmall: { paddingHorizontal: 8, paddingVertical: 3 },
  btnLabel: { fontSize: 13, fontWeight: '600' },
  btnLabelSmall: { fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },

  // Table list
  tableList: { marginBottom: 12 },
  tableListDesktop: { width: 240, minWidth: 200, borderRightWidth: 1, borderRightColor: C.border, paddingRight: 12, marginRight: 12, marginBottom: 0 },
  tableItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4 },
  tableItemActive: { backgroundColor: C.accent + '22' },
  tableName: { fontSize: 13, color: C.text, fontFamily: 'monospace', flex: 1 },
  tableNameActive: { color: C.accent, fontWeight: '600' },
  tableCount: { fontSize: 12, color: C.textDim, fontFamily: 'monospace', marginLeft: 8 },

  // Main layout
  mainLayout: { flex: 1 },
  mainLayoutDesktop: { flexDirection: 'row' },
  contentPanel: { flex: 1 },
  contentScroll: { flex: 1 },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 2, marginBottom: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  tabActive: { backgroundColor: C.accent + '22' },
  tabText: { fontSize: 13, color: C.textDim },
  tabTextActive: { color: C.accent, fontWeight: '600' },
  selectedTableTitle: { fontSize: 15, color: C.text, fontWeight: '600', fontFamily: 'monospace', marginBottom: 6 },

  // Data tab
  tabContent: { flex: 1 },
  dataToolbar: { marginBottom: 8 },
  dataInfo: { fontSize: 12, color: C.textDim, marginBottom: 4 },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterInput: {
    flex: 1, minWidth: 150, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, color: C.text, fontSize: 12, fontFamily: 'monospace',
  },
  tableScroll: { marginBottom: 8 },
  dataRow: { flexDirection: 'row' },
  dataRowAlt: { backgroundColor: C.surface + '44' },
  headerCell: {
    minWidth: 120, maxWidth: 220, paddingHorizontal: 8, paddingVertical: 6,
    backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerCellText: { fontSize: 12, fontWeight: '700', color: C.accent, fontFamily: 'monospace' },
  dataCell: { minWidth: 120, maxWidth: 220, paddingHorizontal: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border + '44' },
  dataCellText: { fontSize: 12, color: C.text, fontFamily: 'monospace' },
  nullText: { color: C.null, fontStyle: 'italic' },

  // Pagination
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingVertical: 8 },
  pageSizeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageSizeBtn: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  pageSizeBtnActive: { borderColor: C.accent },
  pageSizeBtnText: { fontSize: 11, color: C.textDim, fontFamily: 'monospace' },
  pageNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageText: { fontSize: 12, color: C.textDim, fontFamily: 'monospace' },

  // Schema tab
  sqlBlock: { marginTop: 12, padding: 8, backgroundColor: C.headerBg, borderRadius: 6 },
  codeText: { fontSize: 11, color: C.green, fontFamily: 'monospace', lineHeight: 16 },
  indexSection: { marginTop: 12 },
  indexItem: { paddingVertical: 4, paddingHorizontal: 8 },
  indexName: { fontSize: 12, color: C.text, fontFamily: 'monospace', fontWeight: '600' },

  // SQL tab
  sqlInput: {
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border, borderRadius: 6,
    padding: 10, color: C.text, fontSize: 13, fontFamily: 'monospace', minHeight: 80,
    marginVertical: 8, textAlignVertical: 'top',
  },

  // Error
  errorBox: {
    backgroundColor: C.red + '18', borderWidth: 1, borderColor: C.red + '44',
    borderRadius: 6, padding: 10, marginBottom: 8, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  errorText: { color: C.red, fontSize: 12, flex: 1 },

  // Empty
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
