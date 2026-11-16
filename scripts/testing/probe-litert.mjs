import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import ts from 'typescript';
import { openTestBrowser } from './device-browser.mjs';
import { setTimeout as delay } from 'node:timers/promises';

const out = process.env.BAYA_QA_OUTPUT ?? 'docs/ml/resnet18-spatial-v1';
fs.mkdirSync(out, {recursive:true});
const modules = new Map();
for (const name of ['BayaModelError', 'bayaModelConfig', 'bayaOutputs', 'bayaClassLabels', 'bayaPreprocessing', 'bayaModel.web', 'bayaProbabilities', 'writingRecognition']) {
  let source = fs.readFileSync(`apps/mobile/ml/${name}.ts`, 'utf8');
  source = source.replace(/import (\w+) from '([^']+\.json)';/g, (_, binding, file) => `const ${binding}=${fs.readFileSync(path.resolve('apps/mobile/ml', file), 'utf8')};`);
  let js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  js = js.replace(/from '(\.[^']+)'/g, (_, file) => `from '${file === './bayaModel' ? './bayaModel.web' : file}.js'`);
  modules.set('/ml/' + name + '.js', js);
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  if (url === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<script type="importmap">{"imports":{"@litertjs/core":"/core.js","@litertjs/wasm-utils":"/utils.js"}}</script>'); return; }
  if (modules.has(url)) { res.setHeader('Content-Type', 'text/javascript'); res.end(modules.get(url)); return; }
  const file = url.startsWith('/fixtures/') ? `apps/mobile/ml/__tests__/fixtures/resnet18-spatial-v1/${url.slice(10)}` : url === '/core.js' ? 'node_modules/@litertjs/core/dist/index.js'
    : url === '/utils.js' ? 'node_modules/@litertjs/wasm-utils/dist/index.js'
    : url.startsWith('/wasm/') ? `node_modules/@litertjs/core${url}`
    : `apps/mobile/public${url}`;
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await openTestBrowser(server.address().port);
let ws;
try {
  ws = new WebSocket(browser.target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const v = JSON.parse(e.data); pending.get(v.id)?.(v); pending.delete(v.id); };
  const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  await delay(500);
  const report = [];
  for (const backend of ['webgpu', 'wasm']) {
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` }); await delay(300);
    const result = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `(async()=>{
      window.__DEV__=true;
      if (${JSON.stringify(backend)}==='wasm') Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true});
      const service=await import('/ml/bayaModel.web.js');
      const rt=await import('@litertjs/core');
      const prep=await import('/ml/bayaPreprocessing.js');
      const recognition=await import('/ml/writingRecognition.js');
      const reference=await (await fetch('/fixtures/reference.json')).json();
      const start=performance.now();const loaded=await service.getBayaModel();const loadMs=performance.now()-start;
      const runtimeInitializationMs=loaded.runtimeInitializationMs;
      const rows=[]; let firstInferenceMs;
      for(const sample of reference.samples){
        const rgba=new Uint8Array(await(await fetch('/fixtures/'+sample.id+'.rgba')).arrayBuffer());
        const expected=new Float32Array(await(await fetch('/fixtures/'+sample.id+'.f32')).arrayBuffer());
        const image=prep.preprocessBayaImage({width:sample.width,height:sample.height,data:rgba});
        let preprocessingMax=0; for(let i=0;i<image.length;i++)preprocessingMax=Math.max(preprocessingMax,Math.abs(image[i]-expected[i]));
        const input=new rt.Tensor(image,[1,3,160,160]);let outputs=[];const errors={};
        const inferenceStart=performance.now();
        try{outputs=await loaded.model.run(input);
          for(let i=0;i<outputs.length;i++){
            const cpu=await outputs[i].moveTo('wasm');
            const values=Array.from(cpu.toTypedArray());cpu.delete();
            const key=Object.keys(sample.outputs)[i];errors[key]=Math.max(...values.map((v,j)=>Math.abs(v-sample.outputs[key][j])));
          }
        } finally {input.delete();outputs.forEach(o=>{if(!o.deleted)o.delete()});}
        if(firstInferenceMs===undefined)firstInferenceMs=performance.now()-inferenceStart;
        const decoded=await service.runBayaSpatialInference(image);
        rows.push({id:sample.id,preprocessingMax,errors,primary:decoded.primary,base:decoded.base,modifier:decoded.modifier,kudlit:decoded.kudlit,bodyBbox:decoded.bodyBbox});
      }
      const benchmark=await service.runBayaBenchmark();
      const strokes=[Array.from({length:51},(_,i)=>({x:.2+.6*i/50,y:.5+.2*Math.sin(i/50*Math.PI*3)}))];
      const writing=await recognition.recognizeWriting(strokes,{width:640,height:320});
      const detail=d=>({name:d.name,dtype:d.dtype,shape:Array.from(d.shape)});
      const modelResource=performance.getEntriesByType('resource').find(r=>r.name.endsWith('.tflite'));
      const result={physicalDevice:${browser.physical},userAgent:navigator.userAgent,dpr:devicePixelRatio,requestedBackend:${JSON.stringify(backend)},backend:loaded.backend,runtimeInitializationMs,loadMs,firstInferenceMs,downloadMs:modelResource?.duration,transferredBytes:modelResource?.transferSize,benchmark,rows,writing,inputs:loaded.model.getInputDetails().map(detail),outputs:loaded.model.getOutputDetails().map(detail),memory:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize}:null};
      if(loaded.backend==='webgpu') {
        rt.getWebGpuDevice()?.destroy();
        try {await service.runBayaSpatialInference(new Float32Array(76800));result.deviceLoss={recovered:true,backend:(await service.getBayaModel()).backend};}
        catch(error){result.deviceLoss={recovered:false,error:String(error)};}
      }
      await service.disposeBayaModel();result.disposed=loaded.model.deleted;
      result.cycles=[];
      for(let i=0;i<3;i++){const start=performance.now();const m=await service.getBayaModel();await service.runBayaSpatialInference(new Float32Array(76800));await service.disposeBayaModel();result.cycles.push({ms:performance.now()-start,disposed:m.model.deleted});}
      return result;
    })()` });
    if (result.error || result.result.exceptionDetails) throw Error(JSON.stringify(result));
    report.push(result.result.result.value);
  }
  fs.writeFileSync(out + '/browser-parity.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.map(r=>({backend:r.backend,loadMs:r.loadMs,benchmark:r.benchmark,maxPreprocessingError:Math.max(...r.rows.map(s=>s.preprocessingMax)),maxOutputError:Math.max(...r.rows.flatMap(s=>Object.values(s.errors))),disposed:r.disposed}))));
  if(report.some(r=>!r.disposed||r.rows.some(s=>s.preprocessingMax!==0||Object.values(s.errors).some(v=>v>0.001))))throw Error('Browser parity failed');

} finally { ws?.close(); await browser.close(); server.close(); }
