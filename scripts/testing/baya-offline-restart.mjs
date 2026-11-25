import fs from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {openTestBrowser} from './device-browser.mjs';
const base='http://127.0.0.1:5056';
const out='docs/verification/offline-first/restart';fs.mkdirSync(out+'/screenshots',{recursive:true});
const observations=[]; const events=[]; let c;
async function fresh(){const b=await openTestBrowser(5056,{profile:restartProfile});const ws=new WebSocket(b.target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(['Runtime.exceptionThrown','Network.loadingFailed'].includes(m.method))events.push(m)};const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});return {send,ev,close:async()=>{ws.close();await b.close()}}}
const book="document.querySelector('[data-testid=origin-storybook]')";
const trigger="document.querySelector('[data-testid=storybook-settings-trigger]')";
const progress="document.querySelector('[data-testid=origin-progress]')?.getAttribute('aria-valuenow')";
const button=l=>`[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(l)})`;
async function wait(exp,ms=20000){for(let t=0;t<ms;t+=200){if(await c.ev(`Boolean(${exp})`))return;await delay(200)}throw Error('Timeout '+exp)}
async function nav(route='/'){await c.send('Page.navigate',{url:base+route});await delay(500);await wait("document.querySelector('[role=button],[role=radio]')!==null");await delay(400)}
async function press(l,pause=600){await c.ev(`(${button(l)}).click()`);await delay(pause)}
async function open(){await c.ev(`${trigger}.click()`);await wait(book);await delay(200)}
async function close(){if(await c.ev(`!!${book}`)){await c.ev(`(${book}.querySelector('[role=button]')).click()`);await delay(300)}}
async function locale(lang){await close();await nav('/learner/settings');await c.ev(`document.querySelector('[role=radio][aria-label="${lang}"]').click()`);await delay(300)}
async function key(key,modifiers=0){const vk={Tab:9,Enter:13,Escape:27}[key];await c.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,modifiers,windowsVirtualKeyCode:vk,text:key==='Enter'?'\r':undefined});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,modifiers,windowsVirtualKeyCode:vk});await delay(180)}
async function state(){return c.ev(`({url:location.href,text:document.body.innerText,focus:document.activeElement?.outerHTML?.slice(0,800),progress:${progress},online:navigator.onLine,viewport:[innerWidth,innerHeight],images:[...document.querySelectorAll('[data-testid=origin-storybook] img')].map(i=>({src:i.src,alt:i.alt,label:i.getAttribute('aria-label'),loaded:i.complete&&i.naturalWidth>0}))})`)}
async function evidence(id){const s=await state();fs.writeFileSync(out+'/'+id+'.json',JSON.stringify(s,null,2));const r=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(out+'/screenshots/'+id+'.png',Buffer.from(r.data,'base64'));return s}
async function test(id,description,steps,expected,fn){let status='Passed',actual,detail;try{const r=await fn();actual=r.actual;detail=r.detail;if(r.pass===false)status='Failed';if(r.status)status=r.status}catch(e){status='Blocked';actual='Execution was interrupted: '+String(e)}const s=await evidence(id).catch(()=>null);observations.push({id,description,steps,expected,actual,status,detail,evidence:[id+'.json','screenshots/'+id+'.png'],time:new Date().toISOString()});fs.writeFileSync(out+'/observations.json',JSON.stringify(observations,null,2));console.log(id,status,actual)}
const check=async(exp,actual)=>({pass:!!await c.ev(exp),actual});
async function layout(){return c.ev(`(()=>{const b=${book},s=document.querySelector('[data-testid=origin-scroll]');return {overflow:s.scrollWidth>s.clientWidth+1,images:[...b.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),direction:getComputedStyle(document.querySelector('[data-testid=origin-spread]')).flexDirection,controls:[...b.querySelectorAll('[role=button]')].map(e=>{let r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height}}),w:innerWidth,h:innerHeight}})()`)}


import {spawn} from 'node:child_process';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
const restartProfile=fs.mkdtempSync(path.join(os.tmpdir(),'baya-offline-restart-'));
const server=spawn(process.execPath,['scripts/testing/baya-fix-server.mjs'],{env:{...process.env,BAYA_QA_PORT:'5056'},stdio:'ignore',windowsHide:true});
const capture=`window.__qa={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('active_learner_profile_id'))__qa.learner=id;return value(factory,id,...args)}}});`;
try{
 await delay(1000);c=await fresh();await c.send('Page.addScriptToEvaluateOnNewDocument',{source:capture});await nav('/learner/setup');
 const learner=await c.ev(`__r(__qa.learner).localLearnerService.saveProfile('Restart offline QA')`);await c.ev(`__r(__qa.learner).localLearnerService.completeTopic('topic-1-1')`);await wait('!!navigator.serviceWorker.controller',120000);
 await c.close();c=null;
 const stopped=new Promise(r=>server.once('exit',r));server.kill();await stopped;
 let unreachable=false;try{await fetch('http://127.0.0.1:5056/')}catch{unreachable=true}assert(unreachable);
 c=await fresh();await c.send('Page.addScriptToEvaluateOnNewDocument',{source:capture});await c.send('Network.setCacheDisabled',{cacheDisabled:true});await c.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await nav('/learner/activities/topic-1-2');await wait("!!document.querySelector('[data-testid=storybook-topic-screen]')");
 const restored=await c.ev(`__r(__qa.learner).localLearnerService.getActiveLearner()`);const completed=await c.ev(`__r(__qa.learner).localLearnerService.getCompletedTopicIds().then(x=>[...x])`);
 assert.equal(restored.profile_id,learner.profile_id);assert(completed.includes('topic-1-1'));await evidence('server-stopped-browser-restart');
 observations.push({status:'Passed',serverStopped:true,browserProcessRestarted:true,httpCacheDisabled:true,offline:true,restored,completed});
}catch(e){observations.push({status:'Failed',error:String(e)});process.exitCode=1;console.error(e)}finally{fs.writeFileSync(out+'/results.json',JSON.stringify(observations,null,2));await c?.close();server.kill()}
