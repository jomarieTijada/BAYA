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
  write('models/baya/old-version/old.tflite', 'stale version');
  for (const file of activeModel.runtimeFiles) write(activeModel.runtimeBaseUrl.slice(1) + file, 'runtime bytes');
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

it('exports and precaches only the active model, LiteRT WASM, and app shell', () => {
  generate();
  const worker = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  expect(worker).toContain(`/models/baya/${model}`);
  expect(worker).toContain(activeModel.runtimeBaseUrl + 'litert_wasm_internal.js');
  expect(worker).toContain(activeModel.runtimeBaseUrl + 'litert_wasm_internal.wasm');
  expect(worker).toContain(activeModel.runtimeBaseUrl + 'litert_wasm_compat_internal.wasm');
  expect(worker).not.toContain('litert_wasm_threaded_internal');
  expect(worker).not.toContain('litert_wasm_jspi_internal');
  expect(worker).toContain('/_expo/static/js/web/entry-test.js');
  expect(worker).toContain('/_expo/static/js/web/worker-test.js');
  expect(worker).toContain('/assets/reference.png');
  expect(worker).not.toContain('unselected.onnx');
  expect(existsSync(path.join(outputRoot, 'models/baya/unselected.onnx'))).toBe(false);
  expect(existsSync(path.join(outputRoot, 'models/baya/old-version/old.tflite'))).toBe(false);
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

it('uses LiteRT without legacy or native inference dependencies', () => {
  const packageJson = readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8');
  expect(packageJson).toContain('"@litertjs/core"');
  expect(packageJson).not.toContain('onnxruntime');
  expect(existsSync(path.resolve(__dirname, '../../modules/baya-native/expo-module.config.json'))).toBe(false);
});

it('pins offline fetches to each exported asset checksum', () => {
  generate();
  const worker = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  const integrity = JSON.parse(worker.match(/const ASSET_INTEGRITY = (.+);/)![1]);
  const crypto = require('node:crypto');
  const bytes = readFileSync(path.join(outputRoot, activeModel.modelUrl));
  expect(integrity[activeModel.modelUrl]).toBe('sha256-' + crypto.createHash('sha256').update(bytes).digest('base64'));
  expect(worker).toContain('integrity: ASSET_INTEGRITY[url]');
  expect(Object.keys(integrity)).toContain(activeModel.runtimeBaseUrl + 'litert_wasm_internal.wasm');
});

it('removes obsolete BAYA caches on activation and preserves unrelated caches', async () => {
  generate();
  const worker = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  const current = worker.match(/const CACHE_NAME = "([^"]+)"/)![1];
  const listeners: Record<string, (event: { waitUntil: (work: Promise<void>) => void }) => void> = {};
  const remove = jest.fn(async () => true), claim = jest.fn(async () => undefined);
  runInNewContext(worker, { self: { addEventListener: (name: string, listener: typeof listeners[string]) => { listeners[name] = listener; }, clients: { claim } },
    caches: { keys: async () => ['baya-pwa-old-onnx', current, 'unrelated'], delete: remove }, Set });
  let work: Promise<void> | undefined;
  listeners.activate({ waitUntil: value => { work = value; } }); await work;
  expect(remove).toHaveBeenCalledTimes(1); expect(remove).toHaveBeenCalledWith('baya-pwa-old-onnx'); expect(claim).toHaveBeenCalled();
});

it('deletes a partial install cache on download failure without activating it', async () => {
  generate();
  const worker = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  const listeners: Record<string, (event: { waitUntil: (work: Promise<void>) => void }) => void> = {};
  const remove = jest.fn(async () => true), skipWaiting = jest.fn();
  runInNewContext(worker, { self: { addEventListener: (name: string, listener: typeof listeners[string]) => { listeners[name] = listener; }, skipWaiting },
    caches: { open: async () => ({ put: jest.fn() }), delete: remove },
    Request: class { constructor(public url: string) {} }, fetch: async () => ({ ok: false, status: 503 }), Set });
  let work: Promise<void> | undefined;
  listeners.install({ waitUntil: value => { work = value; } });
  await expect(work).rejects.toThrow('PWA precache failed');
  expect(remove).toHaveBeenCalledTimes(1); expect(skipWaiting).not.toHaveBeenCalled();
});
