import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';

const output = 'docs/verification/offline-installation/recovery'; fs.mkdirSync(output, { recursive: true });
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'baya-offline-recovery-'));
fs.cpSync('apps/mobile/dist', root, { recursive: true });
const original = JSON.parse(fs.readFileSync(path.join(root, 'offline-manifest.json')));
const model = original.assets.find(a => a.category === 'Handwriting model').url;
const picture = original.assets.find(a => a.category === 'Character illustrations' && a.url.startsWith('/assets/') && a.url.endsWith('.png')).url;
let failModel = false, failPicture = false, modelStarted = false;
const activeModelResponses = new Set(), hits = [];
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.wasm': 'application/wasm', '.json': 'application/json', '.png': 'image/png', '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.ttf': 'font/ttf', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost').pathname;
  hits.push(url);
  if ((url === model && failModel) || (url === picture && failPicture)) { res.writeHead(503); res.end(); return; }
  const file = path.join(root, !path.extname(url) ? 'index.html' : url.slice(1));
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
    'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' });
  if (url === model && !modelStarted) {
    modelStarted = true; activeModelResponses.add(res);
    const stream = fs.createReadStream(file, { highWaterMark: 128 * 1024 });
    stream.on('data', chunk => { stream.pause(); res.write(chunk); setTimeout(() => { if (!res.destroyed) stream.resume(); }, 30); });
    stream.on('end', () => res.end()); res.on('close', () => { stream.destroy(); activeModelResponses.delete(res); });
  } else fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(5056, '127.0.0.1', resolve));
let browser, ws, send, ev;
const report = { checks: [], errors: [] };
async function connect(profile) {
  browser = await openTestBrowser(5056, { profile }); ws = new WebSocket(browser.target.webSocketDebuggerUrl);
  await new Promise(resolve => { ws.onopen = resolve; });
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const value = JSON.parse(e.data); pending.get(value.id)?.(value); pending.delete(value.id); };
  send = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
  ev = async expression => { const value = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (value.error || value.result.exceptionDetails) throw Error(JSON.stringify(value)); return value.result.result.value; };
  await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `const nativeMatchMedia=window.matchMedia.bind(window);window.matchMedia=q=>{const m=nativeMatchMedia(q);if(q==='(display-mode: standalone)')Object.defineProperty(m,'matches',{value:true});return m};Object.defineProperty(navigator,'gpu',{get:()=>undefined});` });
}
const wait = async expression => { for (let i = 0; i < 720; i++) { if (await ev(expression)) return; await delay(250); } throw Error(expression + '\n' + await ev('document.body.innerText')); };
const message = (type, waiting = false) => ev(`(async()=>{const worker=${waiting ? '(await navigator.serviceWorker.getRegistration()).waiting' : 'navigator.serviceWorker.controller'};return new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=e=>resolve(e.data);worker.postMessage({type:${JSON.stringify(type)}},[c.port2])})})()`);
const offline = value => send('Network.emulateNetworkConditions', { offline: value, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
const snap = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${output}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
try {
  await connect(); await send('Page.navigate', { url: 'http://127.0.0.1:5056/' });
  for (let i = 0; i < 720 && !modelStarted; i++) await delay(100);
  console.log('Model transfer started'); assert(modelStarted); failModel = true; await offline(true);
  for (const response of activeModelResponses) response.destroy();
  await wait(`document.body.innerText.includes('Preparation paused.')`);
  console.log('Interruption displayed'); const interrupted = await message('BAYA_OFFLINE_STATUS');
  assert(['failed','interrupted'].includes(interrupted.phase)); assert.equal(await ev('navigator.onLine'),false); assert(interrupted.verifiedFiles > 0); assert(!interrupted.ready);
  await snap('interrupted');
  const completed = new Set(Object.entries(interrupted.files).filter(([, status]) => status === 'verified').map(([url]) => url));
  hits.length = 0; failModel = false; await offline(false);
  await wait(`!!navigator.serviceWorker.controller && new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=e=>resolve(e.data.ready===true);navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[ch.port2])})`);
  console.log('Resumed package ready'); const ready = await message('BAYA_OFFLINE_STATUS'); assert(ready.ready);
  // Bootstrap registration checks and runtime probes can fetch cached URLs, but
  // the HTTP server must not receive a second download for verified resources.
  assert(!hits.some(url => completed.has(url)));
  report.checks.push({ name: 'Real interrupted transfer resumes automatically without redownloading verified files', completed: completed.size, resumedNetworkRequests: [...new Set(hits)] });

  // New, still-decodable image revision in an isolated export. Fail only its new
  // HTTP transfer; the old verified installation remains usable throughout.
  fs.appendFileSync(path.join(root, picture), '\nBAYA update recovery fixture');
  execFileSync(process.execPath, ['apps/mobile/scripts/generate-pwa-service-worker.mjs'], { env: { ...process.env, BAYA_WEB_OUTPUT_DIR: root } });
  const updated = JSON.parse(fs.readFileSync(path.join(root, 'offline-manifest.json')));
  failPicture = true;
  await ev(`navigator.serviceWorker.getRegistration().then(r=>r.update())`);
  await wait(`navigator.serviceWorker.getRegistration().then(r=>!!r.waiting)`);
  console.log('New worker waiting; staging update'); const failed = await message('BAYA_PREPARE', true); assert.equal(failed.phase, 'failed'); assert(!failed.ready);
  assert((await ev('caches.keys()')).includes(original.version));
  await offline(true);
  const video = original.assets.find(a => a.category === 'Educational videos').url;
  assert.equal(await ev(`fetch(${JSON.stringify(video)},{headers:{Range:'bytes=0-99'}}).then(r=>r.status)`), 206);
  report.checks.push({ name: 'Failed staged update preserves previous offline video and cache', oldVersion: original.version, newVersion: updated.version, missing: failed.missing });
  console.log('Old installation survived update failure'); failPicture = false; await offline(false);
  console.log('Retrying staged update'); const staged = await message('BAYA_PREPARE', true); assert.equal(staged.phase, 'validating');
  await snap('staged-update');
  const profile = browser.profile; ws.close(); await browser.close();
  await connect(profile); await offline(true);
  await send('Page.navigate', { url: 'http://127.0.0.1:5056/' });
  await wait(`!!navigator.serviceWorker.controller && new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=e=>resolve(e.data.ready===true);navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[ch.port2])})`);
  console.log('New version active'); const activated = await message('BAYA_OFFLINE_STATUS'); assert(activated.ready); assert.equal(activated.version, updated.version);
  assert(!(await ev('caches.keys()')).includes(original.version));
  report.checks.push({ name: 'Verified update activates after browser close and validates offline before obsolete cache cleanup' });
} catch (error) { report.errors.push(String(error.stack || error)); process.exitCode = 1; }
finally {
  fs.writeFileSync(`${output}/results.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  ws?.close(); await browser?.close(); server.closeAllConnections(); server.close();
}
