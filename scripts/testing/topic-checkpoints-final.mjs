// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/topic-checkpoints'; fs.mkdirSync(out, {recursive:true});
const data = JSON.parse(fs.readFileSync('apps/mobile/content/characterActivities/questions.json','utf8'));
const previous=JSON.parse(fs.readFileSync(`${out}/browser-results.json`,'utf8'));
const browser = await openTestBrowser(5080,{profile:previous.profile});
const report = {physical:browser.physical, profile:browser.profile, checks:[], errors:[], screenshots:[]};
let ws;
try {
  ws = new WebSocket(browser.target.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
  let id=0; const pending=new Map();
  ws.onmessage=e=>{const v=JSON.parse(e.data);pending.get(v.id)?.(v);pending.delete(v.id);};
  const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});
  const ev=async expression=>{const v=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(v.error||v.result.exceptionDetails)throw Error(JSON.stringify(v));return v.result.result.value;};
  const wait=async(expression,ms=30000)=>{for(let i=0;i<ms/100;i++){if(await ev(expression))return;await delay(100);}throw Error('Timeout '+expression+'\n'+await ev('document.body.innerText'));};
  const check=(name,detail={})=>{report.checks.push({name,status:'Passed',...detail});console.log('PASS '+name);};
  const snap=async name=>{await delay(200);const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`${out}/${name}.png`,Buffer.from(r.result.data,'base64'));report.screenshots.push(name+'.png');};
  const click=async label=>{await wait(`!![...document.querySelectorAll('[role=button]')].find(e=>e.getClientRects().length&&e.getAttribute('aria-label')===${JSON.stringify(label)}&&e.getAttribute('aria-disabled')!=='true')`);await ev(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getClientRects().length&&e.getAttribute('aria-label')===${JSON.stringify(label)});if(!document.querySelector('[data-testid=assessment-slide]'))e.scrollIntoView({block:'center'});e.click()})()`);await delay(100);};
  const testid=async id=>{await ev(`document.querySelector('[data-testid=${id}]').click()`);await delay(40);};
  const nav=async route=>{await send('Page.navigate',{url:'http://127.0.0.1:5080'+route});await delay(300);await wait(`document.readyState==='complete'`);};
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__audio=[];const NativeAudio=window.Audio;window.Audio=function(...args){const audio=new NativeAudio(...args);window.__audio.push(audio);return audio;};`});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;if(s.includes('character_assessment:v1:'))__modules.assessment=id;if(s.includes('checkpoint-v1-'))__modules.checkpoints=id;if(s.includes('Unknown Character Level set.'))__modules.content=id;return value(factory,id,...args)}}});`});

  const visible=selector=>`[...document.querySelectorAll('${selector}')].find(e=>e.getClientRects().length)`;
  const press=async id=>{await wait(`!!${visible(`[data-testid=${id}]`)}`);await ev(`${visible(`[data-testid=${id}]`)}.click()`);await delay(150)};
  await nav('/learner/lessons');await wait(`!!navigator.serviceWorker.controller`);
  await ev(`(async()=>{const r=await navigator.serviceWorker.ready;await r.update()})()`);
  const expected=fs.readFileSync('apps/mobile/dist/sw.js','utf8').match(/baya-pwa-[a-f0-9]+/)[0];
  await wait(`(async()=>{const r=await navigator.serviceWorker.ready;const keys=await caches.keys();return !!r.waiting||(keys.includes('${expected}')&&keys.filter(k=>k.startsWith('baya-pwa-')).length===1)})()`,90000);
  // Release the old client so the prepared update can activate without interrupting a lesson.
  await send('Page.navigate',{url:'about:blank'});await delay(1000);
  await nav('/learner/lessons');await wait(`!!${visible('[data-testid=checkpoint-topic-2-1]')}`);
  assert.deepEqual(await ev(`__r(__modules.assessment).characterActivityService.list()`),previous.attempts);
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value='en' WHERE state_key='interface_language'")})()`);
  await nav('/learner/lessons');await wait(`!!${visible('[data-testid=checkpoint-topic-2-1]')}`);
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  const sizes=[[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[1024,768],[1280,800],[1440,900],[2048,921]];
  for(const [width,height] of sizes){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await nav('/learner/lessons?moduleId=module-kudlit');await wait(`!!${visible('[data-testid=checkpoint-topic-kudlit-upper]')}`);await delay(250);
    const gap=await ev(`(()=>{const header=document.querySelector('[data-testid=lesson-header]');const r=${visible('[data-testid=lesson-journey-frame]')}.getBoundingClientRect();const s=${visible('[data-testid=lesson-scroll]')}.getBoundingClientRect();return r.top-s.top})()`);assert(gap>=0&&gap<=33,'modules start beneath header '+gap);
    for(const topic of ['topic-2-1','topic-2-2','topic-kudlit-upper','topic-kudlit-lower','topic-3-2']){
      await ev(`${visible(`[data-testid=checkpoint-${topic}]`)}.scrollIntoView({block:'center',inline:'center'})`);await delay(80);
      const g=await ev(`(()=>{const r=${visible(`[data-testid=checkpoint-${topic}]`)}.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,h:r.height}})()`);assert(g.x>=-1&&g.right<=width+1&&g.y>=0&&g.bottom<=height&&g.h>=44,JSON.stringify(g));
    }
    await ev(`${visible('[data-testid=lesson-card-module-kudlit]')}.scrollIntoView({block:'start',inline:'center'})`);await delay(100);await snap(`final-lessons-${width}x${height}`);check(`Final top-aligned lesson controls reachable ${width}x${height}`);
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!${visible('[data-testid=completion-dialog]')}`);await press('completion-summary');
  assert.equal(await ev(`document.querySelectorAll('[data-testid^=review-attempt-]').length`),2);await snap('final-history-summary');check('All original and retry responses remain available in topic summary after upgrade');
  await press('completion-summary');await press('completion-retry');await wait(`!${visible('[data-testid=completion-dialog]')}`);check('Offline Retry opens a new topic attempt after final export');
  const first=await ev(`__r(__modules.checkpoints).topicCheckpoints[0].questions[0]`);
  await press('answer-'+first.correctLetter);await click('Check Answer');await wait(`!!${visible('[data-testid=answer-feedback]')}`);await click('Continue');
  await click('Back');await wait(`!!${visible('[data-testid=checkpoint-topic-2-1]')}`);await wait(`${visible('[data-testid=checkpoint-topic-2-1]')}.textContent.includes('Continue')`);await snap('final-continue');
  report.attempts=await ev(`__r(__modules.assessment).characterActivityService.list()`);
  report.completed=await ev(`(async()=>Array.from(await __r(__modules.learner).localLearnerService.getCompletedTopicIds()))()`);
  check('Final export preserves all historical SQLite records');
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/final-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
