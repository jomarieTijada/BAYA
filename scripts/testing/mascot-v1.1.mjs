import fs from 'node:fs';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {openTestBrowser} from './device-browser.mjs';
const out='docs/animations', base='http://127.0.0.1:5082';
const report={checks:[], errors:[], physical:false};
const browser=await openTestBrowser(5082);
let ws;
try {
  ws=new WebSocket(browser.target.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
  let id=0; const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result)}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
  const wait=async exp=>{for(let i=0;i<600;i++){if(await ev(exp))return;await delay(100)}throw Error('Timeout '+exp)};
  const check=(name,detail)=>{report.checks.push({name,status:'PASS',detail});console.log('PASS',name)};
  const snap=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${out}/${name}.png`,Buffer.from(r.data,'base64'))};
  const nav=async route=>{await send('Page.navigate',{url:base+route});await wait(`document.readyState==='complete'&&!!document.querySelector('[role=button]')`);await delay(400)};
  const mascot=`document.querySelector('[data-testid="baya-mascot"] img')`;
  const sample=()=>ev(`new Promise(resolve=>{const samples=[];let n=0;const timer=setInterval(()=>requestAnimationFrame(()=>{const el=${mascot};const r=el?.parentElement.getBoundingClientRect();samples.push({src:el?.src,loaded:!!el?.naturalWidth,box:r&&[r.x,r.y,r.width,r.height]});if(++n===180){clearInterval(timer);resolve(samples)}}),60)})`);
  await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:false});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await nav('/');await wait(`!!document.querySelector('[data-testid="origin-storybook"]')`);
  await snap('storybook');
  await ev(`document.querySelector('[data-testid="origin-storybook"] [role=button]').click()`);
  await wait(`!document.querySelector('[data-testid="origin-storybook"]')`);
  await delay(1500);const online=await sample();report.online=online;report.imageReadiness={status:online.every(s=>s.loaded)?'PASS':'FAIL',unloadedSamples:online.filter(s=>!s.loaded)};assert(new Set(online.map(s=>s.src)).size>25);check('Landing wave and blink playback',online);
  for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[844,390],[1024,768],[1280,800],[1440,900],[2048,921]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(200);
    const boxes=await ev(`new Promise(resolve=>{const rows=[];let n=0;const t=setInterval(()=>requestAnimationFrame(()=>{const e=${mascot},r=e.parentElement.getBoundingClientRect();rows.push({loaded:e.complete&&e.naturalWidth>0,box:[r.x,r.y,r.width,r.height]});if(++n===30){clearInterval(t);resolve(rows)}}),60)})`);
    report.checks.push({name:`Image readiness ${width}x${height}`,status:boxes.every(x=>x.loaded)?'PASS':'FAIL',unloadedSamples:boxes.filter(x=>!x.loaded).length});assert.equal(new Set(boxes.map(x=>JSON.stringify(x.box))).size,1);await snap(`landing-${width}x${height}`);check(`Stable mascot container ${width}x${height}`,boxes[0]);
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(300);
  const staticSrc=await ev(`${mascot}.src`);await delay(1800);assert.equal(await ev(`${mascot}.src`),staticSrc);check('Reduced motion uses static frame',staticSrc);
  await send('Emulation.setEmulatedMedia',{features:[]});
  await wait(`!!navigator.serviceWorker.controller`);
  const sw=fs.readFileSync('apps/mobile/dist/sw.js','utf8');
  const urls=JSON.parse(sw.match(/const PRECACHE_URLS = (.*);/)[1]).filter(u=>u.includes('animations/v1.1'));
  assert.equal(urls.length,50);
  const decoded=await ev(`Promise.all(${JSON.stringify(urls)}.map(async url=>{const i=new Image();i.src=url;await i.decode();return {url,width:i.naturalWidth,height:i.naturalHeight}}))`);assert(decoded.every(i=>i.width===1024&&i.height===1024));check('Every exported frame decodes in Chrome',decoded);
  const cached=await ev(`(async()=>{const keys=await caches.keys();const c=await caches.open(keys.find(k=>k.startsWith('baya-pwa-')));return Promise.all(${JSON.stringify(urls)}.map(async u=>({url:u,present:!!(await c.match(u))})))})()`);
  assert(cached.every(x=>x.present));check('All 50 v1.1 assets precached',cached);
  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await nav('/');const offline=await sample();report.offlineReadiness={status:offline.every(s=>s.loaded)?'PASS':'FAIL',unloadedSamples:offline.filter(s=>!s.loaded)};assert(new Set(offline.map(s=>s.src)).size>25);await snap('offline-landing');check('Offline reload plays both sequences',offline);
  await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await nav('/learner/setup');await wait(`!!document.querySelector('input')`);
  await ev(`(()=>{const e=document.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Mascot QA');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  report.setup=await ev(`document.body.innerText`);
  const buttons=await ev(`[...document.querySelectorAll('[role=button]')].map(e=>({text:e.textContent,label:e.getAttribute('aria-label')}))`);report.setupButtons=buttons;
  await ev(`(()=>{const buttons=[...document.querySelectorAll('[role=button]')];const e=buttons.find(e=>/Start Learning|Continue|Save|Magsimula|Simulan/i.test(e.textContent));if(e)e.click()})()`);await delay(1000);await ev(`document.querySelector('[role=dialog] [role=button]')?.click()`);await delay(500);
  for(const [name,route] of [['dashboard','/learner/home'],['topic','/learner/activities/topic-1-1?lessonPage=content'],['lessons','/learner/lessons']]){
    await nav(route);await delay(700);await snap(name);const details=await ev(`({path:location.pathname,text:document.body.innerText.slice(0,1500),mascots:[...document.querySelectorAll('[data-testid="baya-mascot"] img')].map(e=>({src:e.src,loaded:e.complete&&e.naturalWidth>0}))})`);report.checks.push({name,status:(name==='lessons'?details.path==='/learner/lessons':details.mascots.length&&details.mascots.every(m=>m.loaded))?'PASS':'FAIL',detail:details});
  }
  const exported=fs.readdirSync('apps/mobile/dist/assets/assets/branding/baya-web/animations/v1.1/blink');
  report.exportedBlinkFiles=exported;
  assert.equal(report.imageReadiness.status,'PASS');
  assert.equal(report.offlineReadiness.status,'PASS');
  assert(report.checks.every(check=>check.status==='PASS'));
} catch(e){report.errors.push(String(e.stack));console.error(e);process.exitCode=1}
finally{fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(report,null,2));ws?.close();await browser.close()}
