// Isolated local-browser verification. Real UI, audio, SQLite and LiteRT; no model mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = 'docs/verification/character-level/module-integration'; fs.mkdirSync(out, {recursive:true});
const data = JSON.parse(fs.readFileSync('apps/mobile/content/characterActivities/questions.json','utf8'));
const previous=JSON.parse(fs.readFileSync(`${out}/browser-results.json`,'utf8'));assert.equal(previous.errors.length,0);
const browser = await openTestBrowser(5080,{profile:previous.profile});
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
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await nav('/learner/setup');await wait(`__modules.learner!==undefined&&__modules.db!==undefined`);


 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 await nav('/learner/lessons?moduleId=module-2&assessmentId=character-2');
 await wait(`document.querySelector('[data-testid=checkpoint-character-2]')?.textContent.includes('5/5')`);
 await delay(250);
 assert.equal(await ev(`document.activeElement.getAttribute('data-testid')`),'checkpoint-character-2');check('Return context restores keyboard focus to the owning assessment');
 await ev(`document.querySelectorAll('[data-testid^=checkpoint-] [dir=auto]').forEach(e=>{e.style.fontSize=(parseFloat(getComputedStyle(e).fontSize)*1.5)+'px';e.style.lineHeight='normal'})`);
 for(const id of ['character-1','character-2','character-3','character-4']) {
  const g=await ev(`(()=>{const e=document.querySelector('[data-testid=checkpoint-${id}]');e.scrollIntoView({block:'center',inline:'center'});const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:r.width,h:r.height}})()`);
  assert(g.left>=0&&g.right<=390&&g.top>=0&&g.bottom<=844&&g.w>=44&&g.h>=44,JSON.stringify(g));
 }
 await ev(`document.querySelector('[data-testid=checkpoint-character-2]').scrollIntoView({block:'center',inline:'center'})`);await snap('tagalog-text-150-percent');check('150 percent checkpoint text stress retains wrapping and reachable controls');

}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/accessibility-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
