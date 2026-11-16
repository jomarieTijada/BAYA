import fs from 'node:fs';import assert from 'node:assert/strict';import {connect,delay} from './compliance-01/cdp.mjs';import{instrument}from './compliance-09-fixtures.mjs';
const c=await connect(),root='docs/verification/compliance-09',report={fixtureData:true,liveAuthorization:false,checks:[],screenshots:[]};
const wait=async expression=>{for(let i=0;i<150;i++){if(await c.evaluate(expression))return;await delay(100)}throw Error('Timed out: '+expression)};
const check=(name,value)=>{report.checks.push({name,...value});console.log(name,JSON.stringify(value))};
const go=async path=>{await c.send('Page.navigate',{url:'http://127.0.0.1:5071'+path});await delay(500)};
const click=async label=>{await c.evaluate(`(()=>{const e=Array.from(document.querySelectorAll('[aria-label='+JSON.stringify(${JSON.stringify(label)})+']')).find(e=>e.getBoundingClientRect().width>0);if(!e)throw Error('Missing button '+${JSON.stringify(label)});e.click()})()`);await delay(300)};
const shot=async name=>{const s=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${root}/${name}.png`,Buffer.from(s.data,'base64'));report.screenshots.push(name+'.png')};
try{
await instrument(c);
for(const lang of ['en','tl']){
await go('/mentor/settings');await wait(`!!document.querySelector('[data-testid=language-selector]')`);await click(lang==='en'?'English':'Tagalog');
await go('/mentor/workspaces/test-a');await wait(`!!document.querySelector('[role=table]')`);
for(const [width,height] of [[667,375],[844,390],[915,412],[1024,768],[1366,768]]){
await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(200);
await c.evaluate(`document.querySelector('[data-testid=results-summary]').scrollIntoView({block:'start'})`);await delay(100);
const layout=await c.evaluate(`(()=>{const t=document.querySelector('[role=table]');let scroll=t.parentElement;while(scroll&&!(scroll.scrollWidth>scroll.clientWidth&&getComputedStyle(scroll).overflowX==='auto'))scroll=scroll.parentElement;return{pageOverflow:document.documentElement.scrollWidth>innerWidth,headers:Array.from(t.querySelectorAll('[role=columnheader]'),e=>e.innerText),rows:t.querySelectorAll('[role=row]').length,scrollable:!!scroll,names:Array.from(t.querySelectorAll('[role=rowheader]'),e=>e.innerText)}})()`);
assert.equal(layout.pageOverflow,false);assert.equal(layout.headers.length,5);assert.equal(layout.rows,5);if(width<900)assert.equal(layout.scrollable,true);
await shot(`table-${lang}-${width}x${height}`);check('responsive table',{lang,width,height,...layout});
if(width===667){
await c.evaluate(`(()=>{let e=document.querySelector('[role=table]').parentElement;while(e&&!(e.scrollWidth>e.clientWidth&&getComputedStyle(e).overflowX==='auto'))e=e.parentElement;window.__tableScroller=e;e.scrollLeft=0;e.focus()})()`);
await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await wait(`window.__tableScroller.scrollLeft>0`);check('keyboard table scrolling',{lang,works:true});
await c.evaluate(`(()=>{let e=document.querySelector('[role=table]').parentElement;while(e&&!(e.scrollWidth>e.clientWidth&&getComputedStyle(e).overflowX==='auto'))e=e.parentElement;e.scrollLeft=e.scrollWidth})()`);await delay(150);await shot(`table-${lang}-667x375-details`)}
}
const rows=await c.evaluate(`Array.from(document.querySelectorAll('[role=table] [role=row]')).slice(1).map(e=>({text:e.innerText,cells:e.querySelectorAll('[role=cell]').length}))`);assert.equal(rows[1].text.includes('0%'),true);assert.equal(rows[2].text.includes('0%'),false);assert.equal(rows[2].text.includes('0 / 9'),false);check('zero versus missing',{lang,confirmedZero:true,missingNotZero:true});
assert.equal(await c.evaluate('window.__calls.length'),1);check('bounded retrieval',{lang,requests:1,learners:4});
const ax=await c.send('Accessibility.getFullAXTree');check('accessibility roles',{lang,tables:ax.nodes.filter(n=>n.role?.value==='table').length,columnHeaders:ax.nodes.filter(n=>n.role?.value==='columnheader').length});
}
await go('/mentor/settings');await wait(`!!document.querySelector('[data-testid=language-selector]')`);await click('English');
for(const scenario of ['empty','error','loading','unauthorized']){
await go('/mentor/workspaces/test-a?fixture='+scenario);await wait(scenario==='loading'?`document.body.innerText.includes('Loading synchronized progress')`:scenario==='empty'?`document.body.innerText.includes('No approved learners yet')`:`!!document.querySelector('[aria-label="Retry progress dashboard"]')`);
assert.equal(await c.evaluate(`!!document.querySelector('[role=table]')`),false);assert.equal(await c.evaluate(`document.body.innerText.includes('Ana Santos')`),false);await shot(scenario+'-fixture');check('state',{scenario,noPrivateRows:true});
if(scenario==='error'){await c.evaluate(`window.__scenario='populated'`);await click('Retry progress dashboard');await wait(`!!document.querySelector('[role=table]')`);check('retry',{recovered:true})}
}
await go('/mentor/workspaces/test-a');await wait(`!!document.querySelector('[role=table]')`);await click('Workspace options');await c.evaluate(`window.__scenario='unauthorized'`);await click('Refresh Progress');await wait(`!document.querySelector('[role=table]')`);assert.equal(await c.evaluate(`document.body.innerText.includes('Ana Santos')`),false);check('authorization revoked on refresh',{oldRowsRemoved:true});
await go('/mentor/workspaces/test-a');await wait(`!!document.querySelector('[role=table]')`);await click('Workspace options');await click('Switch Workspace');await wait(`document.body.innerText.includes('Choose Workspace')`);await click('Enter Fixture Workspace B');await wait(`document.body.innerText.includes('Bea — Workspace B')`);assert.equal(await c.evaluate(`document.body.innerText.includes('Ana Santos')`),false);await shot('workspace-b-fixture');check('workspace switch',{onlyB:true,path:await c.evaluate('location.pathname')});
await click("View Bea — Workspace B's progress");await wait(`location.pathname==='/mentor/learner-progress'`);check('detail navigation',{query:await c.evaluate('location.search')});
}finally{fs.writeFileSync(root+'/browser.json',JSON.stringify(report,null,2));c.close()}
