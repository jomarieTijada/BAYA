import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out='docs/verification/character-level';
const prior=JSON.parse(fs.readFileSync(`${out}/browser-results.json`,'utf8'));
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
 await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await nav();await click('Character Writing');await click('Set 2');await wait(`!!document.querySelector('[data-testid=set-result]')`);assert.equal(await ev('navigator.onLine'),false);check('Full browser process restart offline restores prior writing result');
 await nav();await click('Baybayin to Latin');await click('Set 2');await wait(`!!document.querySelector('[data-testid=answer-B]')`);
 // The first run left this repeat at Question 7, initial state.
 await ev(`document.querySelector('[data-testid=answer-A]').focus()`);
 for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await wait(`document.querySelector('[data-testid=answer-A]').getAttribute('aria-checked')==='true'`);
 check('Keyboard Enter selects an answer with visible selected state');
 await click('Check Answer');await wait(`!!document.querySelector('[data-testid=answer-feedback]')`);check('Visual multiple choice scored and saved offline');
 await nav();await click('Character Writing');await click('Set 3');await wait(`!!document.querySelector('[data-testid=set-result]')`);await click('Try this set again');await wait(`!!document.querySelector('[data-testid=writing-canvas]')`);
 for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[1024,768],[1280,800],[1440,900]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(150);
  const g=await ev(`(()=>{const r=document.querySelector('[data-testid=writing-canvas]').getBoundingClientRect();return{width:r.width,height:r.height,scroll:document.documentElement.scrollWidth,underline:document.querySelector('[data-testid=underlined-syllable]').textContent}})()`);
  assert(g.width>=260&&g.height>=220&&g.scroll<=width);assert.equal(g.underline,'KI');
  await ev(`document.querySelector('[data-testid=writing-canvas]').scrollIntoView({block:'center'})`);
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${out}/writing-${width}x${height}.png`,Buffer.from(shot.result.data,'base64'));
  check(`Writing layout ${width}x${height}`,g);
 }
 const ax=await send('Accessibility.getFullAXTree');fs.writeFileSync(`${out}/accessibility-tree.json`,JSON.stringify(ax.result,null,2));check('Accessibility tree captured (not a screen-reader listening test)',{nodes:ax.result.nodes.length});
}catch(e){report.errors.push(String(e.stack||e));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/restart-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
