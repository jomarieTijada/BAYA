// Real Chromium install and offline fetch of the production service worker.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const root = process.cwd();
const dist = path.join(root, 'apps/mobile/dist');
const contract = JSON.parse(fs.readFileSync('apps/mobile/ml/bayaActiveModel.json', 'utf8'));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'baya-pwa-validation-'));
const mime = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.html': 'text/html', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  if (req.url === '/__baya_pwa_validation') {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><title>BAYA PWA validation</title>'); return;
  }
  let file = path.join(dist, new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(dist + path.sep)) { res.writeHead(400).end(); return; }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) file = path.join(dist, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let n = 0; !fs.existsSync(portFile) && n < 100; n++) await sleep(100);
  const debugPort = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  ws.onmessage = e => { const r = JSON.parse(e.data); if (pending.has(r.id)) { pending.get(r.id)(r); pending.delete(r.id); } };
  const call = (method, params = {}) => new Promise(resolve => { const id = ++nextId; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.error || result.result?.exceptionDetails) throw new Error(JSON.stringify(result));
    return result.result.result.value;
  };
  await call('Page.navigate', { url: `http://127.0.0.1:${port}/__baya_pwa_validation` });
  await sleep(300);
  const installation = await evaluate(`(async()=>{
    await caches.open('baya-pwa-superseded-test');
    localStorage.setItem('baya-learner-preservation-test','preserved');
    const started=performance.now();
    await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller) await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
    const names=await caches.keys();
    if(names.includes('baya-pwa-superseded-test'))throw Error('Stale model cache retained');
    if(localStorage.getItem('baya-learner-preservation-test')!=='preserved')throw Error('Learner storage changed');
    const cacheName=names.find(x=>x.startsWith('baya-pwa-'));
    const cache=await caches.open(cacheName);
    const urls=(await cache.keys()).map(x=>new URL(x.url).pathname);
    if(!urls.includes(${JSON.stringify(contract.modelUrl)}))throw Error('Model not precached');
    return {installMs:performance.now()-started,cacheName,entryCount:urls.length,modelPrecached:true,controller:navigator.serviceWorker.controller.scriptURL};
  })()`);
  await call('Network.enable');
  await call('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  const offline = await evaluate(`(async()=>{
    const r=await fetch(${JSON.stringify(contract.modelUrl)});
    const bytes=await r.arrayBuffer();
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    const sha256=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
    const wasm=await fetch('/ort/ort-wasm-simd-threaded.wasm');
    await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/ort/ort-wasm-runtime.min.js';script.onload=resolve;script.onerror=reject;document.head.appendChild(script)});
    ort.env.wasm.numThreads=1;
    ort.env.wasm.wasmPaths={mjs:location.origin+'/ort/ort-wasm-simd-threaded.mjs',wasm:location.origin+'/ort/ort-wasm-simd-threaded.wasm'};
    const session=await ort.InferenceSession.create(${JSON.stringify(contract.modelUrl)},{executionProviders:['wasm']});
    const feeds={};
    for(const input of ${JSON.stringify(contract.logicalInputs)})feeds[input.name]=new ort.Tensor('float32',new Float32Array(input.shape.reduce((a,b)=>a*b,1)),input.shape);
    for(const input of ${JSON.stringify(contract.staticNormalizationInputs ?? [])})feeds[input.name]=new ort.Tensor('float32',Float32Array.from(input.values),input.shape);
    for(let i=0;i<3;i++){
      const outputs=await session.run(feeds),tensor=outputs[session.outputNames[0]];
      if(tensor.data.length!==63||!Array.from(tensor.data).every(Number.isFinite)||Math.abs(tensor.data.reduce((a,b)=>a+b,0)-1)>1e-5)throw Error('Offline inference failed');
      Object.values(outputs).forEach(t=>t.dispose());
    }
    Object.values(feeds).forEach(t=>t.dispose());await session.release();
    return {status:r.status,bytes:bytes.byteLength,sha256,wasmStatus:wasm.status,offlineInferenceRuns:3};
  })()`);
  if (offline.status !== 200 || offline.wasmStatus !== 200 || offline.sha256 !== contract.onnxSha256 || offline.bytes !== contract.onnxBytes) throw new Error('Offline asset validation failed');
  const exportedHash = createHash('sha256').update(fs.readFileSync(path.join(dist, contract.modelUrl))).digest('hex');
  if (exportedHash !== offline.sha256) throw new Error('Offline/exported bytes differ');
  const report = { modelVersion: contract.modelVersion, modelUrl: contract.modelUrl, installation, offline, passed: true };
  const destination = process.env.BAYA_PWA_REPORT ?? 'ml/deployment/onnx/artifacts/efficientnetb0-model/pwa-browser.json';
  fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  ws?.close(); chrome.kill(); server.close();
}
