import fs from 'node:fs';import assert from 'node:assert/strict';import{connect,delay}from './compliance-01/cdp.mjs';
const c=await connect(),results=[];
const wait=async e=>{for(let i=0;i<100;i++){if(await c.evaluate(e))return;await delay(100)}throw Error(e)};
const click=async label=>{await c.evaluate(`Array.from(document.querySelectorAll('[aria-label='+JSON.stringify(${JSON.stringify(label)})+']')).find(e=>e.getBoundingClientRect().width>0).click()`);await delay(300)};
try{
await c.send('Page.enable');await c.send('Network.enable');await c.send('Network.setBypassServiceWorker',{bypass:true});
for(const lang of ['en','tl']){
await c.send('Page.navigate',{url:'http://127.0.0.1:5071/learner/settings'});await delay(400);await wait(`!!document.querySelector('[data-testid=language-selector]')`);await click(lang==='en'?'English':'Tagalog');
await c.send('Page.navigate',{url:'http://127.0.0.1:5071/learner/workspaces'});await delay(400);await wait(`document.querySelectorAll('[role=button]').length>0`);
const joinLabel=await c.evaluate(`Array.from(document.querySelectorAll('[role=button]')).find(e=>/JOIN WORKSPACE|SUMALI SA WORKSPACE/.test(e.innerText))?.getAttribute('aria-label')`);console.log({lang,joinLabel});await c.evaluate(`document.querySelector('[aria-label='+JSON.stringify(${JSON.stringify(joinLabel)})+']').focus()`);await click(joinLabel);await wait(`!!document.querySelector('[role=dialog]')`);
for(const [width,height] of [[667,375],[844,390],[915,412],[1024,768],[1366,768]]){
await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(180);
const buttons=await c.evaluate(`Array.from(document.querySelectorAll('[role=dialog] [role=button]'),e=>{const r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label'),x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}}).filter(r=>r.width>0)`);
assert.ok(buttons.length>=2);assert.ok(buttons.every(b=>b.x>=0&&b.y>=0&&b.right<=width+1&&b.bottom<=height+1));
const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`docs/verification/compliance-07/dialog-${lang}-${width}x${height}.png`,Buffer.from(shot.data,'base64'));results.push({lang,width,height,buttons});
}
await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(300);
const returnedFocus=await c.evaluate(`document.activeElement?.getAttribute('aria-label')`);assert.equal(returnedFocus,joinLabel);results.push({lang,escapeFocusRestored:true});
}
console.log('Passed',results.filter(r=>r.width).length,'dialog layouts, with Escape focus restored in both languages');
}finally{fs.writeFileSync('docs/verification/compliance-07/dialog-layouts.json',JSON.stringify(results,null,2));c.close()}
