import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {connect,delay} from './cdp.mjs';import {hook} from '../../../scripts/testing/compliance-12-fixtures.mjs';
let c=await connect();
const state=()=>c.evaluate(`(async()=>{const db=await __r(__testModules.lifecycle).getReadyDatabase();return{route:location.pathname+location.search,lang:document.documentElement.lang,paths:[...document.querySelectorAll('[data-testid=writing-canvas] path')].map(e=>e.getAttribute('d')),attempts:await db.getAllAsync('SELECT attempt_id,result_status FROM activity_attempts ORDER BY attempt_id')}})()`);
const before=await state();assert.ok(before.paths.length);
// Only our isolated test profiles, never the user's normal Chrome profile.
const candidates=fs.readdirSync(os.tmpdir()).filter(n=>n.startsWith('baya-system-audit-')).map(n=>path.join(os.tmpdir(),n)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs);
const profile=candidates[0];assert.ok(profile&&path.basename(profile).startsWith('baya-system-audit-'));
await c.send('Browser.close').catch(()=>{});c.close();await delay(1800);
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--remote-debugging-port=9368','--headless=new','--disable-gpu',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
try {
 for(let i=0;i<50;i++){try{c=await connect();break}catch{await delay(200)}}
 await c.send('Page.addScriptToEvaluateOnNewDocument',{source:hook});
 await c.send('Page.navigate',{url:'http://127.0.0.1:5093'+before.route});
 let after;
 for(let i=0;i<100;i++){await delay(150);try{after=await state();if(after.paths.length)break}catch{}}
 assert.deepEqual(after.paths,before.paths);assert.deepEqual(after.attempts,before.attempts);assert.equal(after.lang,before.lang);
 const result={fullChromeProcessRestart:true,sameIsolatedProfile:true,languagePersisted:true,geometryEqual:true,attemptsUnchanged:true,before,after,installedOsPwaLaunch:'not tested'};
 fs.writeFileSync('docs/compliance/evidence/restart.json',JSON.stringify(result,null,2));console.log(JSON.stringify({language:after.lang,strokeGroups:after.paths.length,attemptsUnchanged:true}));
} finally {c.close();}
// Keep this isolated browser available for the remaining table audit. It is closed by audit cleanup.
chrome.unref();
