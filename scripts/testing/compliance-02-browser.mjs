import fs from 'node:fs';
import {connect,delay} from './compliance-01/cdp.mjs';
const c=await connect(), out='docs/verification/compliance-02', report={screens:[],checks:[],errors:[]};
async function waitFor(expression){for(let i=0;i<150;i++){if(await c.evaluate(expression))return;await delay(100);}throw Error('Not ready: '+expression);}
async function nav(route){await c.send('Page.navigate',{url:'http://127.0.0.1:5071'+route});await delay(300);await waitFor("document.readyState==='complete' && !!document.querySelector('[role=button],[role=radio]')");await delay(300);}
async function press(label){await c.evaluate(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)});if(!e)throw Error('Missing button');e.focus();e.click()})()`);await delay(400);}
async function shot(language,name,width,height){const file=`${language}-${name}-${width}x${height}.png`;const data=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${out}/${file}`,Buffer.from(data.data,'base64'));report.screens.push({file,language,name,width,height,...await c.evaluate("({text:document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth+1,focus:document.activeElement?.getAttribute('aria-label')})")});}
try{
 await c.send('Page.enable');await c.send('Network.enable');
 for(const lang of ['en','tl']){
  await nav('/learner/settings');await c.evaluate(`document.querySelector('[role=radio][aria-label=${lang==='en'?'English':'Tagalog'}]').click()`);await delay(500);
  for(const[w,h]of [[667,375],[844,390],[915,412],[1024,768],[1366,768]]){
   await c.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await nav('/');
   await shot(lang,'welcome',w,h);await press(lang==='en'?'MEET BAYANI':'KILALANIN SI BAYANI');
   for(let step=0;step<4;step++){
    await shot(lang,['bayani-permission-pending','bayani-story','name-origin','baya'][step],w,h);
    if(h<500){await c.evaluate("[...document.querySelectorAll('div')].filter(e=>getComputedStyle(e).overflowY==='auto'&&e.scrollHeight>e.clientHeight).forEach(e=>e.scrollTop=e.scrollHeight)");await delay(100);await shot(lang,'part-'+(step+1)+'-scrolled',w,h);}
    if(step===0){report.checks.push({language:lang,width:w,photoNotLoaded:await c.evaluate("![...document.images].some(e=>/wixstatic|philippineeagle/.test(e.src))")});}
    await press(step===3?(lang==='en'?'LET’S START!':'SIMULAN NATIN!'):(lang==='en'?'Next':'Susunod'));
   }
   await shot(lang,'dismissed',w,h);
   report.checks.push({language:lang,width:w,dismissed:await c.evaluate("!document.querySelector('[data-testid=bayani-photo-awaiting-authorization]') && !document.querySelector('[data-testid=origin-official-mascot]')")});
  }
  console.log('Captured '+lang);
 }
 await nav('/');await press('KILALANIN SI BAYANI');
 await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});await delay(500);
 report.checks.push({escapeDismisses:await c.evaluate("!document.querySelector('[data-testid=bayani-photo-awaiting-authorization]')"),focusRestored:await c.evaluate("document.activeElement?.getAttribute('aria-label')==='KILALANIN SI BAYANI'")});
 await c.evaluate('navigator.serviceWorker.ready');await delay(1000);await nav('/');
 await c.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await c.send('Page.reload');await delay(2200);await press('KILALANIN SI BAYANI');
 report.checks.push({offlineStory:await c.evaluate("document.body.innerText.includes('Disyembre 5, 2025')")});
 for(let i=0;i<3;i++)await press('Susunod');report.checks.push({offlineOfficialMascot:await c.evaluate("!!document.querySelector('[data-testid=origin-official-mascot] img')")});
 await c.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
}catch(e){report.errors.push(String(e));}finally{fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({screens:report.screens.length,checks:report.checks,errors:report.errors}));c.close();}
if(report.errors.length||report.screens.some(s=>s.overflow)||report.checks.some(c=>Object.values(c).some(v=>v===false)))process.exitCode=1;
