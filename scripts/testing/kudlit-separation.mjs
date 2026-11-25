// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/kudlit-separation'; fs.mkdirSync(out, {recursive:true});
const data = JSON.parse(fs.readFileSync('apps/mobile/content/characterActivities/questions.json','utf8'));
const browser = await openTestBrowser(5080);
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
  await nav('/learner/setup');await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Character Level QA')`);
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language','en') ON CONFLICT(state_key) DO UPDATE SET state_value='en'")})()`);

  const ids=['ba','ka','da_ra','ga','ha','la','ma','na','nga','pa','sa','ta','wa','ya'];
  const visible=selector=>`[...document.querySelectorAll('${selector}')].find(e=>e.getClientRects().length)`;
  const press=async id=>{await wait(`!!${visible(`[data-testid=${id}]`)}`);await ev(`${visible(`[data-testid=${id}]`)}.click()`);await delay(200)};
  await nav('/learner/activities/topic-kudlit-upper');await wait(`!!document.querySelector('[data-testid=learner-lessons-root]')`);check('Direct Kudlit URL blocked for fresh learner');
  await nav('/learner/character-activities?activityId=character-1');await wait(`document.body.innerText.includes('Locked')`);check('Mixed quiz locked before base instruction');
  await ev(`(async()=>{for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  // An old hub attempt is retained without granting new topic completions.
  const historic=await ev(`__r(__modules.assessment).characterActivityService.begin('character-2-set-1')`);
  await nav('/learner/activities/topic-2-2');await wait(`!!document.querySelector('[data-testid=character-glyph]')`);await snap('base-before-offline');
  await wait(`!!navigator.serviceWorker.controller`,90000);
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  for(const id of ids){await press('character-chip-'+id);assert.equal(await ev(`!!document.querySelector('[data-testid=kudlit-recordings]')`),false);assert.equal(await ev(`document.querySelectorAll('[data-testid^=character-chip-]').length`),14);await press('baya-pronunciation-button');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`);check('Base illustration and offline recording '+id)}
  await press('character-chip-ba');
  const sizes=[[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[1024,768],[1280,800],[1440,900]];
  for(const [width,height] of sizes){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(250);assert.equal(await ev(`!!document.querySelector('[data-testid=kudlit-recordings]')`),false);await snap(`base-${width}x${height}`);check(`Base-only layout ${width}x${height}`)}
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  for(let i=0;i<13;i++)await click('Next character');await click('Back to topics');
  await wait(`!!${visible('[data-testid=topic-card-topic-kudlit-upper]')}`);await snap('base-complete-kudlit-unlocked');
  const completed=await ev(`(async()=>Array.from(await __r(__modules.learner).localLearnerService.getCompletedTopicIds()))()`);assert(completed.includes('topic-2-2'));assert(!completed.some(id=>id.startsWith('topic-kudlit-')));check('Base completion unlocks Kudlit without awarding its completion');
  await nav('/learner/character-activities?activityId=character-2');await wait(`document.body.innerText.includes('Locked')`);assert.deepEqual((await ev(`__r(__modules.assessment).characterActivityService.list()`)).find(a=>a.id===historic.id),historic);check('Historical assessment retained; mixed quiz still locked after base topics');
  for(const position of ['upper','lower']){
    await nav('/learner/activities/topic-kudlit-'+position);await wait(`!!document.querySelector('[data-testid=kudlit-recordings]')`);
    await snap('kudlit-'+position);
    for(const id of ids){await press('character-chip-'+id);const image=await ev(`document.querySelector('[data-testid=character-glyph] img')?.src||document.querySelector('[data-testid=character-glyph]').getAttribute('src')`);assert(image);if(id==='da_ra'){assert((await ev('document.body.innerText')).includes('Recording awaiting validation'));}else{await click('Play '+(id.slice(0,-1)+(position==='upper'?'e':'o')).replace(/^./,c=>c.toUpperCase())+' pronunciation');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`)}check(`Retained ${position} variation ${id}`)}
    for(const [width,height] of sizes){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(200);await snap(`kudlit-${position}-${width}x${height}`)}
    await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
    await click(position==='upper'?'Next topic':'Back to topics');
    if(position==='upper'){await nav('/learner/character-activities?activityId=character-1');await wait(`document.body.innerText.includes('Locked')`);check('Upper kudlit alone does not unlock mixed quizzes')}
  }
  await nav('/learner/lessons?moduleId=module-kudlit');await wait(`document.querySelector('[data-testid=checkpoint-character-1]')?.getAttribute('aria-disabled')==='false'||document.querySelector('[data-testid=checkpoint-character-1]')?.getAttribute('aria-disabled')===null`);await snap('kudlit-complete-assessments-unlocked');
  for(const number of [1,2,3]){await nav('/learner/character-activities?activityId=character-'+number);await wait(`!!document.querySelector('[data-testid=assessment-slide]')`);check('Mixed quiz available after both Kudlit topics '+number)}
  const attempts=await ev(`__r(__modules.assessment).characterActivityService.list()`);assert.deepEqual(attempts.find(a=>a.id===historic.id),historic);
  await nav('/learner/character-activities?activityId=character-4');await wait(`document.body.innerText.includes('Locked')`);check('Writing checkpoint still requires its own writing topics');
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value='tl' WHERE state_key='interface_language'")})()`);
  await nav('/learner/activities/topic-kudlit-upper');await wait(`!!document.querySelector('[data-testid=kudlit-recordings]')`);await press('character-chip-da_ra');await snap('kudlit-tagalog');
  report.completed=await ev(`(async()=>Array.from(await __r(__modules.learner).localLearnerService.getCompletedTopicIds()))()`);
  report.attempts=await ev(`__r(__modules.assessment).characterActivityService.list()`);
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
