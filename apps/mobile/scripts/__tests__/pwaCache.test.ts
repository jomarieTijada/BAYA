import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
  expect(worker).toContain('baybayin-song.test.mp4');
  const manifest = JSON.parse(readFileSync(path.join(outputRoot, 'offline-manifest.json'), 'utf8'));
  expect(manifest.assets.find((a: any) => a.url.endsWith('baybayin-song.test.mp4')).sizeBytes).toBe(11);
  expect(generate('--check')).toContain('Verified baya-pwa-');
});

it('fails export when the lesson MP4 is absent', () => {
  const video = path.join(outputRoot, 'assets/assets/media/videos/baybayin-song.test.mp4');
  rmSync(video);
  expect(() => generate()).toThrow();
});

it('fails export when a bundled asset reference is missing', () => {
  write('_expo/static/js/web/entry-test.js', 'module.exports="/assets/missing-reference.png";');
  expect(() => generate()).toThrow();
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
  expect(worker).toContain('integrity: ASSET_INTEGRITY[asset.url]');
  expect(Object.keys(integrity)).toContain(activeModel.runtimeBaseUrl + 'litert_wasm_internal.wasm');
  expect(integrity['/']).toBeUndefined();
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

it('verifies preparation, repair, interruption, media ranges, quota, and update reuse', () => {
  const result = execFileSync(process.execPath, ['--test', path.resolve(__dirname, '../offline-worker.test.mjs')], { encoding: 'utf8' });
  expect(result).toContain('# fail 0');
});
