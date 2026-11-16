import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const packageRoot = path.resolve(path.dirname(require.resolve('@litertjs/core')), '..');
const pkg = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
const config = JSON.parse(await readFile(path.join(appRoot, 'ml/bayaActiveModel.json'), 'utf8'));
if (pkg.version !== config.runtimeVersion) throw new Error('LiteRT version differs from the active model configuration.');
const destination = path.join(appRoot, 'public', config.runtimeBaseUrl);
await mkdir(destination, { recursive: true });
// The app uses default non-threaded, non-JSPI initialization. Keep both SIMD variants.
for (const file of config.runtimeFiles) await copyFile(path.join(packageRoot, 'wasm', file), path.join(destination, file));
// Remove only the known generated variants left by earlier full-directory copies.
for (const variant of ['jspi', 'threaded']) {
  for (const extension of ['js', 'wasm']) {
    await rm(path.join(destination, `litert_wasm_${variant}_internal.${extension}`), { force: true });
  }
}
console.log(`[BAYA ML] Copied local LiteRT ${pkg.version} runtime assets.`);
