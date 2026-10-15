import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageDir = [
  path.resolve(appDir, 'node_modules/expo-sqlite/web'),
  path.resolve(appDir, '../../node_modules/expo-sqlite/web'),
].find((candidate) => existsSync(path.join(candidate, 'worker.ts')));
if (!packageDir) throw new Error('[patch-expo-sqlite-web] Expo SQLite web worker not found');

async function patch(relativePath, marker, replacements) {
  const target = path.join(packageDir, relativePath);
  let source = await readFile(target, 'utf8');
  if (source.includes(marker)) return;
  for (const [before, after] of replacements) {
    if (!source.includes(before)) throw new Error(`[patch-expo-sqlite-web] Missing pattern in ${relativePath}`);
    source = source.replace(before, after);
  }
  await writeFile(target, source, 'utf8');
  console.info(`[patch-expo-sqlite-web] Patched ${relativePath}`);
}

await patch('wa-sqlite/AccessHandlePoolVFS.js', 'BAYA_PARTIAL_VFS_CLEANUP', [
  [
    `    await vfs.isReady();
    return vfs;`,
    `    // BAYA_PARTIAL_VFS_CLEANUP: a failed create may already own OPFS handles.
    try {
      await vfs.isReady();
      return vfs;
    } catch (error) {
      await vfs.close();
      throw error;
    }`,
  ],
  [
    `    await Promise.all(
      files.map(async ([name, handle]) => {`,
    `    const results = await Promise.allSettled(
      files.map(async ([name, handle]) => {`,
  ],
  [
    `      })
    );
  }

  #releaseAccessHandles()`,
    `      })
    );
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) throw failure.reason;
  }

  #releaseAccessHandles()`,
  ],
]);

await patch('wa-sqlite/AccessHandlePoolVFS.js', 'BAYA_CLOSE_ALL_HANDLES', [
  [
    `  #releaseAccessHandles() {
    for (const accessHandle of this.#mapAccessHandleToName.keys()) {
      accessHandle.close();
    }
    this.#mapAccessHandleToName.clear();
    this.#mapPathToAccessHandle.clear();
    this.#availableAccessHandles.clear();
  }`,
    `  #releaseAccessHandles() {
    // BAYA_CLOSE_ALL_HANDLES: one failed close must not strand the rest.
    let firstError;
    for (const accessHandle of this.#mapAccessHandleToName.keys()) {
      try { accessHandle.close(); } catch (error) { firstError ??= error; }
    }
    this.#mapAccessHandleToName.clear();
    this.#mapPathToAccessHandle.clear();
    this.#availableAccessHandles.clear();
    if (firstError) throw firstError;
  }`,
  ],
]);

await patch('web.types.ts', 'BAYA_WORKER_DISPOSE_MESSAGE', [
  [`  close: CloseMessage;`, `  close: CloseMessage;
  dispose: DisposeMessage; // BAYA_WORKER_DISPOSE_MESSAGE`],
  [`type CloseMessage = BaseWorkerMessage & {`, `type DisposeMessage = BaseWorkerMessage & { type: 'dispose'; data: Record<string, never> };

type CloseMessage = BaseWorkerMessage & {`],
  [`  close: void;`, `  close: void;
  dispose: void;`],
]);

