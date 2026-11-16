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
const out = 'docs/verification/compliance-12';
fs.mkdirSync(out, { recursive: true });
const contract = JSON.parse(fs.readFileSync('apps/mobile/ml/bayaActiveModel.json'));
const modules = new Map();
for (const name of ['ml/BayaModelError','ml/bayaProbabilities','ml/bayaModelConfig','ml/bayaModel.web','ml/bayaClassLabels','ml/inkImagePreprocessing','ml/bayaPreprocessing','ml/writingRecognition','ml/recognitionReliability','content/writingMastery','content/writingCanvasValidation']) {
  let source = fs.readFileSync(`apps/mobile/${name}.ts`, 'utf8');
  if (name === 'ml/bayaModelConfig') source = source.replace("import contract from './bayaActiveModel.json';", `const contract=${JSON.stringify(contract)};`);
  let js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  js = js.replace(/from '(\.[^']+)'/g, (_, s) => `from '${s === './bayaModel' ? './bayaModel.web' : s}.js'`);
  modules.set('/'+name+'.js', js);
}
// Fixed generator and split assignment are declared before inference. No fitting on either split.
const line = (fn, n=61) => Array.from({length:n}, (_,i)=>({x:fn(i/(n-1))[0], y:fn(i/(n-1))[1]}));
const shapes = {
  wave: [line(t=>[.2+.6*t,.5+.2*Math.sin(t*Math.PI*3)],51)],
  circle: [line(t=>[.5+.25*Math.cos(t*2*Math.PI),.5+.25*Math.sin(t*2*Math.PI)])],
  zigzag: [line(t=>[.2+.6*t,.3+.4*Math.abs((t*6)%2-1)])],
  scribble: [line(t=>[.5+.28*Math.sin(21*t),.5+.28*Math.sin(37*t)],121)],
  random_lines: [[{x:.2,y:.3},{x:.7,y:.6},{x:.3,y:.8}], [{x:.8,y:.2},{x:.4,y:.7},{x:.75,y:.4}]],
  cross: [line(t=>[.25+.5*t,.25+.5*t]),line(t=>[.75-.5*t,.25+.5*t])],
  geometric: [[{x:.2,y:.2},{x:.8,y:.2},{x:.8,y:.8},{x:.2,y:.8},{x:.2,y:.2}]],
  other_doodle: [line(t=>[.5+.28*t*Math.cos(6*Math.PI*t),.5+.28*t*Math.sin(6*Math.PI*t)],121)],
};
const cases=[];
for (const [category, original] of Object.entries(shapes)) for(let variant=0;variant<12;variant++) {
  const angle=[0,-.14,.14][variant%3], scale=[1,.65,1.15][Math.floor(variant/3)%3];
  let strokes=original.map(s=>s.map(p=>{const x=(p.x-.5)*scale,y=(p.y-.5)*scale;return {x:.5+x*Math.cos(angle)-y*Math.sin(angle)+(variant===9?.08:0), y:.5+x*Math.sin(angle)+y*Math.cos(angle)+(variant===10?-.08:0)}}));
  if(variant===11) strokes=strokes.reverse().map(s=>s.reverse());
  cases.push({id:`${category}-${variant}`,category,variant,split:variant%2?'held-out-synthetic':'development-synthetic',strokes,geometry:{width:640,height:320}});
}
fs.writeFileSync(out+'/synthetic-manifest.json',JSON.stringify({provenance:'Procedural authored test fixtures, no human samples; shape labels denote generator intent, overlap with valid characters is possible.',cases},null,2));
const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost').pathname;
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  if(u==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>BAYA reliability diagnostics</title>');return;}
  if(modules.has(u)){res.setHeader('Content-Type','text/javascript');res.end(modules.get(u));return;}
  let file;
  if(u.startsWith('/ort/')||u===contract.modelUrl) file=path.resolve('apps/mobile/public','.'+u);
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
  const result=await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
    window.__DEV__=false;
    const {prepareBayaInputs}=await import('/ml/writingRecognition.js');
    const {preprocessBayaImage}=await import('/ml/bayaPreprocessing.js');
    const {runBayaInference}=await import('/ml/bayaModel.web.js');
    const {assessRecognition}=await import('/ml/recognitionReliability.js');
    const {validWritingCanvas}=await import('/content/writingCanvasValidation.js');
    const {isValidWritingResult}=await import('/content/writingMastery.js');
    const labels=${JSON.stringify(contract.orderedLabels)},rows=[];
    await runBayaInference(new Float32Array(96*96));
    async function evaluate(c,image){
      const start=performance.now(),scores=Array.from(await runBayaInference(image)),ms=performance.now()-start;
      const ranked=scores.map((probability,classIndex)=>({probability,classIndex,label:labels[classIndex]})).sort((a,b)=>b.probability-a.probability||a.classIndex-b.classIndex);
      const decision=assessRecognition(ranked),top=ranked[0];
      const tensorSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',image.buffer)),b=>b.toString(16).padStart(2,'0')).join('');
      rows.push({...c,strokes:undefined,tensorSha256,probabilities:scores,top,decision,ms,entropy:-scores.reduce((s,p)=>s+(p?p*Math.log(p):0),0),margin:top.probability-ranked[1].probability,
        acceptedTargets:labels.filter(t=>decision.status==='recognized'&&isValidWritingResult(t,ranked)),beforeAcceptedTargets:labels.filter(t=>isValidWritingResult(t,ranked))});
    }
    for(const c of ${JSON.stringify(cases)}){await evaluate({...c,inputUsable:validWritingCanvas(c.strokes,c.geometry)},prepareBayaInputs(c.strokes,c.geometry).imageData)}
    for(const label of labels){const image=new Image();image.src='/guide/'+label+'.png';await image.decode();const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,256,256);ctx.drawImage(image,0,0,256,256);await evaluate({id:'reference-'+label,category:'bundled-reference',expectedLabel:label,split:'diagnostic-only'},preprocessBayaImage(ctx.getImageData(0,0,256,256)))}
    return {rows,userAgent:navigator.userAgent,memory:performance.memory?{usedJSHeapSize:performance.memory.usedJSHeapSize}:null};
  })()`});
  if(result.error||result.result.exceptionDetails)throw Error(JSON.stringify(result));
  const data=result.result.result.value;
  const digest=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  const report={createdAt:new Date().toISOString(),modelSha256:digest('apps/mobile/public'+contract.modelUrl),policy:'existing 0.8 threshold; no OOD detector enabled',datasetLimitations:'No independent writer/child holdout, no original dataset. Reference art is not handwriting. Synthetic families overlap with possible characters; no production detector calibrated or selected.',...data};
  fs.writeFileSync(out+'/real-model-results.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({rows:data.rows.length,modelSha256:report.modelSha256,wave:data.rows[0],referencesCorrect:data.rows.filter(r=>r.expectedLabel&&r.top.label===r.expectedLabel).length}));
} finally {ws?.close();chrome.kill();server.close();}
