// The patched Expo web module is an internal entry point with no public export.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SQLiteModule = require('expo-sqlite/web/SQLiteModule').default as {
  releaseWorkerAsync(): Promise<void>;
};

/** Expo's web module keeps a worker and VFS pool alive after db.closeAsync(). */
export async function releaseSqliteWorker(): Promise<void> {
  await SQLiteModule.releaseWorkerAsync();
}
