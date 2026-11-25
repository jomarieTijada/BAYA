import fs from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {openTestBrowser} from './device-browser.mjs';
const browser=await openTestBrowser(8081);const ws=new WebSocket(browser.target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map();ws.onmessage=e=>{const v=JSON.parse(e.data);pending.get(v.id)?.(v);pending.delete(v.id)};
const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
const ev=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.result.value;
fs.mkdirSync('docs/verification/compact-origin',{recursive:true});
try{
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;return value(factory,id,...args)}}});`});
for(const language of (process.env.QA_LANGUAGE ? [process.env.QA_LANGUAGE] : ['en','tl'])) for(const [width,height] of (process.env.QA_SMALL ? [[568,320],[1280,800]] : [[844,390],[667,375],[568,320],[1280,800]])){
await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://127.0.0.1:8081/'});
for(let n=0;n<100;n++){if(await ev(`!!document.querySelector('[data-testid=origin-storybook]')`))break;await delay(500)}
await ev(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();await db.runAsync("INSERT INTO local_app_state (state_key,state_value) VALUES ('interface_language',?) ON CONFLICT(state_key) DO UPDATE SET state_value=excluded.state_value",[${JSON.stringify(language)}])})()`);
await send('Page.reload');await delay(2200);
for(let page=0;page<16;page++){
await delay(700);
const bounds=await ev(`(()=>{const s=document.querySelector('[data-testid=origin-scroll]');return {height:s?.clientHeight,content:s?.scrollHeight}})()`);
console.log(language,width,page,bounds);

const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/compact-origin/'+language+'-'+width+'-'+page+'.png',Buffer.from(shot.result.data,'base64'));

if(!bounds.height || bounds.content > bounds.height+1) throw Error('Overflow '+JSON.stringify({language,width,page,bounds}));
const label=language==='en'?'Next':'Susunod';
const hasNext=await ev(`!!document.querySelector('[data-testid=origin-storybook] [aria-label="${label}"]')`);
if(!hasNext)break;
await ev(`document.querySelector('[data-testid=origin-storybook] [aria-label="${label}"]').click()`);
}
}
}finally{ws.close();await browser.close()}
