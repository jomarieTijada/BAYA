/* App-controlled offline preparation. Embedded after build-specific constants. */
const ASSETS = new Map(MANIFEST.assets.map(asset => [asset.url, asset]));
const META_URL = '/__baya_offline_verified__';
let running;
let state = { phase: 'not-started', version: CACHE_NAME, verifiedBytes: 0, receivedBytes: 0,
  totalBytes: MANIFEST.totalBytes, verifiedFiles: 0, totalFiles: ASSETS.size, files: {}, missing: [], ready: false };

async function publish(patch) {
  state = { ...state, ...patch };
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) client.postMessage({ type: 'BAYA_PACKAGE_PROGRESS', ...state });
}

async function valid(response, asset) {
  if (!response || response.status !== 200) return false;
  if (asset.url === '/') {
    if (!response.headers.get('content-type')?.includes('text/html')) return false;
    const html = await response.text();
    const entries = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
      .map(match => new URL(match[1], self.location.origin).pathname);
    return SHELL_SCRIPTS.every(script => entries.includes(script));
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== asset.sizeBytes) return false;
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  return hash === asset.revision;
}

async function download(asset, cache, progress = false) {
  const abort = new AbortController();
  // Inactivity timeout resets on each chunk, allowing large files on slow links.
  let timer = setTimeout(() => abort.abort(), 45000);
  try {
    const response = await fetch(new Request(asset.url, { cache: 'reload',
      integrity: ASSET_INTEGRITY[asset.url], signal: abort.signal }));
    if (response.status !== 200) throw new Error('HTTP ' + response.status + ': ' + asset.url);
    const reader = response.body.getReader();
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          clearTimeout(timer);
          if (done) { controller.close(); return; }
          timer = setTimeout(() => abort.abort(), 45000);
          if (progress) state.receivedBytes += value.byteLength;
          controller.enqueue(value);
        } catch (error) { controller.error(error); }
      },
      cancel() { abort.abort(); return reader.cancel(); },
    });
    // Cache consumes the stream; only complete 200 responses can be committed.
    await cache.put(asset.url, new Response(stream, { status: 200, headers: response.headers }));
    if (!await valid(await cache.match(asset.url), asset)) {
      await cache.delete(asset.url);
      throw new Error('Integrity validation failed: ' + asset.url);
    }
  } finally { clearTimeout(timer); }
}

async function prepare(repair) {
  const cache = await caches.open(CACHE_NAME);
  const metadata = await cache.match(META_URL);
  const previous = metadata ? await metadata.json() : null;
  await publish({ phase: 'verifying', ready: false, files: {}, missing: [], verifiedBytes: 0, verifiedFiles: 0, receivedBytes: 0, error: undefined });
  const missing = [];
  for (const asset of ASSETS.values()) {
    if (await valid(await cache.match(asset.url), asset)) {
      state.files[asset.url] = 'verified'; state.verifiedBytes += asset.sizeBytes; state.verifiedFiles++;
    } else { missing.push(asset); state.files[asset.url] = 'missing'; }
  }
  if (missing.length) await cache.delete(META_URL);
  await publish({ missing: missing.map(a => a.url), downloadTotalBytes: missing.reduce((n, a) => n + a.sizeBytes, 0), completedDownloadBytes: 0 });
  if (repair && missing.length) {
    const estimate = await self.navigator.storage?.estimate?.();
    const required = missing.reduce((n, a) => n + a.sizeBytes, 0);
    if (estimate?.quota && estimate.quota - (estimate.usage || 0) < required * 1.1) {
      throw new Error('STORAGE_FULL');
    }
    const oldCaches = (await caches.keys()).filter(name => name.startsWith('baya-pwa-') && name !== CACHE_NAME);
    let next = 0, failure;
    await publish({ phase: 'downloading' });
    await Promise.all(Array.from({ length: 2 }, async () => {
      while (next < missing.length && !failure) {
        const asset = missing[next++];
        try {
          await publish({ category: asset.category });
          let reused = false;
          for (const name of oldCaches) {
            const old = await (await caches.open(name)).match(asset.url);
            if (old && await valid(old.clone(), asset)) { await cache.put(asset.url, old); reused = true; break; }
          }
          if (!reused) {
            for (let attempt = 0; ; attempt++) {
              try { await download(asset, cache, true); break; }
              catch (error) {
                if (attempt >= 2 || self.navigator.onLine === false || error.name === 'QuotaExceededError') throw error;
                await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
              }
            }
          }
          state.files[asset.url] = 'verified'; state.verifiedFiles++; state.verifiedBytes += asset.sizeBytes;
          state.completedDownloadBytes += asset.sizeBytes;
          await publish({ missing: state.missing.filter(url => url !== asset.url) });
        } catch (error) { failure = error; state.files[asset.url] = 'failed'; }
      }
    }));
    if (failure) throw failure;
  }
  const complete = state.verifiedFiles === ASSETS.size;
  const ready = complete && previous?.runtimeVerified === true && missing.length === 0;
  await publish({ phase: ready ? 'ready' : complete ? 'validating' : 'incomplete', ready,
    lastVerified: ready ? previous.lastVerified : undefined });
  return state;
}

