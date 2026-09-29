import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(appRoot, 'public', 'ort');
const require = createRequire(import.meta.url);
const runtimeFiles = [
  ['onnxruntime-web/wasm', 'ort-wasm-runtime.min.js'],
  'onnxruntime-web/ort-wasm-simd-threaded.mjs',
  'onnxruntime-web/ort-wasm-simd-threaded.wasm',
];

await mkdir(destination, { recursive: true });
for (const entry of runtimeFiles) {
  const [packagePath, targetName] = Array.isArray(entry) ? entry : [entry, undefined];
  const source = require.resolve(packagePath);
  const filename = targetName ?? path.basename(source);
  await copyFile(source, path.join(destination, filename));
  process.stdout.write(`[BAYA ML] Copied ${filename} to public/ort/\n`);
}
