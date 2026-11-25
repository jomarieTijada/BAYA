// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/writing-canvas-layout'; fs.mkdirSync(out, {recursive:true});
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
  const click=async label=>{await wait(`!![...document.querySelectorAll('[role=button]')].find(e=>e.getClientRects().length&&e.getAttribute('aria-label')===${JSON.stringify(label)}&&e.getAttribute('aria-disabled')!=='true')`);await ev(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getClientRects().length&&e.getAttribute('aria-label')===${JSON.stringify(label)});if(!document.querySelector('[data-testid=canonical-writing-layout]'))e.scrollIntoView({block:'center'});e.click()})()`);await delay(100);};
  const testid=async id=>{await ev(`document.querySelector('[data-testid=${id}]').click()`);await delay(40);};
  const nav=async route=>{await send('Page.navigate',{url:'http://127.0.0.1:8081'+route});await delay(300);await wait(`document.readyState==='complete'`);};
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__audio=[];const NativeAudio=window.Audio;window.Audio=function(...args){const audio=new NativeAudio(...args);window.__audio.push(audio);return audio;};`});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;if(s.includes('character_assessment:v1:'))__modules.assessment=id;if(s.includes('checkpoint-v1-'))__modules.checkpoints=id;if(s.includes('Unknown Character Level set.'))__modules.content=id;return value(factory,id,...args)}}});`});
  await nav('/learner/setup');await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Character Level QA')`);
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language','en') ON CONFLICT(state_key) DO UPDATE SET state_value='en'")})()`);



  await ev(`(async()=>{for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1','topic-2-2','topic-kudlit-upper','topic-kudlit-lower','topic-3-1','topic-3-2'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  for(const [width,height] of [[844,390],[667,375],[568,320],[1280,800]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await nav('/learner/activities/topic-3-1');await wait(`!!document.querySelector('[data-testid=canonical-writing-layout]')`);await delay(600);await snap('quiz-'+width);
    const size=await ev(`(()=>{const e=document.querySelector('[data-testid=canonical-writing-layout]');return {height:e.clientHeight,content:e.scrollHeight}})()`);if(width>=568)assert(size.content<=size.height+1,JSON.stringify(size));const feedback=await ev(`(()=>{const r=id=>document.querySelector('[data-testid='+id+']').getBoundingClientRect();const b=r('baya-result-bubble'),n=r('writing-navigation'),p=r('writing-feedback-panel');return {bubbleVisible:b.top>=p.top&&b.bottom<n.top,buttonInside:n.bottom<=p.bottom,buttonBelowBubble:n.top>b.bottom}})()`);assert(feedback.bubbleVisible&&feedback.buttonInside&&feedback.buttonBelowBubble,JSON.stringify(feedback));check('Writing layout '+width,{...size,scrollRequired:size.content>size.height+1});
  }
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false});
  await nav('/learner/activities/topic-3-1');await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);await delay(500);
  const rect=await ev(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
  const points=Array.from({length:81},(_,i)=>({x:rect.x+rect.w*(.2+.6*i/80),y:rect.y+rect.h*(.5+.2*Math.sin(i/80*Math.PI*2))}));
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...points[0],button:'left',buttons:1,clickCount:1});
  for(const point of points.slice(1))await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point,button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',...points.at(-1),button:'left',buttons:0,clickCount:1});
  await delay(100);
  const path=await ev(`document.querySelector('[data-testid=writing-canvas] svg path').getAttribute('d')`);
  assert(path.startsWith('M200.0,500.0'),path);assert(path.endsWith('800.0,500.0'),path);assert((path.match(/Q/g)||[]).length>=70,path);
  await delay(300);assert.equal(await ev(`document.querySelector('[data-testid=writing-canvas] svg path').getAttribute('d')`),path);
  check('Pointer stroke preserves smooth samples, canvas coordinates and release endpoint');await snap('smooth-pointer-stroke');

}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
