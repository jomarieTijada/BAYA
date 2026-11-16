import { validateManifest, summarize, sha256 } from './evaluation.mjs';
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
const diagnostic = process.argv.includes('--diagnostic');
const manifestFile = diagnostic ? null : process.argv[2];
if (!diagnostic && !manifestFile) throw Error('Usage: node scripts/testing/compliance-12-validation/run.mjs <reviewed-manifest.json> [output-directory] OR --diagnostic');
const out = diagnostic ? 'docs/verification/compliance-12/validation/diagnostic' : path.resolve(process.argv[3] || 'docs/verification/compliance-12/validation/reviewed');
let inputs;
if (diagnostic) {
  const existing = JSON.parse(fs.readFileSync('docs/verification/compliance-12/synthetic-manifest.json')).cases;
  inputs = existing.map(r => ({id:r.id,category:r.category,kind:'strokes',target:'ha',payload:{strokes:r.strokes,geometry:r.geometry},provenance:'Existing unreviewed procedural diagnostic; NOT invalid ground truth'}));
  const labels = JSON.parse(fs.readFileSync('apps/mobile/public/models/baya/id_to_label.json'));
  for (const label of Object.values(labels)) inputs.push({id:'reference-'+label,category:'reference-art',kind:'image',file:path.resolve('apps/mobile/assets/illustrations/baybayin/guides-1024/'+label+'.png'),referenceLabel:label,provenance:'Bundled reference art; NOT real handwriting ground truth'});
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestFile));
  const labels = Object.values(JSON.parse(fs.readFileSync('apps/mobile/public/models/baya/id_to_label.json')));
  inputs = validateManifest(manifest, path.dirname(path.resolve(manifestFile)), labels);
}
const thresholds = JSON.parse(fs.readFileSync('apps/mobile/public/models/baya/validity_thresholds_research.json'));
const frozenRun = {purpose:diagnostic?'diagnostic-not-validation':'independent-validation',manifestSha256:diagnostic?null:sha256(fs.readFileSync(manifestFile)),thresholds,thresholdSha256:sha256(JSON.stringify(thresholds)),startedAt:new Date().toISOString()};
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(out+'/frozen-run.json',JSON.stringify(frozenRun,null,2));
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
  if (/^\/sample\/\d+$/.test(u)) { const r=inputs[Number(u.split('/').at(-1))]; if(r?.kind==='image'){res.setHeader('Content-Type','image/png');fs.createReadStream(r.file).pipe(res);return;} }
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
  const safeInputs=inputs.map((r,i)=>({...r,file:undefined,url:'/sample/'+i}));
  const result=await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
    window.__DEV__=false; window.process={env:{}};
    const service=await import('/ml/bayaModel.web.js');
    const {preprocessBayaImage}=await import('/ml/bayaPreprocessing.js');
    const {prepareBayaInputs,recognizeWriting}=await import('/ml/writingRecognition.js');
    const {decodeValidity}=await import('/ml/validityDetector.js');
    const {assessRecognition,canAwardWritingMastery}=await import('/ml/recognitionReliability.js');
    const {validWritingCanvas}=await import('/content/writingCanvasValidation.js');
    const {nextValidCount}=await import('/content/writingMastery.js');
    const labels=${JSON.stringify(contract.orderedLabels)}, rows=[];
    for(const item of ${JSON.stringify(safeInputs)}) {
      let image,sufficient=null;
      try {
      if(item.kind==='strokes') { const {strokes,geometry}=item.payload; sufficient=validWritingCanvas(strokes,geometry); if(!sufficient){rows.push({...item,payload:undefined,url:undefined,sufficient:false,band:'not-evaluated',status:'insufficient-input',masteryWithoutGate:false,masteryWithGate:false});continue;} image=prepareBayaInputs(strokes,geometry).imageData; }
      else { const source=new Image();source.src=item.url;await source.decode(); const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);image=preprocessBayaImage(ctx.getImageData(0,0,canvas.width,canvas.height)); }
      const scores=Array.from(await service.runBayaInference(image)),index=scores.indexOf(Math.max(...scores));
      const top={label:labels[index],classIndex:index,probability:scores[index]}, validity=decodeValidity(await service.runBayaValidityInference(image));
      const decision=assessRecognition([top]);
      const award=target=>sufficient===null?null:canAwardWritingMastery({strokes:item.payload.strokes,geometry:item.payload.geometry,target,decision});
      const masteryWithoutGate=item.target?award(item.target):null;
      const targetMatchedDiagnostic=award(top.label);
      const tensorSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',image.buffer)),b=>b.toString(16).padStart(2,'0')).join('');
      const row={...item,payload:undefined,url:undefined,sufficient,tensorSha256,top,validityScore:validity.score,band:validity.band,masteryWithoutGate,masteryWithGate:masteryWithoutGate===null?null:masteryWithoutGate&&validity.band==='pass',targetMatchedDiagnostic};
      if(item.id==='wave-0') {
        const actual=await recognizeWriting(item.payload.strokes,item.payload.geometry,1);
        window.__DEV__=true;window.process.env.EXPO_PUBLIC_BAYA_EXPERIMENTAL_VALIDITY='true';
        try { row.experimentalPipeline={status:'recognized',prediction:await recognizeWriting(item.payload.strokes,item.payload.geometry,1)}; } catch(e) {row.experimentalPipeline={status:e.code};}
        window.__DEV__=false;delete window.process.env.EXPO_PUBLIC_BAYA_EXPERIMENTAL_VALIDITY;
        row.productionPipeline=actual;row.twoIndependentEligibleAttempts=nextValidCount(nextValidCount(0,targetMatchedDiagnostic),targetMatchedDiagnostic);row.wrongTargetAward=award(top.label==='a'?'ha':'a');
      }
      rows.push(row);
      } catch(error) { rows.push({...item,payload:undefined,url:undefined,sufficient,status:'error',error:String(error),band:'not-evaluated',masteryWithoutGate:item.kind==='strokes'?false:null,masteryWithGate:item.kind==='strokes'?false:null}); }
    }
    return {rows,userAgent:navigator.userAgent,productionGateEnabled:false};
  })()`});
  if(result.error||result.result.exceptionDetails)throw Error(JSON.stringify(result));
  const data=result.result.result.value;
  const duplicateGroups=new Map();
  for(const r of data.rows){if(!r.tensorSha256)continue;const a=duplicateGroups.get(r.tensorSha256)||[];a.push(r);duplicateGroups.set(r.tensorSha256,a);}
  const duplicateTensors=[...duplicateGroups.values()].filter(a=>a.length>1).map(a=>a.map(r=>r.id));
  if(!diagnostic && [...duplicateGroups.values()].some(a=>new Set(a.map(r=>r.split)).size>1))throw Error('Cross-split decoded/preprocessed input duplication; holdout evaluation invalid');
  const report={...frozenRun,...data,duplicateTensors,models:Object.fromEntries(['character','validity'].map(k=>[k,sha256(fs.readFileSync('apps/mobile/public/models/baya/baya_'+k+'.onnx'))])),metrics:diagnostic?null:summarize(data.rows),productionApproval:false};
  fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));
  if(data.rows.some(r=>r.status==='error')) process.exitCode=1;
  console.log(JSON.stringify({samples:data.rows.length,wave:data.rows.find(r=>r.id==='wave-0'),metrics:report.metrics,duplicateTensors,productionApproval:false}));
} finally {ws?.close();chrome.kill();server.close();}
