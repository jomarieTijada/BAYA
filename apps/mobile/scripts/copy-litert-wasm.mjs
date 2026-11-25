import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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
for (const file of config.runtimeFiles) {
  const source = path.join(packageRoot, 'wasm', file);
  const target = path.join(destination, file);
  if (!file.endsWith('.js')) {
    await copyFile(source, target);
    continue;
  }
  // LiteRT writes native INFO messages to stderr. Expo treats console.error as
  // an application error; route explicitly informational lines at their level.
  // Scope this to the generated runtime, never the application's global console.
  const original = await readFile(source, 'utf8');
  const stderr = 'var err = console.error.bind(console);';
  if (original.split(stderr).length !== 2) throw new Error(`Unexpected LiteRT stderr binding in ${file}; review logging before upgrading.`);
  await writeFile(target, original.replace(stderr, `// BAYA LiteRT severity routing
var err = function(message) {
  if (typeof message === "string" && /^INFO:/.test(message)) console.info(message);
  else if (typeof message === "string" && /^WARNING:/.test(message)) console.warn(message);
  else console.error(message);
};
// End BAYA LiteRT severity routing`));
}
// Remove only the known generated variants left by earlier full-directory copies.
for (const variant of ['jspi', 'threaded']) {
  for (const extension of ['js', 'wasm']) {
    await rm(path.join(destination, `litert_wasm_${variant}_internal.${extension}`), { force: true });
  }
}
console.log(`[BAYA ML] Copied local LiteRT ${pkg.version} runtime assets.`);
