import fs from 'node:fs';
import {connect,delay} from './compliance-01/cdp.mjs';
const c=await connect(),report={offline:[],navigation:[],media:null};
async function nav(id){await c.send('Page.navigate',{url:`http://127.0.0.1:5071/learner/activities/topic-1-${id}?lessonPage=content`});for(let i=0;i<100;i++){await delay(150);if(await c.evaluate("!!document.querySelector('[data-testid=story-content]')")){await delay(1200);return;}}throw Error('Lesson timeout '+id);}
try{
 await c.send('Network.enable');await nav(1);
 report.media=await c.evaluate(`(()=>{const v=document.querySelector('video');return {source:v?.currentSrc,duration:v?.duration,error:v?.error?.message,credits:[...document.querySelectorAll('[role=link],a')].map(e=>({text:e.textContent,url:e.getAttribute('href')}))}})()`);
 await c.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 for(let i=1;i<=5;i++){await nav(i);report.offline.push(await c.evaluate(`({topic:${i},online:navigator.onLine,path:location.pathname,paragraphs:[...document.querySelectorAll('[data-testid^=story-paragraph]')].map(e=>e.textContent),controller:!!navigator.serviceWorker.controller})`));}
 await c.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await nav(1);for(let i=1;i<=2;i++){await c.evaluate(`document.querySelectorAll('[data-testid=story-navigation] [role=button]')[1].click()`);await delay(1800);}await c.evaluate(`document.querySelectorAll('[data-testid=story-navigation] [role=button]')[1].click()`);await delay(3000);report.navigation.push(await c.evaluate('location.pathname+location.search'));
 await c.evaluate(`document.querySelectorAll('[data-testid=story-navigation] [role=button]')[0].click()`);await delay(800);report.navigation.push(await c.evaluate('location.pathname+location.search'));
 await c.send('Emulation.setDeviceMetricsOverride',{width:667,height:375,deviceScaleFactor:1,mobile:false});await nav(4);await c.evaluate(`document.querySelector('[data-testid=story-mascot-button]').click()`);await delay(150);report.popoverOpened=await c.evaluate(`!!document.querySelector('[data-testid=story-mascot-popover]')`);
 await c.evaluate(`document.querySelector('[data-testid=story-mascot-popover] [role=button]').click()`);await delay(600);report.popoverDismissed=await c.evaluate(`!document.querySelector('[data-testid=story-mascot-popover]')`);
 if(report.navigation[0]!='/learner/activities/topic-1-4?lessonPage=content'||report.navigation[1]!='/learner/activities/topic-1-3?lessonPage=content')throw Error('Unexpected navigation');
 if(report.offline.some(r=>!r.controller||r.online||!r.paragraphs.length))throw Error('Offline failure');
}catch(e){report.error=String(e);process.exitCode=1;}finally{await c.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});fs.writeFileSync('docs/verification/compliance-03/interaction-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));c.close();}
