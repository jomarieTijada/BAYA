import fs from 'node:fs';import assert from 'node:assert/strict';import{connect,delay}from './cdp.mjs';
const c=await connect(),root='docs/compliance/evidence/resume',origin='http://127.0.0.1:5093';
const report={checks:[],screenshots:[]};
const check=(name,data)=>{report.checks.push({name,...data});console.log(name,JSON.stringify(data));};
const wait=async expr=>{for(let i=0;i<150;i++){if(await c.evaluate(expr))return;await delay(100);}throw Error('Timed out: '+expr)};
const go=async path=>{await c.send('Page.navigate',{url:origin+path});await delay(400);await wait(`!!document.querySelector('[data-testid=learner-home-root], [data-testid=writing-canvas]') || !!document.querySelector('[data-testid=storybook-topic-screen]') || document.body.innerText.includes('MY WORKSPACES')`)};
const shot=async name=>{const s=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(root+'/'+name+'.png',Buffer.from(s.data,'base64'));report.screenshots.push(name+'.png')};
const paths=()=>c.evaluate(`Array.from(document.querySelectorAll('[data-testid=writing-canvas] path'),p=>p.getAttribute('d'))`);
const click=async label=>{await c.evaluate(`(()=>{const e=Array.from(document.querySelectorAll('[aria-label='+JSON.stringify(${JSON.stringify(label)})+']')).find(e=>e.getBoundingClientRect().width>0 && e.getBoundingClientRect().height>0);if(!e)throw Error('Missing '+${JSON.stringify(label)});e.click()})()`);await delay(300)};
const inspect=()=>c.evaluate(`(async()=>{const l=__r(__testModules.learner).localLearnerService,p=await l.getActiveLearner(),r=__r(__testModules.resume).activityResumeService,db=await __r(__testModules.lifecycle).getReadyDatabase();return{checkpoint:await r.read(p.profile_id),attempts:await db.getAllAsync('SELECT activity_id, result_status FROM activity_attempts WHERE learner_profile_id = ?',[p.profile_id])}})()`);
try{
await c.send('Page.enable');await c.send('Network.enable');
await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__testModules={};let def;Object.defineProperty(window,'__d',{configurable:true,get(){return def},set(value){def=function(factory,id,...args){const src=String(factory);if(src.includes('active_learner_profile_id'))window.__testModules.learner=id;if(src.includes('activity_resume:')&&src.includes('acceptedCounts'))window.__testModules.resume=id;if(src.includes('getReadyDatabase')&&src.includes('resetReadyDatabase'))window.__testModules.lifecycle=id;return value(factory,id,...args)}}});`});
await c.send('Network.setBypassServiceWorker',{bypass:true});
await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
await go('/learner/activities/topic-3-1');await delay(500);
check('instrumentation',await c.evaluate(`__testModules`));
await c.evaluate(`__r(__testModules.learner).localLearnerService.saveProfile('Compliance 07 Test A')`);
if((await paths()).length)await click('Clear all strokes');
const r=await c.evaluate(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()`);
for(let s=0;s<2;s++){const pts=Array.from({length:24},(_,i)=>({x:r.x+r.w*(.2+.5*i/23),y:r.y+r.h*(.25+s*.4+.08*Math.sin(i/23*Math.PI*2))}));await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...pts[0],button:'left',buttons:1,clickCount:1});await delay(35);for(const p of pts.slice(1)){await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});await delay(8);}await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...pts.at(-1),button:'left',buttons:0,clickCount:1});await delay(100);}
await wait(`(async()=>{const l=__r(__testModules.learner).localLearnerService,p=await l.getActiveLearner();return (await __r(__testModules.resume).activityResumeService.read(p.profile_id))?.draft.strokes?.length===2})()`);
const before=await paths();assert.equal(before.length,2);const original=await inspect();await shot('after-draft');
await c.send('Page.reload');await delay(400);await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);await delay(300);assert.deepEqual(await paths(),before);const restored=await inspect();assert.deepEqual(restored.attempts,original.attempts);check('drawing reload',{strokeGroups:before.length,geometryEqual:true,attemptsUnchanged:true});await shot('after-reload');
await click('Settings');await wait(`!!document.querySelector('[data-testid=language-selector]')`);
await click('Back');await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);assert.deepEqual(await paths(),before);check('Settings back',{geometryEqual:true});
await go('/learner/home');await wait(`document.querySelector('[data-testid=continue-lesson-hero]')?.innerText.includes('Vowels')`);
await c.send('Page.resetNavigationHistory');
const hero=await c.evaluate(`document.querySelector('[data-testid=continue-lesson-hero]').innerText`);check('Continue Learning context',{hero});
await c.evaluate(`document.querySelector('[data-testid=continue-lesson-hero] [role=button]').click()`);await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);assert.deepEqual(await paths(),before);
await c.evaluate('history.back()');await wait(`location.pathname==='/learner/home'`);check('browser Back',{path:await c.evaluate('location.pathname')});
await c.evaluate('history.forward()');await wait(`location.pathname.includes('topic-3-1') && !!document.querySelector('[data-testid=writing-canvas]')`);assert.deepEqual(await paths(),before);check('browser Forward',{geometryEqual:true});
await go('/learner/home');await click('Settings');await click('Join Workspace');await wait(`!!document.querySelector('[aria-label="Join workspace"]')`);await click('Join workspace');await wait(`!!document.querySelector('[role=dialog]')`);await shot('join-dialog');
const modalOrigin=await c.evaluate('location.pathname');await c.evaluate('history.back()');await delay(700);
check('modal browser Back',{before:modalOrigin,after:await c.evaluate('location.pathname'),dialogs:await c.evaluate(`document.querySelectorAll('[role=dialog]').length`),body:await c.evaluate(`document.body.innerText.slice(0,150)`)});

