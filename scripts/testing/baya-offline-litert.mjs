// Tests the supplied live deployment in an isolated profile. Creates only a local QA learner; no mentor or remote account. No predictions are mocked.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { openTestBrowser } from './device-browser.mjs';
import { setTimeout as delay } from 'node:timers/promises';

const out = 'docs/verification/offline-first/litert'+(process.env.BAYA_FORCE_WASM==='1'?'-wasm':'');
fs.mkdirSync(out,{recursive:true});
const faultModel=false;
const browser=await openTestBrowser(5055);
let ws;
const report = { physicalDevice: browser.physical, checks: [], errors: [] };
try {
  ws = new WebSocket(browser.target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const v = JSON.parse(e.data); pending.get(v.id)?.(v); pending.delete(v.id); };
  const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.error || result.result.exceptionDetails) throw Error(JSON.stringify(result));
    return result.result.result.value;
  };
  const wait = async expression => { for (let i = 0; i < 300; i++) { if (await evaluate(expression)) return; await delay(100); } throw Error('Timeout: ' + expression + ' DOM: ' + await evaluate('document.body.innerText')); };
  const base = 'http://127.0.0.1:5055';
  const navigate = async route => { await send('Page.navigate', { url: base + route }); await delay(500); };
  await send('Page.enable');
  if (process.env.BAYA_FORCE_WASM === '1') {
    await send('Page.addScriptToEvaluateOnNewDocument', {source: `Object.defineProperty(navigator,'gpu',{get:()=>undefined});`});
  }
  // Identify shipped Metro exports for diagnostics only. Do not alter factories or model outputs.
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('Could not initialize the local LiteRT runtime'))__modules.model=id;if(s.includes('active_learner_profile_id'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;return value(factory,id,...args)}}});` });
  if (!browser.physical) await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await send('Network.enable');
  await navigate('/learner/setup');
  await wait(`window.__modules?.model!==undefined&&window.__modules?.learner!==undefined&&window.__modules?.db!==undefined`);
  await evaluate(`__r(__modules.learner).localLearnerService.saveProfile('LiteRT isolated test')`);
  await navigate('/learner/activities/topic-3-1');
  await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);
  if (faultModel && process.env.BAYA_VERIFY_RECOVERY === '1') {
    await wait(`navigator.serviceWorker.getRegistrations().then(r=>r.every(x=>!x.installing))`);
    const failed = await evaluate(`(async()=>{let error;try{await __r(__modules.model).preloadBayaModel()}catch(e){error=e.code}return {error,controller:!!navigator.serviceWorker.controller,caches:await caches.keys()}})()`);
    assert.equal(failed.error, 'MODEL_LOAD_FAILED'); assert.equal(failed.controller, false); assert.deepEqual(failed.caches, []);
    report.checks.push({name:'corrupted HTTP 200 model rejected; no partial offline cache',...failed});
    faultModel=false;
    await evaluate(`navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'})`);
  }
  await delay(1000);
  await wait(`!!navigator.serviceWorker.controller`);
  await send('Network.setCacheDisabled', {cacheDisabled:true});
  const cacheInfo = await evaluate(`(async()=>{const names=await caches.keys();const keys=names.length ? await (await caches.open(names[0])).keys():[];let bytes=0;for(const r of keys){const response=await (await caches.open(names[0])).match(r);bytes+=(await response.arrayBuffer()).byteLength;}return {names,urls:keys.map(k=>new URL(k.url).pathname),bytes}})()`);
  // Cache absence is recorded separately from model inference.
  assert(!cacheInfo.urls.some(u => /\.onnx$|\/ort\//.test(u)));
  report.checks.push({ name: 'observed cache inventory (empty is not an installation pass)', ...cacheInfo });
  const inference = async () => evaluate(`(async()=>{const service=__r(__modules.model);const recognition=__r(__modules.recognition);const strokes=[Array.from({length:51},(_,i)=>({x:.2+.6*i/50,y:.5+.2*Math.sin(i/50*Math.PI*3)}))];const start=performance.now();const predictions=await recognition.recognizeWriting(strokes,{width:640,height:320});const loaded=await service.getBayaModel();return {predictions,ms:performance.now()-start,backend:loaded.backend,offline:!navigator.onLine}})()`);
  report.checks.push({ name: 'exported bundle inference online', ...await inference() });
  const countAttempts = () => evaluate(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();return (await db.getFirstAsync('SELECT count(*) AS n FROM activity_attempts')).n})()`);
  const click = labels => evaluate(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>${JSON.stringify(labels)}.includes(e.getAttribute('aria-label')));if(!e)throw Error('Missing button '+${JSON.stringify(labels)});e.click()})()`);
  if (browser.physical) {
    const rect = await evaluate(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`);
    const point = (x,y,id=0) => ({x:rect.x+rect.w*x,y:rect.y+rect.h*y,id});
    const paths = () => evaluate(`JSON.stringify([...document.querySelectorAll('[data-testid=writing-canvas] path')].map(p=>p.getAttribute('d')))`);
    await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(.3,.4)]});
    await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(.4,.5)]});
    const beforeMulti = await paths();
    await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(.4,.5),point(.7,.7,1)]});
    await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(.5,.6),point(.8,.8,1)]});
    await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await paths(),beforeMulti);
    assert.notEqual(beforeMulti,'[]');
    await click(['Clear all strokes','Burahin lahat ng guhit']);
    assert.equal(await paths(),'[]');
    report.checks.push({name:'physical Chrome injected touch draws; secondary touch cannot extend stroke; clear works',passed:true});
  }
  // A synthetic, high-confidence case exercises persistence, not handwriting validity.
  let candidate = await evaluate(`(async()=>{
    const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();
    const curves=[
      Array.from({length:81},(_,i)=>({x:.5+.28*Math.cos(i/80*Math.PI*2),y:.5+.28*Math.sin(i/80*Math.PI*2)})),
      Array.from({length:81},(_,i)=>({x:.5+.28*Math.cos(.5+i/80*Math.PI*1.7),y:.5+.28*Math.sin(.5+i/80*Math.PI*1.7)})),
      Array.from({length:81},(_,i)=>({x:.2+.6*i/80,y:.5+.2*Math.sin(i/80*Math.PI*2)})),
      [{x:.2,y:.2},{x:.5,y:.8},{x:.8,y:.2}],
      [{x:.2,y:.8},{x:.5,y:.2},{x:.8,y:.8}],
      [{x:.2,y:.2},{x:.2,y:.8},{x:.8,y:.8}]
    ];
    const rows=[];
    for(const stroke of curves){const predictions=await __r(__modules.recognition).recognizeWriting([stroke],{width:r.width,height:r.height});rows.push({stroke,prediction:predictions[0]});}
    return rows.sort((a,b)=>b.prediction.probability-a.prediction.probability)[0];
  })()`);
  report.checks.push({ name: 'synthetic persistence candidate (not validity evidence)', prediction: candidate.prediction });
  if (process.env.BAYA_REPLAY_SAMPLE) {
    const samples = JSON.parse(fs.readFileSync(process.env.BAYA_REPLAY_SAMPLE, 'utf8'));
    const sample = samples.find(s => s.label === 'BA');
    assert(sample?.paths?.length);
    // Replay rendered path endpoints; this is an approximate trace, not a new human sample.
    const strokes = sample.paths.map(d => [...d.matchAll(/([MQ])([\d., -]+)/g)].map(m => {
      const n = m[2].split(/[ ,]+/).filter(Boolean).map(Number);
      return {x:n.at(-2)/1000,y:n.at(-1)/1000};
    }));
    candidate = {strokes};
    report.checks.push({name:'approximate recorded BA replay for persistence',source:process.env.BAYA_REPLAY_SAMPLE});
  }
  async function draw() {
    const rect = await evaluate(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`);
    for (const stroke of candidate.strokes ?? [candidate.stroke]) {
    const points = stroke.map(p => ({ x: rect.x + rect.w * p.x, y: rect.y + rect.h * p.y }));
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...points[0], button: 'left', buttons: 1, clickCount: 1 });
    for (const p of points.slice(1)) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...p, button: 'left', buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...points.at(-1), button: 'left', buttons: 0, clickCount: 1 });
    }
    await delay(200);
  }
  async function submit(name) {
    const before = await countAttempts();
    await draw(); await click(['Check your writing', 'Suriin ang isinulat']);
    await wait(`!!document.querySelector('[data-testid=baya-predicted-class]')||/unclear|Hindi malinaw/i.test(document.querySelector('[data-testid=baya-status-message]')?.textContent||'')`);
    const state = await evaluate(`({label:document.querySelector('[data-testid=baya-predicted-class]')?.textContent,status:document.querySelector('[data-testid=baya-status-message]')?.textContent,confidence:document.querySelector('[data-testid=baya-confidence-percentage]')?.textContent})`);
    const after = await countAttempts(); assert.equal(after, before + (state.label ? 1 : 0));
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${out}/${name}.png`, Buffer.from(screenshot.result.data, 'base64'));
    report.checks.push({ name, before, after, ...state });
  }
  await submit('online-ui-submission');
  await click(['Retry writing', 'Ulitin ang pagsulat']);
  await wait(`!document.querySelector('[data-testid=baya-predicted-class]')`);
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await send('Page.reload'); await delay(500);
  await wait(`!!document.querySelector('[data-testid=writing-canvas]')&&__modules.recognition!==undefined`);
  const offline = await inference(); assert(offline.offline); report.checks.push({ name: 'exported bundle offline inference after reload', ...offline });
  await submit('offline-ui-submission');
  await click(['Retry writing', 'Ulitin ang pagsulat']);
  await wait(`!document.querySelector('[data-testid=baya-predicted-class]')`);
  await submit('offline-ui-retry');
  const loaded = await evaluate(`(async()=>{const s=__r(__modules.model);const m=await s.getBayaModel();await s.disposeBayaModel();return m.model.deleted})()`);
  assert(loaded); report.checks.push({ name: 'production model disposal', passed: loaded });
  if (process.env.BAYA_MANUAL === '1') {
    await send('Network.emulateNetworkConditions', { offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1 });
    await click(['Retry writing', 'Ulitin ang pagsulat']);
    report.manual=[];
    console.log('MANUAL READY: draw on the phone; create '+out+'/manual-complete.txt to finish.');
    let last='';
    while(!fs.existsSync(out+'/manual-complete.txt')) {
      const state=await evaluate(`({time:new Date().toISOString(),label:document.querySelector('[data-testid=baya-predicted-class]')?.textContent,status:document.querySelector('[data-testid=baya-status-message]')?.textContent,confidence:document.querySelector('[data-testid=baya-confidence-percentage]')?.textContent,paths:[...document.querySelectorAll('[data-testid=writing-canvas] path')].map(p=>p.getAttribute('d')),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},url:location.pathname})`);
      const key=JSON.stringify([state.label,state.status,state.paths]);
      if(key!==last&&(state.label||state.status)) {report.manual.push(state);fs.writeFileSync(out+'/manual-samples.json',JSON.stringify(report.manual,null,2));last=key;}
      await delay(1000);
    }
  }
  console.log(JSON.stringify(report.checks.map(c => ({ ...c, urls: c.urls?.length }))));
} catch (error) { report.errors.push(String(error)); console.error(error); process.exitCode = 1; }
finally { fs.writeFileSync(`${out}/production-browser.json`, JSON.stringify(report, null, 2)); ws?.close(); await browser.close();  }
