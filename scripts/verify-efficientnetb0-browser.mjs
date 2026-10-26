// Candidate validation never changes the active manifest. Uses real Chromium/WASM.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import ts from 'typescript';

const root = process.cwd();
const artifacts = path.join(root, 'ml/deployment/onnx/artifacts/efficientnetb0-model');
const publicRoot = path.join(root, 'apps/mobile/public');
const modelRoot = path.join(root, 'ml/rollback');
const python = JSON.parse(fs.readFileSync('docs/ml/efficientnetb0-model-python-parity.json', 'utf8'));
const contract = JSON.parse(fs.readFileSync(path.join(modelRoot,'models/baya/EfficientNetB0_model_onnx_contract.json'),'utf8'));
const phase=process.argv.includes('--before-cleanup')?'before-cleanup':'final';
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.js'");
const modules = new Map([['/preprocess.js', compile(fs.readFileSync('apps/mobile/ml/inkImagePreprocessing.ts', 'utf8'))]]);
for (const [version, config] of [['active', contract]]) {
  for (const name of ['BayaModelError', 'bayaProbabilities', 'bayaModelConfig', 'bayaModel.web', 'inkImagePreprocessing', 'bayaPreprocessing']) {
    let source = fs.readFileSync(name === 'bayaModel.web' ? 'ml/rollback/runtime/bayaModel.web.ts.txt' : `apps/mobile/ml/${name}.ts`, 'utf8');
    if (name === 'bayaModelConfig') source = `export const BAYA_MODEL_CONFIG=${JSON.stringify(config)}; export const BAYA_RECOGNITION_MODEL_NAME=BAYA_MODEL_CONFIG.modelName; export const BAYA_RECOGNITION_MODEL_VERSION=BAYA_MODEL_CONFIG.modelVersion; export const BAYA_RECOGNITION_MODEL_URL=BAYA_MODEL_CONFIG.modelUrl;`;
    modules.set(`/app/${version}/${name}.js`, compile(source));
  }
}
const modelFiles = { [contract.modelUrl]:path.join(modelRoot,contract.modelUrl) };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  if (url === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>BAYA Custom CNN validation</title>'); return; }
  if (modules.has(url)) { res.setHeader('Content-Type', 'text/javascript'); res.end(modules.get(url)); return; }
  const file = url === '/cases.json' ? path.join(artifacts, 'browser-cases.json') : modelFiles[url] ?? (url.startsWith('/ort/') ? path.join(publicRoot, url) : null);
  if (!file || !file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', file.endsWith('.wasm') ? 'application/wasm' : /\.(mjs|js)$/.test(file) ? 'text/javascript' : 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'baya-custom-parity-'));
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
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
  ws.onmessage = event => { const value = JSON.parse(event.data); if (pending.has(value.id)) { pending.get(value.id)(value); pending.delete(value.id); } };
  const call = (method, params = {}) => new Promise(resolve => { const id = ++nextId; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
  await call('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await sleep(500);
  const result = await call('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `
    (async () => {
      window.__DEV__=false;
      const {preprocessBayaImage:preprocessNotebookImage}=await import('/app/active/bayaPreprocessing.js');
      await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/ort/ort-wasm-runtime.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});
      const runtime=ort;
      runtime.env.wasm.numThreads=1;
      runtime.env.wasm.wasmPaths={mjs:location.origin+'/ort/ort-wasm-simd-threaded.mjs',wasm:location.origin+'/ort/ort-wasm-simd-threaded.wasm'};
      const cases=await(await fetch('/cases.json')).json();
      const stats=values=>{
        const sorted=[...values].sort((a,b)=>a-b),pos=(sorted.length-1)*.95,lo=Math.floor(pos);
        return {count:values.length,mean:values.reduce((a,b)=>a+b,0)/values.length,median:sorted.length%2?sorted[Math.floor(sorted.length/2)]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2,p95:sorted[lo]+(sorted[Math.ceil(pos)]-sorted[lo])*(pos-lo)};
      };
      const top3=x=>Array.from(x,(_,i)=>i).sort((a,b)=>x[b]-x[a]||a-b).slice(0,3);
      const inputs=[],preprocessTimes=[];
      let preprocessingMaximum=0;
      for(const c of cases) {
        const rgba=c.raster?Uint8Array.from(atob(c.raster.rgba),x=>x.charCodeAt(0)):null;
        const start=performance.now();
        const input=rgba?preprocessNotebookImage({width:c.raster.width,height:c.raster.height,data:rgba}):Float32Array.from(c.input);
        if(rgba)preprocessTimes.push(performance.now()-start);
        preprocessingMaximum=Math.max(preprocessingMaximum,...input.map((x,i)=>Math.abs(x-c.input[i])));
        inputs.push({c,input,rgba});
      }
      const url=${JSON.stringify(contract.modelUrl)};
      const run=async(session,input)=>{
        const tensor=new runtime.Tensor('float32',input,[1,96,96,1]);
        try {const out=await session.run({[session.inputNames[0]]:tensor});const result=new Float32Array(out[session.outputNames[0]].data);Object.values(out).forEach(t=>t.dispose());return result;}finally{tensor.dispose();}
      };
      const initTimes=[],firstTimes=[];let session;
      for(let round=0;round<3;round++){
        const start=performance.now();const current=await runtime.InferenceSession.create(url,{executionProviders:['wasm']});initTimes.push(performance.now()-start);
        const firstStart=performance.now();await run(current,inputs.find(x=>x.rgba).input);firstTimes.push(performance.now()-firstStart);
        if(round===2)session=current;else await current.release();
      }
      const appService=await import('/app/active/bayaModel.web.js');
      window.__DEV__=true;
      const smoke=await appService.runBayaSmokeTest();
      if(!smoke.sameSessionReused||smoke.sessionCreations!==1)throw Error('Shared session check failed');
      const preload=appService.preloadBayaModel();
      if(appService.preloadBayaModel()!==preload)throw Error('Preload Promise not shared');
      await preload;await appService.preloadBayaModel();window.__DEV__=false;
      for(let i=0;i<5;i++)await run(session,inputs.find(x=>x.rgba).input);
      const rows=[],warm=[],serviceWarm=[],endToEnd=[];
      for(const {c,input,rgba} of inputs){
        const start=performance.now();const output=await run(session,input);warm.push(performance.now()-start);
        const serviceStart=performance.now();const serviceOutput=await appService.runBayaInference(input);serviceWarm.push(performance.now()-serviceStart);
        if(serviceOutput.some((value,i)=>value!==output[i]))throw Error('Production service differs');
        if(rgba){const e2eStart=performance.now();const prepared=preprocessNotebookImage({width:c.raster.width,height:c.raster.height,data:rgba});await appService.runBayaInference(prepared);endToEnd.push(performance.now()-e2eStart);}
        if(output.length!==63||!Array.from(output).every(Number.isFinite))throw Error('Malformed probabilities');
        const diffs=Array.from(output,(x,i)=>Math.abs(x-c.keras[i])),kt=top3(c.keras),bt=top3(output);
        rows.push({sample:c.name,browserProbabilities:Array.from(output),maximumAbsoluteDifference:Math.max(...diffs),meanAbsoluteDifference:diffs.reduce((a,b)=>a+b,0)/63,kerasTop3:kt,browserTop3:bt,top1Match:kt[0]===bt[0],top3Match:JSON.stringify(kt)===JSON.stringify(bt)});
      }
      await session.release();
      return {parity:{runtime:runtime.env.versions.web,executionProvider:'wasm',productionServiceVerified:true,sharedSessionVerified:true,sessionCreations:smoke.sessionCreations,preloadVerified:true,sampleCount:rows.length,preprocessingMaximum,maximumAbsoluteDifference:Math.max(...rows.map(r=>r.maximumAbsoluteDifference)),meanAbsoluteDifference:rows.reduce((s,r)=>s+r.meanAbsoluteDifference,0)/rows.length,top1Matches:rows.filter(r=>r.top1Match).length,top3Matches:rows.filter(r=>r.top3Match).length,cases:rows},benchmark:{runtime:runtime.env.versions.web,threads:1,preprocessing:stats(preprocessTimes),sessionInitialization:stats(initTimes),firstInference:stats(firstTimes),warmInference:stats(warm),serviceWarmInference:stats(serviceWarm),endToEnd:stats(endToEnd)}};
    })()
  ` });
  if (result.error || result.result?.exceptionDetails) throw Error(JSON.stringify(result));
  const { parity, benchmark } = result.result.result.value;
  parity.absoluteTolerance = 2e-5;
  parity.meanTolerance = 1e-6;
  parity.preprocessingProvenanceConfirmed = python.preprocessingProvenanceConfirmed;
  parity.passed = parity.preprocessingMaximum === 0 && parity.maximumAbsoluteDifference <= parity.absoluteTolerance && parity.meanAbsoluteDifference <= parity.meanTolerance && parity.top1Matches === parity.sampleCount && parity.top3Matches === parity.sampleCount;
  benchmark.modelBytes = fs.statSync(modelFiles[contract.modelUrl]).size;
  benchmark.notes = 'Desktop Chromium single-thread WASM, local HTTP, three initialization/first-inference trials, five warmups, identical 114-case corpus. End-to-end includes RGBA preprocessing and actual app service; excludes canvas rasterization/cold remote download. Before/after cleanup runs use identical graph bytes and runtime lifecycle.';
  fs.writeFileSync(`docs/ml/efficientnetb0-model-${phase}-browser-parity.json`, JSON.stringify(parity, null, 2)+'\n');
  fs.writeFileSync(`docs/ml/efficientnetb0-model-${phase}-benchmark.json`, JSON.stringify(benchmark, null, 2)+'\n');
  console.log(JSON.stringify({ parity: { ...parity, cases: undefined }, benchmark }, null, 2));
  if (!parity.passed) throw Error('Browser parity gate failed');
} finally {
  ws?.close();chrome.kill();server.close();
}
