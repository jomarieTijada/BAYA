import fs from 'node:fs';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {connect,delay} from './cdp.mjs';
let c=await connect();let chrome;
const snapshot=()=>c.evaluate(`({lang:document.documentElement.lang,paths:[...document.querySelectorAll('[data-testid=writing-canvas] path')].map(e=>e.getAttribute('d'))})`);
const wait=async predicate=>{for(let i=0;i<100;i++){try{if(await predicate())return}catch{}await delay(150)}throw Error('Restart timeout')};
try{
 await c.send('Page.navigate',{url:'http://127.0.0.1:5093/learner/settings'});await wait(()=>c.evaluate(`!!document.querySelector('[aria-label=Tagalog]')`));await c.evaluate(`document.querySelector('[aria-label=Tagalog]').click()`);await delay(800);
 await c.send('Page.navigate',{url:'http://127.0.0.1:5093/learner/activities/topic-3-1'});await wait(async()=>!!(await snapshot()).paths.length);const before=await snapshot();assert.equal(before.lang,'tl');fs.writeFileSync('docs/compliance/evidence/restart-baseline.json',JSON.stringify(before,null,2));
 await Promise.race([c.send('Browser.close').catch(()=>{}),delay(500)]);c.close();await delay(1800);
 chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--remote-debugging-port=9368','--headless=new','--disable-gpu','--user-data-dir=C:/Users/jomsa/AppData/Local/Temp/baya-system-audit-fzcyjs','about:blank'],{stdio:'ignore',windowsHide:true});await delay(1500);c=await connect();
 await c.send('Page.navigate',{url:'http://127.0.0.1:5093/learner/activities/topic-3-1'});await wait(async()=>!!(await snapshot()).paths.length);const after=await snapshot();assert.equal(after.lang,before.lang);assert.deepEqual(after.paths,before.paths);
 fs.writeFileSync('docs/compliance/evidence/restart.json',JSON.stringify({fullChromeProcessRestart:true,sameIsolatedProfile:true,languagePersisted:true,geometryEqual:true,before,after,attemptCounts:'Verified on reload/offline tests, not independently rechecked after full process restart',installedOsPwaLaunch:'not tested'},null,2));console.log('PASS full Chrome restart: saved language and exact handwriting geometry restored');
}finally{c.close();chrome?.kill()}
