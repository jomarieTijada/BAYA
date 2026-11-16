import fs from 'node:fs';
import {connect,delay} from './cdp.mjs';
const c=await connect(),base='http://127.0.0.1:5071',out='docs/verification/compliance-01',report={screens:[],checks:[],errors:[]};
const screens=[['welcome','/'],['home','/learner/home'],['lesson','/learner/activities/topic-1-2'],['writing','/learner/activities/topic-3-1'],['workspaces','/learner/workspaces'],['mentor-login','/mentor'],['settings','/learner/settings']];
const sizes=[[667,375],[844,390],[915,412],[1024,768],[1366,768]];
async function navigate(route){await c.send('Page.navigate',{url:base+route});await delay(300);for(let i=0;i<100;i++){await delay(100);if(await c.evaluate("document.readyState === 'complete' && !!document.querySelector('[role=button],[role=radio]') && document.body?.innerText?.trim().length > 10 && !document.body.innerText.includes('Downloading JavaScript')"))break;}await delay(700);}
async function choose(language){await navigate('/learner/settings');await c.evaluate(`document.querySelector('[role=radio][aria-label=${language==='tl'?'Tagalog':'English'}]').click()`);await delay(500);if(await c.evaluate('document.documentElement.lang')!==language)throw Error('Language did not change');}
try{
 await c.send('Network.enable');await c.send('Page.enable');
 await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
 await navigate('/learner/settings');await c.evaluate('navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.update())))');await delay(1000);await navigate('/learner/settings');
 for(const language of ['en','tl']){
  await choose(language);
  await navigate('/');report.checks.push({language,persistedAfterNavigation:await c.evaluate('document.documentElement.lang')===language});
  for(const [width,height]of sizes){
   await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
   for(const[name,route]of screens){await navigate(route);const info=await c.evaluate(`({lang:document.documentElement.lang,text:document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth+1,width:innerWidth,height:innerHeight,buttons:[...document.querySelectorAll('[role=button],[role=radio]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({text:e.innerText||e.getAttribute('aria-label'),w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})),clipped:[...document.querySelectorAll('div')].filter(e=>e.childElementCount===0 && e.innerText?.trim() && e.clientWidth>0 && (e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)).map(e=>e.innerText)})`);
    const file=`${language}-${name}-${width}x${height}.png`;const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${out}/${file}`,Buffer.from(shot.data,'base64'));report.screens.push({name,language,width,height,file,...info});
   }
  }
  console.log('Captured '+language);
 }
 await choose('en');
 await c.evaluate("document.querySelector('[role=radio][aria-label=English]').focus()");await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});await delay(300);report.checks.push({keyboardArrowSwitch:await c.evaluate("document.documentElement.lang==='tl' && document.activeElement.getAttribute('aria-label')==='Tagalog'")});
 await c.evaluate('navigator.serviceWorker.ready.then(()=>true)');await delay(1500);report.checks.push({serviceWorkerControlsPage:await c.evaluate('!!navigator.serviceWorker.controller')});
 await c.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await c.evaluate("document.querySelector('[role=radio][aria-label=English]').click()");await delay(500);report.checks.push({offlineSwitch:await c.evaluate("document.documentElement.lang==='en'")});
 await c.send('Page.reload');await delay(1800);report.checks.push({offlineReload:await c.evaluate("document.documentElement.lang==='en' && !!document.querySelector('[role=radio]')")});
 await c.evaluate("document.querySelector('[role=radio][aria-label=Tagalog]').click()");await delay(500);await c.send('Page.reload');await delay(1800);report.checks.push({offlineTagalogReload:await c.evaluate("document.documentElement.lang==='tl' && !!document.querySelector('[role=radio]')")});
 await c.evaluate("document.querySelector('[role=radio][aria-label=English]').click()");await delay(500);
 await c.send('Page.navigate',{url:base+'/learner/activities/topic-1-2'});await delay(1500);report.checks.push({offlineLesson:await c.evaluate("document.body.innerText.includes('Syllabary')")});
 await c.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
} catch(e){report.errors.push(String(e));console.error(e);}finally{fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({screens:report.screens.length,checks:report.checks,errors:report.errors,overflow:report.screens.filter(x=>x.overflow).map(x=>x.file),clipped:report.screens.filter(x=>x.clipped.length).map(x=>({file:x.file,text:x.clipped}))}));c.close();}

if(report.errors.length || report.screens.some(s=>s.overflow) || report.checks.some(check=>Object.values(check).some(value=>value===false)))process.exitCode=1;
