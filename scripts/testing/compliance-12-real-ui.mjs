import fs from 'node:fs';
import assert from 'node:assert/strict';
import {connect,delay} from './compliance-01/cdp.mjs';
import {hook} from './compliance-12-fixtures.mjs';
const c=await connect(),root='docs/verification/compliance-12',report={checks:[],screens:[]};
const wait=async e=>{for(let i=0;i<600;i++){if(await c.evaluate(e))return;await delay(100)}throw Error('Timeout '+e)};
const go=async p=>{await c.send('Page.navigate',{url:'http://127.0.0.1:5071'+p});await delay(500)};
const click=async labels=>{await c.evaluate(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>${JSON.stringify(labels)}.includes(e.getAttribute('aria-label'))&&e.getBoundingClientRect().width);if(!e)throw Error('Missing action');e.click()})()`);await delay(100)};
const state=()=>c.evaluate(`(async()=>{const db=await __r(__testModules.lifecycle).getReadyDatabase();return{guide:document.querySelector('[data-testid=baya-writing-guide]')?.innerText,stars:document.querySelector('[data-testid=writing-mastery]')?.getAttribute('aria-label'),attempts:await db.getAllAsync('SELECT activity_id,result_status FROM activity_attempts'),runs:window.__runs,paths:[...document.querySelectorAll('[data-testid=writing-canvas] path')].map(p=>p.getAttribute('d'))}})()`);
const shot=async name=>{const r=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${root}/${name}.png`,Buffer.from(r.data,'base64'));report.screens.push(name+'.png')};
async function draw(dot=false){const r=await c.evaluate(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`);const pts=Array.from({length:dot?1:51},(_,i)=>({x:r.x+r.w*(dot?.5:.2+.6*i/50),y:r.y+r.h*(dot?.5:.5+.2*Math.sin(i/50*Math.PI*3))}));await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...pts[0],button:'left',buttons:1,clickCount:1});for(const p of pts.slice(1))await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...pts.at(-1),button:'left',buttons:0,clickCount:1});await delay(150)}
try {
 await c.send('Page.enable');await c.send('Network.enable');await c.send('Page.addScriptToEvaluateOnNewDocument',{source:hook});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
 await go('/learner/settings');await wait(`!!document.querySelector('[aria-label=English]')`);await c.evaluate(`document.querySelector('[aria-label=English]').click()`);
 await c.evaluate(`(async()=>{const db=await __r(__testModules.lifecycle).getReadyDatabase();await db.runAsync("DELETE FROM local_app_state WHERE state_key LIKE 'activity_resume:%'")})()`);
 await go('/learner/activities/topic-3-2?writingIndex=4');await wait(`!!document.querySelector('[data-testid=writing-canvas]')&&window.__runs.some(r=>r.finished)`);
 const before=await state();await draw();await click(['Check your writing']);await wait(`!!document.querySelector('[data-testid=baya-predicted-class]')`);
 const first=await state();assert.equal(first.attempts.length,before.attempts.length+1);await shot('real-wave-ha-unresolved-first');
 await click(['Retry writing']);await draw();await click(['Check your writing']);await wait(`!!document.querySelector('[aria-label="Next character"]')`);
 const second=await state();assert.equal(second.attempts.length,first.attempts.length+1);await shot('real-wave-ha-unresolved-second');
 report.checks.push({name:'known unresolved high-confidence wave',before,first,second,detectorEnabled:false});
 // Fresh vowel activity, real blank/dot gate: no inference and no attempt.
 await go('/learner/activities/topic-3-1');await wait(`!!document.querySelector('[data-testid=writing-canvas]')&&window.__runs.some(r=>r.finished)`);
 for(const lang of ['en','tl']){
  await click(['Settings','Mga Setting']);await wait(`!!document.querySelector('[aria-label=Tagalog]')`);await c.evaluate(`document.querySelector('[aria-label=${lang==='en'?'English':'Tagalog'}]').click()`);await click(['Back','Bumalik']);await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);
  for(const [width,height] of [[667,375],[844,390],[915,412],[1024,768],[1366,768]]){
   await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(200);
   const a=await state();await draw(true);await click(['Check your writing','Suriin ang isinulat']);await delay(200);const b=await state();assert.equal(b.runs.length,a.runs.length);assert.equal(b.attempts.length,a.attempts.length);await shot(`insufficient-${lang}-${width}x${height}`);await click(['Clear all strokes','Burahin ang lahat ng guhit']);
  }
 }
 // Cached offline inference and submitted-draft restoration (fixture output identifies UI test).
 await wait(`!!navigator.serviceWorker.controller`);
 await c.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await c.send('Page.reload');await delay(500);await wait(`!!document.querySelector('[data-testid=writing-canvas]')&&window.__runs.some(r=>r.finished)`);
 await draw();const base=await state();await c.evaluate(`window.__fixture='low'`);await click(['Check your writing','Suriin ang isinulat']);await wait(`document.querySelector('[data-testid=baya-status-message]')?.innerText.includes('Hindi malinaw')`);
 const uncertain=await state();assert.equal(uncertain.attempts.length,base.attempts.length);await shot('offline-uncertain-fixture');
 await c.send('Page.reload');await delay(500);await wait(`!!document.querySelector('[data-testid=writing-canvas]')&&window.__runs.some(r=>r.finished)`);const restored=await state();assert.deepEqual(restored.paths,uncertain.paths);assert.equal(restored.attempts.length,uncertain.attempts.length);assert.equal(restored.runs.length,1);await shot('offline-submitted-restored');
 report.checks.push({name:'offline uncertain fixture and reload',unchangedAttempts:true,strokesRestored:true,warmupOnly:true});
 await click(['Retry writing','Ulitin ang pagsulat']);await draw();await click(['Check your writing','Suriin ang isinulat']);await wait(`!!document.querySelector('[data-testid=baya-predicted-class]')`);const offlineReal=await state();assert.ok(offlineReal.runs.every(r=>r.mode==='real'));await shot('offline-real-wave');report.checks.push({name:'offline real ONNX inference',...offlineReal});
} finally {await c.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});fs.writeFileSync(root+'/real-ui.json',JSON.stringify(report,null,2));c.close()}
