import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';

const out = 'docs/verification/offline-installation';
fs.mkdirSync(out, { recursive: true });
let browser, socket, send, evaluate;
const report = { checks: [], errors: [], physicalDevice: false };
async function connect(profile) {
  browser = await openTestBrowser(5055, { profile });
  socket = new WebSocket(browser.target.webSocketDebuggerUrl);
  await new Promise(resolve => { socket.onopen = resolve; });
  let id = 0; const pending = new Map();
  socket.onmessage = e => { const v = JSON.parse(e.data); pending.get(v.id)?.(v); pending.delete(v.id); };
  send = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); socket.send(JSON.stringify({ id: n, method, params })); });
  evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.error || result.result.exceptionDetails) throw Error(JSON.stringify(result));
    return result.result.result.value;
  };
  await send('Page.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  // Force the supported WASM fallback; discover public bundle exports without changing factories.
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `const nativeMatchMedia=window.matchMedia.bind(window);window.matchMedia=q=>{const m=nativeMatchMedia(q);if(q==='(display-mode: standalone)')Object.defineProperty(m,'matches',{value:true});return m};Object.defineProperty(navigator,'gpu',{get:()=>undefined});window.__modules={};let definition;Object.defineProperty(window,'__d',{configurable:true,get(){return definition},set(value){definition=function(factory,id,...args){const s=String(factory);if(s.includes('Could not initialize the local LiteRT runtime'))__modules.model=id;if(s.includes('active_learner_profile_id'))__modules.learner=id;if(s.includes('resetReadyDatabase')&&s.includes('getReadyDatabase'))__modules.db=id;if(s.includes('BAYA drawing capture is available'))__modules.recognition=id;return value(factory,id,...args)}}});` });
}
const wait = async (expression, seconds = 120) => {
  for (let i = 0; i < seconds * 4; i++) { if (await evaluate(expression)) return; await delay(250); }
  throw Error('Timed out: ' + expression + '\n' + await evaluate('document.body.innerText'));
};
const shot = async name => { const result = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(result.result.data, 'base64')); };
const message = type => evaluate(`new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=e=>resolve(e.data);navigator.serviceWorker.controller.postMessage({type:${JSON.stringify(type)}},[c.port2])})`);
const offline = async value => { await send('Network.emulateNetworkConditions', { offline: value, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); };
try {
  await connect();
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const started = Date.now();
  await send('Page.navigate', { url: 'http://127.0.0.1:5055/' });
  await wait(`!!document.querySelector('[data-testid="offline-setup"]')`);
  await shot('first-launch');
  await wait(`!!navigator.serviceWorker.controller && new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=e=>resolve(e.data.ready===true);navigator.serviceWorker.controller.postMessage({type:'BAYA_OFFLINE_STATUS'},[ch.port2])})`,180);
  report.checks.push({ name: 'Fresh installation and real runtime validation', ms: Date.now() - started, state: await message('BAYA_OFFLINE_STATUS') });
  await shot('prepared-landing');
  await wait(`!document.querySelector('[data-testid="offline-setup"]')`);
  await offline(true); await delay(500); await shot('offline-toast');
  assert((await evaluate('document.body.innerText')).includes("You're offline"));
  await delay(6500);
  assert(!(await evaluate('document.body.innerText')).includes("You're offline"));
  const manifest = await message('BAYA_PACKAGE_MANIFEST');
  for (const asset of manifest.assets.filter(a => a.category === 'Educational videos')) {
    const playback = await evaluate(`(async()=>{const video=document.createElement('video');video.muted=true;video.playsInline=true;video.src=${JSON.stringify(asset.url)};document.body.append(video);await new Promise((r,j)=>{video.onloadedmetadata=r;video.onerror=j});const duration=video.duration;const positions=[];for(const fraction of [0,.5,.95]){if(fraction){video.currentTime=duration*fraction;await new Promise(r=>video.onseeked=r)}await video.play();const start=video.currentTime;await new Promise(r=>setTimeout(r,600));positions.push({start,end:video.currentTime});video.pause()}video.remove();return{duration,positions}})()`);
    assert(playback.positions.every(p => p.end > p.start)); report.checks.push({ name: 'Offline video playback and seeking', url: asset.url, ...playback });
  }
  const audio = manifest.assets.find(a => a.category === 'Pronunciation audio');
  report.checks.push({ name: 'Offline audio decode', result: await evaluate(`(async()=>{const c=new AudioContext();const b=await c.decodeAudioData(await(await fetch(${JSON.stringify(audio.url)})).arrayBuffer());await c.close();return{duration:b.duration}})()`) });
  await evaluate(`__r(__modules.learner).localLearnerService.saveProfile('Offline installation QA')`);
  await evaluate(`__r(__modules.learner).localLearnerService.completeTopic('topic-1-1')`);
  const saved=await evaluate(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();return{profile:await __r(__modules.learner).localLearnerService.getActiveLearner(),progress:await db.getAllAsync('SELECT lesson_id,status FROM learner_progress')}})()`);
  const media=await evaluate(`(async()=>{const assets=${JSON.stringify(manifest.assets)};let images=0,audio=0;const context=new AudioContext();try{for(const a of assets){if(/\\.(png|webp|jpg|jpeg)$/.test(a.url)){const image=new Image();image.src=a.url;await image.decode();images++}if(a.category==='Pronunciation audio'){await context.decodeAudioData(await(await fetch(a.url)).arrayBuffer());audio++}}}finally{await context.close()}return{images,audio}})()`);
  assert(media.images>100); assert.equal(media.audio,71); report.checks.push({name:'All exported audio and raster learning images decode offline',...media});
  const profile = browser.profile; socket.close(); await browser.close();
  await connect(profile); await offline(true);
  await send('Page.navigate', { url: 'http://127.0.0.1:5055/learner/setup' });
  await wait(`window.__modules?.model!==undefined && !document.querySelector('[data-testid="offline-setup"]')`, 180);
  const inference = await evaluate(`(async()=>{const m=__r(__modules.model);const output=await m.runBayaSpatialInference(new Float32Array(3*160*160));return{backend:(await m.getBayaModel()).backend,classes:output.probabilities.length,offline:!navigator.onLine}})()`);
  assert.equal(inference.backend, 'wasm'); assert.equal(inference.classes, 63); assert(inference.offline);
  report.checks.push({ name: 'Browser process restart offline and real LiteRT inference', ...inference });
  const restored=await evaluate(`(async()=>{const db=await __r(__modules.db).getReadyDatabase();return{profile:await __r(__modules.learner).localLearnerService.getActiveLearner(),progress:await db.getAllAsync('SELECT lesson_id,status FROM learner_progress')}})()`);
  assert.deepEqual(restored,saved);
  report.checks.push({name:'Local learner profile and progress persist through offline browser restart',saved});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  for(const [route,selector] of [['/learner/home','continue-lesson-hero'],['/learner/activities/topic-1-1','storybook-topic-screen'],['/learner/activities/topic-2-1','character-glyph']]){
    await send('Page.navigate',{url:'http://127.0.0.1:5055'+route});
    await wait(`!!document.querySelector('[data-testid="${selector}"]')`);
    report.checks.push({name:'Offline lesson route',route});
  }
  await shot('offline-restart');
  await offline(false); await delay(500); await shot('online-toast');
  assert((await evaluate('document.body.innerText')).includes("You're online."));
  await message('BAYA_VERIFY'); await delay(1000);
  const currentManifest = await message('BAYA_PACKAGE_MANIFEST');
  const model = currentManifest.assets.find(a => a.category === 'Handwriting model');
  await evaluate(`(async()=>{const c=await caches.open(${JSON.stringify(currentManifest.version)});await c.put(${JSON.stringify(model.url)},new Response('corrupt'))})()`);
  const invalid = await message('BAYA_VERIFY'); assert(!invalid.ready); assert(invalid.missing.includes(model.url));
  const repaired = await message('BAYA_PREPARE'); assert.equal(repaired.phase, 'validating'); assert.equal(repaired.missing.length, 0);
  report.checks.push({ name: 'Corruption detected and repaired', invalid: invalid.missing, repaired: repaired.verifiedFiles });
} catch (error) { report.errors.push(String(error.stack || error)); process.exitCode = 1; }
finally {
  fs.writeFileSync(`${out}/browser-results.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.map(c => c.name), errors: report.errors }, null, 2));
  socket?.close(); await browser?.close();
}