assert.equal(await c.evaluate('location.pathname'),modalOrigin);assert.equal(await c.evaluate(`document.querySelectorAll('[role=dialog]').length`),0);
await click('Join workspace');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(300);assert.equal(await c.evaluate(`document.querySelectorAll('[role=dialog]').length`),0);check('dialog Escape',{stayedOnWorkspace:true});
// Use the app's real DB connection in an isolated browser profile. No test API is shipped.
await go('/learner/activities/topic-3-1');
const a=await c.evaluate(`__r(__testModules.learner).localLearnerService.getActiveLearner()`);
const b=await c.evaluate(`(async()=>{const db=await __r(__testModules.lifecycle).getReadyDatabase();await db.runAsync("DELETE FROM local_app_state WHERE state_key = 'active_learner_profile_id'");return __r(__testModules.learner).localLearnerService.saveProfile('Compliance 07 Test B')})()`);
await c.send('Page.reload');await delay(400);await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);assert.equal((await paths()).length,0);assert.equal((await inspect()).checkpoint.profileId,b.profile_id);check('profile B isolation',{emptyDraft:true,correctOwner:true});
await c.evaluate(`(async()=>{const db=await __r(__testModules.lifecycle).getReadyDatabase();await db.runAsync("UPDATE local_app_state SET state_value = ? WHERE state_key = 'active_learner_profile_id'",[${JSON.stringify(a.profile_id)}])})()`);
await c.send('Page.reload');await delay(400);await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);assert.deepEqual(await paths(),before);check('profile A restored',{geometryEqual:true});
await click('Clear all strokes');await delay(400);await c.send('Page.reload');await delay(400);await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);assert.equal((await paths()).length,0);check('clear reload',{emptyDraft:true});
await go('/learner/home');
// Reuse the real captured draft for repeatable layout/offline checks (no progress writes).
await c.evaluate(`__r(__testModules.resume).activityResumeService.save(${JSON.stringify({...original.checkpoint,savedAt:new Date().toISOString()})})`);
await go('/learner/activities/topic-3-1');
for(const lang of ['en','tl']){
  await click(lang==='en'?'Settings':'Settings');await wait(`!!document.querySelector('[data-testid=language-selector]')`);await click(lang==='en'?'English':'Tagalog');
  await click(lang==='en'?'Back':'Bumalik');await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);
  for(const [width,height] of [[667,375],[844,390],[915,412],[1024,768],[1366,768]]){
    await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(150);
    assert.deepEqual(await paths(),before);const layout=await c.evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,back:!!document.querySelector('[aria-label="Back"], [aria-label="Bumalik"]'),label:document.querySelector('[data-testid=writing-canvas]').getAttribute('aria-label')})`);assert.equal(layout.overflow,false);await shot(`writing-${lang}-${width}x${height}`);check('restored writing layout',{lang,width,height,...layout});
  }
  await go('/learner/home');
  for(const [width,height] of [[667,375],[844,390],[915,412],[1024,768],[1366,768]]){
    await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(150);
    const layout=await c.evaluate(`(()=>{const e=document.querySelector('[data-testid=continue-lesson-hero] [role=button]'),r=e.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,buttonWidth:r.width,buttonHeight:r.height,label:e.getAttribute('aria-label')}})()`);assert.equal(layout.overflow,false);assert.ok(layout.buttonHeight>=44);await shot(`home-${lang}-${width}x${height}`);check('Continue layout',{lang,width,height,...layout});
  }
  await go('/learner/activities/topic-3-1');
}
// Restore English through existing localization UI.
await c.evaluate(`document.querySelector('[aria-label="Settings"], [aria-label="Mga Setting"]').click()`);await wait(`!!document.querySelector('[data-testid=language-selector]')`);await click('English');await click('Back');await go('/learner/activities/topic-3-1');
await c.send('Network.setBypassServiceWorker',{bypass:false});
await c.evaluate(`(async()=>{const r=await navigator.serviceWorker.ready;await r.update()})()`);
await delay(1500);await c.send('Page.reload');await delay(400);await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);
await wait(`!!navigator.serviceWorker.controller`);
await c.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
await c.send('Page.reload');await delay(400);await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);assert.deepEqual(await paths(),before);check('offline reload',{geometryEqual:true,attempts:(await inspect()).attempts});await shot('offline-restored');
await c.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
}finally{fs.writeFileSync(root+'/browser.json',JSON.stringify(report,null,2));c.close()}

