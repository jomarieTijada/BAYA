// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/offline-installation/activities'; fs.mkdirSync(out, {recursive:true});
const data = JSON.parse(fs.readFileSync('apps/mobile/content/characterActivities/questions.json','utf8'));
const browser = await openTestBrowser(5055);
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
  const nav=async route=>{await send('Page.navigate',{url:'http://127.0.0.1:5055'+route});await delay(300);await wait(`document.readyState==='complete'`);};
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`const nativeMatchMedia=window.matchMedia.bind(window);window.matchMedia=q=>{const m=nativeMatchMedia(q);if(q==='(display-mode: standalone)')Object.defineProperty(m,'matches',{value:true});return m};window.__audio=[];const NativeAudio=window.Audio;window.Audio=function(...args){const audio=new NativeAudio(...args);window.__audio.push(audio);return audio;};`});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;if(s.includes('character_assessment:v1:'))__modules.assessment=id;if(s.includes('checkpoint-v1-'))__modules.checkpoints=id;if(s.includes('Unknown matching source'))__modules.matching=id;if(s.includes('Unknown Character Level set.'))__modules.content=id;return value(factory,id,...args)}}});`});
  await nav('/learner/setup');await wait(`!!navigator.serviceWorker.controller && new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=e=>resolve(e.data.ready===true);navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[ch.port2])})`,180000);await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Character Level QA')`);
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language','en') ON CONFLICT(state_key) DO UPDATE SET state_value='en'")})()`);



  await ev(`(async()=>{for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=matching-board]')`);
  await wait(`!!navigator.serviceWorker.controller`,120000);
  await wait(`(async()=>{const r=await new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=e=>resolve(e.data);navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[channel.port2]);});return r.ready})()`,120000);
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});check('Production assets prepared, network disabled');
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=matching-board]')`);check('Offline route reload');
  async function completeCheckpoint(checkpoint, audio=false) {
    const ids=await ev(`__r(__modules.matching).matchingBoards('${checkpoint}').flatMap(b=>b.pairs.map(p=>p.id))`);
    for (let i=0;i<ids.length;i++) {
      const id=ids[i];
      await wait(`!!document.querySelector('[data-testid="match-source-${id}"]')`);
      if(audio){
        const label=await ev(`Array.from(document.querySelectorAll('[role=button]')).map(e=>e.getAttribute('aria-label')).find(s=>s?.startsWith('Play sound'))`);
        if(label){await click(label); await delay(800);assert(await ev(`window.__audio.some(a=>a.currentTime>0)`));}
      }
      await testid('match-source-'+id); await testid('baya-drop-target');
      await wait(`document.body.innerText.includes('Correct match!')`);
      if(i===0){await snap(audio?'offline-audio':'correct-feedback');}
      await delay(2200);
    }
    await wait(`!!document.querySelector('[data-testid=set-result]')`); await snap(audio?'audio-summary':'summary');
  }
  await completeCheckpoint('checkpoint-v1-topic-2-1');
  check('Offline tap matching reaches completion summary and saves responses');
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');
  await wait(`!!document.querySelector('[data-testid=set-result]')`);
  check('Completed matching result persists after offline reload');
  await ev(`__r(__modules.learner).localLearnerService.completeTopic('topic-2-2')`);
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-2');
  await wait(`!!document.querySelector('[data-testid=matching-board]')`);
  await completeCheckpoint('checkpoint-v1-topic-2-2',true);
  check('Approved audio plays and matching scores offline');

}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
