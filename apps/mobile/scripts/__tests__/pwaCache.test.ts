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
  write('assets/assets/audio/baya/baya-a-ba.test.m4a', 'recorded pronunciation');
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
  expect(worker).toContain('/assets/assets/audio/baya/baya-a-ba.test.m4a');
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
  expect(integrity['/']).toBeUndefined();
});

it.each([true, false])('validates shell bundle references while allowing hosting comments (current=%s)', async current => {
  generate();
  const worker = readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
  const listeners: Record<string, (event: any) => void> = {};
  const skipWaiting = jest.fn(), remove = jest.fn();
  const html = `<!-- hosting comment --><script src="/_expo/static/js/web/${current ? 'entry-test' : 'stale'}.js"></script>`;
  runInNewContext(worker, {
    self: { location: { origin: 'https://baya.test' }, addEventListener: (n: string, f: any) => { listeners[n] = f; }, skipWaiting },
    caches: { open: async () => ({ put: jest.fn() }), delete: remove },
    Request: class { constructor(public url: string) {} }, URL, Set,
    fetch: async () => ({ ok: true, headers: { get: () => 'text/html' }, clone: () => ({ text: async () => html }) }),
  });
  let work: Promise<void> | undefined;
  listeners.install({ waitUntil: (p: Promise<void>) => { work = p; } });
  if (current) { await work; expect(skipWaiting).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled(); }
  else { await expect(work).rejects.toThrow('expected application build'); expect(skipWaiting).not.toHaveBeenCalled(); expect(remove).toHaveBeenCalled(); }
});

it('exports font URLs without scoped-package paths and preserves development URLs', () => {
  const plugin = require('../export-font-path.cjs');
  const font = { type: 'ttf', name: 'Ionicons', httpServerLocation: '/assets?export_path=assets/../node_modules/@expo/vector-icons/Fonts' };
  expect(plugin(font).httpServerLocation).toBe('/assets?export_path=/assets/fonts');
  const dev = { ...font, httpServerLocation: '/assets/node_modules/@expo/vector-icons/Fonts' };
  expect(plugin(dev)).toBe(dev);
  const image = { ...font, type: 'png' };
  expect(plugin(image)).toBe(image);
});

it('serves the installed shell without fetching or caching a newer deployment', async () => {
  generate();
  const listeners: Record<string, (event: any) => void> = {};
  const shell = { ok: true, version: 'installed' };
  const fetch = jest.fn(), put = jest.fn();
  runInNewContext(readFileSync(path.join(outputRoot, 'sw.js'), 'utf8'), {
    self: { location: { origin: 'https://baya.test' }, addEventListener: (n: string, f: any) => { listeners[n] = f; } },
    caches: { open: async () => ({ match: async () => shell, put }) }, URL, Set, fetch,
  });
  let response: any;
  listeners.fetch({ request: { url: 'https://baya.test/learner/activities/topic-1-1', method: 'GET', mode: 'navigate', headers: { has: () => false } }, respondWith: (p: any) => { response = p; } });
  expect(await response).toBe(shell);
  expect(fetch).not.toHaveBeenCalled(); expect(put).not.toHaveBeenCalled();
});

it.each([true, false])('reports readiness only when every required asset exists (complete=%s)', async complete => {
  generate();
  const listeners: Record<string, (event: any) => void> = {};
  const postMessage = jest.fn();
  runInNewContext(readFileSync(path.join(outputRoot, 'sw.js'), 'utf8'), {
    self: { addEventListener: (n: string, f: any) => { listeners[n] = f; } }, Set,
    caches: { open: async () => ({ match: async (url: string) => !complete && url === activeModel.modelUrl ? undefined : { ok: true } }) },
  });
  let work: any;
  listeners.message({ data: { type: 'BAYA_OFFLINE_STATUS' }, ports: [{ postMessage }], waitUntil: (p: any) => { work = p; } });
  await work;
  expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ ready: complete, missing: complete ? [] : [activeModel.modelUrl] }));
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

it.each([['bytes=1-3', 206, [1, 2, 3]], ['bytes=-2', 206, [4, 5]], ['bytes=4-', 206, [4, 5]], ['bytes=8-', 416, []], ['bytes=0-1,3-4', 416, []]])(
  'serves cached pronunciation ranges offline (%s)', async (range, status, bytes) => {
    generate();
    const listeners: Record<string, (event: any) => void> = {};
    const fetch = jest.fn();
    class ResponseStub { constructor(public body: ArrayBuffer | null, public options: any) {} }
    runInNewContext(readFileSync(path.join(outputRoot, 'sw.js'), 'utf8'), {
      self: { location: { origin: 'https://baya.test' }, addEventListener: (name: string, listener: any) => { listeners[name] = listener; } },
      caches: { open: async () => ({ match: async () => ({ arrayBuffer: async () => new Uint8Array([0,1,2,3,4,5]).buffer }) }) },
      URL, Set, Response: ResponseStub, fetch,
    });
    let response: Promise<ResponseStub> | undefined;
    listeners.fetch({ request: { method: 'GET', destination: 'audio', url: 'https://baya.test/assets/assets/audio/baya/baya-a-ba.test.m4a', headers: { get: () => range } }, respondWith: (p: any) => { response = p; } });
    const result = (await response)!;
    expect(result.options.status).toBe(status);
    expect(result.body ? [...new Uint8Array(result.body)] : []).toEqual(bytes);
    expect(fetch).not.toHaveBeenCalled();
  },
);
