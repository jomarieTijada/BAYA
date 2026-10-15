import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { BAYA_MODEL_CONFIG as activeModel } from '../../ml/bayaModelConfig';

const generator = path.resolve(__dirname, '../generate-pwa-service-worker.mjs');
const model = activeModel.model;
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
  write(`models/baya/${model}`, 'active model bytes');
  write(activeModel.labelsUrl.slice(1), 'production labels');
  write(activeModel.contractUrl.slice(1), 'production contract');
  write('models/baya/unselected.onnx', 'unselected bytes');
  write('ort/ort-wasm-runtime.min.js', 'runtime');
  write('ort/ort-wasm-simd-threaded.mjs', 'loader');
  write('ort/ort-wasm-simd-threaded.wasm', 'wasm');
  write('_expo/static/js/web/entry-test.js', 'bundle v1');
  write('_expo/static/js/web/worker-test.js', 'worker');
  write('assets/reference.png', 'reference');
  write('assets/assets/media/videos/baybayin-song.test.mp4', 'large video');
});

afterEach(() => {
  const resolved = realpathSync(outputRoot);
  const allowed = realpathSync(tmpdir()) + path.sep;
  if (!resolved.startsWith(allowed) || !path.basename(resolved).startsWith('baya-pwa-test-')) {
    throw new Error('Refusing to remove a PWA test directory outside the named temporary target.');
  }
  rmSync(resolved, { recursive: true, force: true });
});

it('exports and precaches only the active model, ORT WASM, and app shell', () => {
  generate();
  const worker = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  expect(worker).toContain(`/models/baya/${model}`);
  expect(worker).toContain('/ort/ort-wasm-runtime.min.js');
  expect(worker).toContain('/ort/ort-wasm-simd-threaded.mjs');
  expect(worker).toContain('/ort/ort-wasm-simd-threaded.wasm');
  expect(worker).toContain('/_expo/static/js/web/entry-test.js');
  expect(worker).toContain('/_expo/static/js/web/worker-test.js');
  expect(worker).toContain('/assets/reference.png');
  expect(worker).not.toContain('unselected.onnx');
  expect(existsSync(path.join(outputRoot, 'models/baya/unselected.onnx'))).toBe(false);
  expect(worker).not.toContain('lesson.mp4');
  expect(worker).not.toContain('baybayin-song.test.mp4');
  expect(generate('--check')).toContain('Verified baya-pwa-');
});

it('fails export when the lesson MP4 is absent', () => {
  const video = path.join(outputRoot, 'assets/assets/media/videos/baybayin-song.test.mp4');
  rmSync(video);
  expect(() => generate()).toThrow();
});

it('leaves video and Range requests to the browser without a cache or SPA response', () => {
  generate();
  const worker = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  const listeners: Record<string, (event: any) => void> = {};
  const fetch = jest.fn();
  const open = jest.fn();
  runInNewContext(worker, {
    self: {
      location: { origin: 'https://baya.test' },
      addEventListener: (name: string, listener: (event: any) => void) => {
        listeners[name] = listener;
      },
    },
    URL,
    Set,
    fetch,
    caches: { open },
  });
  for (const request of [
    { url: 'https://baya.test/assets/assets/media/videos/baybayin-song.test.mp4', destination: 'video', headers: { has: () => false } },
    { url: 'https://baya.test/stream/lesson', destination: 'video', headers: { has: () => false } },
    { url: 'https://baya.test/assets/assets/media/videos/missing.mp4', destination: '', headers: { has: () => false } },
    { url: 'https://baya.test/assets/file.bin', destination: '', headers: { has: (name: string) => name === 'range' } },
  ]) {
    const respondWith = jest.fn();
    listeners.fetch({ request: { method: 'GET', ...request }, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
  }
  expect(fetch).not.toHaveBeenCalled();
  expect(open).not.toHaveBeenCalled();
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
