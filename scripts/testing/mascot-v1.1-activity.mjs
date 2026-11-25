import fs from 'node:fs';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {openTestBrowser} from './device-browser.mjs';
const out='docs/animations', base='http://127.0.0.1:5082';
const report={checks:[], errors:[], physical:false};
const browser=await openTestBrowser(5082);
let ws;
try {
  ws=new WebSocket(browser.target.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
  let id=0; const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result)}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
  const wait=async exp=>{for(let i=0;i<600;i++){if(await ev(exp))return;await delay(100)}throw Error('Timeout '+exp)};
  const check=(name,detail)=>{report.checks.push({name,status:'PASS',detail});console.log('PASS',name)};
  const snap=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${out}/${name}.png`,Buffer.from(r.data,'base64'))};
  const nav=async route=>{await send('Page.navigate',{url:base+route});await wait(`document.readyState==='complete'&&!!document.querySelector('[role=button]')`);await delay(400)};
  const mascot=`document.querySelector('[data-testid="baya-mascot"] img')`;
  const sample=()=>ev(`new Promise(resolve=>{const samples=[];let n=0;const timer=setInterval(()=>requestAnimationFrame(()=>{const el=${mascot};const r=el?.parentElement.getBoundingClientRect();samples.push({src:el?.src,loaded:!!el?.naturalWidth,box:r&&[r.x,r.y,r.width,r.height]});if(++n===180){clearInterval(timer);resolve(samples)}}),60)})`);
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:false});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__modules.learner=id;return value(factory,id,...args)}}});`});
  await nav('/learner/setup');
  await wait(`__modules.learner!==undefined`);
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Mascot Activity QA')`);
  await ev(`(async()=>{for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');
  await wait(`!!document.querySelector('[data-testid="baya-mascot"] img')`);
  await delay(700);await snap('activity-verified');
  const details=await ev(`({path:location.pathname,text:document.body.innerText,mascots:[...document.querySelectorAll('[data-testid="baya-mascot"] img')].map(e=>({src:e.src,loaded:e.complete&&e.naturalWidth>0}))})`);
  assert(details.mascots.every(m=>m.loaded&&m.src.includes('/animations/v1.1/')));check('Activity mascot uses v1.1',details);
  const exported=fs.readdirSync('apps/mobile/dist/assets/assets/branding/baya-web/animations/v1.1/blink');
  report.exportedBlinkFiles=exported;
} catch(e){report.errors.push(String(e.stack));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/activity-browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
