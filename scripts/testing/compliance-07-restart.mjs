import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import{connect,delay}from './compliance-01/cdp.mjs';
const profile=process.argv[2];if(!profile?.includes('baya-compliance-01-'))throw Error('An isolated test browser profile is required');
let c=await connect();const before=await c.evaluate(`Array.from(document.querySelectorAll('[data-testid=writing-canvas] path'),p=>p.getAttribute('d'))`);assert.equal(before.length,2);
await c.send('Browser.close').catch(()=>{});c.close();await delay(700);
const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--remote-debugging-port=9349','--headless=new','--disable-gpu',`--user-data-dir=${profile}`,'http://127.0.0.1:5071/learner/home'],{stdio:'ignore',windowsHide:true,detached:true});browser.unref();
for(let i=0;i<100;i++){try{c=await connect();break}catch{await delay(100)}}
try{
await c.send('Page.enable');await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
for(let i=0;i<100;i++){if(await c.evaluate(`document.querySelector('[data-testid=continue-lesson-hero]')?.innerText.includes('Vowels')`))break;await delay(100)}
const hero=await c.evaluate(`document.querySelector('[data-testid=continue-lesson-hero]').innerText`);assert.ok(hero.includes('Vowels'));
await c.evaluate(`document.querySelector('[data-testid=continue-lesson-hero] [role=button]').click()`);
for(let i=0;i<100;i++){if(await c.evaluate(`!!document.querySelector('[data-testid=writing-canvas]')`))break;await delay(100)}
const after=await c.evaluate(`Array.from(document.querySelectorAll('[data-testid=writing-canvas] path'),p=>p.getAttribute('d'))`);assert.deepEqual(after,before);
const result={fullChromeProcessRestart:true,sameIsolatedProfile:true,hero,geometryEqual:true,installedOsPwaLaunch:'not tested'};fs.writeFileSync('docs/verification/compliance-07/restart.json',JSON.stringify(result,null,2));const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/compliance-07/restart-restored.png',Buffer.from(shot.data,'base64'));console.log(result);
}finally{c.close()}
