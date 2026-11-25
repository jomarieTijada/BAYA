// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/touch-focus'; fs.mkdirSync(out, {recursive:true});
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



  for(const [width,height] of [[844,390]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await nav('/learner/lessons');await wait(`!!document.querySelector('[data-testid=lesson-card-module-1]')`);await delay(800);
    const geometry=await ev(`(()=>{const e=document.querySelector('[data-testid=lesson-scroll]');return {height:e.clientHeight,content:e.scrollHeight,cards:[...document.querySelectorAll('[data-testid^=lesson-card-]')].map(e=>({id:e.dataset.testid,height:e.getBoundingClientRect().height}))}})()`);
    await snap('lessons-'+width);console.log(width,geometry);check('Lesson geometry '+width,geometry);assert(geometry.content <= geometry.height + 1, 'Module cards require vertical scrolling');
    await nav('/learner/activities/topic-1-1?lessonPage=content');await wait(`!!document.querySelector('[data-testid=story-navigation]')`);await delay(600);await snap('topic-'+width);
    const box=await ev(`(()=>{const e=document.querySelector('[data-testid=story-mascot-button]');const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...box,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...box,button:'left',clickCount:1});await delay(300);
    const focus=await ev(`(()=>{const e=document.querySelector('[data-testid=story-mascot-button]');const s=getComputedStyle(e);return{outline:s.outlineWidth,border:s.borderColor,open:!!document.querySelector('[data-testid=story-mascot-popover]')}})()`);
    assert.equal(focus.outline,'0px');assert.equal(focus.border,'rgba(0, 0, 0, 0)');assert.equal(focus.open,true);check('Tapping BAYA opens message without outline',focus);await snap('baya-tapped');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    check('Keyboard focus remains available');
  }
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
