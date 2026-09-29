import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const generator = path.resolve(__dirname, '../generate-pwa-service-worker.mjs');
const model = 'Baybayin_EfficientNetB0_BiLSTM_1.1.onnx';
let outputRoot: string;

function write(relativePath: string, content: string) {
  const destination = path.join(outputRoot, relativePath);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, content);
}

function generate(...args: string[]) {
  return execFileSync(process.execPath, [generator, ...args], {
    encoding: 'utf8',
    env: { ...process.env, BAYA_WEB_OUTPUT_DIR: outputRoot },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

beforeEach(() => {
  outputRoot = mkdtempSync(path.join(tmpdir(), 'baya-pwa-test-'));
  write('index.html', '<script src="/_expo/static/js/web/entry-test.js" defer></script>');
  write('manifest.json', '{}');
  write('favicon.ico', 'icon');
  write('icon-192.png', 'icon');
  write('icon-512.png', 'icon');
  write(`models/baya/${model}`, 'v1.1 model bytes');
  write('ort/ort-wasm-runtime.min.js', 'runtime');
  write('ort/ort-wasm-simd-threaded.mjs', 'loader');
  write('ort/ort-wasm-simd-threaded.wasm', 'wasm');
  write('_expo/static/js/web/entry-test.js', 'bundle v1');
  write('_expo/static/js/web/worker-test.js', 'worker');
  write('assets/reference.png', 'reference');
  write('assets/media/videos/lesson.mp4', 'large video');
});

afterEach(() => {
  const resolved = realpathSync(outputRoot);
  const allowed = realpathSync(tmpdir()) + path.sep;
  if (!resolved.startsWith(allowed) || !path.basename(resolved).startsWith('baya-pwa-test-')) {
    throw new Error('Refusing to remove a PWA test directory outside the named temporary target.');
  }
  rmSync(resolved, { recursive: true, force: true });
});

it('precaches the v1.1 model, ORT WASM, and app shell without the old model or video', () => {
  generate();
  const worker = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  expect(worker).toContain(`/models/baya/${model}`);
  expect(worker).toContain('/ort/ort-wasm-runtime.min.js');
  expect(worker).toContain('/ort/ort-wasm-simd-threaded.mjs');
  expect(worker).toContain('/ort/ort-wasm-simd-threaded.wasm');
  expect(worker).toContain('/_expo/static/js/web/entry-test.js');
  expect(worker).toContain('/_expo/static/js/web/worker-test.js');
  expect(worker).toContain('/assets/reference.png');
  expect(worker).not.toContain('BiLSTM_1.0.onnx');
  expect(worker).not.toContain('lesson.mp4');
  expect(generate('--check')).toContain('Verified baya-pwa-');
});

it('changes the cache version when an exported bundle changes', () => {
  generate();
  const before = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  write('_expo/static/js/web/entry-test.js', 'bundle v2');
  expect(() => generate('--check')).toThrow();
  generate();
  const after = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  const version = (source: string) => source.match(/const CACHE_NAME = "(baya-pwa-[a-f0-9]+)"/)?.[1];
  expect(version(before)).toBeTruthy();
  expect(version(after)).not.toBe(version(before));
});

it('keeps recognition free of a native ONNX module', () => {
  const packageJson = readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8');
  expect(packageJson).toContain('"onnxruntime-web"');
  expect(packageJson).not.toContain('onnxruntime-android');
  expect(existsSync(path.resolve(__dirname, '../../modules/baya-native/expo-module.config.json'))).toBe(false);
});
