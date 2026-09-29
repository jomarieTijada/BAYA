import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidatePaths = [
  path.resolve(appDir, 'node_modules/expo-sqlite/web/worker.ts'),
  path.resolve(appDir, '../../node_modules/expo-sqlite/web/worker.ts'),
];

const targetPattern = /async function maybeInitAsync\(\): Promise<\{[\s\S]*?return \{ sqlite3: _sqlite3, vfs: _vfs, vfsMemory: _vfsMemory \};\s*\}/m;

const replacement = `async function maybeInitAsync(): Promise<{
  sqlite3: SQLiteAPI;
  vfs: AccessHandlePoolVFS;
  vfsMemory: MemoryVFS;
}> {
  if (!_sqlite3 || _vfs == null || _vfsMemory == null) {
    try {
      const module = await WaSQLiteFactory({
        locateFile: () => wasmModule,
      });
      const sqlite3Instance = SQLite.Factory(module) as SQLiteAPI;
      if (!sqlite3Instance) {
        throw new Error('Failed to initialize wa-sqlite');
      }

      const vfsInstance = await AccessHandlePoolVFS.create(VFS_NAME_PERSISTENT, module);
      if (!vfsInstance) {
        throw new Error('Failed to initialize AccessHandlePoolVFS');
      }
      sqlite3Instance.vfs_register(vfsInstance, true);

      const memInstance = await MemoryVFS.create(VFS_NAME_MEMORY, module);
      if (!memInstance) {
        throw new Error('Failed to initialize MemoryVFS');
      }
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
  if (_vfs == null || _vfsMemory == null) {
    throw new Error('Invalid VFS state');
  }
  return { sqlite3: _sqlite3, vfs: _vfs, vfsMemory: _vfsMemory };
}`;

let patchedCount = 0;
for (const targetPath of candidatePaths) {
  if (!existsSync(targetPath)) continue;
  const content = await readFile(targetPath, 'utf8');
  if (content.includes('sqlite3Instance')) {
    // Already patched
    patchedCount++;
    continue;
  }
  if (!targetPattern.test(content)) {
    console.warn(`[patch-expo-sqlite-web] Pattern not matched in ${targetPath}`);
    continue;
  }
  const patched = content.replace(targetPattern, replacement);
  await writeFile(targetPath, patched, 'utf8');
  console.info(`[patch-expo-sqlite-web] Successfully patched ${targetPath}`);
  patchedCount++;
}

if (patchedCount === 0) {
  console.warn('[patch-expo-sqlite-web] No worker.ts files found to patch.');
}
