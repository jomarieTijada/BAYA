import fs from 'node:fs';import assert from 'node:assert/strict';import{connect,delay}from './compliance-01/cdp.mjs';
const c=await connect();
try{
await c.send('Page.enable');await c.send('Network.enable');await c.send('Network.setBypassServiceWorker',{bypass:true});
await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__resumeModule=null;let def;Object.defineProperty(window,'__d',{configurable:true,get(){return def},set(value){def=function(factory,id,...args){const src=String(factory);if(src.includes('activity_resume:')&&src.includes('acceptedCounts'))window.__resumeModule=id;return value(factory,id,...args)}}});`});
await c.send('Page.navigate',{url:'http://127.0.0.1:5071/learner/home'});await delay(700);
for(let i=0;i<100;i++){if(await c.evaluate(`!!document.querySelector('[data-testid=continue-lesson-hero]') && window.__resumeModule!==null`))break;await delay(100)}
await c.evaluate(`__r(__resumeModule).activityResumeService.read=async()=>{throw Error('Injected test-only read failure')};document.querySelector('[data-testid=continue-lesson-hero] [role=button]').click()`);
for(let i=0;i<100;i++){if(await c.evaluate(`document.body.innerText.includes('Your activity could not be opened')`))break;await delay(100)}
assert.ok(await c.evaluate(`document.body.innerText.includes('Your activity could not be opened')`));
await c.evaluate(`Array.from(document.querySelectorAll('[aria-label="Back"]')).find(e=>e.getBoundingClientRect().width>0).click()`);await delay(500);assert.equal(await c.evaluate('location.pathname'),'/learner/lessons');
const r={testOnlyInjectedReadFailure:true,friendlyErrorShown:true,backFallback:'/learner/lessons'};fs.writeFileSync('docs/verification/compliance-07/restore-error.json',JSON.stringify(r,null,2));console.log(r);
}finally{c.close()}
