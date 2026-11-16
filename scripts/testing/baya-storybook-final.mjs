import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = process.env.BAYA_STORYBOOK_OUTPUT || 'docs/verification/baya-storybook-final'; fs.mkdirSync(out, {recursive:true});
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

const button = label => `([...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)}))`;
const click = label => evaluate(`${button(label)}.click()`);
const key = async (key,code=key,modifiers=0) => {const vk={Enter:13,Tab:9,Escape:27,' ':32}[key]||0;await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,modifiers,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,text:key==='Enter'?'\r':key===' '?' ':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,modifiers,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk});};
const waitFor=async exp=>{for(let i=0;i<100;i++){if(await evaluate(exp))return;await delay(100);}throw Error('Timeout '+exp);};
const nav=async route=>{await send('Page.navigate',{url:'http://127.0.0.1:5055'+route});await delay(500);await waitFor("document.readyState==='complete' && !!document.querySelector('[role=button],[role=radio]')");};
const locale=async lang=>{await nav('/learner/settings');await waitFor(`!!document.querySelector('[role=radio][aria-label="${lang==='en'?'English':'Tagalog'}"]')`);await evaluate(`document.querySelector('[role=radio][aria-label="${lang==='en'?'English':'Tagalog'}"]').click()`);await delay(300);await nav('/');await ready();};
const scrollElement = `document.querySelector('[data-testid=origin-scroll]')`;
const layout=async name=>{
 const r=await evaluate(`(()=>{const book=document.querySelector('[data-testid=origin-storybook]'),s=${scrollElement};const controls=[...book.querySelectorAll('[role=button]')].map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,right:r.right}});return {w:innerWidth,h:innerHeight,overflow:s.scrollWidth>s.clientWidth+1,controls,images:[...book.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),scrollHeight:s.scrollHeight,clientHeight:s.clientHeight}})()`);
 check(name+' readable',!r.overflow&&r.images&&r.controls.every(c=>c.x>=0&&c.y>=0&&c.b<=r.h+1&&c.right<=r.w+1&&c.h>=44));
 report.layouts??=[];report.layouts.push({name,...r});
};
try {
 await send('Page.enable');await send('Network.enable');await send('Accessibility.enable');
 report.browser=await send('Browser.getVersion');
 const matrix=[[320,568],[390,844],[430,932],[844,390],[768,1024],[1024,768],[1280,800],[1440,900]];
 if(browser.physical){matrix.splice(0,matrix.length,await evaluate('[innerWidth,innerHeight]'));report.device=await evaluate('({ua:navigator.userAgent,dpr:devicePixelRatio,screen:[screen.width,screen.height],orientation:screen.orientation.type,memory:navigator.deviceMemory})');}
 for(const lang of (process.env.BAYA_QA_SKIP_MATRIX ? [] : ['en','tl'])){
  if(!browser.physical)await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await locale(lang);
  const next=lang==='en'?'Next':'Susunod',finish=lang==='en'?'Finish Reading':'Tapusin ang Pagbasa';
  for(const[w,h]of matrix){
   if(!browser.physical)await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});
   await delay(250);await shot(`${lang}-${w}x${h}-welcome`);await open();
   for(let p=1;p<=5;p++){
    await layout(`${lang}-${w}x${h}-page-${p}`);await shot(`${lang}-${w}x${h}-page-${p}`);
    check('starts at top '+lang+w+p,await evaluate(`${scrollElement}.scrollTop===0`));
    await evaluate(`${scrollElement}.scrollTop=${scrollElement}.scrollHeight`);await delay(80);
    await shot(`${lang}-${w}x${h}-page-${p}-reading`);
    await press(p===5?finish:next);
   }
  }
 }
 // Keyboard opening, reverse tab, and semantic tree (not a claim of TalkBack testing).
 if(!browser.physical)await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
 await locale('en');await delay(500);await send('Page.bringToFront');await evaluate("document.querySelector('[data-testid=mascot-origin-teaser]').focus()");report.keyboardBefore=await evaluate("({focus:document.activeElement.outerHTML,hasFocus:document.hasFocus()})");await key('Enter');await delay(200);
 check('Enter opens',await evaluate("!!document.querySelector('[data-testid=origin-storybook]')"));
 for(let i=0;i<7;i++)await key('Tab','Tab',8);
 check('reverse tab contained',await evaluate("!!document.activeElement.closest('[data-testid=origin-storybook]')"));
 const ax=await send('Accessibility.getFullAXTree');fs.writeFileSync(`${out}/accessibility-tree.json`,JSON.stringify(ax,null,2));
 check('named dialog',ax.nodes.some(n=>n.role?.value==='dialog'&&n.name?.value==='The Story Behind BAYA'));
 check('meaningful mascot alternative',ax.nodes.some(n=>n.role?.value==='image'&&n.name?.value.includes('woven hat')));
 await key('Escape');await delay(100);check('Escape restores focus',await evaluate("document.activeElement.dataset.testid==='mascot-origin-teaser'"));
 await key(' ','Space');await delay(200);check('Space opens',await evaluate("!!document.querySelector('[data-testid=origin-storybook]')"));
 // Scroll while starting turn, stress lock, animation timings and long tasks.
 await evaluate(`window.qaLongTasks=[];window.qaObserver=new PerformanceObserver(l=>window.qaLongTasks.push(...l.getEntries().map(x=>({start:x.startTime,duration:x.duration}))));window.qaObserver.observe({type:'longtask',buffered:false})`);
 await send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReturnAsStream'});
 const begin=Date.now();await click('Next');await delay(90);await shot('forward-turn');await waitFor(`${button('Next')}.getAttribute('aria-disabled')!=='true'`);report.turnDurationMs=Date.now()-begin;
 await click('Previous');await delay(90);await shot('backward-turn');await delay(500);
 await evaluate(`(()=>{const n=${button('Next')},p=${button('Previous')};for(let i=0;i<12;i++){n.click();p.click()}})()`);await delay(600);
 check('alternating clicks locked',await evaluate("document.body.innerText.includes('Page 2 of 5')"));
 if(!browser.physical)await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await delay(150);
 await evaluate(`${scrollElement}.scrollTop=120`);await click('Next');await delay(40);
 check('outgoing scroll retained',await evaluate(`${scrollElement}.scrollTop===120`));
 if(!browser.physical)await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:false});await delay(600);
 check('resize during turn commits once',await evaluate("document.body.innerText.includes('Page 3 of 5')"));
 await click('Next');await click('Close the story');await open();await delay(600);
 check('cancel and immediate reopen',await evaluate("document.body.innerText.includes('Page 1 of 5')"));
 const traceDone=new Promise(resolve=>ws.addEventListener('message',function handler(e){const m=JSON.parse(e.data);if(m.method==='Tracing.tracingComplete'){ws.removeEventListener('message',handler);resolve(m.params.stream)}}));
 await send('Tracing.end');const stream=await traceDone;let trace='';for(;;){const r=await send('IO.read',{handle:stream});trace+=r.data;if(r.eof)break;}await send('IO.close',{handle:stream});fs.writeFileSync(`${out}/animation-trace.json`,trace);
 report.longTasks=await evaluate('window.qaLongTasks');await evaluate('window.qaObserver.disconnect()');
 if(!browser.physical){
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(100);await click('Next');await delay(50);
  check('reduced motion',await evaluate("document.body.innerText.includes('Page 2 of 5')&&document.getAnimations().length===0"));await shot('reduced-motion');
  await press('Close the story');
  // Reduced CSS viewport plus DPR models zoom reflow; not browser-toolbar zoom.
  for(const zoom of [1.25,1.5,2]){
   await send('Emulation.setDeviceMetricsOverride',{width:Math.round(1280/zoom),height:Math.round(800/zoom),deviceScaleFactor:zoom,mobile:false});await delay(200);await open();await layout('zoom-equivalent-'+zoom);await shot('zoom-equivalent-'+zoom);await press('Close the story');
  }
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await delay(150);await open();
  await evaluate(`document.querySelectorAll('[data-testid=origin-storybook] [dir=auto]').forEach(e=>{const c=getComputedStyle(e);e.style.fontSize=parseFloat(c.fontSize)*1.5+'px';e.style.lineHeight=parseFloat(c.lineHeight)*1.5+'px'})`);
  await layout('150-percent-text');await shot('150-percent-text');await press('Close the story');
 }
 await evaluate('navigator.serviceWorker.ready.then(()=>true)');await delay(500);
 await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await send('Page.reload');await delay(1200);await ready();
 for(const lang of ['en','tl']){
  await locale(lang);await open();for(let p=1;p<=5;p++){await layout(`offline-${lang}-${p}`);if(p<5)await press(lang==='en'?'Next':'Susunod');}await shot('offline-'+lang);await press(lang==='en'?'Finish Reading':'Tapusin ang Pagbasa');
 }
 await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await locale('en');await press('Continue as learner');check('learner destination',await evaluate("location.pathname.startsWith('/learner/')"));await nav('/');await press('Continue as mentor');check('mentor destination',await evaluate("location.pathname.startsWith('/mentor')"));
} catch(e){report.error=String(e);report.failure=await evaluate("({text:document.body.innerText,active:document.activeElement?.outerHTML.slice(0,1500)})").catch(()=>null);await shot('failure').catch(()=>{});process.exitCode=1;}
finally{fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({screens:report.screens.length,checks:report.checks.length,error:report.error}));ws.close();await browser.close();}
