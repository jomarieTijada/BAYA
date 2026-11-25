// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/mascot-match'; fs.mkdirSync(out, {recursive:true});
const data = JSON.parse(fs.readFileSync('apps/mobile/content/characterActivities/questions.json','utf8'));
const browser = await openTestBrowser(8081);
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
  const nav=async route=>{await send('Page.navigate',{url:'http://127.0.0.1:8081'+route});await delay(300);await wait(`document.readyState==='complete'`);};
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__audio=[];const NativeAudio=window.Audio;window.Audio=function(...args){const audio=new NativeAudio(...args);window.__audio.push(audio);return audio;};`});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;if(s.includes('character_assessment:v1:'))__modules.assessment=id;if(s.includes('checkpoint-v1-'))__modules.checkpoints=id;if(s.includes('Unknown Character Level set.'))__modules.content=id;return value(factory,id,...args)}}});`});
  await nav('/learner/setup');await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Character Level QA')`);
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language','en') ON CONFLICT(state_key) DO UPDATE SET state_value='en'")})()`);



  await ev(`(async()=>{for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);

  for(const [width,height] of [[844,390],[760,360],[320,568]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=baya-drop-target]')`);await delay(400);await snap('mascot-'+width);const layout=await ev(`(()=>{const card=document.querySelector('[data-testid^=match-source-]').getBoundingClientRect(),baya=document.querySelector('[data-testid=baya-drop-target]').getBoundingClientRect();return {w:card.width,h:card.height,bottom:baya.bottom,viewport:innerHeight}})()`);assert(Math.abs(layout.w-layout.h)<2,JSON.stringify(layout));assert(Math.abs(layout.bottom-layout.viewport)<3,JSON.stringify(layout));
  }
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false});
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=baya-drop-target]')`);
  await click('Instructions');await wait(`!!document.querySelector('[data-testid=writing-help-popup]')`);await snap('matching-instructions');await click('Close the guide');await click('Switch card');await delay(550);check('Canvas-style guide and animated card switch');
  await testid('match-source-character-2-q-02');await testid('baya-drop-target');await wait(`document.body.innerText.includes('Try again!')`);await snap('wrong-card');check('Immediate incorrect feedback');
  await testid('match-source-character-2-q-01');await testid('baya-drop-target');await wait(`document.body.innerText.includes('Correct!')`);await snap('correct-card');check('Practice retry accepted');
  await wait(`document.body.innerText.includes('Can you find I/E?')`);
  const rect=async id=>ev(`(()=>{const r=document.querySelector('[data-testid="${id}"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await testid('match-source-character-2-q-02');
  const a=await rect('match-source-character-2-q-02'),b=await rect('baya-drop-target');
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...a,button:'left',clickCount:1});
  for(let n=1;n<=15;n++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:a.x+(b.x-a.x)*n/15,y:a.y+(b.y-a.y)*n/15,button:'left',buttons:1});await delay(30);}
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',...b,button:'left',clickCount:1});await wait(`document.body.innerText.includes('Correct!')`);check('Drag card onto BAYA');
  await wait(`document.body.innerText.includes('Can you find O/U?')`);
  await testid('match-source-character-2-q-03');await testid('baya-drop-target');await wait(`document.body.innerText.includes('Correct!')`);await snap('collected-pairs');
  await wait(`!!document.querySelector('[data-testid=set-result]')`);assert.match(await ev('document.body.innerText'),/2 \/ 3/);check('First response score preserved after successful retry');await snap('mascot-summary');
  await ev(`__r(__modules.learner).localLearnerService.completeTopic('topic-2-2')`);
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-2');await wait(`!!document.querySelector('[aria-label="Play sound 1"]')`);
  assert(await ev(`!!document.querySelector('[data-testid=story-speech-bubble] [aria-label="Play sound 1"]')`));
  assert(await ev(`(()=>{const b=document.querySelector('[data-testid=story-speech-bubble]').getBoundingClientRect(),s=document.querySelector('[aria-label="Play sound 1"]').getBoundingClientRect();return s.top>=b.top&&s.bottom<=b.bottom})()`));await snap('sound-inside-bubble');await click('Play sound 1');await wait(`__audio.some(a=>a.currentTime>0)`);check('Speaker inside bubble plays recording');
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