self.addEventListener('message', event => {
  const type = event.data?.type;
  const port = event.ports?.[0];
  const reply = value => port?.postMessage(value);
  if (type === 'BAYA_PACKAGE_MANIFEST') { reply(MANIFEST); return; }
  if (type === 'BAYA_OFFLINE_STATUS') { reply(state); return; }
  if (type === 'BAYA_CONFIRM_READY') {
    event.waitUntil((async () => {
      if (state.verifiedFiles !== ASSETS.size || running) { reply({ error: 'Package is incomplete' }); return; }
      const lastVerified = new Date().toISOString();
      await (await caches.open(CACHE_NAME)).put(META_URL, new Response(JSON.stringify({ runtimeVerified: true, lastVerified })));
      await publish({ phase: 'ready', ready: true, lastVerified });
      // Called only through the controlling worker after the app's runtime checks.
      // Waiting updates never receive this command and never remove the usable set.
      for (const name of await caches.keys()) {
        if (name.startsWith('baya-pwa-') && name !== CACHE_NAME) await caches.delete(name);
      }
      reply(state);
    })());
    return;
  }
  if (type !== 'BAYA_PREPARE' && type !== 'BAYA_VERIFY') return;
  if (!running) {
    const heartbeat = setInterval(() => { void publish({}); }, 2000);
    running = prepare(type === 'BAYA_PREPARE').catch(async error => {
    await publish({ phase: self.navigator.onLine === false ? 'interrupted' : 'failed', ready: false,
      error: error.name === 'QuotaExceededError' ? 'STORAGE_FULL' : String(error.message || error) });
    return state;
    }).finally(() => { clearInterval(heartbeat); running = undefined; });
  }
  event.waitUntil(running.then(reply));
});

self.addEventListener('install', () => {
  // Registration/native installation must not wait for any resource downloads.
  // The opened app sends BAYA_PREPARE, including its shell and UI assets.
  // Never skipWaiting: existing windows keep their matching application version.
});

self.addEventListener('activate', event => {
  // Keep the previous installation while the new package is incomplete.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname === '/sw.js') return;
  const navigation = request.mode === 'navigate' || request.destination === 'document';
  const asset = ASSETS.get(navigation ? '/' : url.pathname);
  if (!asset) return; // Cloud and external resources are never put in a learning cache.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(asset.url);
    if (!cached) {
      try { return await fetch(request); }
      catch { return new Response('Learning materials are not prepared', { status: 503 }); }
    }
    const range = request.headers.get('range');
    if (!range) return cached;
    const bytes = await cached.arrayBuffer();
    const size = bytes.byteLength;
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const invalid = () => new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    if (!match || (!match[1] && !match[2])) return invalid();
    const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) return invalid();
    return new Response(bytes.slice(start, end + 1), { status: 206, headers: {
      'Content-Type': cached.headers.get('content-type') || 'application/octet-stream',
      'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
    } });
  })());
});
