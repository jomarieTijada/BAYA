// Isolated Chromium profile, local export, real SW/SQLite. Never touches user data.
// node scripts/optimization/browser-benchmark.mjs EXPORT LABEL [RUNS=3]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from '../testing/device-browser.mjs';

const root=path.resolve(process.argv[2]);
const label=process.argv[3];
const out=path.resolve('docs/optimization/browser',label);
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.wasm':'application/wasm','.ttf':'font/ttf','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml','.m4a':'audio/mp4','.mp4':'video/mp4','.css':'text/css','.ico':'image/x-icon'};
const served=new Map();
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost').pathname;
  let file=path.resolve(root,'.'+decodeURIComponent(url));
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
  if(url==='/'||(!path.extname(url)&&!/^\/(assets|_expo|models|litert)\//.test(url)))file=path.join(root,'index.html');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  if(!served.has(file)){const raw=fs.readFileSync(file);served.set(file,{raw,gzip:zlib.gzipSync(raw,{level:6})});}
  const compressed=/gzip/.test(req.headers['accept-encoding']??'');
  const body=served.get(file)[compressed?'gzip':'raw'];
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-cache','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'credentialless',...(compressed?{'Content-Encoding':'gzip'}:{})});res.end(body);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port,base=`http://127.0.0.1:${port}`;
const runs=[];
try {
for(let run=0;run<Number(process.argv[4]??3);run++){
 const browser=await openTestBrowser(port);let ws;
 const report={run,physical:browser.physical,transport:'localhost HTTP gzip level 6, no bandwidth throttling; timings are not field performance',failures:[]};
 try {
  ws=new WebSocket(browser.target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  let id=0;const pending=new Map();const network=[];const responses=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Network.loadingFinished')network.push(m.params);else if(m.method==='Network.responseReceived')responses.push(m.params);};
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const wait=async(expr,timeout=120000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await ev(`Boolean(${expr})`))return;await delay(100);}throw Error('Timeout '+expr);};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  if(process.env.BAYA_FORCE_WASM==='1')await send('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(navigator,'gpu',{get:()=>undefined});"});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__qa={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__qa.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__qa.db=id;if(s.includes('Could not initialize the local LiteRT runtime'))__qa.model=id;if(s.includes('BAYA drawing capture is available'))__qa.recognition=id;return value(factory,id,...args)}}});`});
  const start=Date.now();await send('Page.navigate',{url:base+'/learner/setup'});
  await wait("document.querySelector('[role=button],[role=radio]')");
  report.usableInterfaceMs=Date.now()-start;
  report.pageTransferAtUsableBytes=network.reduce((s,r)=>s+r.encodedDataLength,0);
  report.pageRequestsAtUsable=network.length;
  await wait('navigator.serviceWorker.controller');
  report.offlineReadyMs=Date.now()-start;
  report.ready=await ev(`new Promise((resolve,reject)=>{const ch=new MessageChannel();const t=setTimeout(()=>reject(Error('readiness timeout')),10000);ch.port1.onmessage=e=>{clearTimeout(t);resolve(e.data)};navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[ch.port2])})`);
  assert(report.ready.ready);
  report.cache=await ev(`(async()=>{const name=(await caches.keys()).find(n=>n.startsWith('baya-pwa-'));const c=await caches.open(name);const keys=await c.keys();let bytes=0;for(const k of keys)bytes+=(await(await c.match(k)).arrayBuffer()).byteLength;return{name,bytes,count:keys.length,urls:keys.map(k=>new URL(k.url).pathname)}})()`);
  report.pageNetwork=responses.map(r=>({url:r.response.url,status:r.response.status,fromServiceWorker:r.response.fromServiceWorker}));
  await wait('__qa.learner!==undefined');await ev(`__r(__qa.learner).localLearnerService.saveProfile('Asset optimization isolated test')`);
  await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  report.offlineRoutes=[];
  for(const [route,selector] of [['/learner/home','[data-testid=continue-lesson-hero]'],['/learner/lessons','[role=button]'],['/learner/activities/topic-1-2','[data-testid=storybook-topic-screen]'],['/learner/activities/topic-2-1','[data-testid=character-glyph]'],['/learner/activities/topic-3-1','[data-testid=writing-canvas]']]){
    await send('Page.navigate',{url:base+route});await wait(`document.querySelector(${JSON.stringify(selector)})`);
    await delay(200);report.offlineRoutes.push({route,offline:await ev('!navigator.onLine'),text:await ev('document.body.innerText')});
  }
  if(run===0){
   report.images=await ev(`(async()=>{const urls=${JSON.stringify(report.cache.urls.filter(u=>/\.(png|jpg|jpeg|webp|avif)$/.test(u)))};const results=[];for(const url of urls){const start=performance.now();const im=new Image();im.src=url;try{await im.decode();results.push({url,width:im.naturalWidth,height:im.naturalHeight,decodeMs:performance.now()-start,ok:true})}catch(e){results.push({url,ok:false,error:String(e)})}}return results})()`);
   assert(report.images.every(r=>r.ok));
   report.audio=await ev(`(async()=>{const ctx=new AudioContext();const results=[];for(const url of ${JSON.stringify(report.cache.urls.filter(u=>u.endsWith('.m4a')))}){try{const b=await(await fetch(url)).arrayBuffer();const a=await ctx.decodeAudioData(b);results.push({url,duration:a.duration,ok:true})}catch(e){results.push({url,ok:false,error:String(e)})}}await ctx.close();return results})()`);
   assert(report.audio.every(r=>r.ok));
   report.playback=[];
   for(const url of report.cache.urls.filter(u=>/baya-(a-ba|e-be|i-bi)\./.test(u))){
    report.playback.push(await ev(`new Promise(async(resolve,reject)=>{const a=new Audio(${JSON.stringify(url)});const t=setTimeout(()=>{a.pause();reject(Error('playback timeout'))},15000);a.onended=()=>{clearTimeout(t);resolve({url:a.src,ended:true,duration:a.duration});a.removeAttribute('src');a.load()};a.onerror=()=>{clearTimeout(t);reject(Error('audio error'))};try{await a.play()}catch(e){clearTimeout(t);reject(e)}})`));
   }
   assert.equal(report.playback.length,3);
   await wait('__qa.recognition!==undefined');
   report.inference=await ev(`(async()=>{const strokes=[Array.from({length:51},(_,i)=>({x:.2+.6*i/50,y:.5+.2*Math.sin(i/50*Math.PI*3)}))];const start=performance.now();const predictions=await __r(__qa.recognition).recognizeWriting(strokes,{width:640,height:320});const model=await __r(__qa.model).getBayaModel();return{predictions,backend:model.backend,ms:performance.now()-start,offline:!navigator.onLine}})()`);
   assert(report.inference.predictions.length>0);
   await ev(`__r(__qa.learner).localLearnerService.completeTopic('topic-1-1')`);
   const rows=`(async()=>{const db=await __r(__qa.db).getReadyDatabase();return{profile:await __r(__qa.learner).localLearnerService.getActiveLearner(),progress:await db.getAllAsync('SELECT lesson_id,status FROM learner_progress')}})()`;
   const saved=await ev(rows);await send('Page.reload');await wait("document.querySelector('[data-testid=writing-canvas]')");assert.deepEqual(await ev(rows),saved);report.sqlitePersistence=true;
   await send('Page.navigate',{url:base+'/learner/settings'});await wait("document.querySelector('[role=radio]')");
   report.locales=[];
   for(const lang of ['English','Tagalog']){
    const selected=await ev(`(()=>{const e=document.querySelector('[role=radio][aria-label="${lang}"]');if(!e)return false;e.click();return true})()`);assert(selected);await delay(200);report.locales.push({lang,text:await ev('document.body.innerText')});
   }
   await ev("document.querySelector('[data-testid=storybook-settings-trigger]').click()");await wait("document.querySelector('[data-testid=origin-storybook]')");
   report.originStory=[];
   for(let page=0;page<5;page++){
    await delay(800);
    const state=await ev("({page:document.querySelector('[data-testid=origin-progress]').getAttribute('aria-valuenow'),images:[...document.querySelectorAll('[data-testid=origin-storybook] img')].map(i=>({src:i.src,ok:i.complete&&i.naturalWidth>0})),text:document.querySelector('[data-testid=origin-reading]').innerText})");
    assert(state.images.every(i=>i.ok));assert.equal(Number(state.page),(page+1)*20);report.originStory.push(state);
    if(page===2){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'origin-learning.png'),Buffer.from(shot.data,'base64'));}
    await ev("[...document.querySelectorAll('[data-testid=origin-storybook] [role=button]')].at(-1).click()");
   }
   for(const [width,height] of [[1280,800],[844,390],[390,844]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1000});await send('Page.navigate',{url:base+'/learner/activities/topic-1-2'});await wait("document.querySelector('[data-testid=storybook-topic-screen]')");await delay(400);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,`storybook-${width}.png`),Buffer.from(shot.data,'base64'));
   }
   await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});assert.deepEqual(await ev(rows),saved);report.reconnectPreservesProgress=true;
  }
 }catch(e){report.failures.push(String(e));process.exitCode=1;console.error(e);}finally{runs.push(report);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(runs,null,2));ws?.close();await browser.close();}
 console.log(label,run,JSON.stringify({usable:runs.at(-1).usableInterfaceMs,ready:runs.at(-1).offlineReadyMs,cache:runs.at(-1).cache?.bytes,failures:runs.at(-1).failures}));
}
}finally{server.close();}
