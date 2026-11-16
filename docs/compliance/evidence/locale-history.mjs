import fs from 'node:fs';import assert from 'node:assert/strict';import {connect,delay} from './cdp.mjs';
const c=await connect(),root='docs/compliance/evidence',report=[];
const wait=async e=>{for(let i=0;i<150;i++){if(await c.evaluate(e))return;await delay(100)}throw Error('Not ready: '+e)};
const go=async route=>{await c.send('Page.navigate',{url:'http://127.0.0.1:5093'+route});await wait("document.readyState==='complete'&&!!document.querySelector('[role=button],[role=radio]')");await delay(350)};
const press=async label=>{await c.evaluate(`(()=>{const el=[...document.querySelectorAll('[aria-label]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)}&&e.getBoundingClientRect().width);if(!el)throw Error('Missing '+${JSON.stringify(label)});el.click()})()`);await delay(350)};
const shot=async name=>{const r=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(root+'/'+name+'.png',Buffer.from(r.data,'base64'))};
try {
 await c.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 for(const language of ['en','tl']) {
  await go('/learner/settings');await wait("!!document.querySelector('[data-testid=language-selector]')");await press(language==='en'?'English':'Tagalog');
  await c.send('Page.reload');await wait(`document.documentElement.lang===${JSON.stringify(language)}&&!!document.querySelector('[data-testid=language-selector]')`);await delay(300);await shot('settings-'+language);
  await go('/');assert.equal(await c.evaluate('document.documentElement.lang'),language);await shot('welcome-'+language);
  await go('/learner/activities/topic-1-1');
  await wait("!!document.querySelector('[data-testid=lesson-video-introduction],[data-testid=storybook-topic-screen]')");
  if(await c.evaluate("!!document.querySelector('[data-testid=lesson-video-introduction]')")){await shot('history-invitation-'+language);await press(language==='en'?'Watch the Video':'Panoorin ang Video');}
  await wait("/ancient ways|sinaunang paraan/.test(document.body.innerText)");
  for(const [width,height] of [[844,390],[1366,768]]){
   await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(300);
   const info=await c.evaluate("({language:document.documentElement.lang,text:document.body.innerText,overflow:document.documentElement.scrollWidth>innerWidth+1})");
   assert.equal(info.overflow,false);assert.match(info.text,language==='en'?/Philippines|Filipino/:/Pilipinas|Pilipino/);
   report.push({name:'history reachable and localized',width,height,...info});await shot('history-'+language+'-'+width);
  }
 }
 await go('/learner/settings');await press('English');
}finally{fs.writeFileSync(root+'/locale-history.json',JSON.stringify(report,null,2));c.close()}