// Expo 57 initializes the VFS through module globals. Recoverability requires
// local variables so a failed initialization cannot leave a half-ready cache.
const workerPath = path.join(packageDir, 'worker.ts');
let workerSource = await readFile(workerPath, 'utf8');
if (!workerSource.includes('const sqlite3Instance')) {
  const originalInit = /async function maybeInitAsync\(\): Promise<\{[\s\S]*?return \{ sqlite3: _sqlite3, vfs: _vfs, vfsMemory: _vfsMemory \};\s*\}/m;
  if (!originalInit.test(workerSource)) throw new Error('[patch-expo-sqlite-web] Cannot find worker initialization');
  workerSource = workerSource.replace(originalInit, `async function maybeInitAsync(): Promise<{
  sqlite3: SQLiteAPI;
  vfs: AccessHandlePoolVFS;
  vfsMemory: MemoryVFS;
}> {
  if (!_sqlite3 || _vfs == null || _vfsMemory == null) {
    try {
      const module = await WaSQLiteFactory({ locateFile: () => wasmModule });
      const sqlite3Instance = SQLite.Factory(module) as SQLiteAPI;
      if (!sqlite3Instance) throw new Error('Failed to initialize wa-sqlite');
      const vfsInstance = await AccessHandlePoolVFS.create(VFS_NAME_PERSISTENT, module);
      if (!vfsInstance) throw new Error('Failed to initialize AccessHandlePoolVFS');
      sqlite3Instance.vfs_register(vfsInstance, true);
      const memInstance = await MemoryVFS.create(VFS_NAME_MEMORY, module);
      if (!memInstance) throw new Error('Failed to initialize MemoryVFS');
      sqlite3Instance.vfs_register(memInstance, false);
      _sqlite3 = sqlite3Instance;
      _vfs = vfsInstance;
      _vfsMemory = memInstance;
    } catch (err) {
      _sqlite3 = null;
      _vfs = null;
      _vfsMemory = null;
      throw err;
    }
  }
  if (_vfs == null || _vfsMemory == null) throw new Error('Invalid VFS state');
  return { sqlite3: _sqlite3, vfs: _vfs, vfsMemory: _vfsMemory };
}`);
  await writeFile(workerPath, workerSource, 'utf8');
}

await patch('worker.ts', 'BAYA_WORKER_DISPOSE', [
  [`    case 'close': {
      await closeDatabase(data.nativeDatabaseId);
      break;
    }`,
   `    case 'close': {
      await closeDatabase(data.nativeDatabaseId);
      break;
    }

    case 'dispose': {
      // BAYA_WORKER_DISPOSE: close pooled OPFS handles before the page releases its Web Lock.
      if (databaseIdMap.size !== 0) throw new Error('Cannot dispose an open SQLite database');
      if (_vfs) await _vfs.close();
      _vfs = null;
      _vfsMemory = null;
      _sqlite3 = null;
      statementIdMap.clear();
      sessionIdMap.clear();
      break;
    }`],
  [`    try {
      const module = await WaSQLiteFactory({`, `    let vfsInstance: AccessHandlePoolVFS | null = null;
    try {
      const module = await WaSQLiteFactory({`],
  [`      const vfsInstance = await AccessHandlePoolVFS.create(VFS_NAME_PERSISTENT, module);`,
   `      vfsInstance = await AccessHandlePoolVFS.create(VFS_NAME_PERSISTENT, module);`],
  [`    } catch (err) {
      _sqlite3 = null;`,
   `    } catch (err) {
      if (vfsInstance) await vfsInstance.close();
      _sqlite3 = null;`],
]);

await patch('SQLiteModule.ts', 'BAYA_RELEASE_WORKER', [
  [`  readonly defaultDatabaseDirectory = '.';`,
   `  // BAYA_RELEASE_WORKER: the module worker otherwise retains AccessHandlePoolVFS handles.
  async releaseWorkerAsync(): Promise<void> {
    if (!worker) return;
    const currentWorker = worker;
    await invokeWorkerAsync(currentWorker, 'dispose', {});
    currentWorker.terminate();
    worker = null;
  }

  readonly defaultDatabaseDirectory = '.';`],
]);

await patch('SQLiteModule.ts', 'BAYA_WORKER_LOG', [
  [`  if (!worker) {
    worker = new Worker`, `  if (!worker) {
    console.info('[BAYA SQLite Worker] created'); // BAYA_WORKER_LOG
    worker = new Worker`],
  [`    await invokeWorkerAsync(currentWorker, 'dispose', {});
    currentWorker.terminate();`,
   `    await invokeWorkerAsync(currentWorker, 'dispose', {});
    console.info('[BAYA SQLite Worker] VFS disposed');
    currentWorker.terminate();`],
]);
