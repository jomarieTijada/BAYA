import fs from 'node:fs';import assert from 'node:assert/strict';import{connect,delay}from './compliance-01/cdp.mjs';
const c=await connect(),checks=[];
const wait=async e=>{for(let i=0;i<150;i++){if(await c.evaluate(e))return;await delay(100)}throw Error(e)};
const go=async p=>{await c.send('Page.navigate',{url:'http://127.0.0.1:5071'+p});await delay(500)};
const click=async label=>{await c.evaluate(`Array.from(document.querySelectorAll('[aria-label='+JSON.stringify(${JSON.stringify(label)})+']')).find(e=>e.getBoundingClientRect().width>0).click()`);await delay(400)};
try{
await c.send('Page.enable');await c.send('Network.enable');await c.send('Network.setBypassServiceWorker',{bypass:true});await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
await go('/learner/settings');await wait(`!!document.querySelector('[data-testid=language-selector]')`);await click('English');
await go('/learner/activities/topic-1-1');await wait(`!!document.querySelector('[data-testid=storybook-topic-screen]')`);
console.log('story',await c.evaluate(`Array.from(document.querySelectorAll('[aria-label]'),e=>e.getAttribute('aria-label')).filter(x=>/Video|video|Back|intro|Watch/.test(x))`));
if(await c.evaluate(`!!document.querySelector('[aria-label="Back to the introduction"]')`))await click('Back to the introduction');
await click('Watch the Video');await wait(`!!document.querySelector('[data-testid=topic-intro-video-player]')`);await delay(400);
await click('Back');await wait(`location.pathname==='/learner/lessons'`);checks.push({name:'storybook Back',path:'/learner/lessons'});
await go('/learner/home');await wait(`document.querySelector('[data-testid=continue-lesson-hero]')?.innerText.includes('History')`);
await c.evaluate(`document.querySelector('[data-testid=continue-lesson-hero] [role=button]').click()`);await wait(`!!document.querySelector('[data-testid=topic-intro-video-player]')`);checks.push({name:'story Continue page',restored:true});
await c.send('Page.reload');await delay(500);await wait(`!!document.querySelector('[data-testid=topic-intro-video-player]')`);checks.push({name:'story reload',restored:true,playing:await c.evaluate(`Array.from(document.querySelectorAll('video')).some(v=>!v.paused)`) });
await go('/learner/activities/topic-2-1');await wait(`!!document.querySelector('[data-testid=character-glyph]')`);
await c.evaluate(`document.querySelectorAll('[data-testid^=character-chip-]')[1].click()`);await delay(400);
const glyph=await c.evaluate(`document.querySelector('[data-testid=character-glyph]').getAttribute('aria-label')`);
await c.send('Page.reload');await delay(500);await wait(`!!document.querySelector('[data-testid=character-glyph]')`);assert.equal(await c.evaluate(`document.querySelector('[data-testid=character-glyph]').getAttribute('aria-label')`),glyph);checks.push({name:'Module 2 character reload',glyph,restored:true});
await go('/learner/activities/unknown');await wait(`!!document.querySelector('[data-testid=story-unavailable]')`);await click('Back');await wait(`location.pathname==='/learner/lessons'`);checks.push({name:'unknown topic',safeFallback:true});
await go('/mentor/settings');await c.send('Page.resetNavigationHistory');await click('Back');await wait(`location.pathname==='/mentor/workspaces'`);checks.push({name:'mentor Settings direct entry',safeFallback:true});
await wait(`document.body.innerText.includes('Please log in')`);checks.push({name:'unauthenticated mentor workspace',protected:true});
const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/verification/compliance-07/mentor-unauthenticated.png',Buffer.from(shot.data,'base64'));
console.log(checks);
}finally{fs.writeFileSync('docs/verification/compliance-07/lesson-navigation.json',JSON.stringify(checks,null,2));c.close()}
