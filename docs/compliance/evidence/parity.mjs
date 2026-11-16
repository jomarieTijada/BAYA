// Local-only diagnostic, real production capture/preprocessing/model/policy.
// Synthetic shapes and bundled reference art are NOT an independent handwriting dataset.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import ts from 'typescript';
const out = 'docs/compliance/evidence/parity';
fs.mkdirSync(out, { recursive: true });
const contract = JSON.parse(fs.readFileSync('apps/mobile/ml/bayaActiveModel.json'));
const modules = new Map();
for (const name of ['ml/validityDetector','ml/BayaModelError','ml/bayaProbabilities','ml/bayaModelConfig','ml/bayaModel.web','ml/bayaClassLabels','ml/inkImagePreprocessing','ml/bayaPreprocessing','ml/writingRecognition','ml/recognitionReliability','content/writingMastery','content/writingCanvasValidation']) {
  let source = fs.readFileSync(`apps/mobile/${name}.ts`, 'utf8');
  source = source.replace(/import (\w+) from '([^']+\.json)';/g, (_, binding, file) => `const ${binding}=${fs.readFileSync(path.resolve('apps/mobile', path.dirname(name), file), 'utf8')};`);
  let js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  js = js.replace(/from '(\.[^']+)'/g, (_, s) => `from '${s === './bayaModel' ? './bayaModel.web' : s}.js'`);
  modules.set('/'+name+'.js', js);
}
const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost').pathname;
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  if(u==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>BAYA reliability diagnostics</title>');return;}
  if(modules.has(u)){res.setHeader('Content-Type','text/javascript');res.end(modules.get(u));return;}
  let file;
  if(u.startsWith('/ort/')||u.startsWith('/models/baya/')) file=path.resolve('apps/mobile/public','.'+u);
  else if(u.startsWith('/fixtures/')) file=path.resolve('apps/mobile/ml/__tests__/fixtures/imagenet-finetune-1.0',u.slice('/fixtures/'.length));
  else if(/^\/guide\/[a-z_]+\.png$/.test(u)) file=path.resolve('apps/mobile/assets/illustrations/baybayin/guides-1024',u.split('/').at(-1));
  if(!file||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',file.endsWith('.wasm')?'application/wasm':/\.(mjs|js)$/.test(file)?'text/javascript':'application/octet-stream');fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'baya-reliability-'));
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
let ws;
try {
  const portFile=path.join(profile,'DevToolsActivePort');for(let i=0;!fs.existsSync(portFile)&&i<100;i++)await delay(100);
  const debug=fs.readFileSync(portFile,'utf8').split('\n')[0];const targets=await(await fetch(`http://127.0.0.1:${debug}/json/list`)).json();
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  let id=0;const pending=new Map();ws.onmessage=e=>{const v=JSON.parse(e.data);pending.get(v.id)?.(v);pending.delete(v.id)};
  const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
  await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});await delay(500);
  const reference=JSON.parse(fs.readFileSync(out+'/python-reference.json'));
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:2,mobile:true});
  const result=await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
    window.__DEV__=true; window.process={env:{}};
    const service=await import('/ml/bayaModel.web.js');
    const {preprocessBayaImage}=await import('/ml/bayaPreprocessing.js');
    const {recognizeWriting}=await import('/ml/writingRecognition.js');
    const {experimentalValidityEnabled}=await import('/ml/validityDetector.js');
    let start=performance.now(); await service.runBayaInference(new Float32Array(9216)); const characterColdMs=performance.now()-start;
    const validityNotDownloadedByDefault=!performance.getEntriesByType('resource').some(r=>r.name.includes('baya_validity'));
    start=performance.now(); await service.runBayaValidityInference(new Float32Array(9216)); const validityColdMs=performance.now()-start;
    const rows=[];
    for(const sample of ${JSON.stringify(reference.samples)}) {
      const data=new Uint8Array(await (await fetch('/fixtures/'+sample.id+'/input.rgba')).arrayBuffer());
      const expected=new Float32Array(await (await fetch('/fixtures/'+sample.id+'/image.f32')).arrayBuffer());
      const image=preprocessBayaImage({width:sample.width,height:sample.height,data});
      const preprocessingMax=Math.max(...image.map((v,i)=>Math.abs(v-expected[i])));
      start=performance.now(); const actual=Array.from(await service.runBayaInference(image)); const characterMs=performance.now()-start;
      start=performance.now(); const validity=await service.runBayaValidityInference(image); const validityMs=performance.now()-start;
      const top=actual.indexOf(Math.max(...actual)), refTop=sample.character.indexOf(Math.max(...sample.character));
      rows.push({id:sample.id,preprocessingMax,characterMax:Math.max(...actual.map((v,i)=>Math.abs(v-sample.character[i]))),validityDifference:Math.abs(validity-sample.validity[0]),topMatches:top===refTop,characterMs,validityMs});
    }
    const strokes=[Array.from({length:51},(_,i)=>({x:.2+.6*i/50,y:.5+.2*Math.sin(i/50*Math.PI*3)}))];
    const wave=await recognizeWriting(strokes,{width:640,height:320},1);
    const smoke=await service.runBayaSmokeTest();
    window.__DEV__=false; window.process.env.EXPO_PUBLIC_BAYA_EXPERIMENTAL_VALIDITY='true';
    const productionGateEnabled=experimentalValidityEnabled();
    window.__DEV__=true; delete window.process.env.EXPO_PUBLIC_BAYA_EXPERIMENTAL_VALIDITY;
    const resources=performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.onnx')).map(r=>r.name);
    return {productionGateEnabled,rows,characterColdMs,validityColdMs,validityNotDownloadedByDefault,gateEnabled:experimentalValidityEnabled(),wave,smoke,modelRequests:resources,userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight}};
  })()`});
  if(result.error||result.result.exceptionDetails)throw Error(JSON.stringify(result));
  const data=result.result.result.value;
  fs.writeFileSync(out+'/browser-parity.json',JSON.stringify(data,null,2));
  if(data.rows.some(r=>r.preprocessingMax!==0||r.characterMax>1e-5||r.validityDifference>1e-5||!r.topMatches)||!data.validityNotDownloadedByDefault||data.gateEnabled||data.productionGateEnabled||data.modelRequests.length!==2)throw Error('Parity or lazy loading failed');
  console.log(JSON.stringify({samples:data.rows.length,characterColdMs:data.characterColdMs,validityColdMs:data.validityColdMs,characterMeanMs:data.rows.reduce((s,r)=>s+r.characterMs,0)/data.rows.length,validityMeanMs:data.rows.reduce((s,r)=>s+r.validityMs,0)/data.rows.length,wave:data.wave,modelRequests:data.modelRequests,passed:true}));
} finally {ws?.close();chrome.kill();server.close();}
