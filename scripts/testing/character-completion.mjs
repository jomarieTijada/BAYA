// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/character-level/completion'; fs.mkdirSync(out, {recursive:true});
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
  const hub=async()=>{await nav('/learner/character-activities');await wait(`document.querySelector('[data-testid=card-character-4]')&&![...document.querySelectorAll('[role=button]')].some(e=>e.getAttribute('aria-label')==='Sound Matching'&&e.getAttribute('aria-disabled')==='true')`);};
  const open=async(ai,si)=>{await hub();await click(['Sound Matching','Baybayin to Latin','Latin to Baybayin','Character Writing'][ai]);if(await ev(`!!document.querySelector('[data-testid=activity-result]')`))await click('Review');await click('Set '+(si+1));await wait(`!!document.querySelector('[data-testid=question-${data[ai].sets[si].questions[0].id}]')||!!document.querySelector('[data-testid=set-result]')`);};
  await hub();await snap('hub');check('Hub has four activity cards', {cards:await ev(`document.querySelectorAll('[data-testid^=card-character-]').length`)});

 const sizes=[[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[1024,768],[1280,800],[1440,900]];
 const press=async id=>{await wait(`!!document.querySelector('[data-testid=${id}]')`);await ev(`document.querySelector('[data-testid=${id}]').click()`);await delay(200)};
 const modal=async()=>{await wait(`!!document.querySelector('[data-testid=completion-dialog]')`);await delay(300)};
 const geometry=async()=>await ev(`(()=>{const card=document.querySelector('[data-testid=completion-dialog]').getBoundingClientRect();const buttons=[...document.querySelectorAll('[data-testid^=completion-]')].filter(e=>e.getAttribute('role')==='button').map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,w:r.width,h:r.height}});return {card:{left:card.left,right:card.right,top:card.top,bottom:card.bottom},buttons,width:innerWidth,height:innerHeight,focus:!!document.activeElement.closest('[data-testid=completion-dialog]'),dialogs:document.querySelectorAll('[role=dialog]').length}})()`);
 const checkModal=async(name)=>{const g=await geometry();assert(g.card.left>=0&&g.card.right<=g.width+1&&g.card.top>=0&&g.card.bottom<=g.height+1,JSON.stringify(g));assert.equal(g.buttons.length,3);assert(g.buttons.every(r=>r.w>=44&&r.h>=44&&r.top>=0&&r.bottom<=g.height+1&&r.left>=0&&r.right<=g.width+1),JSON.stringify(g));assert(g.focus,'focus inside dialog');assert(g.dialogs>=1);check(name,g)};
 const matrix=async prefix=>{for(const [width,height] of sizes){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(250);await checkModal(`${prefix} ${width}x${height}`);await snap(`${prefix}-${width}x${height}`)}await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false})};
 const prior=JSON.parse(fs.readFileSync('docs/verification/character-level/slide-correction/browser-results.json','utf8'));
 const stroke=prior.inferenceCandidates[0].stroke;
 const draw=async()=>{await ev(`document.querySelector('[data-testid=writing-canvas]').scrollIntoView({block:'center'})`);const r=await ev(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`);const points=stroke.map(p=>({x:r.x+r.w*p.x,y:r.y+r.h*p.y}));await send('Input.dispatchMouseEvent',{type:'mousePressed',...points[0],button:'left',buttons:1,clickCount:1});for(const p of points.slice(1))await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...points.at(-1),button:'left',buttons:0,clickCount:1});await delay(200)};
 const finish=async(ai,si,wrong=false)=>{for(const q of data[ai].sets[si].questions){await wait(`!!document.querySelector('[data-testid=question-${q.id}]')`);assert.equal(await ev(`!!document.querySelector('[data-testid=completion-dialog]')`),false);
 if(q.type==='handwriting'){await draw();await click('Check Writing')}
 else if(ai===0&&['DE','RE'].includes(q.prompt)){await click('Continue without scoring')}
 else{if(ai===0){await click('Play Sound');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`)}await testid('answer-'+(wrong?(q.correctLetter==='A'?'B':'A'):q.correctLetter));await click('Check Answer')}
 await wait(`!!document.querySelector('[data-testid=answer-feedback]')`,90000);await click('Continue');}
 await modal();};
 for(const ai of [1,2,0,3]){
  await open(ai,0);
  for(let si=0;si<5;si++){
   await finish(ai,si,ai===1&&si===0);await checkModal(`Activity ${ai+1} set ${si+1} completion`);
   const attempts=await ev(`__r(__modules.assessment).characterActivityService.list()`);const current=attempts.filter(a=>a.setId===data[ai].sets[si].id).at(-1);assert.equal(current.cursor,5);assert.equal(current.responses.length,5);
   const scored=current.responses.filter(r=>r.correct!==null).length,correct=current.responses.filter(r=>r.correct).length;
   assert((await ev(`document.querySelector('[data-testid=completion-metrics]').textContent`)).includes(`${correct} / ${scored}`));
   if(si===0&&ai===2){
    await ev(`window.__originalBegin=__r(__modules.assessment).characterActivityService.begin;__r(__modules.assessment).characterActivityService.begin=async()=>{throw Error('QA persistence interruption')}`);
    await press('completion-next');await wait(`document.querySelector('[data-testid=completion-dialog]').textContent.includes('Please try again')`);assert(await ev(`!!document.querySelector('[data-testid=completion-dialog]')`));await snap('persistence-error');
    await ev(`__r(__modules.assessment).characterActivityService.begin=window.__originalBegin`);check('Persistence failure keeps completed result and displays a retryable error');
   }
   if(si===0){await snap(`activity-${ai+1}-set-complete`);await press('completion-summary');await wait(`!!document.querySelector('[data-testid=review-attempt-${current.id}]')`);await snap(`activity-${ai+1}-summary`);await press('completion-summary');await modal();
    if(ai===1){await matrix('completion-en');const before=await ev(`__r(__modules.assessment).characterActivityService.list()`);await press('completion-retry');await wait(`!document.querySelector('[data-testid=completion-dialog]')`);await snap('retry-transition');await finish(ai,si);const after=await ev(`__r(__modules.assessment).characterActivityService.list()`);assert.equal(after.length,before.length+1);assert.deepEqual(after.find(a=>a.id===current.id),current);check('Retry creates a separate attempt and preserves prior zero-correct result');}
   }
   if(ai===0&&si===1){const t=await ev(`document.querySelector('[data-testid=completion-dialog]').textContent`);assert(t.includes('3 / 3 scored')&&t.includes('Awaiting Validation')&&!t.includes('Great Job!'));await snap('pending-audio');await matrix('pending-audio');}
   await press('completion-next');
   if(si<4){await wait(`!!document.querySelector('[data-testid=question-${data[ai].sets[si+1].questions[0].id}]')`);if(ai!==3)await wait(`document.activeElement.getAttribute('data-testid')==='question-context'`);}
  }
  await modal();await wait(`!!document.querySelector('[data-testid=activity-result]')`);await snap(`activity-${ai+1}-complete`);await press('completion-summary');assert.equal(await ev(`document.querySelectorAll('[data-testid^=review-attempt-]').length`),5);await snap(`activity-${ai+1}-full-summary`);await press('completion-summary');
  if(ai===1){await wait(`!!navigator.serviceWorker.controller`,90000);await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});assert.equal(await ev('navigator.onLine'),false);check('Browser network disconnected for remaining three complete activity flows');}
  await press('completion-next');await wait(`!!document.querySelector('[data-testid=card-character-4]')`);check(`Activity ${ai+1}: full summary and hub return`);
 }
 // Reopen saved activity results offline and change language through the normal persisted preference.
 await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value='tl' WHERE state_key='interface_language'")})()`);
 await nav('/learner/character-activities');await wait(`!!document.querySelector('[data-testid=card-character-4]')`);await click('Pagtutugma ng Tunog');await modal();await matrix('completion-tl');await press('completion-summary');await snap('tagalog-summary');await press('completion-summary');
 // Keyboard focus containment and browser Escape remain inside the same dialog stage.
 for(let i=0;i<10;i++){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert(await ev(`!!document.activeElement.closest('[data-testid=completion-dialog]')`));}
 check('Keyboard Tab remains inside completion modal');await press('completion-retry');await wait(`!document.querySelector('[data-testid=completion-dialog]')`);assert(await ev(`!!document.querySelector('[data-testid=question-character-1-set-1-q-1]')||!!document.querySelector('[data-testid=assessment-slide]')`));await snap('activity-retry');check('Full activity Retry restarts first set offline');
 await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value='en' WHERE state_key='interface_language'")})()`);
 await nav('/learner/character-activities');await wait(`!!document.querySelector('[data-testid=card-character-4]')`);await click('Sound Matching');await click('Set 1');await finish(0,0);await press('completion-next');await wait(`!!document.querySelector('[data-testid=question-${data[0].sets[1].questions[0].id}]')&&!document.querySelector('[data-testid=completion-dialog]')`);check('Activity Retry advances into a fresh second set after reload');
 report.attempts=await ev(`__r(__modules.assessment).characterActivityService.list()`);
 const ax=await send('Accessibility.getFullAXTree');fs.writeFileSync(`${out}/accessibility-tree.json`,JSON.stringify(ax.result,null,2));
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
