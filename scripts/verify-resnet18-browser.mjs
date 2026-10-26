// Candidate validation never changes the active manifest. Uses real Chromium/WASM.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import ts from 'typescript';

const root = process.cwd();
const artifacts = path.join(root, 'ml/deployment/onnx/artifacts/resnet18-1.0');
const publicRoot = path.join(root, 'apps/mobile/public');
const contract={modelUrl:'/candidate.onnx'};
const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const modules=new Map([
 ['/image.js',compile(fs.readFileSync('apps/mobile/ml/inkImagePreprocessing.ts','utf8'))]
]);
const appContract=JSON.parse(fs.readFileSync(path.join(artifacts,'candidate-contract.json'),'utf8'));
for(const name of ['BayaModelError','bayaProbabilities','bayaModelConfig','bayaModel.web']){
 let source=fs.readFileSync(`apps/mobile/ml/${name}.ts`,'utf8');
 if(name==='bayaModelConfig')source=`export const BAYA_MODEL_CONFIG=${JSON.stringify(appContract)}; export const BAYA_RECOGNITION_MODEL_NAME=BAYA_MODEL_CONFIG.modelName;export const BAYA_RECOGNITION_MODEL_VERSION=BAYA_MODEL_CONFIG.modelVersion;export const BAYA_RECOGNITION_MODEL_URL=BAYA_MODEL_CONFIG.modelUrl;`;
 modules.set('/'+name+'.js',compile(source).replace(/from '(\.\/[^']+)'/g,"from '$1.js'"));
}
const modelFiles={'/candidate.onnx':path.join(artifacts,'BAYA_ResNet18_1.0.onnx')};
modelFiles[appContract.modelUrl]=path.join(artifacts,'BAYA_ResNet18_1.0.onnx');
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
  const result = await call('Runtime.evaluate', {awaitPromise:true,returnByValue:true,expression:`
(async()=>{
 const {preprocessNotebookImage}=await import('/image.js');
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/ort/ort-wasm-runtime.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
 const runtime=ort;runtime.env.wasm.numThreads=1;runtime.env.wasm.wasmPaths={mjs:location.origin+'/ort/ort-wasm-simd-threaded.mjs',wasm:location.origin+'/ort/ort-wasm-simd-threaded.wasm'};
 const session=await runtime.InferenceSession.create('/candidate.onnx',{executionProviders:['wasm']});
 window.__DEV__=true;const service=await import('/bayaModel.web.js');const smoke=await service.runBayaSmokeTest();await service.preloadBayaModel();
 const cases=await(await fetch('/cases.json')).json(),rows=[];
 const top=x=>Array.from(x,(_,i)=>i).sort((a,b)=>x[b]-x[a]||a-b).slice(0,3);
 for(const c of cases){
  let image=Float32Array.from(c.image);
  if(c.rgba) { image=preprocessNotebookImage({width:c.width,height:c.height,data:Uint8Array.from(c.rgba)}); if(image.some((v,i)=>v!==c.image[i])) throw Error('Preprocessing mismatch '+c.name); }
  const a=new runtime.Tensor('float32',image,[1,96,96,1]);
  const staticFeeds=Object.fromEntries(${JSON.stringify(appContract.staticNormalizationInputs)}.map(v=>[v.name,new runtime.Tensor('float32',Float32Array.from(v.values),v.shape)]));
  const outputs=await session.run({image_input:a,...staticFeeds});
  Object.values(staticFeeds).forEach(t=>t.dispose());
  const actual=Array.from(outputs[session.outputNames[0]].data),delta=actual.map((v,i)=>Math.abs(v-c.expected[i]));
  const serviceOutput=await service.runBayaInference(image);if(serviceOutput.some((v,i)=>v!==actual[i]))throw Error('App service differs');
  rows.push({sample:c.name,probabilities:actual,max:Math.max(...delta),mean:delta.reduce((a,b)=>a+b,0)/63,top1:top(actual)[0]===top(c.expected)[0],top3:JSON.stringify(top(actual))===JSON.stringify(top(c.expected))});
  a.dispose();Object.values(outputs).forEach(t=>t.dispose());
 }
 await session.release(); const benchmark=await service.runBayaBenchmark(); return {runtime:runtime.env.versions.web,productionServiceVerified:true,smoke,benchmark,rows,passed:rows.every(r=>r.max<=1e-5&&r.mean<=1e-6&&r.top1&&r.top3)};
})()`});
 if(result.error||result.result?.exceptionDetails)throw Error(JSON.stringify(result));
 const report=result.result.result.value;
 fs.writeFileSync(path.join(artifacts,'browser-parity.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({...report,rows:report.rows.map(({probabilities,...r})=>r)},null,2));
 if(!report.passed)throw Error('Browser parity failed');
} finally {ws?.close();chrome.kill();server.close();}
