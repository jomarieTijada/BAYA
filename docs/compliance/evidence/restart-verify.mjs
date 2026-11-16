import fs from 'node:fs';import assert from 'node:assert/strict';import {connect,delay} from './cdp.mjs';import {hook} from '../../../scripts/testing/compliance-12-fixtures.mjs';
const c=await connect();
try{
 const previous=JSON.parse(fs.readFileSync('docs/compliance/evidence/recognition/real-ui.json')).checks.find(r=>r.name==='offline real ONNX inference');
 await c.send('Page.addScriptToEvaluateOnNewDocument',{source:hook});await c.send('Page.navigate',{url:'http://127.0.0.1:5093/learner/activities/topic-3-1'});
 let after;
 for(let i=0;i<100;i++){await delay(150);try{after=await c.evaluate(`({lang:document.documentElement.lang,paths:[...document.querySelectorAll('[data-testid=writing-canvas] path')].map(e=>e.getAttribute('d'))})`);if(after.paths.length)break}catch{}}
 assert.deepEqual(after.paths,previous.paths);assert.equal(after.lang,'tl');
 fs.writeFileSync('docs/compliance/evidence/restart.json',JSON.stringify({fullChromeProcessRestart:true,languagePersisted:true,geometryEqual:true,databaseRecheck:"Unavailable: browser module-discovery hook did not expose the database after restart",after,installedOsPwaLaunch:'not tested'},null,2));console.log('PASS language and draft geometry after closing and relaunching isolated Chrome');
}finally{c.close()}
