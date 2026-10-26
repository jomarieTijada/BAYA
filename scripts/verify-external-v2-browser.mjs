// Real Chromium WASM inference against Keras references, using production preprocessing.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import ts from 'typescript';

const root = process.cwd();
const artifacts = path.join(root, 'ml/deployment/onnx/artifacts/external-v2');
const publicRoot = path.join(root, 'apps/mobile/public');
const modelRoot = path.join(root, 'ml/rollback');
const modelName = 'Baybayin_EfficientNetB0_ExternalFirst_v2.onnx';
const optimization = process.env.BAYA_PARITY_OPTIMIZATION ?? 'all';
const preprocess = ts.transpileModule(fs.readFileSync(path.join(root, 'apps/mobile/ml/inkImagePreprocessing.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const appModules = new Map();
for (const name of ['BayaModelError', 'bayaProbabilities', 'bayaModelConfig', 'bayaModel.web']) {
  let source = fs.readFileSync(path.join(root, 'apps/mobile/ml', `${name}.ts`), 'utf8');
  if (name === 'bayaModelConfig') source = source.replace("import contract from './bayaActiveModel.json';", `const contract = ${fs.readFileSync(path.join(modelRoot, 'models/baya/Baybayin_EfficientNetB0_ExternalFirst_v2_onnx_contract.json'), 'utf8')};`);
  appModules.set(`/app/${name}.js`, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.js'"));
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  if (url === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>BAYA parity</title>'); return; }
  if (url === '/preprocess.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(preprocess); return; }
  if (appModules.has(url)) { res.setHeader('Content-Type', 'text/javascript'); res.end(appModules.get(url)); return; }
  const file = url === '/cases.json' ? path.join(artifacts, 'browser-cases.json')
    : url === '/model.onnx' ? path.join(modelRoot, 'models/baya', modelName)
    : url.startsWith('/models/') ? path.join(modelRoot, url) : url.startsWith('/ort/') ? path.join(publicRoot, url) : null;
  if (!file || !file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', file.endsWith('.wasm') ? 'application/wasm' : /\.(mjs|js)$/.test(file) ? 'text/javascript' : 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'baya-v2-parity-'));
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });
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
      const { preprocessNotebookImage } = await import('/preprocess.js');
      await new Promise((resolve,reject) => { const s=document.createElement('script');s.src='/ort/ort-wasm-runtime.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s); });
      ort.env.wasm.numThreads=1;
      ort.env.wasm.wasmPaths={mjs:location.origin+'/ort/ort-wasm-simd-threaded.mjs',wasm:location.origin+'/ort/ort-wasm-simd-threaded.wasm'};
      const session=await ort.InferenceSession.create('/model.onnx',{executionProviders:['wasm'],graphOptimizationLevel:${JSON.stringify(optimization)}});
      const runtimeVersion=ort.env.versions.web;
      const runtime=ort;
      window.__DEV__=false;
      const appService=${optimization === 'all' ? "await import('/app/bayaModel.web.js')" : 'null'};
      if(session.inputNames.length!==1 || session.outputNames.length!==1) throw Error('Unexpected tensor count');
      const cases=await (await fetch('/cases.json')).json();
      const rows=[];
      const top3=x=>Array.from(x,(_,i)=>i).sort((a,b)=>x[b]-x[a]||a-b).slice(0,3);
      for(const c of cases) {
        const input=c.raster ? preprocessNotebookImage({width:c.raster.width,height:c.raster.height,data:Uint8Array.from(atob(c.raster.rgba),x=>x.charCodeAt(0))}) : Float32Array.from(c.input);
        const preprocessingMax=Math.max(...input.map((x,i)=>Math.abs(x-c.input[i])));
        const tensor=new runtime.Tensor('float32',input,[1,96,96,1]);
        const outputs=await session.run({[session.inputNames[0]]:tensor});
        const output=outputs[session.outputNames[0]];
        if(output.data.length!==63 || !Array.from(output.data).every(Number.isFinite)) throw Error('Invalid output');
        const diffs=Array.from(output.data,(x,i)=>Math.abs(x-c.keras[i]));
        if(appService) {
          const appOutput=await appService.runBayaInference(input);
          if(appOutput.some((value,i)=>value!==output.data[i])) throw Error('App service differs from verified session');
        }
        const kt=top3(c.keras), bt=top3(output.data);
        rows.push({sample:c.name,preprocessingMax,maximumAbsoluteDifference:Math.max(...diffs),meanAbsoluteDifference:diffs.reduce((a,b)=>a+b,0)/63,kerasTop3:kt,browserTop3:bt,top1Match:kt[0]===bt[0],top3Match:JSON.stringify(kt)===JSON.stringify(bt)});
        tensor.dispose();output.dispose();
      }
      await session.release();
      return {runtime:runtimeVersion,executionProvider:'wasm',productionServiceVerified:!!appService,sampleCount:rows.length,preprocessingMaximum:Math.max(...rows.map(r=>r.preprocessingMax)),maximumAbsoluteDifference:Math.max(...rows.map(r=>r.maximumAbsoluteDifference)),meanAbsoluteDifference:rows.reduce((s,r)=>s+r.meanAbsoluteDifference,0)/rows.length,top1Matches:rows.filter(r=>r.top1Match).length,top3Matches:rows.filter(r=>r.top3Match).length,cases:rows};
    })()
  ` });
  if (result.error || result.result?.exceptionDetails) throw Error(JSON.stringify(result));
  const report = result.result.result.value;
  // WASM and CPU accumulate convolutions differently. Both optimized and
  // unoptimized WASM were measured; retain a strict absolute gate plus mean
  // error and exact ranking gates, without transforming any probabilities.
  report.absoluteTolerance = 2e-5;
  report.meanTolerance = 1e-6;
  report.passed = report.preprocessingMaximum === 0 && report.maximumAbsoluteDifference <= report.absoluteTolerance
    && report.meanAbsoluteDifference <= report.meanTolerance && report.top1Matches === report.sampleCount && report.top3Matches === report.sampleCount;
  report.graphOptimizationLevel = optimization;
  fs.writeFileSync(path.join(root, optimization === 'all' ? 'docs/ml/external-v2-browser-parity.json' : 'docs/ml/external-v2-browser-diagnostic.json'), JSON.stringify(report, null, 2)+'\n');
  console.log(JSON.stringify({ ...report, cases: undefined }, null, 2));
  if (!report.passed) throw Error('Browser parity failed');
} finally {
  ws?.close();
  chrome.kill();
  server.close();
}
