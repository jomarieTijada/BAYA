// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/drag-match'; fs.mkdirSync(out, {recursive:true});
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
  for(const [width,height] of (process.env.BAYA_FAST_QA ? [[844,390]] : [[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[667,375],[568,320],[1024,768],[1280,800],[1440,900]])){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=assessment-slide]')`);await delay(600);await snap('quiz-'+width);
    assert.equal(await ev(`!!document.querySelector('[data-testid=quiz-instruction]')`),false);
    await testid('quiz-help-button');await wait(`!!document.querySelector('[data-testid=quiz-instruction]')`);await snap('instructions-'+width);
    await click("Close BAYA's message");assert.equal(await ev(`!!document.querySelector('[data-testid=quiz-instruction]')`),false);
    const size=await ev(`(()=>{const e=document.querySelector('[data-testid=slide-content]');return {height:e.clientHeight,content:e.scrollHeight}})()`);if(height>=375)assert(size.content<=size.height+1,JSON.stringify(size));check('Quiz fits '+width,size);
  }
  const sources=await ev(`Array.from(document.querySelectorAll('[data-testid^="match-source-"]')).map(e=>e.dataset.testid.replace('match-source-',''))`);
  for(const id of sources){await testid('match-source-'+id);await testid('match-target-'+id);}
  await snap('provisional');await click('Check Matches');await wait(`!!document.querySelector('[data-testid=matching-feedback]')`);await snap('correct-feedback');
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=matching-feedback]')`);check('Submitted board resumes after reload');
  await click('Next');
  await wait(`!!document.querySelector('[data-testid=set-result]')`);await snap('summary');check('Pair scores reach completion summary');
  await testid('completion-retry');await wait(`!!document.querySelector('[data-testid=matching-board]')`);check('Retry creates a fresh matching attempt');
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false});
  const rect=async id=>ev(`(()=>{const r=document.querySelector('[data-testid="${id}"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  const drag=async(source,target,touch=false,invalid=false)=>{
    const a=await rect('match-source-'+source),b=invalid?{x:20,y:72}:await rect('match-target-'+target);
    if(touch)await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1}]});
    else await send('Input.dispatchMouseEvent',{type:'mousePressed',...a,button:'left',clickCount:1});
    for(let n=1;n<=12;n++){const p={x:a.x+(b.x-a.x)*n/12,y:a.y+(b.y-a.y)*n/12};
      if(touch)await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:1}]});
      else await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});
      await delay(25); if(n===6)await snap(touch?'touch-dragging':'mouse-dragging');
    }
    if(touch)await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    else await send('Input.dispatchMouseEvent',{type:'mouseReleased',...b,button:'left',clickCount:1});
    await delay(200);
  };
  await drag(sources[0],sources[0],false,true);assert.match(await ev('document.body.innerText'),/0 \/ 3 connected/);check('Invalid drop changes no matches');
  await drag(sources[0],sources[0]);assert.match(await ev('document.body.innerText'),/1 \/ 3 connected/);check('Mouse drag creates a provisional match');
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await drag(sources[1],sources[2],true);assert.match(await ev('document.body.innerText'),/2 \/ 3 connected/);check('Emulated touch drag creates a provisional match');
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  // Keyboard activates native button semantics through Enter, without clicking.
  for(const id of ['match-source-'+sources[2],'match-target-'+sources[1]]){
    await ev(`document.querySelector('[data-testid="${id}"]').focus()`);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await delay(180);
  }
  assert.match(await ev('document.body.innerText'),/3 \/ 3 connected/);check('Keyboard source/target activation');
  await click('Check Matches');await wait(`!!document.querySelector('[data-testid=matching-feedback]')`);await snap('incorrect-feedback');
  await click('Next');await wait(`!!document.querySelector('[data-testid=set-result]')`);assert.match(await ev('document.body.innerText'),/1 \/ 3/);check('Mixed matching board scores one of three');
  await ev(`(async()=>{for(const id of ['topic-2-2','topic-kudlit-upper','topic-kudlit-lower'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  for(const topic of ['topic-2-2','topic-kudlit-upper','topic-kudlit-lower']){
    await nav('/learner/character-activities?checkpointId=checkpoint-v1-'+topic);await wait(`!!document.querySelector('[data-testid=matching-board]')`);await snap(topic);
    // Exercise each board, including withheld audio notices, without changing the approved source data.
    for(let turn=0;turn<30;turn++){
      if(await ev(`!!document.querySelector('[data-testid=set-result]')`))break;
      if(await ev(`document.body.innerText.includes('awaiting validation')`)){await click('Continue');await click('Next');continue;}
      const ids=await ev(`Array.from(document.querySelectorAll('[data-testid^="match-source-"]')).map(e=>e.dataset.testid.replace('match-source-',''))`);
      const audioButtons=await ev(`Array.from(document.querySelectorAll('[role=button]')).map(e=>e.getAttribute('aria-label')).filter(s=>s?.startsWith('Play sound'))`);
      for(const [index,label] of audioButtons.entries()){await click(label);await wait(`document.body.innerText.includes('${index+1}/${audioButtons.length} heard')`);await delay(1800);}
      if(audioButtons.length){await snap('audio-matching');const r=await ev(`(()=>{const e=document.querySelector('[data-testid=slide-content]');return {height:e.clientHeight,content:e.scrollHeight}})()`);assert(r.content<=r.height+1,JSON.stringify(r));}
      for(const id of ids){await testid('match-source-'+id);await testid('match-target-'+id);}
      await click('Check Matches');await wait(`!!document.querySelector('[data-testid=matching-feedback]')`);await click('Next');await delay(100);
    }
    await wait(`!!document.querySelector('[data-testid=set-result]')`);check('Completed '+topic+' with approved audio and pending notices');
  }
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value='tl' WHERE state_key='interface_language'")})()`);
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=set-result]')`);await testid('completion-retry');await wait(`!!document.querySelector('[data-testid=matching-board]')`);await snap('tagalog');
  assert.match(await ev('document.body.innerText'),/Pagtugmain/);check('Tagalog matching interface');

}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
