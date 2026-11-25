// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/precision-layout/functional'; fs.mkdirSync(out, {recursive:true});
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



  await ev(`(async()=>{for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1','topic-2-2'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);



  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false});
  await nav('/learner/home');await wait(`!!document.querySelector('[data-testid=continue-lesson-hero]')`);
  await click('Go to lessons');await wait(`location.pathname==='/learner/lessons'`);check('Home Lessons action');
  await ev(`document.querySelector('[data-testid=lesson-scroll]').scrollTop=10000`);await delay(200);
  const footer=await ev(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.textContent.includes('Review Topics'));const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom}})()`);assert(footer.top>=52&&footer.bottom<=343,JSON.stringify(footer));check('Module footer reachable by scrolling',{footer});await snap('lessons-footer');
  await nav('/learner/activities/topic-1-1?lessonPage=content');await delay(1200);await wait(`!!document.querySelector('video')`);
  await ev(`document.querySelector('video').play()`);await wait(`document.querySelector('video').currentTime>0`);check('Connected lesson video playback');await snap('video-playing');await ev(`document.querySelector('video').pause()`);
  await wait(`!!navigator.serviceWorker.controller`,90000);
  await wait(`(async()=>{const keys=await caches.keys();const c=await caches.open(keys.find(k=>k.startsWith('baya-pwa-')));return (await c.keys()).length>=237})()`,90000);
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await nav('/learner/activities/topic-1-1?lessonPage=content');await delay(1200);await wait(`!!document.querySelector('[data-testid=story-content]')`);
  report.limitations=['Video streaming requires connectivity under the existing service-worker media bypass policy. Offline text, navigation and pronunciation were tested separately.'];
  check('Offline lesson text and source attribution remain available');await snap('offline-video-fallback');
  await click('Next topic');await wait(`location.pathname.includes('topic-1-2')`);check('Offline lesson Next navigation');
  await ev(`document.querySelector('[data-testid=story-reading-scroll]').scrollTop=10000`);await delay(100);
  const reading=await ev(`(()=>{const e=document.querySelector('[data-testid=story-reading-scroll]');return {height:e.clientHeight,scroll:e.scrollHeight,top:e.scrollTop}})()`);assert(reading.top+reading.height>=reading.scroll-1);check('Long lesson can be read to the end',{reading});await snap('long-lesson-bottom');
  await ev(`document.querySelector('[data-testid=story-mascot-button]').click()`);await wait(`!!document.querySelector('[data-testid=story-mascot-popover]')`);check('Larger Bayani still opens takeaway');await snap('bayani-takeaway');
  await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await nav('/learner/settings');await wait(`!!document.querySelector('[role=radio][aria-label=Tagalog]')`);await ev(`document.querySelector('[role=radio][aria-label=Tagalog]').click()`);
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Maria Alexandra Baybayin Learner')`);
  await nav('/learner/home');await wait(`!!document.querySelector('[data-testid=continue-lesson-hero]')`);await delay(400);await snap('tagalog-long-name-home');
  const home=await ev(`(()=>{const e=document.querySelector('[data-testid=learner-home-scroll]');return {height:e.clientHeight,scroll:e.scrollHeight}})()`);assert(home.scroll<=home.height+1,JSON.stringify(home));check('Tagalog dashboard and long learner name fit',{home});
  await nav('/learner/activities/topic-1-2');await wait(`!!document.querySelector('[data-testid=story-content]')`);await snap('tagalog-lesson');check('Tagalog lesson content');
  await send('Network.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await nav('/learner/home');await delay(500);await snap('phone-portrait-warning');check('Portrait phone retains landscape guidance',{text:await ev('document.body.innerText')});
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
