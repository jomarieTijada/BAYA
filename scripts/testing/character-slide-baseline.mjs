import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out='docs/verification/character-level/slide-correction';fs.mkdirSync(out,{recursive:true});
const prior=JSON.parse(fs.readFileSync('docs/verification/character-level/refinement/browser-results.json','utf8'));
assert.equal(prior.errors.length,0);
const browser=await openTestBrowser(5080,{profile:prior.profile});
const report={checks:[],errors:[]};let ws;
try{
 ws=new WebSocket(browser.target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map();
 ws.onmessage=e=>{const v=JSON.parse(e.data);pending.get(v.id)?.(v);pending.delete(v.id)};
 const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
 const ev=async expression=>{const v=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(v.error||v.result.exceptionDetails)throw Error(JSON.stringify(v));return v.result.result.value};
 const wait=async exp=>{for(let i=0;i<300;i++){if(await ev(exp))return;await delay(100)}throw Error(exp+'\n'+await ev('document.body.innerText'))};
 const click=async label=>{await wait(`!![...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)}&&e.getAttribute('aria-disabled')!=='true')`);await ev(`[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)}).click()`);await delay(100)};
 const nav=async()=>{await send('Page.navigate',{url:'http://127.0.0.1:5080/learner/character-activities'});await wait(`!!document.querySelector('[data-testid=card-character-4]')`)};
 const check=(name,details={})=>{report.checks.push({name,status:'Passed',...details});console.log('PASS '+name)};

 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
 const snap=async name=>{await delay(1000);const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${out}/${name}.png`,Buffer.from(shot.result.data,'base64'));check(name)};
 await nav();await snap('before-hub');
 for(const name of ['Sound Matching','Baybayin to Latin','Latin to Baybayin']){
  await nav();await click(name);await click('Set 1');
  if(await ev(`!!document.querySelector('[data-testid=set-result]')`))await click('Try this set again');
  await wait(`!!document.querySelector('[data-testid=answer-A]')`);await snap('before-'+name.replaceAll(' ','-'));
 }
 await nav();await click('Character Writing');await click('Set 3');await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);await snap('before-activity-writing');
 await send('Page.navigate',{url:'http://127.0.0.1:5080/learner/activities/topic-3-1'});await wait(`!!document.querySelector('[data-testid=writing-reference-card]')`);await snap('before-lesson-writing');
 fs.writeFileSync(`${out}/before-lesson-text.txt`,await ev('document.body.innerText'));
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/baseline-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
