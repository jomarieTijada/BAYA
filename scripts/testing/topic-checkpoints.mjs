// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/topic-checkpoints'; fs.mkdirSync(out, {recursive:true});
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
  const click=async label=>{await wait(`!![...document.querySelectorAll('[role=button]')].find(e=>e.getClientRects().length&&e.getAttribute('aria-label')===${JSON.stringify(label)}&&e.getAttribute('aria-disabled')!=='true')`);await ev(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getClientRects().length&&e.getAttribute('aria-label')===${JSON.stringify(label)});if(!document.querySelector('[data-testid=assessment-slide]'))e.scrollIntoView({block:'center'});e.click()})()`);await delay(100);};
  const testid=async id=>{await ev(`document.querySelector('[data-testid=${id}]').click()`);await delay(40);};
  const nav=async route=>{await send('Page.navigate',{url:'http://127.0.0.1:5080'+route});await delay(300);await wait(`document.readyState==='complete'`);};
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__audio=[];const NativeAudio=window.Audio;window.Audio=function(...args){const audio=new NativeAudio(...args);window.__audio.push(audio);return audio;};`});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;if(s.includes('character_assessment:v1:'))__modules.assessment=id;if(s.includes('checkpoint-v1-'))__modules.checkpoints=id;if(s.includes('Unknown Character Level set.'))__modules.content=id;return value(factory,id,...args)}}});`});
  await nav('/learner/setup');await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);
  await ev(`__r(__modules.learner).localLearnerService.saveProfile('Character Level QA')`);
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language','en') ON CONFLICT(state_key) DO UPDATE SET state_value='en'")})()`);


  const visible=selector=>`[...document.querySelectorAll('${selector}')].find(e=>e.getClientRects().length)`;
  const press=async id=>{await wait(`!!${visible(`[data-testid=${id}]`)}`);await ev(`${visible(`[data-testid=${id}]`)}.click()`);await delay(150)};
  const lessons=async(module='module-2')=>{await nav('/learner/lessons?moduleId='+module);await wait(`!!${visible('[data-testid=checkpoint-topic-2-1]')}`);await delay(300)};
  const checkpointRoute=c=>'/learner/character-activities?checkpointId='+c.id;
  await lessons();await snap('fresh-locked');
  assert(!(await ev('document.body.innerText')).includes('Character Level'));
  assert.equal(await ev(`document.querySelectorAll('[data-testid^=checkpoint-]').length`),5);
  check('No Character Level banner or standalone hub; five contextual checkpoints');
  const checkpoints=await ev(`__r(__modules.checkpoints).topicCheckpoints`);
  assert.deepEqual(checkpoints.map(c=>c.questions.length),[3,22,27,23,25]);
  const inventory=await ev(`__r(__modules.checkpoints).questionPlacements.map(p=>({...p, modelClass:__r(__modules.content).glyphClass(p.glyph), illustration:__r(__modules.content).glyphAsset(p.glyph),audio:p.interaction===1?__r(__modules.content).questionRecording(p.question):null,scoreable:p.interaction!==1||!!__r(__modules.content).questionRecording(p.question)}))`);
  fs.writeFileSync(`${out}/inventory.json`,JSON.stringify(inventory,null,2));
  assert.equal(new Set(inventory.map(p=>p.questionId)).size,100);check('Production mapping references all 100 questions once');
  for(const c of checkpoints){await nav(checkpointRoute(c));await wait(`document.body.innerText.includes('Locked')`);assert(!await ev(`!!document.querySelector('[data-testid=assessment-slide]')`));check('Fresh direct route blocked '+c.topicId)}
  await nav('/learner/character-activities?activityId=character-1');await wait(`!!${visible('[data-testid=learner-lessons-root]')}`);check('Legacy bank link redirects safely to lessons');
  await ev(`(async()=>{for(const id of ['topic-1-1','topic-1-2','topic-1-3','topic-1-4','topic-1-5'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  const historic=await ev(`__r(__modules.assessment).characterActivityService.begin('character-2-set-1')`);
  await wait(`!!navigator.serviceWorker.controller`,90000);
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});assert.equal(await ev('navigator.onLine'),false);
  await nav('/learner/activities/topic-2-1');await wait(`!!document.querySelector('[data-testid=character-glyph]')`);
  await ev('window.__sameDocument=true');await click('Next character');await click('Next character');await click('Next topic');await click('Back');
  await wait(`${visible('[data-testid=checkpoint-topic-2-1]')}?.getAttribute('aria-disabled')!=='true'&&!!${visible('[data-testid=checkpoint-topic-2-1]')}`);
  assert(await ev('window.__sameDocument'));assert.equal(await ev(`${visible('[data-testid=checkpoint-topic-2-2]')}.getAttribute('aria-disabled')`),'true');
  await snap('vowels-unlocked-offline');check('Offline lesson completion unlocks only its adjacent checkpoint without reload');
  // Complete subsequent instructions in the isolated QA fixture; no mastery results are forged by the application.
  await ev(`(async()=>{for(const id of ['topic-2-2','topic-kudlit-upper'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  await lessons('module-kudlit');assert.equal(await ev(`${visible('[data-testid=checkpoint-topic-kudlit-upper]')}.getAttribute('aria-disabled')`),null);assert.equal(await ev(`${visible('[data-testid=checkpoint-topic-kudlit-lower]')}.getAttribute('aria-disabled')`),'true');check('Upper checkpoint unlocks before lower instruction');
  await nav(checkpointRoute(checkpoints[3]));await wait(`document.body.innerText.includes('Locked')`);check('Lower checkpoint direct route remains locked');
  await ev(`(async()=>{for(const id of ['topic-kudlit-lower','topic-3-1','topic-3-2'])await __r(__modules.learner).localLearnerService.completeTopic(id)})()`);
  const sizes=[[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[1024,768],[1280,800],[1440,900],[2048,921]];
  for(const [width,height] of sizes){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await lessons('module-kudlit');
    assert(!(await ev('document.body.innerText')).includes('Character Level'));
    assert.equal(await ev(`document.querySelectorAll('[data-testid^=checkpoint-]').length`),5);
    for(const c of checkpoints){
      await ev(`${visible(`[data-testid=checkpoint-${c.topicId}]`)}.scrollIntoView({block:'center',inline:'center'})`);await delay(100);
      const g=await ev(`(()=>{const r=${visible(`[data-testid=checkpoint-${c.topicId}]`)}.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}})()`);
      assert(g.x>=-1&&g.right<=width+1&&g.y>=0&&g.bottom<=height&&g.h>=44,JSON.stringify(g));
    }
    await ev(`${visible('[data-testid=lesson-card-module-kudlit]')}.scrollIntoView({block:'start',inline:'center'})`);await delay(150);await snap(`lessons-${width}x${height}`);check(`All five checkpoint controls reachable ${width}x${height}`);
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  const stroke=JSON.parse(fs.readFileSync('docs/verification/character-level/slide-correction/browser-results.json','utf8')).inferenceCandidates[0].stroke;
  const draw=async()=>{await ev(`document.querySelector('[data-testid=writing-canvas]').scrollIntoView({block:'center'})`);const r=await ev(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`);const points=stroke.map(p=>({x:r.x+r.w*p.x,y:r.y+r.h*p.y}));await send('Input.dispatchMouseEvent',{type:'mousePressed',...points[0],button:'left',buttons:1,clickCount:1});for(const p of points.slice(1))await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...points.at(-1),button:'left',buttons:0,clickCount:1});await delay(200)};
  const answer=async(q,wrong=false)=>{
    await wait(`!!${visible(`[data-testid=question-${q.id}]`)}`);
    if(q.type==='handwriting'){await draw();await click('Check Writing')}
    else if(q.id.startsWith('character-1-')&&['DE','RE'].includes(q.prompt)){await click('Continue without scoring')}
    else{if(q.id.startsWith('character-1-')){await click('Play Sound');await wait(`__audio.some(a=>a.currentTime>0&&!a.paused)`)}await press('answer-'+(wrong?(q.correctLetter==='A'?'B':'A'):q.correctLetter));await click('Check Answer')}
    await wait(`!!${visible('[data-testid=answer-feedback]')}`,90000);await click('Continue');
  };
  const modal=async()=>{await wait(`!!${visible('[data-testid=completion-dialog]')}`);await delay(200)};
  for(const c of checkpoints){
    await lessons(c.moduleId);await press('checkpoint-'+c.topicId);await wait(`!!${visible(`[data-testid=question-${c.questions[0].id}]`)}`);await snap('player-'+c.topicId);
    for(const [i,q] of c.questions.entries()){
      if(i===1&&c===checkpoints[1]){await click('Back');await wait(`!!${visible('[data-testid=checkpoint-topic-2-2]')}`);await wait(`${visible('[data-testid=checkpoint-topic-2-2]')}.textContent.includes('Continue')`);await press('checkpoint-topic-2-2');await wait(`!!${visible(`[data-testid=question-${q.id}]`)}`);await nav(checkpointRoute(c));await wait(`!!${visible(`[data-testid=question-${q.id}]`)}`);check('Back and reload resume the correct checkpoint question')}
      await answer(q,c===checkpoints[0]);
    }
    await modal();const attempt=(await ev(`__r(__modules.assessment).characterActivityService.list()`)).filter(a=>a.setId===c.id).at(-1);
    assert.equal(attempt.cursor,c.questions.length);assert.equal(attempt.responses.length,c.questions.length);
    const scored=attempt.responses.filter(r=>r.correct!==null).length,correct=attempt.responses.filter(r=>r.correct).length;
    const metric=await ev(`${visible('[data-testid=completion-metrics]')}.textContent`);assert(metric.includes(`${correct} / ${scored}`)&&metric.includes(`${c.questions.length} / ${c.questions.length}`));
    if(c.topicId==='topic-kudlit-upper')assert.equal(attempt.responses.filter(r=>r.correct===null).length,2);
    await snap('complete-'+c.topicId);await press('completion-summary');await wait(`!!${visible('[data-testid=completion-review]')}`);await snap('summary-'+c.topicId);await press('completion-summary');
    if(c===checkpoints[0]){
      await press('completion-retry');await wait(`!${visible('[data-testid=completion-dialog]')}`);for(const q of c.questions)await answer(q);await modal();
      const saved=await ev(`__r(__modules.assessment).characterActivityService.list()`);assert.deepEqual(saved.find(a=>a.id===attempt.id),attempt);assert.equal(saved.filter(a=>a.setId===c.id).length,2);check('Retry preserves zero-correct original and saves a separate attempt');
    }
    await press('completion-next');await wait(`${visible(`[data-testid=checkpoint-${c.topicId}]`)}?.textContent.includes('Review')`);await snap('return-'+c.topicId);check(`Offline ${c.topicId}: all ${c.questions.length} questions, real results, Summary and owning-topic return`);
  }
  assert.deepEqual((await ev(`__r(__modules.assessment).characterActivityService.list()`)).find(a=>a.id===historic.id),historic);
  await lessons('module-2');await ev(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getClientRects().length&&e.textContent.includes('Previous source-set results'));e.scrollIntoView();e.click()})()`);await modal();await wait(`!!${visible(`[data-testid=review-attempt-${historic.id}]`)}`);await snap('legacy-history');check('Unmodified original bank attempt remains accessible');await press('completion-next');
  await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value='tl' WHERE state_key='interface_language'")})()`);
  await lessons('module-kudlit');await snap('lessons-tagalog');await nav(checkpointRoute(checkpoints[2]));await modal();await snap('completion-tagalog');check('Tagalog topic labels, results and offline reopening');
  for(let i=0;i<8;i++){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert(await ev(`!!document.activeElement.closest('[data-testid=completion-dialog]')`));}check('Completion keyboard focus remains contained');
  report.attempts=await ev(`__r(__modules.assessment).characterActivityService.list()`);
  report.completed=await ev(`(async()=>Array.from(await __r(__modules.learner).localLearnerService.getCompletedTopicIds()))()`);
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
