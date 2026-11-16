import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';
const out = process.env.BAYA_STORYBOOK_OUTPUT || 'docs/verification/baya-storybook-enhancement/android-touch'; fs.mkdirSync(out, {recursive:true});
if (!process.env.BAYA_ANDROID_SERIAL) throw Error('Set BAYA_ANDROID_SERIAL to the connected test device serial.');
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
const locale=async lang=>{await nav('/learner/settings');await waitFor(`!!document.querySelector('[role=radio][aria-label="${lang==='en'?'English':'Tagalog'}"]')`);await evaluate(`document.querySelector('[role=radio][aria-label="${lang==='en'?'English':'Tagalog'}"]').click()`);await delay(300);await nav('/');await ready();await delay(150);if(await evaluate("!!document.querySelector('[data-testid=origin-storybook]')"))await press(lang==='en'?'Close the story':'Isara ang kuwento');};
const scrollElement = `document.querySelector('[data-testid=origin-scroll]')`;
const layout=async name=>{
 const r=await evaluate(`(()=>{const book=document.querySelector('[data-testid=origin-storybook]'),s=${scrollElement};const controls=[...book.querySelectorAll('[role=button]')].map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,right:r.right}});return {w:innerWidth,h:innerHeight,overflow:s.scrollWidth>s.clientWidth+1,controls,images:[...book.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),scrollHeight:s.scrollHeight,clientHeight:s.clientHeight}})()`);
 check(name+' readable',!r.overflow&&r.images&&r.controls.every(c=>c.x>=0&&c.y>=0&&c.b<=r.h+1&&c.right<=r.w+1&&c.h>=44));
 report.layouts??=[];report.layouts.push({name,...r});
};

const adb=(...args)=>execFileSync('adb',['-s',process.env.BAYA_ANDROID_SERIAL,...args],{encoding:'utf8',windowsHide:true}).trim();
const rotation=adb('shell','settings','get','system','user_rotation');
const tap=async selector=>{const r=await evaluate(`(()=>{const e=${selector};e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[r]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(650);};
try{
 await send('Page.enable');await send('Network.enable');await locale('en');
 report.browser=await send('Browser.getVersion');
 for(const orientation of [0,1]){
  adb('shell','settings','put','system','user_rotation',String(orientation));await delay(1100);
  await tap("document.querySelector('[data-testid=mascot-origin-teaser]')");
  for(let p=1;p<=5;p++){
   await layout(`touch-${orientation}-${p}`);await shot(`touch-${orientation}-page-${p}`);
   if(p===2){
    await evaluate("document.querySelector('[data-testid=origin-illustration] a').scrollIntoView({block:'center'})");await delay(200);await shot(`touch-${orientation}-source`);
    check('source reachable '+orientation,await evaluate("(()=>{const r=document.querySelector('[data-testid=origin-illustration] a').getBoundingClientRect();return r.top>=0&&r.bottom<innerHeight})()"));
   }
   const pos=await evaluate("(()=>{const r=document.querySelector('[data-testid=origin-scroll]').getBoundingClientRect();return {x:r.x+r.width*.7,y:r.y+r.height*.8,d:r.height*.5}})()");
   await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pos.x,y:pos.y}]});
   for(let i=1;i<=8;i++){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pos.x,y:pos.y-pos.d*i/8}]});await delay(30);}
   await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(250);
   await shot(`touch-${orientation}-page-${p}-swiped`);
   await tap(button(p===5?'Finish Reading':'Next'));
  }
 }
 await tap("document.querySelector('[data-testid=mascot-origin-teaser]')");await tap(button('Next'));
 const targetBefore=await send('Target.getTargets');
 await tap("document.querySelector('[data-testid=origin-illustration] a')");await delay(2000);
 const targets=await send('Target.getTargets');
 const opened=targets.targetInfos.find(t=>!targetBefore.targetInfos.some(b=>b.targetId===t.targetId)&&t.url.includes('philippineeaglefoundation.org/post/princess-maasim'));
 check('touch opens official PEF source',!!opened);
 if(opened)await send('Target.closeTarget',{targetId:opened.targetId});
} catch(e){report.error=String(e);process.exitCode=1;}
finally{adb('shell','settings','put','system','user_rotation',rotation);fs.writeFileSync(`${out}/browser-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({screens:report.screens.length,checks:report.checks.length,error:report.error}));ws.close();await browser.close();}
