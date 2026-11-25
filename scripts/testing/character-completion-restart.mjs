// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/character-level/completion'; fs.mkdirSync(out, {recursive:true});
const data = JSON.parse(fs.readFileSync('apps/mobile/content/characterActivities/questions.json','utf8'));
const previous=JSON.parse(fs.readFileSync(`${out}/browser-results.json`,'utf8'));assert.equal(previous.errors.length,0);
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
  await nav('/learner/setup');await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);

  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language','en') ON CONFLICT(state_key) DO UPDATE SET state_value='en'")})()`);
  const hub=async()=>{await nav('/learner/character-activities');await wait(`document.querySelector('[data-testid=card-character-4]')&&![...document.querySelectorAll('[role=button]')].some(e=>e.getAttribute('aria-label')==='Sound Matching'&&e.getAttribute('aria-disabled')==='true')`);};
  const open=async(ai,si)=>{await hub();await click(['Sound Matching','Baybayin to Latin','Latin to Baybayin','Character Writing'][ai]);if(await ev(`!!document.querySelector('[data-testid=activity-result]')`))await click('Review');await click('Set '+(si+1));await wait(`!!document.querySelector('[data-testid=question-${data[ai].sets[si].questions[0].id}]')||!!document.querySelector('[data-testid=set-result]')`);};

 await hub();await click('Sound Matching');await click('Set 2');assert.equal(await ev('navigator.onLine'),false);
 for(const q of data[0].sets[1].questions){
   await wait(`!!document.querySelector('[data-testid=question-${q.id}]')`);
   if(['DE','RE'].includes(q.prompt))await click('Continue without scoring');
   else{await click('Play Sound');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`);await testid('answer-'+q.correctLetter);await click('Check Answer');}
   await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);await click('Continue');
 }
 await wait(`!!document.querySelector('[data-testid=completion-dialog]')`);await delay(400);await snap('offline-restart-completion');
 const text=await ev(`document.querySelector('[data-testid=completion-dialog]').textContent`);assert(text.includes('3 / 3 scored'));check('Full process restart: pending set completed offline with honest scored metrics');
 const saved=await ev(`__r(__modules.assessment).characterActivityService.list()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:10,y:10,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:10,y:10,button:'left',buttons:0,clickCount:1});
 assert(await ev(`!!document.querySelector('[data-testid=completion-dialog]')`));assert.deepEqual(await ev(`__r(__modules.assessment).characterActivityService.list()`),saved);check('Backdrop click cannot activate underlying question or navigation');
 await testid('completion-summary');await wait(`!!document.querySelector('[data-testid=completion-review]')`);await snap('offline-restart-summary');await testid('completion-summary');await testid('completion-retry');await wait(`!document.querySelector('[data-testid=completion-dialog]')`);const changed=await ev(`__r(__modules.assessment).characterActivityService.list()`);assert.equal(changed.length,saved.length+1);check('Summary and new-attempt Retry remain operational after offline restart');
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/restart-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
