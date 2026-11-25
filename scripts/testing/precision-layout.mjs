// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const phase = process.env.BAYA_LAYOUT_PHASE || 'before';
const out = 'docs/verification/precision-layout/'+phase; fs.mkdirSync(out, {recursive:true});
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


  for(const [width,height] of [[844,390],[768,320],[320,568],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for(const [name,route,selector] of [
      ['home','/learner/home','[data-testid=continue-lesson-hero]'],
      ['lessons','/learner/lessons','[data-testid=lesson-journey]'],
      ['history','/learner/activities/topic-1-1?lessonPage=content','[data-testid=story-content]'],
      ['syllabary','/learner/activities/topic-1-2','[data-testid=story-content]'],
      ['characters','/learner/activities/topic-1-3','[data-testid=story-content]']]){
      await nav(route); await wait(`!!document.querySelector('${selector}')`);await delay(400);
      const metrics=await ev(`(()=>{const rect=id=>{const e=document.querySelector('[data-testid='+id+']');if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,scroll:e.scrollHeight,client:e.clientHeight}};return Object.fromEntries(['learner-header','learner-home-scroll','continue-lesson-hero','dashboard-cards-wrapper','dashboard-card-goal','dashboard-card-adventure','dashboard-card-achievement','learner-bottom-nav','topic-card-topic-1-1','topic-card-topic-1-2','checkpoint-topic-2-1','story-visual-column','story-content-column','story-visual-frame','story-mascot-button','story-navigation','story-reading-scroll'].map(id=>[id,rect(id)]))})()`);
      if(phase==='after'){
        if(name==='home'&&width>height&&width>=768){assert(metrics['learner-home-scroll'].scroll<=metrics['learner-home-scroll'].client+1,JSON.stringify(metrics));}
        if(['history','syllabary','characters'].includes(name)&&width>=640){assert(Math.abs(metrics['story-visual-column'].width-metrics['story-content-column'].width)<1,JSON.stringify(metrics));}
        if(metrics['story-visual-frame'])assert(Math.abs(metrics['story-visual-frame'].width/metrics['story-visual-frame'].height-16/9)<.02);
        if(metrics['story-mascot-button'])assert(metrics['story-mascot-button'].bottom<=metrics['story-navigation'].y+1);
      }
      await snap(name+'-'+width+'x'+height);check(name+' '+width+'x'+height,{metrics});
    }
  }
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
