import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';

const out = 'docs/verification/pwa-compact'; fs.mkdirSync(out, { recursive: true });
const root = path.resolve('apps/mobile/dist');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'offline-manifest.json')));
const requests = [], held = [];
let hold = true;
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.wasm': 'application/wasm', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost').pathname; requests.push(url);
  const file = path.join(root, path.extname(url) ? url.slice(1) : 'index.html');
  const respond = () => {
    if (res.destroyed) return;
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'credentialless' });
    fs.createReadStream(file).pipe(res);
  };
  if (hold && url.endsWith('.tflite')) held.push(respond); else respond();
});
await new Promise(resolve => server.listen(5057, '127.0.0.1', resolve));
const browser = await openTestBrowser(5057);
const ws = new WebSocket(browser.target.webSocketDebuggerUrl); await new Promise(resolve => { ws.onopen = resolve; });
let seq = 0; const pending = new Map();
ws.onmessage = e => { const r = JSON.parse(e.data); pending.get(r.id)?.(r); pending.delete(r.id); };
const send = (method, params = {}) => new Promise(resolve => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const ev = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.error || r.result.exceptionDetails) throw Error(JSON.stringify(r)); return r.result.result.value; };
const wait = async expression => { for (let i = 0; i < 1200; i++) { if (await ev(expression)) return; await delay(100); } throw Error(expression + '\n' + await ev('document.body.innerText')); };
const status = `new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=e=>resolve(e.data);navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[c.port2])})`;
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
const report = { version: manifest.version, checks: [], layouts: [], errors: [], limitations: 'Standalone/fullscreen media queries simulated; native OS install UI not automated.' };
try {
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `const match=window.matchMedia.bind(window);window.matchMedia=q=>{const m=match(q);if(q==='(display-mode: fullscreen)'||(q==='(display-mode: standalone)'&&sessionStorage.getItem('test-standalone')))Object.defineProperty(m,'matches',{value:true});return m};Object.defineProperty(navigator,'gpu',{get:()=>undefined});` });
  await send('Page.navigate', { url: 'http://127.0.0.1:5057/' });
  await wait(`!!document.querySelector('[data-testid=pwa-install-welcome]') && !!navigator.serviceWorker.controller`);
  await delay(1000);
  assert.equal((await ev(status)).phase, 'not-started');
  const cacheCount = await ev(`(async()=>{let count=0;for(const n of await caches.keys())count+=(await(await caches.open(n)).keys()).length;return count})()`);
  assert.equal(cacheCount, 0);
  const heavy = new Set(manifest.assets.filter(a => ['Handwriting model', 'LiteRT runtime', 'Educational videos', 'Pronunciation audio'].includes(a.category)).map(a => a.url));
  assert(!requests.some(url => heavy.has(url)));
  await ev(`window.dispatchEvent(new Event('appinstalled'))`); await delay(250);
  assert(!requests.some(url => heavy.has(url)));
  report.checks.push('Fullscreen browser and install event do not download learning assets; worker installation caches zero resources');
  await ev(`sessionStorage.setItem('test-standalone','1')`); await send('Page.reload');
  await wait(`!!document.querySelector('[data-testid=offline-setup]') && !!navigator.serviceWorker.controller`);
  await wait(`(${status}).then(s=>s.phase==='downloading')`);
  for (const [width, height] of [[844,320],[780,300],[915,360],[1024,600],[390,680],[360,540],[320,480]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true }); await delay(180);
    const geometry = await ev(`(()=>{const host=document.querySelector('[data-testid=offline-setup]');const children=[...host.querySelectorAll('[role=header],[role=progressbar],[data-testid=download-mascot-crop]')].map(e=>{const r=e.getBoundingClientRect();return{tag:e.tagName,top:r.top,bottom:r.bottom,left:r.left,right:r.right}});return{width:innerWidth,height:innerHeight,scrollHeight:host.scrollHeight,clientHeight:host.clientHeight,documentHeight:document.documentElement.scrollHeight,children}})()`);
    report.layouts.push(geometry);
    assert(geometry.scrollHeight <= geometry.clientHeight + 1, JSON.stringify(geometry));
    assert(geometry.documentHeight <= height + 1, JSON.stringify(geometry));
    assert(geometry.children.every(r=>r.top>=-1&&r.bottom<=height+1&&r.left>=-1&&r.right<=width+1),JSON.stringify(geometry));
    await shot(`loading-${width}x${height}`);
  }
  report.checks.push('Download page fits without scrolling or clipped logo/mascot/progress at seven portrait/landscape sizes');
  hold = false; held.forEach(respond => respond());
  await wait(`(${status}).then(s=>s.phase==='validating'||s.ready)`);
  if (!(await ev(status)).ready) {
    assert(!(await ev('document.body.innerText')).includes('99%'));
    assert((await ev('document.body.innerText')).includes('Download complete.'));
    await shot('final-checks');
  }
  await wait(`(${status}).then(s=>s.ready)`);
  await wait(`!document.querySelector('[data-testid=offline-setup]')`);
  report.checks.push('Actual assets download after app launch; final validation is separate from percentage; app opens automatically');
} catch(error) { report.errors.push(String(error.stack || error)); process.exitCode = 1; }
finally { hold=false;held.forEach(respond=>respond());fs.writeFileSync(`${out}/results.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));ws.close();await browser.close();server.closeAllConnections();server.close(); }
