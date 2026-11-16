import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = process.env.BAYA_STORYBOOK_OUTPUT || 'docs/verification/baya-storybook-enhancement'; fs.mkdirSync(out, {recursive:true});
const browser = await openTestBrowser(5055);
const ws = new WebSocket(browser.target.webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0; const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const report={screens:[],checks:[],physical:browser.physical};
const check=(name,value)=>{report.checks.push({name,pass:!!value});assert.ok(value,name);};
const press=async label=>{await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)});if(!e)throw Error('Missing '+${JSON.stringify(label)});e.focus();e.click()})()`);await delay(600);};
const open=async()=>{await evaluate(`document.querySelector('[data-testid=mascot-origin-teaser]').click()`);await delay(250);};
async function ready(){for(let n=0;n<100;n++){if(await evaluate(`!!document.querySelector('[data-testid=mascot-origin-teaser]')`))return;await delay(200);}throw Error('Welcome timeout');}
async function shot(name){const image=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${out}/${name}.png`,Buffer.from(image.data,'base64'));report.screens.push(name);}
try {
 await send('Page.enable');await send('Network.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1366,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5055/'});await ready();await delay(700);
 if(await evaluate("!!document.querySelector('[data-testid=origin-storybook]')"))await press('Close the story');
 await shot('desktop-welcome');await open();
 for(let page=1;page<=5;page++){
  await shot('desktop-page-'+page);
  check('desktop spread '+page,await evaluate(`(()=>{const a=document.querySelector('[data-testid=origin-illustration]').getBoundingClientRect(),b=document.querySelector('[data-testid=origin-reading]').getBoundingClientRect();return a.right<=b.left})()`));
  check('images loaded '+page,await evaluate(`Array.from(document.querySelectorAll('[data-testid=origin-storybook] img')).every(i=>i.complete&&i.naturalWidth>0)`));
  if(page===2){
   check('supplied eagle collage and source',await evaluate(`(()=>{const v=document.querySelector('[data-testid=origin-illustration]');return v.querySelector('a')?.href==='https://www.philippineeaglefoundation.org/post/princess-maasim-from-near-tragedy-to-conservation-legacy' && v.querySelectorAll('img').length===1 && v.querySelector('img').src.includes('bayani_pic')})()`));
  }
  if(page<5)await press('Next');
 }
 await press('Previous');check('backward navigation',await evaluate(`document.body.innerText.includes('Discovering Baybayin')`));
 await press('Close the story');
 check('focus restored',await evaluate(`document.activeElement?.dataset.testid==='mascot-origin-teaser'`));
 await open();
 for(let i=0;i<8;i++){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab'});}
 check('keyboard focus stays in book',await evaluate(`!!document.activeElement.closest('[data-testid=origin-storybook]')`));
 await evaluate(`(()=>{let e=[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')==='Next');for(let i=0;i<10;i++)e.click()})()`);await delay(100);await shot('forward-turn');check('forward turn animates',await evaluate(`document.getAnimations().length>0`));await delay(500);
 check('rapid next advances once',await evaluate(`document.querySelector('[data-testid=origin-progress]').getAttribute('aria-valuenow')==='40'`));
 await evaluate(`(()=>{let e=[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')==='Previous');for(let i=0;i<10;i++)e.click()})()`);await delay(100);await shot('backward-turn');check('backward turn animates',await evaluate(`document.getAnimations().length>0`));await delay(500);
 check('rapid previous advances once',await evaluate(`document.querySelector('[data-testid=origin-progress]').getAttribute('aria-valuenow')==='20'`));
 await evaluate(`(()=>{const b=n=>[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===n);b('Next').click();b('Close the story').click()})()`);await delay(600);await open();
 check('interrupted turn resets on reopen',await evaluate(`document.querySelector('[data-testid=origin-progress]').getAttribute('aria-valuenow')==='20'`));
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await delay(250);
 check('escape dismisses',await evaluate(`!document.querySelector('[data-testid=origin-storybook]')`));
 for(const[w,h]of [[320,568],[390,844],[430,932],[844,390],[768,1024],[1024,768],[1280,800],[1440,900]]){
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});
  await send('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36'});
  await delay(300);await open();
  for(let page=1;page<=5;page++){
   await shot(`${w}x${h}-page-${page}`);
   check(`layout ${w}x${h} page ${page}`,await evaluate(`(()=>{const b=document.querySelector('[data-testid=origin-storybook]');return b.getBoundingClientRect().right<=innerWidth && [...b.querySelectorAll('[role=button]')].every(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth})})()`));
   if(w<760)check(`stacked ${w} page ${page}`,await evaluate(`document.querySelector('[data-testid=origin-illustration]').getBoundingClientRect().bottom<=document.querySelector('[data-testid=origin-reading]').getBoundingClientRect().top`));
   await evaluate(`[...document.querySelectorAll('[data-testid=origin-storybook] div')].filter(e=>getComputedStyle(e).overflowY==='auto'&&e.scrollHeight>e.clientHeight).forEach(e=>e.scrollTop=e.scrollHeight)`);await delay(100);
   if(w<760||h<500)await shot(`${w}x${h}-page-${page}-reading`);
   await press(page===5?'Finish Reading':'Next');
  }
 }
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await open();await press('Next');
 check('reduced motion instant and no animation',await evaluate(`document.querySelector('[data-testid=origin-progress]').getAttribute('aria-valuenow')==='40' && document.getAnimations().length===0`));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
 check('rotation preserves current page',await evaluate(`document.querySelector('[data-testid=origin-progress]').getAttribute('aria-valuenow')==='40'`));
 await press('Close the story');
 await evaluate('navigator.serviceWorker.ready.then(()=>true)');await delay(1500);
 await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await send('Page.reload');await delay(1800);await ready();await open();
 for(let p=1;p<=5;p++){
  check('offline page '+p,await evaluate(`Array.from(document.querySelectorAll('[data-testid=origin-storybook] img')).every(i=>i.complete&&i.naturalWidth>0)`));
  if(p<5)await press('Next');
 }
 await shot('offline-final-page');
} catch(e){report.error=String(e);process.exitCode=1;}
finally{fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));ws.close();await browser.close();}
