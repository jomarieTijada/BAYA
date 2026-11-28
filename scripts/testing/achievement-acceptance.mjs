// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const port = Number(process.env.BAYA_QA_PORT || 5082);
const out = process.env.BAYA_REWARDS ? 'docs/verification/rewards/'+(process.env.BAYA_ANDROID_SERIAL?'android':'desktop')+(process.env.BAYA_WRITING?'-writing':process.env.BAYA_LOW_FUNDS?'-low-funds':process.env.BAYA_SOUND?'-sound':'') : 'docs/verification/achievements/'+(process.env.BAYA_ONLY?'learning-'+process.env.BAYA_ONLY.split(' ')[0]:process.env.BAYA_EXTRA?'learning':'acceptance') + (process.env.BAYA_ANDROID_SERIAL ? '-android' : ''); fs.mkdirSync(out, {recursive:true});

const browser = await openTestBrowser(port);
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
  const nav=async route=>{await send('Page.navigate',{url:'http://127.0.0.1:'+port+route});await delay(300);await wait(`document.readyState==='complete'`);};
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  const standaloneHook=`const nativeMatchMedia=window.matchMedia.bind(window);window.matchMedia=q=>{const m=nativeMatchMedia(q);if(q==='(display-mode: standalone)')Object.defineProperty(m,'matches',{value:true});return m};window.__audio=[];const NativeAudio=window.Audio;window.Audio=function(...args){const audio=new NativeAudio(...args);window.__audio.push(audio);return audio;};`;
  await send('Page.addScriptToEvaluateOnNewDocument',{source:standaloneHook});
  if(!browser.physical) await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  const moduleHook=`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('Question already submitted or changed'))__modules.rewardHints=id;if(s.includes('Unknown writing exercise.'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;if(s.includes('Attempt is missing.'))__modules.assessment=id;if(s.includes('checkpoint-v1-'))__modules.checkpoints=id;if(s.includes('Unknown matching source'))__modules.matching=id;if(s.includes('Unknown Character Level set.'))__modules.content=id;return value(factory,id,...args)}}});`;
  await send('Page.addScriptToEvaluateOnNewDocument',{source:moduleHook});
  await nav('/learner/setup');await wait(`!!navigator.serviceWorker.controller && new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=e=>resolve(e.data.ready===true);navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[ch.port2])})`,180000);await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Character Level QA')`);
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language','en') ON CONFLICT(state_key) DO UPDATE SET state_value='en'")})()`);



  async function coldRestart(){
    const profile=browser.profile;ws.close();await browser.close();
    const restart=await openTestBrowser(port,{profile,offlineLaunch:browser.physical});
    Object.assign(browser,restart);
    ws=new WebSocket(restart.target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
    ws.onmessage=e=>{const v=JSON.parse(e.data);pending.get(v.id)?.(v);pending.delete(v.id)};
    await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
    await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
    await send('Page.addScriptToEvaluateOnNewDocument',{source:moduleHook});
    await send('Page.addScriptToEvaluateOnNewDocument',{source:standaloneHook});
  }
  if(process.env.BAYA_REWARDS){
    const {verifyRewards}=await import('./reward-acceptance.mjs');
    await verifyRewards({coldRestart,send,ev,wait,click,nav,snap,testid,check,browser,report});
  }else if(process.env.BAYA_EXTRA){
    const {verifyLearning}=await import('./achievement-learning.mjs');
    await verifyLearning({browser,send,ev,nav,click,testid,snap,check,wait,report});
  } else {
  for(const topic of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5','topic-2-1']){
    await nav('/learner/activities/'+topic);
    for(let i=0;i<18;i++){
      if(await ev(`__r(__modules.learner).localLearnerService.getCompletedTopicIds().then(ids=>ids.has('${topic}'))`)) break;
      const labels=await ev(`[...document.querySelectorAll('[role=button]')].filter(e=>e.getClientRects().length).map(e=>e.getAttribute('aria-label'))`);
      const next=labels.find(l=>l&&/next|watch the video|return to topics|back to topics|finish|continue|complete|susunod/i.test(l));
      if(next) await click(next);
      else if(i>8)throw Error(topic+' '+JSON.stringify(labels));
      await delay(300);
    }
    assert(await ev(`__r(__modules.learner).localLearnerService.getCompletedTopicIds().then(ids=>ids.has('${topic}'))`));check('Completed through UI '+topic);
    if(topic==='topic-1-1'){
      await wait(`!!document.querySelector('[data-testid=reward-popup]')`);await snap('topic-unlock-popup');
      await wait(`!document.querySelector('[data-testid=reward-popup]')`);
      await nav('/learner/home');await wait(`document.body.innerText.includes('Time Traveler')`);
      await snap('home-first-topic');check('Home recent achievement and unlock notification after first topic');
    }
  }
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=matching-board]')`);
  await wait(`!!navigator.serviceWorker.controller`,120000);
  await wait(`(async()=>{const r=await new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=e=>resolve(e.data);navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[channel.port2]);});return r.ready})()`,120000);
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});const disconnected=await ev(`fetch('/qa-uncached-'+Date.now(),{method:'POST',cache:'no-store'}).then(()=>false,()=>true)`);assert(disconnected);check('Production assets prepared, uncached network request rejected');
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=matching-board]')`);check('Offline route reload');
  async function completeCheckpoint(checkpoint, audio=false, first=false) {
    const ids=await ev(`__r(__modules.matching).matchingBoards('${checkpoint}').flatMap(b=>b.pairs.map(p=>p.id))`);
    for (let i=0;i<ids.length;i++) {
      const id=ids[i];
      await wait(`!!document.querySelector('[data-testid="match-source-${id}"]')`);
      if(audio){
        const label=await ev(`Array.from(document.querySelectorAll('[role=button]')).map(e=>e.getAttribute('aria-label')).find(s=>s?.startsWith('Play sound'))`);
        if(label){await click(label); await delay(800);assert(await ev(`window.__audio.some(a=>a.currentTime>0)`));}
      }
      if(first && i===0 && ids.length>1 && await ev(`!!document.querySelector('[data-testid=match-source-${ids[1]}]')`)){
        await testid('match-source-'+ids[1]);await testid('baya-drop-target');await delay(800);
      }
      if(!first && i===ids.length-1){
        const point=key=>ev(`(()=>{const r=document.querySelector('[data-testid="${key}"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
        const a=await point('match-source-'+id),b=await point('baya-drop-target');
        const pointer=(type,p)=>browser.physical?send('Input.dispatchTouchEvent',{type:{mousePressed:'touchStart',mouseMoved:'touchMove',mouseReleased:'touchEnd'}[type],touchPoints:type==='mouseReleased'?[]:[{...p,id:1}]}):send('Input.dispatchMouseEvent',{type,...p,button:'left',buttons:type==='mouseReleased'?0:1,clickCount:1});
        await pointer('mousePressed',a);for(let n=1;n<=15;n++){await pointer('mouseMoved',{x:a.x+(b.x-a.x)*n/15,y:a.y+(b.y-a.y)*n/15});await delay(30)}await pointer('mouseReleased',b);
      }else{await testid('match-source-'+id);await testid('baya-drop-target');}
      await wait(`document.body.innerText.includes('Correct match!')`);
      if(i===0){await snap(audio?'offline-audio':'correct-feedback');}
      await delay(2200);
      if(first && i===0 && ids.length>1) {
        await nav('/learner/home');await nav('/learner/character-activities?checkpointId='+checkpoint);
        await wait(`!!document.querySelector('[data-testid="match-source-${ids[1]}"]')`);check('Resumed after leaving a partially completed checkpoint');
      }
    }
    await wait(`!!document.querySelector('[data-testid=set-result]')`); await snap(audio?'audio-summary':'summary');
  }
  await completeCheckpoint('checkpoint-v1-topic-2-1',true,true);
  check('Offline tap matching reaches completion summary and saves responses');
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');
  await wait(`!!document.querySelector('[data-testid=set-result]')`);
  check('Completed matching result persists after offline reload');
  await nav('/learner/achievements');
  await wait(`document.querySelector('[data-testid="achievement-offline_adventurer"]')?.getAttribute('aria-label')?.includes('Unlocked')`);
  await snap('offline-adventurer-earned');check('Offline Adventurer earned');
  await nav('/learner/home');await wait(`document.body.innerText.includes('Offline Adventurer')`);await snap('offline-home');check('Home shows Offline Adventurer after checkpoint');
  await nav('/learner/achievements');await wait(`document.querySelector('[data-testid="achievement-offline_adventurer"]')?.getAttribute('aria-label')?.includes('Unlocked')`);check('Persisted after offline navigation restart');
  const sql = query => ev(`__r(__modules.db).getReadyDatabase().then(db=>db.getAllAsync(${JSON.stringify(query)}))`);
  const awards = () => sql('SELECT achievement_id, unlocked_at FROM learner_achievements ORDER BY achievement_id');
  const assertAward = async id => {await wait(`__r(__modules.db).getReadyDatabase().then(db=>db.getFirstAsync("SELECT 1 FROM learner_achievements WHERE achievement_id=?",['${id}']))`);check('Persisted '+id);};
  await assertAward('first_step');await assertAward('pair_pioneer');
  const original=await awards();
  const eventRows=await sql("SELECT * FROM achievement_events WHERE event_type IN ('resume','offline')");
  assert(eventRows.some(e=>e.event_type==='offline'));check('Persisted checkpoint evidence',{eventRows,original});
  {
    await coldRestart();
    await nav('/learner/achievements');
    await wait(`document.querySelector('[data-testid="achievement-offline_adventurer"]')?.getAttribute('aria-label')?.includes('Unlocked')`);
    assert(await ev('navigator.onLine===false'));assert.deepEqual(await awards(),original);
    await snap('cold-offline-restart');check(browser.physical?'Reopened Android QA tab offline preserves all unlock rows and timestamps':'Cold browser process restart offline preserves all unlock rows and timestamps');
  }
  await nav('/learner/character-activities?checkpointId=checkpoint-v1-topic-2-1');await wait(`!!document.querySelector('[data-testid=completion-retry]')`);
  await click('RETRY');await completeCheckpoint('checkpoint-v1-topic-2-1');check('Completed checkpoint retry',{awards:await awards()});
  await nav('/learner/activities/topic-2-2');await wait(`!!document.querySelector('[data-testid^=character-chip-]')`);
  const chips=await ev(`Array.from(document.querySelectorAll('[data-testid^=character-chip-]'),e=>e.dataset.testid)`);assert.equal(chips.length,14);
  for(const [i,id] of chips.entries()){await testid(id);if(i===0||i===1){
    const play=await ev(`Array.from(document.querySelectorAll('[role=button]'),e=>e.getAttribute('aria-label')).find(s=>s&&/pronunciation|pagbigkas/i.test(s))`);
    if(play){for(let j=0;j<(i===0?2:1);j++){await click(play);await delay(3500);}}
    if(i===0){await testid(id);await assertAward('first_feather');}
  }if(i===6)await assertAward('seven_symbols');}
  await assertAward('fourteen_feathers');await assertAward('first_sound');
  check('Distinct exploration and approved audio',{events:await sql("SELECT * FROM achievement_events WHERE event_type IN ('audio','explore:base-consonant')")});
  }
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
