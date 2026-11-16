import fs from 'node:fs';import {connect,delay} from './compliance-01/cdp.mjs';
const c=await connect(),report={checks:[],errors:[]};
async function nav(path){await c.send('Page.navigate',{url:'http://127.0.0.1:5071'+path});await delay(1600);}
async function press(label){await c.evaluate(`(()=>{const e=[...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)});e.focus();e.click()})()`);await delay(400);}
async function key(key,code=key){await c.send('Input.dispatchKeyEvent',{type:'keyDown',key,code,text:key==='Enter'?'\r':undefined,windowsVirtualKeyCode:key==='Enter'?13:key==='Tab'?9:key==='Escape'?27:0});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:key==='Enter'?13:key==='Tab'?9:key==='Escape'?27:0});await delay(100);}
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:667,height:375,deviceScaleFactor:1,mobile:false});await nav('/learner/settings');await c.evaluate("document.querySelector('[role=radio][aria-label=English]').click()");await delay(500);await nav('/');await press('MEET BAYANI');
 const labels=[];for(let i=0;i<8;i++){await key('Tab');labels.push(await c.evaluate("document.activeElement.getAttribute('aria-label')||document.activeElement.textContent"));}
 report.checks.push({tabFocusStaysInStory:labels.every(label=>['Close the story','View Bayani’s photo at the Philippine Eagle Foundation (online)','Next','Meet Bayani!'].includes(label)||label.startsWith('Meet Bayani!Part 1 of 4')),tabLabels:labels});
 for(let i=0;i<5;i++){if(await c.evaluate("document.activeElement.getAttribute('aria-label')==='Next'"))break;await key('Tab');}
 report.focusBeforeEnter=await c.evaluate("document.activeElement.getAttribute('aria-label')");await key('Enter');await delay(400);report.checks.push({keyboardNext:await c.evaluate("document.body.innerText.includes('A Little Eagle, A Big Hope')"),textAfterEnter:await c.evaluate('document.body.innerText')});
 await key('Escape');await delay(400);await press('Continue as learner');report.checks.push({learnerRoute:await c.evaluate("location.pathname.startsWith('/learner/')")});
 await nav('/');await press('Continue as mentor');report.checks.push({mentorRoute:await c.evaluate("location.pathname==='/mentor'")});
 await nav('/');await c.evaluate('navigator.serviceWorker.ready');await c.send('Network.enable');await c.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await c.send('Page.reload');await delay(1800);await press('MEET BAYANI');report.checks.push({offlineEnglish:await c.evaluate("document.body.innerText.includes('December 5, 2025')")});
 await c.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
}catch(e){report.errors.push(String(e));}finally{fs.writeFileSync('docs/verification/compliance-02/keyboard-navigation-report.json',JSON.stringify(report,null,2));console.log(report);c.close();}
if(report.errors.length||report.checks.some(c=>Object.values(c).some(v=>v===false)))process.exitCode=1;
