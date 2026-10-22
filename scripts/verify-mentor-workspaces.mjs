import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
const output = path.resolve('docs/verification/mentor-workspaces');
fs.mkdirSync(output, { recursive: true });
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--remote-debugging-port=9358', `--user-data-dir=${process.env.TEMP}\\baya-mentor-visual-check`, '--no-first-run', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
  let targets;
  for (let i=0;i<30;i++) { try { targets = await (await fetch('http://127.0.0.1:9358/json/list')).json(); break; } catch { await delay(500); } }
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id=0; const pending = new Map();
  ws.onmessage = e => { const data=JSON.parse(e.data); if(data.id) { pending.get(data.id)?.(data); pending.delete(data.id); } };
  const send = (method, params={}) => new Promise((resolve,reject) => { const n=++id; const timer=setTimeout(()=>{ pending.delete(n); reject(new Error(method+' timed out')); },30000); pending.set(n, data=>{ clearTimeout(timer); if(data.error) reject(new Error(JSON.stringify(data.error))); else resolve(data.result); }); ws.send(JSON.stringify({id:n,method,params})); });
  const evaluate = async expression => (await send('Runtime.evaluate', {expression,returnByValue:true,awaitPromise:true})).result.value;
  await send('Page.enable'); await send('Runtime.enable');
  const results=[];
  for (const [width,height] of [[1366,768],[667,375],[844,390],[915,412],[1024,768]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    for (const screen of (process.env.BAYA_VISUAL_SCREENS?.split(',') ?? ['login','register','otp','empty','list','create','details','join','memberships','loading','error','unavailable','validation'])) {
      const route = screen === 'guard' ? '/mentor/workspaces' : screen === 'joined' ? '/debug/workspace-preview?screen=join' : screen === 'unavailable' || screen === 'validation' ? '/mentor' : `/debug/workspace-preview?screen=${screen}`;
      await send('Page.navigate',{url:`http://localhost:8087${route}`});
      for(let i=0;i<90;i++) { if(await evaluate(`document.body.innerText.includes('MENTOR LOGIN') || document.body.innerText.includes('MENTOR WORKSPACES') || document.body.innerText.includes('DEVELOPMENT PREVIEW')`)) break; await delay(500); }
      if (!await evaluate(`document.body.innerText.includes('MENTOR LOGIN') || document.body.innerText.includes('MENTOR WORKSPACES') || document.body.innerText.includes('DEVELOPMENT PREVIEW')`)) throw new Error(`App did not load: ${route}`);
      await delay(300);
      if(screen === 'reset') await evaluate(`(() => { const input=document.querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'mentor@example.test'); input.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[aria-label="Request reset"]').click(); })()`);
      if(screen === 'joined') await evaluate(`(() => { const input=document.querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'BAYA-TEST'); input.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[aria-label="Join workspace"]').click(); })()`);
      if(screen === 'validation') await evaluate(`document.querySelector('[aria-label="Log In"]').click()`);
      if(screen === 'unavailable') await evaluate(`(() => { const inputs=document.querySelectorAll('input'); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(inputs[0],'mentor@example.test'); inputs[0].dispatchEvent(new Event('input',{bubbles:true})); setter.call(inputs[1],'test-password'); inputs[1].dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[aria-label="Log In"]').click(); })()`);
      await delay(150);
      const info=await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth, text:document.body.innerText, inputs:[...document.querySelectorAll('input')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))})`);
      results.push({screen,width,height,...info});
      const image=await send('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(path.join(output,`${screen}-${width}x${height}.png`),Buffer.from(image.data,'base64'));
      // Also capture reachable controls at the bottom of each long form.
      if(['login','register','create','reset','settings-connected','settings-empty','dashboard','progress-detail'].includes(screen) && height<500) {
        await evaluate(`document.querySelectorAll('div').forEach(e=>{if(getComputedStyle(e).overflowY==='auto' || getComputedStyle(e).overflowY==='scroll') e.scrollTop=e.scrollHeight;})`);
        await delay(100); const bottom=await send('Page.captureScreenshot',{format:'png'}); fs.writeFileSync(path.join(output,`${screen}-${width}x${height}-bottom.png`),Buffer.from(bottom.data,'base64'));
      }
    }
    console.log(`Captured ${width}x${height}`);
  }
  const existing=fs.existsSync(path.join(output,'results.json')) ? JSON.parse(fs.readFileSync(path.join(output,'results.json'),'utf8')) : [];
  const merged=[...existing.filter(old=>!results.some(r=>r.screen===old.screen && r.width===old.width)),...results];
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(merged,null,2));
  const failures=results.filter(r=>r.overflow || r.text.includes('Uncaught Error') || !r.text.trim());
  console.log(JSON.stringify({captures:results.length,failures},null,2));
  if(failures.length) process.exitCode=1;
} finally { ws?.close(); chrome.kill(); }
