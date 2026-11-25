// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/sequential-checkpoints'; fs.mkdirSync(out, {recursive:true});
const data = JSON.parse(fs.readFileSync('apps/mobile/content/characterActivities/questions.json','utf8'));
const browser = await openTestBrowser(8084);
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
  const nav=async route=>{await send('Page.navigate',{url:'http://127.0.0.1:8084'+route});await delay(300);await wait(`document.readyState==='complete'`);};
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__audio=[];const NativeAudio=window.Audio;window.Audio=function(...args){const audio=new NativeAudio(...args);window.__audio.push(audio);return audio;};`});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;if(s.includes('character_assessment:v1:'))__modules.assessment=id;if(s.includes('checkpoint-v1-'))__modules.checkpoints=id;if(s.includes('Unknown Character Level set.'))__modules.content=id;return value(factory,id,...args)}}});`});
  await nav('/learner/setup');await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Character Level QA')`);
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language','en') ON CONFLICT(state_key) DO UPDATE SET state_value='en'")})()`);




  await ev(`(async()=>{for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  const visible=selector=>`[...document.querySelectorAll('${selector}')].find(e=>e.getClientRects().length)`;
  const press=async id=>{await wait(`!!${visible(`[data-testid=${id}]`)}`);await ev(`${visible(`[data-testid=${id}]`)}.click()`);await delay(100)};
  await nav('/learner/activities/topic-2-1');await wait(`!!${visible('[data-testid=character-topic-screen-topic-2-1]')}`);
  await wait(`!!navigator.serviceWorker.controller`,90000);await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  const checkpoints=await ev(`__r(__modules.checkpoints).topicCheckpoints`);
  for(const [ci,c] of checkpoints.slice(0,4).entries()){
    await wait(`!!${visible(`[data-testid=character-topic-screen-${c.topicId}]`)}`);
    for(let i=0;i<(ci===0?2:13);i++)await click('Next character');
    await click('Next');await wait(`!!${visible(`[data-testid=question-${c.questions[0].id}]`)}`);check('Lesson Next automatically opens '+c.topicId);await snap('automatic-'+c.topicId);
    for(const q of c.questions){
      await wait(`!!${visible(`[data-testid=question-${q.id}]`)}`);
      if(q.id.startsWith('character-1-')&&['DE','RE'].includes(q.prompt))await click('Continue without scoring');
      else{if(q.id.startsWith('character-1-')){await click('Play Sound');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`)}await press('answer-'+q.correctLetter);await click('Check Answer')}
      await wait(`!!${visible('[data-testid=answer-feedback]')}`);await click('Continue');
    }
    await wait(`!!${visible('[data-testid=completion-dialog]')}`);await press('completion-next');
    if(ci<3)await wait(`!!${visible(`[data-testid=character-topic-screen-${checkpoints[ci+1].topicId}]`)}`);
    else await wait(`location.pathname.includes('topic-3-1')&&!!document.querySelector('[data-testid=writing-canvas]')`);
    check('Completion Next opens next instructional topic after '+c.topicId);
  }
  await snap('continued-to-writing');report.attempts=await ev(`__r(__modules.assessment).characterActivityService.list()`);
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
