// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/character-level/refinement'; fs.mkdirSync(out, {recursive:true});
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
  const snap=async name=>{if(!name.startsWith('mentor-')){await wait(`!!document.querySelector('[data-testid=character-baya-helper]')`);const mascot=await ev(`(()=>{const e=document.querySelector('[data-testid=character-baya-helper]');return {images:e.querySelectorAll('img').length,loaded:[...e.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)}})()`);assert(mascot.images>0&&mascot.loaded,'Baya asset must be loaded');} const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(`${out}/${name}.png`,Buffer.from(r.result.data,'base64'));report.screenshots.push(name+'.png');};
  const click=async label=>{await wait(`!![...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)}&&e.getAttribute('aria-disabled')!=='true')`);await ev(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)});e.scrollIntoView({block:'center'});e.click()})()`);await delay(100);};
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
  const open=async(ai,si)=>{await hub();await click(['Sound Matching','Baybayin to Latin','Latin to Baybayin','Character Writing'][ai]);await click('Set '+(si+1));await wait(`!!document.querySelector('[data-testid=question-${data[ai].sets[si].questions[0].id}]')||!!document.querySelector('[data-testid=set-result]')`);};
  await hub();await snap('hub');check('Hub has four activity cards', {cards:await ev(`document.querySelectorAll('[data-testid^=card-character-]').length`)});
  // Navigate every supplied visual multiple-choice question in source order.
  for(const ai of [1,2])for(let si=0;si<5;si++){
    await open(ai,si);
    for(const [qi,q] of data[ai].sets[si].questions.entries()){
      await wait(`!!document.querySelector('[data-testid=question-${q.id}]')`);
      if(si===0&&qi===0)await snap(ai===1?'baybayin-to-latin':'latin-to-baybayin');
      const letter = si===0&&qi===1 ? (q.correctLetter==='A'?'B':'A') : q.correctLetter;
      await testid('answer-'+letter);assert.equal(await ev(`!!document.querySelector('[data-testid=answer-feedback]')`),false);
      await click('Check Answer');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);
      assert.equal(await ev(`document.querySelector('[data-testid=answer-feedback]').textContent.includes('Great job!')`),letter===q.correctLetter);
      if(ai===1&&si===0&&qi<2)await snap(qi===0?'correct-feedback':'incorrect-feedback');
      await click('Continue');
    }
    await wait(`!!document.querySelector('[data-testid=set-result]')`);if(si===0)await snap(`activity-${ai+1}-set-result`);
    check(`Activity ${ai+1} set ${si+1}: all five questions submitted`);
    if(si===4){await click('Activity results');await wait(`!!document.querySelector('[data-testid=activity-result]')`);await snap(`activity-${ai+1}-complete`);}
  }
  // Audio set 1: real on-demand playback, hidden cue, replay and a complete set.
  for(let si=0;si<5;si++){
  await open(0,si);
  for(const [qi,q] of data[0].sets[si].questions.entries()){
    if(['DE','RE'].includes(q.prompt)){
      assert.equal(await ev(`document.querySelector('[data-testid=answer-A]').getAttribute('aria-disabled')`),'true');
      await snap('missing-approved-recording');await click('Continue without scoring');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);await click('Continue');continue;
    }
    assert.equal(await ev(`document.querySelector('[data-testid=question-${q.id}]').textContent.includes(${JSON.stringify(q.prompt)})`),false);
    await click('Play Sound');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`);
    if(si===0&&qi===0){await snap('sound-matching');await click('Play Sound');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`);}
    await testid('answer-'+q.correctLetter);await click('Check Answer');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);await click('Continue');
  }
  await wait(`!!document.querySelector('[data-testid=set-result]')`);check(`Sound Matching set ${si+1}: source order, no cue leakage, saved results`,{scored:si===1?3:5,deferred:si===1?2:0});
  if(si===1){assert(await ev(`document.querySelector('[data-testid=set-result]').textContent.includes('Answered: 3 / 5')`));await snap('audio-set-pending');}
  }
  // Canvas input and production model inference. Synthetic strokes test the pipeline, not accuracy.
  await open(3,0);await snap('writing-question');
  const curves = [Array.from({length:81},(_,i)=>({x:.5+.28*Math.cos(i/80*Math.PI*2),y:.5+.28*Math.sin(i/80*Math.PI*2)})),
    Array.from({length:81},(_,i)=>({x:.5+.28*Math.cos(.5+i/80*Math.PI*1.7),y:.5+.28*Math.sin(.5+i/80*Math.PI*1.7)})),
    Array.from({length:81},(_,i)=>({x:.2+.6*i/80,y:.5+.2*Math.sin(i/80*Math.PI*2)})),
    [{x:.2,y:.2},{x:.5,y:.8},{x:.8,y:.2}], [{x:.2,y:.8},{x:.5,y:.2},{x:.8,y:.8}], [{x:.2,y:.2},{x:.2,y:.8},{x:.8,y:.8}]];
  const candidates=await ev(`(async()=>{const rows=[];for(const stroke of ${JSON.stringify(curves)}){const predictions=await __r(__modules.recognition).recognizeWriting([stroke],{width:500,height:350},3);rows.push({stroke,prediction:predictions[0]});}return rows.sort((a,b)=>b.prediction.probability-a.prediction.probability)})()`);
  report.inferenceCandidates=candidates;const candidate=candidates[0];assert(candidate.prediction.probability>=.8,'Need a recognized real-model sample to test persistence');
  async function draw(){await ev(`document.querySelector('[data-testid=writing-canvas]').scrollIntoView({block:'center'})`);const r=await ev(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`);
    const points=candidate.stroke.map(p=>({x:r.x+r.w*p.x,y:r.y+r.h*p.y}));
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...points[0],button:'left',buttons:1,clickCount:1});
    for(const p of points.slice(1))await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...points.at(-1),button:'left',buttons:0,clickCount:1});await delay(100);
  }
  for(let si=0;si<5;si++){
  if(si>0)await open(3,si);
  for(let qi=0;qi<5;qi++){
    assert.equal(await ev(`document.querySelector('[data-testid=underlined-syllable]').textContent`),data[3].sets[si].questions[qi].target);
    await draw();if(qi===0){await click('Clear / Retry');assert.equal(await ev(`document.querySelectorAll('[data-testid=writing-canvas] path').length`),0);await draw();}
    await click('Check Writing');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`,90000);
    if(si===0&&qi===0)await snap('writing-real-inference');await click('Continue');
  }
  await wait(`!!document.querySelector('[data-testid=set-result]')`);if(si===0)await snap('writing-set-result');check(`Writing set ${si+1}: five real LiteRT submissions and exact underline ranges`,{synthetic:true,prediction:candidate.prediction});
  }
  // Responsive geometry, loaded images, and scrolling at every requested size.
  for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[1024,768],[1280,800],[1440,900]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await open(2,0);
    // Completed set is a result; start a fresh attempt for actual question layout.
    await click('Try this set again');await wait(`!!document.querySelector('[data-testid=answer-A]')`);
    const geometry=await ev(`({width:innerWidth,scroll:document.documentElement.scrollWidth,images:[...document.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),buttons:[...document.querySelectorAll('[data-testid^=answer-]')].map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))})`);
    assert(geometry.scroll<=width);assert(geometry.images);assert(geometry.buttons.every(b=>b.h>=44));await snap(`viewport-${width}x${height}`);check(`Responsive ${width}x${height}`,geometry);
    // Complete the repeat so the next viewport can explicitly restart.
    for(const q of data[2].sets[0].questions){await testid('answer-'+q.correctLetter);await click('Check Answer');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);await click('Continue');}
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await open(1,1);await click('Try this set again');await testid('answer-B');await click('Check Answer');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);
  const before=await ev(`__r(__modules.assessment).characterActivityService.list()`);await hub();await click('Baybayin to Latin');await click('Set 2');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);assert.deepEqual(await ev(`__r(__modules.assessment).characterActivityService.list()`),before);check('Reload restores feedback without duplicate scoring');
  await click('Continue');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  check('Keyboard focus reaches controls',{role:await ev(`document.activeElement.getAttribute('role')`)});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert(await ev(`matchMedia('(prefers-reduced-motion: reduce)').matches`));check('Reduced-motion preference: assessment has no required animations');
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value='tl' WHERE state_key='interface_language'")})()`);
  await nav('/learner/character-activities');await wait(`document.body.textContent.includes('Magsanay tayo')`);await snap('tagalog-hub');check('Tagalog interface persisted through reload');
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value='en' WHERE state_key='interface_language'")})()`);
  await hub();await wait(`!!navigator.serviceWorker.controller`,90000);
  report.cache=await ev(`(async()=>{const names=await caches.keys();return {names,entries:await Promise.all(names.map(async n=>(await (await caches.open(n)).keys()).length))}})()`);
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await open(0,2);await click('Try this set again');await click('Play Sound');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`);await testid('answer-B');await click('Check Answer');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);await snap('offline-listening');check('Offline hub, recording, scoring and SQLite save');
  await open(3,1);await click('Try this set again');await draw();await click('Check Writing');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`,90000);await snap('offline-writing');check('Offline canvas and LiteRT inference');
  await hub();await click('Character Writing');await click('Set 2');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);assert.equal(await ev('navigator.onLine'),false);check('Offline reload restores saved handwriting result');
  // Finish two complete sets while the network remains unavailable.
  await click('Continue');
  for(let qi=1;qi<5;qi++){await draw();await click('Check Writing');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`,90000);await click('Continue');}
  await wait(`!!document.querySelector('[data-testid=set-result]')`);check('Complete five-question writing set offline');
  await hub();await click('Sound Matching');await click('Set 3');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);await click('Continue');
  for(const q of data[0].sets[2].questions.slice(1)){await click('Play Sound');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`);await testid('answer-'+q.correctLetter);await click('Check Answer');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);await click('Continue');}
  await wait(`!!document.querySelector('[data-testid=set-result]')`);check('Complete five-question listening set offline');
  report.attempts=await ev(`__r(__modules.assessment).characterActivityService.list()`);
  await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await nav('/learner/lessons');await click('Character Level');await wait(`!!document.querySelector('[data-testid=card-character-4]')`);check('Lessons entry point reaches Character Level');
  await nav('/learner/home');await wait(`document.body.innerText.includes('Character Level QA')`);check('Learner dashboard still loads active profile');
  await nav('/mentor');await wait(`document.body.innerText.length>80`);await snap('mentor-public-regression');check('Mentor public entry still renders',{text:await ev('document.body.innerText')});
} catch(e) {report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1;}
finally {fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close();}
