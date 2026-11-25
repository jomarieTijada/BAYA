// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/kudlit-separation'; fs.mkdirSync(out, {recursive:true});
const data = JSON.parse(fs.readFileSync('apps/mobile/content/characterActivities/questions.json','utf8'));
const previous=JSON.parse(fs.readFileSync(`${out}/browser-results.json`,'utf8'));
assert.equal(previous.errors.length,0);
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
  const click=async label=>{await wait(`!![...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)}&&e.getAttribute('aria-disabled')!=='true')`);await ev(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)});if(!document.querySelector('[data-testid=assessment-slide]'))e.scrollIntoView({block:'center'});e.click()})()`);await delay(100);};
  const testid=async id=>{await ev(`document.querySelector('[data-testid=${id}]').click()`);await delay(40);};
  const nav=async route=>{await send('Page.navigate',{url:'http://127.0.0.1:5080'+route});await delay(300);await wait(`document.readyState==='complete'`);};
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__audio=[];const NativeAudio=window.Audio;window.Audio=function(...args){const audio=new NativeAudio(...args);window.__audio.push(audio);return audio;};`});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;if(s.includes('character_assessment:v1:'))__modules.assessment=id;if(s.includes('Unknown Character Level set.'))__modules.content=id;return value(factory,id,...args)}}});`});

  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await nav('/learner/lessons?moduleId=module-kudlit');await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value=? WHERE state_key='active_learner_profile_id'",[${JSON.stringify(previous.attempts[0].profileId)}])})()`);
  assert.equal(await ev('navigator.onLine'),false);
  assert.deepEqual(await ev(`__r(__modules.assessment).characterActivityService.list()`),previous.attempts);
  assert.deepEqual(await ev(`(async()=>Array.from(await __r(__modules.learner).localLearnerService.getCompletedTopicIds()))()`),previous.completed);check('Full offline browser restart preserves all topics and historical assessment attempts');
  await nav('/learner/activities/topic-2-2');await wait(`!!document.querySelector('[data-testid=character-glyph]')`);assert.equal(await ev(`!!document.querySelector('[data-testid=kudlit-recordings]')`),false);await snap('offline-restart-base');
  // Create a separate local QA learner to verify unfinished Kudlit resume, without changing the previous profile.
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("DELETE FROM local_app_state WHERE state_key='active_learner_profile_id'");await __r(__modules.learner).localLearnerService.saveProfile('Kudlit resume QA');for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1','topic-2-2'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  await nav('/learner/activities/topic-kudlit-upper');await wait(`!!document.querySelector('[data-testid=kudlit-recordings]')`);await testid('character-chip-ga');await delay(800);
  await nav('/learner/activities/topic-kudlit-upper');await wait(`document.body.innerText.includes('Ga → GE / GI')`);await snap('offline-kudlit-resume');check('Unfinished Kudlit selected-character position resumes offline after reload');
  await nav('/learner/character-activities?activityId=character-1');await wait(`document.body.innerText.includes('Naka-lock')`);check('Viewing and resuming Kudlit does not award completion or unlock assessments');
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/restart-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
