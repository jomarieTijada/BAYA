// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/character-level/slide-correction'; fs.mkdirSync(out, {recursive:true});
const data = JSON.parse(fs.readFileSync('apps/mobile/content/characterActivities/questions.json','utf8'));
const prior=JSON.parse(fs.readFileSync(`${out}/browser-results.json`,'utf8'));
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
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Character Slide Layout QA')`);

  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language','en') ON CONFLICT(state_key) DO UPDATE SET state_value='en'")})()`);
  const hub=async()=>{await nav('/learner/character-activities');await wait(`document.querySelector('[data-testid=card-character-4]')&&![...document.querySelectorAll('[role=button]')].some(e=>e.getAttribute('aria-label')==='Sound Matching'&&e.getAttribute('aria-disabled')==='true')`);};
  const open=async(ai,si)=>{await hub();await click(['Sound Matching','Baybayin to Latin','Latin to Baybayin','Character Writing'][ai]);if(await ev(`!!document.querySelector('[data-testid=activity-result]')`))await click('Review');await click('Set '+(si+1));await wait(`!!document.querySelector('[data-testid=question-${data[ai].sets[si].questions[0].id}]')||!!document.querySelector('[data-testid=set-result]')`);};
  await hub();await snap('hub');check('Hub has four activity cards', {cards:await ev(`document.querySelectorAll('[data-testid^=card-character-]').length`)});
  const assertSlide=async()=>{
    const g=await ev(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};return {questions:document.querySelectorAll('[data-testid^=question-character-]').length,doc:document.documentElement.scrollHeight,height:innerHeight,options:[...document.querySelectorAll('[role=radio]')].map(rect),actions:rect(document.querySelector('[data-testid=slide-actions]')),scroll:document.querySelector('[data-testid=slide-content]').scrollTop}})()`);
    assert.equal(g.questions,1);assert(g.doc<=g.height+1);assert(g.options.length===3&&g.options.every(r=>r.top>=0&&r.bottom<=g.height&&r.height>=44),JSON.stringify(g));assert(g.actions.bottom<=g.height+1&&g.actions.top>=0);assert.equal(g.scroll,0);return g;
  };

  await nav('/learner/activities/topic-3-1');await wait(`!!document.querySelector('[data-testid=canonical-writing-layout]')`);await snap('after-lesson-writing');
  const rects=await ev(`Object.fromEntries(['writing-reference-panel','writing-canvas','writing-feedback-panel'].map(id=>{const r=document.querySelector('[data-testid='+id+']').getBoundingClientRect();return [id,{x:r.x,y:r.y,width:r.width,height:r.height}]}))`);report.lessonRects=rects;
  assert(await ev(`!!document.querySelector('[data-testid=writing-trace-guide]')`));
  const r=await ev(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
  const points=prior.inferenceCandidates[0].stroke.map(p=>({x:r.x+r.w*p.x,y:r.y+r.h*p.y}));
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...points[0],button:'left',buttons:1,clickCount:1});
  for(const p of points.slice(1))await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',...points.at(-1),button:'left',buttons:0,clickCount:1});
  await testid('writing-undo-button');assert.equal(await ev(`document.querySelectorAll('[data-testid=writing-canvas] path').length`),0);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...points[0],button:'left',buttons:1,clickCount:1});
  for(const p of points.slice(1))await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',...points.at(-1),button:'left',buttons:0,clickCount:1});
  await delay(250);await wait(`document.querySelector('[data-testid=writing-navigation] [role=button]').getAttribute('aria-disabled')!=='true'`);await ev(`document.querySelector('[data-testid=writing-navigation] [role=button]').click()`);await wait(`!!document.querySelector('[data-testid=baya-confidence-percentage]')`,90000);await snap('lesson-real-inference');
  await ev(`document.querySelector('[data-testid=writing-navigation] [role=button]').click()`);await wait(`document.querySelectorAll('[data-testid=writing-canvas] path').length===0`);check('Original lesson: reference, tracing, undo, real inference and retry remain operational');
  const ax=await send('Accessibility.getFullAXTree');fs.writeFileSync(`${out}/accessibility-tree.json`,JSON.stringify(ax.result,null,2));
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/lesson-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
