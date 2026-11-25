import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// Isolated browser profile, local exported app, real generated worker; no user data.
const root=path.resolve('apps/mobile/dist'), port=5067, base=`http://127.0.0.1:${port}`;
const name=process.argv[2] || 'chrome';
const executable=name==='edge' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out=path.resolve('docs/audio/browser'); fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.wasm':'application/wasm','.m4a':'audio/mp4','.webm':'audio/webm','.png':'image/png','.ttf':'font/ttf','.svg':'image/svg+xml','.mp4':'video/mp4'};
let networkBlocked=false;
const blockedRequests=[];
const server=http.createServer((req,res)=>{
  if(networkBlocked){blockedRequests.push(req.url);res.writeHead(503).end('Network unavailable for offline verification');return;}
  const url=decodeURIComponent(new URL(req.url,base).pathname);
  const benchmark=url.startsWith('/__benchmark/'); const dir=benchmark?path.resolve('.codex-tmp/audio/benchmark'):root;
  let file=path.resolve(dir,'.'+(benchmark?url.slice('/__benchmark'.length):url));
  if(!file.startsWith(dir+path.sep)&&file!==dir){res.writeHead(403).end();return;}
  if(!benchmark&&(url==='/'||!path.extname(url)))file=path.join(root,'index.html');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  const size=fs.statSync(file).size;
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream'); res.setHeader('Cache-Control','no-store');
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','credentialless');
  const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');
  if(range){const start=Number(range[1]),end=Math.min(Number(range[2]||size-1),size-1);res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(file,{start,end}).pipe(res);}
  else {res.setHeader('Content-Length',size);fs.createReadStream(file).pipe(res);}
});
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'baya-audio-browser-'));
const browser=spawn(executable,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore',windowsHide:true});
const results={browser:name,started:new Date().toISOString(),profile,tests:[]}; let ws;
try {
  const debugFile=path.join(profile,'DevToolsActivePort');
  for(let i=0;!fs.existsSync(debugFile)&&i<100;i++)await delay(100);
  const debug=fs.readFileSync(debugFile,'utf8').split('\n')[0];
  const target=(await(await fetch(`http://127.0.0.1:${debug}/json/list`)).json()).find(t=>t.type==='page');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r); let id=0;const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  async function wait(expr,timeout=30000){for(let t=0;t<timeout;t+=200){if(await ev(`Boolean(${expr})`))return;await delay(200);}throw Error('Timeout: '+expr);}
  async function nav(route){await send('Page.navigate',{url:base+route});await delay(400);await wait('document.querySelector("[role=button]")');}
  const record=(test,details)=>{results.tests.push({test,status:'PASS',...details});fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(results,null,2));console.log(name,test);};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__audioQa={media:[],requests:[]};const OriginalAudio=window.Audio;window.Audio=function(...args){const a=new OriginalAudio(...args);__audioQa.media.push(a);return a;};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){if(String(factory).includes('active_learner_profile_id'))__audioQa.learner=id;return value(factory,id,...args)}}});`});
  await nav('/learner/setup');await ev(`__r(__audioQa.learner).localLearnerService.saveProfile('Audio verification isolated learner')`);
  await wait('navigator.serviceWorker.controller',120000);
  const status=await ev(`new Promise((resolve,reject)=>{const channel=new MessageChannel();const t=setTimeout(()=>reject(Error('readiness timeout')),15000);channel.port1.onmessage=e=>{clearTimeout(t);resolve(e.data)};navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[channel.port2])})`);
  if(!status.ready)throw Error('Incomplete offline preparation');record('offline preparation',status);
  const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');const precache=JSON.parse(worker.match(/const PRECACHE_URLS = (\[.*\]);/)[1]);
  const urls=precache.filter(u=>u.includes('/audio/baya/')&&u.endsWith('.m4a'));
  if(urls.length!==69)throw Error('Missing audio in precache '+urls.length);
  results.cacheBytes=precache.reduce((sum,u)=>sum+fs.statSync(path.join(root,u==='/'?'index.html':u.slice(1))).size,0);
  results.audioBytes=urls.reduce((sum,u)=>sum+fs.statSync(path.join(root,u.slice(1))).size,0);
  results.browserVersion=await send('Browser.getVersion');
  // Web Audio checks full buffers; HTMLMediaElement verifies actual advancing playback.
  async function decodeAndPlay(list){return ev(`(async()=>{const ctx=new AudioContext();const rows=[];for(const url of ${JSON.stringify(list)}){const start=performance.now();const response=await fetch(url);if(!response.ok)throw Error('fetch '+url);const decoded=await ctx.decodeAudioData(await response.arrayBuffer());const a=new Audio(url);await a.play();for(let i=0;i<30&&a.currentTime<=0;i++)await new Promise(r=>setTimeout(r,50));if(a.paused||a.currentTime<=0||a.error)throw Error('playback '+url);rows.push({url,duration:decoded.duration,channels:decoded.numberOfChannels,timeline:a.currentTime,loadAndPlayMs:performance.now()-start,mime:response.headers.get('Content-Type')});a.pause();a.removeAttribute('src');a.load();}await ctx.close();return rows})()`);}
  record('all 69 browser decode and playback',{rows:await decodeAndPlay(urls)});
  const trials=fs.readdirSync('.codex-tmp/audio/benchmark').filter(f=>/baya-(a-ba|e-be|i-bi|o-bo|u-bu|vowel-eoi|vowel-oou|katinig-b)-/.test(f)).map(f=>'/__benchmark/'+f);
  record('five codec candidates browser playback',{rows:await decodeAndPlay(trials)});
  networkBlocked=true;
  await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  record('all 69 offline decode and playback',{rows:await decodeAndPlay(urls)});
  await nav('/learner/activities/topic-2-2');await wait('document.querySelector("[data-testid=baya-pronunciation-button]")');
  await ev('document.querySelector("[data-testid=baya-pronunciation-button]").click()');await wait('__audioQa.media.some(a=>a.currentTime>0&&!a.paused)');
  record('offline lesson control BA',{source:await ev('__audioQa.media.at(-1).src')});
  await ev('document.querySelector("[data-testid=character-chip-ka]").click()');
  if(await ev('__audioQa.media.some(a=>!a.paused)'))throw Error('Navigation failed to stop');
  await ev(`Array.from(document.querySelectorAll('[role=button]')).find(e=>e.innerText.includes('Sounds with kudlit')).click()`);
  await ev(`document.querySelector('[aria-label="Play Ke pronunciation"]').click()`);await wait('__audioQa.media.some(a=>a.currentTime>0&&!a.paused)');
  record('offline upper kudlit KE',{source:await ev('__audioQa.media.at(-1).src')});
  await ev(`document.querySelector('[aria-label="Play Ku pronunciation"]').click()`);await wait('__audioQa.media.some(a=>a.currentTime>0&&!a.paused)');
  record('offline lower kudlit KU',{source:await ev('__audioQa.media.at(-1).src')});
  await ev(`for(let i=0;i<20;i++)document.querySelector('[aria-label="Play Ki pronunciation"]').click()`);await delay(200);
  const active=await ev('__audioQa.media.filter(a=>!a.paused).length');if(active!==1)throw Error('Overlap '+active);record('rapid repeated selection',{activePlayers:active});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'-mobile-layout.png'),Buffer.from(shot.data,'base64'));
  await nav('/learner/activities/topic-2-1');await wait('document.querySelector("[data-testid=baya-pronunciation-button]")');
  await ev('document.querySelector("[data-testid=baya-pronunciation-button]").focus()');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await wait('__audioQa.media.some(a=>a.currentTime>0&&!a.paused)');record('keyboard playback offline',{source:await ev('__audioQa.media.at(-1).src')});
  await send('Page.reload',{ignoreCache:true});await wait('document.querySelector("[data-testid=baya-pronunciation-button]")');
  await ev('document.querySelector("[data-testid=baya-pronunciation-button]").click()');await wait('__audioQa.media.some(a=>a.currentTime>0&&!a.paused)');record('offline app reload and replay',{online:await ev('navigator.onLine')});
  record('offline valid playback network independence',{blockedServerRequests:[...blockedRequests]});
  const vowelUrl=urls.find(u=>u.includes('baya-vowel-eoi.'));
  await ev('document.querySelector("[data-testid=character-chip-e_i]").click()');
  await ev(`(async()=>{window.__reviewCache=await caches.open(${JSON.stringify(status.version)});window.__savedRecording=await __reviewCache.match(${JSON.stringify(vowelUrl)});await __reviewCache.delete(${JSON.stringify(vowelUrl)});})()`);
  await ev('document.querySelector("[data-testid=baya-pronunciation-button]").click()');await wait('document.body.innerText.includes("Could not play. Try again.")');record('missing offline recording recoverable error',{});
  await ev(`__reviewCache.put(${JSON.stringify(vowelUrl)},new Response('invalid media',{headers:{'Content-Type':'audio/mp4'}}))`);
  await ev('document.querySelector("[data-testid=baya-pronunciation-button]").click()');await wait('document.body.innerText.includes("Could not play. Try again.")');record('corrupt recording recoverable error',{});
  await ev(`__reviewCache.put(${JSON.stringify(vowelUrl)},__savedRecording)`);
  await ev('document.querySelector("[data-testid=baya-pronunciation-button]").click()');await wait('__audioQa.media.some(a=>a.currentTime>0&&!a.paused)');record('recording retry after restoration',{});
  await nav('/learner/settings');await wait('document.querySelector("[role=radio][aria-label=Tagalog]")');
  await ev('document.querySelector("[role=radio][aria-label=Tagalog]").click()');await delay(300);
  await nav('/learner/activities/topic-2-1');await wait('document.querySelector("[data-testid=baya-pronunciation-button]")');
  const label=await ev('document.querySelector("[data-testid=baya-pronunciation-button]").getAttribute("aria-label")');
  if(!label.startsWith('Pakinggan'))throw Error('Tagalog label missing: '+label);
  await ev('document.querySelector("[data-testid=baya-pronunciation-button]").click()');await wait('__audioQa.media.some(a=>a.currentTime>0&&!a.paused)');record('Tagalog labels and offline playback',{label,source:await ev('__audioQa.media.at(-1).src')});
  record('cache integrity',{entries:await ev(`(async()=>{const c=await caches.open(${JSON.stringify(status.version)});return (await c.keys()).length})()`)});
} catch(error){results.tests.push({test:'browser run',status:'FAIL',error:String(error)});process.exitCode=1;console.error(error);} finally {
  fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(results,null,2));ws?.close();browser.kill();await new Promise(r=>server.close(r));
}
