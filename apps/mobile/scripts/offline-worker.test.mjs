import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const origin = 'https://baya.test';
const shell = '<script src="/entry.js"></script>';
const resources = { '/': shell, '/entry.js': 'application', '/video.mp4': '0123456789', '/model.tflite': 'model' };
const assets = Object.entries(resources).map(([url, body]) => ({ url, sizeBytes: Buffer.byteLength(body),
  revision: createHash('sha256').update(body).digest('hex'), category: url === '/video.mp4' ? 'Educational videos' : 'Other' }));

function setup() {
  const stores = new Map();
  const key = request => new URL(typeof request === 'string' ? request : request.url, origin).pathname;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async match(request) { return store.get(key(request))?.clone(); },
        async put(request, response) { const bytes = await response.arrayBuffer(); store.set(key(request), new Response(bytes, { status: response.status, headers: response.headers })); },
        async delete(request) { return store.delete(key(request)); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const listeners = {}, requests = [], messages = [];
  let failUrl, quota = 1e9;
  const nav = { onLine: true, storage: { estimate: async () => ({ quota, usage: 0 }) } };
  const context = {
    self: { location: { origin }, navigator: nav, clients: { claim: async () => {}, matchAll: async () => [{ postMessage: message => messages.push(structuredClone(message)) }] },
      addEventListener: (name, cb) => { listeners[name] = cb; } },
    caches, crypto: webcrypto, URL, Response, ReadableStream, AbortController, setTimeout, clearTimeout, setInterval, clearInterval,
    Request: class extends Request { constructor(url, options) { super(new URL(url, origin), options); } },
    fetch: async request => {
      const url = key(request); requests.push(url);
      if (url === failUrl) throw new Error('Interrupted network');
      return new Response(resources[url], { headers: { 'content-type': url === '/' ? 'text/html' : url.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream' } });
    },
  };
  const constants = `const CACHE_NAME = 'baya-pwa-current'; const MANIFEST = ${JSON.stringify({ version: 'baya-pwa-current', assets, totalBytes: assets.reduce((n, a) => n + a.sizeBytes, 0) })}; const SHELL_SCRIPTS=['/entry.js']; const BOOTSTRAP_URLS=['/','/entry.js']; const ASSET_INTEGRITY={};`;
  runInNewContext(constants + readFileSync(new URL('./offline-worker.js', import.meta.url), 'utf8'), context);
  return { caches, stores, requests, messages, offline: () => { nav.onLine = false; }, fail: url => { failUrl = url; }, quota: value => { quota = value; },
    async lifecycle(name) { let work; listeners[name]({ waitUntil: value => { work = value; } }); await work; },
    async message(type) { let work, result; listeners.message({ data: { type }, ports: [{ postMessage: value => { result = structuredClone(value); } }], waitUntil: value => { work = value; } }); await work; return result; },
    async fetch(path, headers = {}) { let result; listeners.fetch({ request: new Request(origin + path, { headers }), respondWith: value => { result = value; } }); return result; },
  };
}

test('registration downloads no resources and readiness needs file and runtime verification', async () => {
  const app = setup(); await app.lifecycle('install');
  assert.deepEqual(app.requests, []);
  assert.equal((await app.message('BAYA_VERIFY')).ready, false);
  assert.equal((await app.message('BAYA_PREPARE')).phase, 'validating');
  assert.equal((await app.message('BAYA_CONFIRM_READY')).ready, true);
  assert.equal((await app.message('BAYA_VERIFY')).ready, true);
});

test('corrupt cached bytes invalidate readiness; repair fetches only the corrupt file', async () => {
  const app = setup(); await app.message('BAYA_PREPARE'); await app.message('BAYA_CONFIRM_READY');
  const cache = await app.caches.open('baya-pwa-current');
  await cache.put('/model.tflite', new Response('wrong'));
  const result = await app.message('BAYA_VERIFY');
  assert.equal(result.ready, false); assert.deepEqual(result.missing, ['/model.tflite']);
  app.requests.length = 0;
  assert.equal((await app.message('BAYA_PREPARE')).phase, 'validating');
  assert.deepEqual(app.requests, ['/model.tflite']);
});

test('interruption retains completed files and resume downloads only missing files', async () => {
  const app = setup(); app.fail('/model.tflite'); app.offline();
  const result = await app.message('BAYA_PREPARE');
  assert.equal(result.phase, 'interrupted'); assert.equal(result.ready, false);
  const completed = new Set(Object.entries(result.files).filter(([, status]) => status === 'verified').map(([url]) => url));
  app.requests.length = 0; app.fail(undefined);
  assert.equal((await app.message('BAYA_PREPARE')).phase, 'validating');
  assert(app.requests.every(url => !completed.has(url)));
});

test('offline range responses support beginning, middle, end, suffix and invalid ranges', async () => {
  const app = setup(); await app.message('BAYA_PREPARE'); app.offline(); app.requests.length = 0;
  for (const [range, body] of [['bytes=0-2', '012'], ['bytes=4-6', '456'], ['bytes=8-', '89'], ['bytes=-2', '89']]) {
    const response = await app.fetch('/video.mp4', { range });
    assert.equal(response.status, 206); assert.equal(response.headers.get('content-type'), 'video/mp4'); assert.equal(await response.text(), body);
  }
  for (const range of ['bytes=20-', 'bytes=-0', 'bytes=0-1,4-5']) assert.equal((await app.fetch('/video.mp4', { range })).status, 416);
  assert.equal(app.requests.length, 0);
});

test('storage failure and incomplete activation preserve old caches and unrelated data', async () => {
  const app = setup();
  await (await app.caches.open('baya-pwa-old')).put('/entry.js', new Response('previous'));
  await app.caches.open('unrelated'); app.quota(1);
  assert.equal((await app.message('BAYA_PREPARE')).error, 'STORAGE_FULL');
  await app.lifecycle('activate');
  assert(app.stores.has('baya-pwa-old')); assert(app.stores.has('unrelated'));
});

test('updates reuse only checksum-matching previous assets', async () => {
  const app = setup(); const old = await app.caches.open('baya-pwa-old');
  await old.put('/model.tflite', new Response(resources['/model.tflite']));
  await old.put('/video.mp4', new Response('stale'));
  await app.message('BAYA_PREPARE');
  assert(!app.requests.includes('/model.tflite')); assert(app.requests.includes('/video.mp4'));
});
